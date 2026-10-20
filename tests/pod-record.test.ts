// e-POD record hashing, the audit export's checks, licence masking and the consignee OTP (pure logic).

import { describe, expect, it } from 'vitest';
import {
  buildPodAuditExport, canonicalJson, damageDeduction, hashPodRecord, pngDataUrlBytes, sha256Hex, verifyPodHash,
  type PodRecord, type StoredPod,
} from '@/features/delivery/pod';
import { maskLicence } from '@/lib/masking';
import { deliveryOtp, verifyDeliveryOtp } from '@/lib/session-token';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const record = (overrides: Partial<PodRecord> = {}): PodRecord => ({
  version: 'pod-v1',
  tenantId: 'ten_a',
  tripId: 'TRP-1001',
  orderId: 'ORD-1001',
  vehicleNo: 'MH12AB1234',
  tripStatusBefore: 'In Transit',
  capturedAt: '2026-10-19T08:30:00.000Z',
  capturedBy: 'usr_1',
  receiver: { name: 'Sunita Rao', confirmation: 'name_only', otpMatched: false },
  location: { source: 'driver_phone_gps', lat: 19.07283, lng: 72.88261, accuracyM: 12, recordedAt: '2026-10-19T08:29:55.000Z' },
  quantities: { deliveredKg: 3000, damagedKg: 10 },
  deduction: { amountInr: '200.00', ratePerKgInr: 20 },
  remarks: '',
  checks: { sealIntact: true, countVerified: true, tempVerified: false },
  signatureSha256: null,
  photoRef: null,
  ...overrides,
});

describe('canonical JSON', () => {
  it('sorts keys at every level and drops undefined, so key order never changes the text', () => {
    expect(canonicalJson({ b: 1, a: { d: [3, { y: 1, x: 2 }], c: 'é' }, u: undefined }))
      .toBe('{"a":{"c":"é","d":[3,{"x":2,"y":1}]},"b":1}');
    expect(canonicalJson({ z: null, a: true })).toBe('{"a":true,"z":null}');
  });

  it('refuses values JSON cannot carry exactly', () => {
    expect(() => canonicalJson({ n: Number.NaN })).toThrow();
    expect(() => canonicalJson({ n: Infinity })).toThrow();
  });
});

