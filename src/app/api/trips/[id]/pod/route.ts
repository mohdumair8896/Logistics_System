// GET  /api/trips/[id]/pod — the trip's POD record, with its SHA-256 re-checked
// POST /api/trips/[id]/pod — capture the POD once: closes the trip if it is still In Transit (which also
//      stops the driver's trip link), then stores the canonical record and its SHA-256 in one transaction.
//      The server adds its own clock time and the trip's last GPS ping; see src/features/delivery/pod.ts.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq, sql } from 'drizzle-orm';
import { withTenant } from '@/lib/tenancy';
import { gpsPings, podRecords, trips, vehicles } from '@/lib/schema';
import { requireTenant, isAuthError, verifyDeliveryOtp } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { parseJsonBody, transitionError } from '@/lib/validation';
import { isRateLimited, tooManyRequests } from '@/lib/rateLimit';
import { completeTrip } from '@/lib/delivery';
import {
  POD_CONFIRMATIONS, POD_RECORD_VERSION, DAMAGE_RATE_INR_PER_KG, damageDeduction, hashPodRecord,
  pngDataUrlBytes, sha256Hex, verifyPodHash, type PodLocation, type PodRecord,
} from '@/features/delivery/pod';

const podSchema = z.object({
  receiverName: z.string().trim().min(2).max(100),
  confirmation: z.enum(POD_CONFIRMATIONS),
  otp: z.string().regex(/^\d{6}$/, 'The OTP has 6 digits').optional(),
  deliveredKg: z.number().int().min(0).max(100_000),
  damagedKg: z.number().int().min(0).max(100_000),
  remarks: z.string().trim().max(500).default(''),
  checks: z.object({ sealIntact: z.boolean(), countVerified: z.boolean(), tempVerified: z.boolean() }).strict(),
  signaturePng: z.string().max(400_000).optional(), // data:image/png;base64,…
}).strict().superRefine((body, ctx) => {
  if (body.confirmation === 'otp' && !body.otp) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['otp'], message: 'Enter the 6-digit OTP the receiver gave you' });
  }
  if (body.confirmation === 'signature' && !body.signaturePng) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['signaturePng'], message: 'The receiver has not signed yet' });
  }
  if (body.signaturePng && !pngDataUrlBytes(body.signaturePng)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['signaturePng'], message: 'The signature must be a PNG image' });
  }
});

