// ─── e-POD record: canonical form, SHA-256 fingerprint and audit export ───────
// Shared by the server (which builds, hashes and stores the record) and the delivery page (which shows
// the fingerprint). Uses Web Crypto, available in Node 20+ and every current browser.
//
// The hash covers one canonical JSON text: object keys sorted, no whitespace, UTF-8. That text is stored
// next to its hash (pod_records.record), so anyone can recompute SHA-256 over it and compare. Changing any
// field (receiver, time, location, deduction, signature) changes the hash.

export const POD_RECORD_VERSION = 'pod-v1';
export const POD_HASH_ALGORITHM = 'SHA-256';

/** Damage or shortage is deducted at a flat ₹20 per kg (the rate the delivery page has always used). */
export const DAMAGE_RATE_INR_PER_KG = 20;

export function damageDeduction(damagedKg: number): number {
  return Math.max(0, Math.round(damagedKg)) * DAMAGE_RATE_INR_PER_KG;
}

export const POD_CONFIRMATIONS = ['otp', 'signature', 'name_only'] as const;
export type PodConfirmation = (typeof POD_CONFIRMATIONS)[number];

export interface PodLocation {
  source: 'driver_phone_gps'; // the last ping the driver's trip link sent on this trip
  lat: number;
  lng: number;
  accuracyM: number | null;
  recordedAt: string;         // when that ping was taken (ISO 8601)
}

export interface PodRecord {
  version: typeof POD_RECORD_VERSION;
  tenantId: string;
  tripId: string;
  orderId: string | null;
  vehicleNo: string | null;
  tripStatusBefore: string;   // 'In Transit' when this POD closed the trip, 'Delivered' if it was closed earlier
  capturedAt: string;         // server clock, ISO 8601 UTC
  capturedBy: string;         // user id
  receiver: { name: string; confirmation: PodConfirmation; otpMatched: boolean };
  location: PodLocation | null;
  quantities: { deliveredKg: number; damagedKg: number };
  deduction: { amountInr: string; ratePerKgInr: number };
  remarks: string;
  checks: { sealIntact: boolean; countVerified: boolean; tempVerified: boolean };
  signatureSha256: string | null; // SHA-256 of the PNG bytes of the receiver's signature
  // TODO(photo upload): there is no POD photo upload yet. When there is, store the photo's object key here
  // and its SHA-256 next to it, and link each damage deduction to the photo that shows the damage.
  photoRef: string | null;
}

/** JSON with object keys sorted at every level and no whitespace. Rejects values JSON can't carry exactly. */
export function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return JSON.stringify(value);
    case 'number':
      if (!Number.isFinite(value)) throw new Error('canonicalJson: numbers must be finite');
      return JSON.stringify(value);
    case 'object': {
      if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
    }
    default:
      throw new Error(`canonicalJson: unsupported type ${typeof value}`);
  }
}

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

const PNG_DATA_URL = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/;

/** The PNG bytes inside a data:image/png;base64 URL, or null if it isn't one. */
export function pngDataUrlBytes(dataUrl: string): Uint8Array | null {
  const match = PNG_DATA_URL.exec(dataUrl);
  if (!match) return null;
  try {
    return Uint8Array.from(atob(match[1]), ch => ch.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function hashPodRecord(record: PodRecord): Promise<{ json: string; hash: string }> {
  const json = canonicalJson(record);
  return { json, hash: await sha256Hex(json) };
}

/** True when `json` still hashes to `hash`. */
export async function verifyPodHash(json: string, hash: string): Promise<boolean> {
  return (await sha256Hex(json)) === hash.toLowerCase();
}

// ─── Audit export ─────────────────────────────────────────────────────────────

export interface StoredPod {
  id: string;
  tripId: string;
  orderId: string | null;
  capturedAt: Date | string;
  createdAt: Date | string | null;
  createdBy: string | null;
  record: string;
  recordHash: string;
  signaturePng: string | null;
}

export interface AuditExportMeta {
  generatedAt: Date;
  generatedBy: { userId: string; name: string; role: string };
  workspace: { id: string; name: string };
  scope: { tripId: string } | { from: string; to: string };
}

const iso = (d: Date | string | null) => (d === null ? null : new Date(d).toISOString());

/**
 * Builds the downloadable audit file. Each record's hash and signature are re-checked now, so a row
 * changed in the database after capture shows up as "does not match".
 */
export async function buildPodAuditExport(rows: StoredPod[], meta: AuditExportMeta) {
  const records = [];
  for (const row of rows) {
    let signatureCheck: 'matches' | 'does not match' | 'no signature' = 'no signature';
    let expectedSignature: string | null = null;
    try {
      expectedSignature = (JSON.parse(row.record) as Partial<PodRecord>).signatureSha256 ?? null;
    } catch {
      expectedSignature = null;
    }
    if (row.signaturePng || expectedSignature) {
      const bytes = row.signaturePng ? pngDataUrlBytes(row.signaturePng) : null;
      signatureCheck = bytes && expectedSignature && (await sha256Hex(bytes)) === expectedSignature ? 'matches' : 'does not match';
    }
    records.push({
      podId: row.id,
      tripId: row.tripId,
      orderId: row.orderId,
      capturedAt: iso(row.capturedAt),
      storedAt: iso(row.createdAt),
      capturedBy: row.createdBy,
      hashAlgorithm: POD_HASH_ALGORITHM,
      recordHash: row.recordHash,
      hashCheck: (await verifyPodHash(row.record, row.recordHash)) ? 'matches' : 'does not match',
      signatureCheck,
      record: row.record,
      signaturePng: row.signaturePng,
    });
  }

  return {
    kind: 'LogisticsEdge e-POD audit export',
    formatVersion: 1,
    generatedAt: meta.generatedAt.toISOString(),
    generatedBy: meta.generatedBy,
    workspace: meta.workspace,
    scope: meta.scope,
    about: [
      'Each POD record was written once, at handover, by the LogisticsEdge server. The database rejects updates and deletes on POD records.',
      `recordHash is the ${POD_HASH_ALGORITHM} of the exact "record" text. Recompute it with any SHA-256 tool to check it; hashCheck shows the result of that check when this file was generated.`,
      'signatureCheck compares the SHA-256 of the signature image (PNG bytes) with signatureSha256 inside the record.',
      'Times are from the server clock, in UTC. The location is the last GPS ping the driver\'s trip link sent on that trip, with the time it was taken.',
      'After downloading, compute the SHA-256 of this file and quote it wherever you refer to the file.',
      'This file collects information that can help the person responsible for the system prepare a certificate under section 63 of the Bharatiya Sakshya Adhiniyam, 2023. It is not a certificate, and it does not by itself make any record admissible. Take legal advice on the certificate.',
    ],
    section63Support: {
      producedBy: 'LogisticsEdge web application, e-POD module (cloud-hosted; records written by the application server)',
      howRecordsAreMade: 'A staff user enters the POD on the delivery page; the server adds its own clock time and the trip\'s last GPS ping, builds the record, hashes it and stores both in one database transaction.',
      recordFormat: `${POD_RECORD_VERSION}: canonical JSON (object keys sorted, no whitespace, UTF-8)`,
      hashAlgorithm: POD_HASH_ALGORITHM,
      toBeCompletedByYou: 'Name, designation and signature of the person in charge of the system, and of any expert who certifies the hash values. These are not filled in by LogisticsEdge.',
    },
    records,
  };
}