describe('SHA-256 fingerprint', () => {
  it('matches the standard test vector', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('is the same however the record object was built', async () => {
    const a = record();
    const b = Object.fromEntries(Object.entries(record()).reverse()) as unknown as PodRecord;
    expect((await hashPodRecord(a)).hash).toBe((await hashPodRecord(b)).hash);
  });

  it('changes when any field changes, and verifyPodHash notices', async () => {
    const { json, hash } = await hashPodRecord(record());
    expect(await verifyPodHash(json, hash)).toBe(true);
    for (const changed of [
      record({ receiver: { name: 'Sunita Rao.', confirmation: 'name_only', otpMatched: false } }),
      record({ capturedAt: '2026-10-19T08:30:01.000Z' }),
      record({ deduction: { amountInr: '0.00', ratePerKgInr: 20 } }),
      record({ location: null }),
    ]) {
      expect((await hashPodRecord(changed)).hash).not.toBe(hash);
    }
    expect(await verifyPodHash(json.replace('Sunita', 'Sunil'), hash)).toBe(false);
  });
});

describe('damage deduction', () => {
  it('charges ₹20 per whole kg and never goes negative', () => {
    expect(damageDeduction(10)).toBe(200);
    expect(damageDeduction(2.6)).toBe(60);
    expect(damageDeduction(-5)).toBe(0);
  });
});

describe('audit export', () => {
  const stored = async (overrides: Partial<StoredPod> = {}, rec: PodRecord = record()): Promise<StoredPod> => {
    const { json, hash } = await hashPodRecord(rec);
    return {
      id: 'pod-1', tripId: rec.tripId, orderId: rec.orderId, capturedAt: rec.capturedAt, createdAt: rec.capturedAt,
      createdBy: rec.capturedBy, record: json, recordHash: hash, signaturePng: null, ...overrides,
    };
  };
  const meta = {
    generatedAt: new Date('2026-10-20T00:00:00Z'),
    generatedBy: { userId: 'usr_1', name: 'Asha', role: 'Compliance Officer' },
    workspace: { id: 'ten_a', name: 'Alpha Logistics' },
    scope: { tripId: 'TRP-1001' },
  };

  it('re-checks each record and its signature', async () => {
    const sigHash = await sha256Hex(pngDataUrlBytes(PNG)!);
    const signed = await stored({ signaturePng: PNG }, record({ signatureSha256: sigHash }));
    const file = await buildPodAuditExport([signed, await stored()], meta);
    expect(file.records.map(r => [r.hashCheck, r.signatureCheck])).toEqual([
      ['matches', 'matches'],
      ['matches', 'no signature'],
    ]);
    expect(file.records[0].hashAlgorithm).toBe('SHA-256');
  });

  it('flags a record or signature changed after it was stored', async () => {
    const good = await stored();
    const sigHash = await sha256Hex(pngDataUrlBytes(PNG)!);
    const swappedSignature = await stored({ signaturePng: 'data:image/png;base64,AAAA' }, record({ signatureSha256: sigHash }));
    const file = await buildPodAuditExport([
      { ...good, record: good.record.replace('"damagedKg":10', '"damagedKg":0') },
      swappedSignature,
    ], meta);
    expect(file.records[0].hashCheck).toBe('does not match');
    expect(file.records[1].signatureCheck).toBe('does not match');
  });

  it('says it supports a section 63 certificate without claiming to be one', async () => {
    const text = JSON.stringify(await buildPodAuditExport([], meta));
    expect(text).toMatch(/section 63 of the Bharatiya Sakshya Adhiniyam/);
    expect(text).toMatch(/It is not a certificate/);
    expect(text).not.toMatch(/legally valid|admissible evidence|conclusive/i);
  });
});

describe('signature images', () => {
  it('reads PNG data URLs only', () => {
    expect(pngDataUrlBytes(PNG)?.slice(1, 4)).toEqual(new Uint8Array([0x50, 0x4e, 0x47])); // "PNG"
    expect(pngDataUrlBytes('data:image/jpeg;base64,AAAA')).toBeNull();
    expect(pngDataUrlBytes('not a data url')).toBeNull();
  });
});

describe('licence masking', () => {
  it('shows only the last 4 characters', () => {
    expect(maskLicence('MH12 20190012345')).toBe('•••• 2345');
    expect(maskLicence('DL-982-XYZ')).toBe('•••• -XYZ');
  });

  it('hides short or empty values completely', () => {
    expect(maskLicence('1234')).toBe('••••');
    expect(maskLicence('')).toBe('');
    expect(maskLicence(null)).toBe('');
  });
});

describe('consignee delivery OTP', () => {
  it('is 6 digits, stable per trip, and different for other trips and workspaces', async () => {
    const otp = await deliveryOtp('ten_a', 'TRP-1001');
    expect(otp).toMatch(/^\d{6}$/);
    expect(await deliveryOtp('ten_a', 'TRP-1001')).toBe(otp);
    const others = await Promise.all([deliveryOtp('ten_a', 'TRP-1002'), deliveryOtp('ten_b', 'TRP-1001')]);
    expect(others).not.toContain(otp);
  });

  it('accepts only the trip’s own code', async () => {
    const otp = await deliveryOtp('ten_a', 'TRP-1001');
    expect(await verifyDeliveryOtp('ten_a', 'TRP-1001', ` ${otp} `)).toBe(true);
    expect(await verifyDeliveryOtp('ten_a', 'TRP-1001', otp === '000000' ? '000001' : '000000')).toBe(false);
    expect(await verifyDeliveryOtp('ten_b', 'TRP-1001', otp)).toBe(false);
  });
});