/** OTP guesses allowed per trip in 15 minutes. */
const OTP_ATTEMPTS = 5;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const [pod] = await withTenant(auth.tenantId, tx => tx.select({
      id: podRecords.id, tripId: podRecords.tripId, receiverName: podRecords.receiverName,
      confirmation: podRecords.confirmation, capturedAt: podRecords.capturedAt,
      damageDeduction: podRecords.damageDeduction, record: podRecords.record, recordHash: podRecords.recordHash,
    }).from(podRecords).where(and(eq(podRecords.tenantId, auth.tenantId), eq(podRecords.tripId, id))));
    if (!pod) return NextResponse.json({ error: 'No POD recorded for this trip' }, { status: 404 });
    return NextResponse.json({ ...pod, hashMatches: await verifyPodHash(pod.record, pod.recordHash) });
  } catch (err) {
    console.error('[GET /api/trips/[id]/pod]', err);
    return NextResponse.json({ error: 'Failed to fetch POD' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'trip.complete');
  if (denied) return denied;
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(req, podSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    let otpMatched = false;
    if (body.confirmation === 'otp') {
      if (isRateLimited(`pod-otp:${auth.tenantId}:${id}`, OTP_ATTEMPTS, 15 * 60_000)) {
        return tooManyRequests('Too many wrong OTPs for this trip. Wait 15 minutes, or record the receiver\'s signature instead.');
      }
      otpMatched = await verifyDeliveryOtp(auth.tenantId, id, body.otp ?? '');
      if (!otpMatched) {
        return NextResponse.json({ error: 'That OTP does not match this trip. Ask the receiver to read it out again.' }, { status: 400 });
      }
    }
    const signatureBytes = body.signaturePng ? pngDataUrlBytes(body.signaturePng) : null;
    const signatureSha256 = signatureBytes ? await sha256Hex(signatureBytes) : null;

    return await withTenant(auth.tenantId, async (tx) => {
      const [trip] = await tx.select().from(trips)
        .where(and(eq(trips.tenantId, auth.tenantId), eq(trips.id, id))).for('update');
      if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      if (trip.status !== 'In Transit' && trip.status !== 'Delivered') return transitionError('Trip', trip.status, 'Delivered');

      const [existing] = await tx.select({ recordHash: podRecords.recordHash }).from(podRecords)
        .where(and(eq(podRecords.tenantId, auth.tenantId), eq(podRecords.tripId, id)));
      if (existing) {
        return NextResponse.json({ error: 'A POD is already recorded for this trip', recordHash: existing.recordHash }, { status: 409 });
      }

      const statusBefore = trip.status;
      if (trip.status === 'In Transit') await completeTrip(tx, auth.tenantId, trip);

      // Geotag: where the truck was, from the driver's own phone, rather than wherever this screen is
      const [ping] = await tx.select({
        lat: gpsPings.lat, lng: gpsPings.lng, accuracy: gpsPings.accuracy,
        at: sql<Date>`coalesce(${gpsPings.recordedAt}, ${gpsPings.createdAt})`.mapWith(gpsPings.createdAt),
      }).from(gpsPings)
        .where(and(eq(gpsPings.tenantId, auth.tenantId), eq(gpsPings.tripId, id)))
        .orderBy(desc(sql`coalesce(${gpsPings.recordedAt}, ${gpsPings.createdAt})`))
        .limit(1);
      const location: PodLocation | null = ping ? {
        source: 'driver_phone_gps',
        lat: Number(ping.lat),
        lng: Number(ping.lng),
        accuracyM: ping.accuracy === null ? null : Number(ping.accuracy),
        recordedAt: new Date(ping.at).toISOString(),
      } : null;

      const [vehicle] = trip.vehicleId
        ? await tx.select({ vehicleNo: vehicles.vehicleNo }).from(vehicles)
          .where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, trip.vehicleId)))
        : [];

      const capturedAt = new Date();
      const deduction = damageDeduction(body.damagedKg);
      const record: PodRecord = {
        version: POD_RECORD_VERSION,
        tenantId: auth.tenantId,
        tripId: trip.id,
        orderId: trip.orderId,
        vehicleNo: vehicle?.vehicleNo ?? null,
        tripStatusBefore: statusBefore ?? 'In Transit',
        capturedAt: capturedAt.toISOString(),
        capturedBy: auth.userId,
        receiver: { name: body.receiverName, confirmation: body.confirmation, otpMatched },
        location,
        quantities: { deliveredKg: body.deliveredKg, damagedKg: body.damagedKg },
        deduction: { amountInr: deduction.toFixed(2), ratePerKgInr: DAMAGE_RATE_INR_PER_KG },
        remarks: body.remarks,
        checks: body.checks,
        signatureSha256,
        photoRef: null, // TODO(photo upload): see PodRecord.photoRef
      };
      const { json, hash } = await hashPodRecord(record);

      const [saved] = await tx.insert(podRecords).values({
        tenantId: auth.tenantId,
        tripId: trip.id,
        orderId: trip.orderId,
        receiverName: body.receiverName,
        confirmation: body.confirmation,
        capturedAt,
        lat: location ? location.lat.toString() : null,
        lng: location ? location.lng.toString() : null,
        damageDeduction: deduction.toFixed(2),
        photoRef: null,
        signaturePng: body.signaturePng ?? null,
        record: json,
        recordHash: hash,
        createdBy: auth.userId,
      }).returning({ id: podRecords.id });

      return NextResponse.json({
        id: saved.id,
        tripId: trip.id,
        recordHash: hash,
        capturedAt: record.capturedAt,
        damageDeduction: deduction,
        location,
        record: json,
      }, { status: 201 });
    });
  } catch (err) {
    console.error('[POST /api/trips/[id]/pod]', err);
    return NextResponse.json({ error: 'Failed to record POD' }, { status: 500 });
  }
}
