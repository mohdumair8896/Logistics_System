// POST /api/gps/ping — receive live GPS from driver smartphone
// Called every ~5 seconds from the /driver-app page on driver's phone.
// Requires the signed driver-link token (Authorization: Driver <token>) issued by
// GET /api/trips/[id]/driver-link, so only that trip's phone can move its vehicle.
// Updates trip lat/lng in DB and broadcasts via Ably in real-time.
//
// The phone queues points while it has no signal and sends them later, oldest first, as a batch
// ({ vehicleId, tripId, pings: [...] }) with the time each was taken (recordedAt). A single ping
// ({ vehicleId, tripId, lat, lng, ... }) is still accepted.
//
// Pings are accepted only while the trip is In Transit. Once it is delivered or cancelled every ping,
// including queued ones, gets 409 and the phone stops sharing location (DPDP: tracking ends with the trip).

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenant } from '@/lib/tenancy';
import { gpsPings, tenants, trips, vehicles } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { publishToAbly } from '@/lib/ably-server';
import { requireTenant, isAuthError, verifyDriverLinkToken, type DriverLinkPayload } from '@/lib/auth';

/** Most points one request may carry (about 8 minutes of 5-second pings). Keep in step with driver-app/pingQueue.ts. */
const MAX_PINGS_PER_BATCH = 100;
/** A phone clock this far ahead of the server is wrong; such points keep only the server receive time. */
const MAX_CLOCK_AHEAD_MS = 2 * 60 * 1000;

const point = {
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speedKmH: z.number().min(0).max(250).optional(),
  accuracy: z.number().min(0).max(100000).optional(),
  recordedAt: z.string().datetime({ offset: true }).optional(),
};
const ids = {
  vehicleId: z.string().min(1).max(20),
  tripId: z.string().min(1).max(20),
};
const batchSchema = z.object({ ...ids, pings: z.array(z.object(point)).min(1).max(MAX_PINGS_PER_BATCH) });
const singleSchema = z.object({ ...ids, ...point });

async function driverLink(req: NextRequest): Promise<DriverLinkPayload | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Driver ') ? header.slice('Driver '.length).trim() : '';
  return token ? verifyDriverLinkToken(token) : null;
}

const invalidLink = () =>
  NextResponse.json({ error: 'Driver link is missing, invalid or expired. Ask dispatch for a new link.' }, { status: 401 });

export async function POST(req: NextRequest) {
  const link = await driverLink(req);
  if (!link) return invalidLink();

  try {
    const raw = await req.json().catch(() => null);
    const batch = batchSchema.safeParse(raw);
    const single = batch.success ? null : singleSchema.safeParse(raw);
    if (!batch.success && !single?.success) {
      const details = (raw && typeof raw === 'object' && 'pings' in raw ? batch.error : single?.error)?.flatten().fieldErrors;
      return NextResponse.json({ error: 'Invalid GPS ping', details }, { status: 400 });
    }
    const { vehicleId, tripId } = batch.success ? batch.data : single!.data!;
    const points = batch.success ? batch.data.pings : [single!.data!];

    if (vehicleId !== link.vehicleId || tripId !== link.tripId) {
      return NextResponse.json({ error: 'This link is not valid for that vehicle or trip' }, { status: 403 });
    }

    const now = Date.now();
    const rows = points.map(p => {
      const at = p.recordedAt ? new Date(p.recordedAt) : null;
      return { ...p, recordedAt: at && at.getTime() <= now + MAX_CLOCK_AHEAD_MS ? at : null };
    });
    const latest = rows[rows.length - 1];

    // The token says which workspace this phone belongs to; the trip must be live there
    const accepted = await withTenant(link.tenantId, async (tx) => {
      const [trip] = await tx.select({ status: trips.status, vehicleId: trips.vehicleId }).from(trips)
        .where(and(eq(trips.tenantId, link.tenantId), eq(trips.id, tripId)));
      if (!trip || trip.vehicleId !== vehicleId) return 'not-found' as const;
      if (trip.status !== 'In Transit') return 'closed' as const;

      // Ping history (in the order the phone took them), vehicle live location, trip live location
      await tx.insert(gpsPings).values(rows.map(p => ({
        tenantId: link.tenantId,
        vehicleId,
        tripId,
        lat: p.lat.toString(),
        lng: p.lng.toString(),
        speedKmH: p.speedKmH?.toString() ?? null,
        accuracy: p.accuracy?.toString() ?? null,
        recordedAt: p.recordedAt,
      })));
      await tx.update(vehicles)
        .set({ lat: latest.lat.toString(), lng: latest.lng.toString() })
        .where(and(eq(vehicles.tenantId, link.tenantId), eq(vehicles.id, vehicleId)));
      await tx.update(trips).set({
        lat: latest.lat.toString(),
        lng: latest.lng.toString(),
        ...(latest.speedKmH !== undefined ? { speedKmH: Math.round(latest.speedKmH) } : {}),
      }).where(and(eq(trips.tenantId, link.tenantId), eq(trips.id, tripId)));
      return 'ok' as const;
    });
    if (accepted === 'not-found') {
      return NextResponse.json({ error: 'Trip not found. Ask dispatch for a new link.' }, { status: 404 });
    }
    if (accepted === 'closed') {
      return NextResponse.json({ error: 'This trip is finished. Tracking has stopped.' }, { status: 409 });
    }

    // ─── Phase 4: Broadcast via Ably for real-time map update ─────────────────
    // Tenant-scoped channel. No-op if ABLY_API_KEY is not set — the UI falls back to polling.
    await publishToAbly(`tenant:${link.tenantId}:fleet`, 'ping', {
      vehicleId, tripId, lat: latest.lat, lng: latest.lng, speedKmH: Math.round(latest.speedKmH ?? 0),
    });

    return NextResponse.json({ success: true, accepted: rows.length });
  } catch (err) {
    console.error('[POST /api/gps/ping]', err);
    return NextResponse.json({ error: 'Failed to save GPS ping' }, { status: 500 });
  }
}

// GET /api/gps/ping (Authorization: Driver <token>) — the trip link's own trip: who runs it (named in
//   the location notice) and whether it is still being tracked.
// GET /api/gps/ping?vehicleId=V001 — get latest position (staff only)
export async function GET(req: NextRequest) {
  if ((req.headers.get('authorization') ?? '').startsWith('Driver ')) return driverTrip(req);

  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicleId query param required' }, { status: 400 });
    }

    const [vehicle] = await withTenant(auth.tenantId, tx => tx.select({ lat: vehicles.lat, lng: vehicles.lng, location: vehicles.location })
      .from(vehicles)
      .where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, vehicleId))));

    return NextResponse.json(vehicle ?? { lat: null, lng: null });
  } catch (err) {
    console.error('[GET /api/gps/ping]', err);
    return NextResponse.json({ error: 'Failed to get GPS position' }, { status: 500 });
  }
}

async function driverTrip(req: NextRequest) {
  const link = await driverLink(req);
  if (!link) return invalidLink();
  try {
    const found = await withTenant(link.tenantId, async (tx) => {
      const [trip] = await tx.select({
        status: trips.status, vehicleId: trips.vehicleId, origin: trips.origin, destination: trips.destination,
      }).from(trips).where(and(eq(trips.tenantId, link.tenantId), eq(trips.id, link.tripId)));
      if (!trip || trip.vehicleId !== link.vehicleId) return null;
      const [tenant] = await tx.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, link.tenantId));
      const [vehicle] = await tx.select({ vehicleNo: vehicles.vehicleNo }).from(vehicles)
        .where(and(eq(vehicles.tenantId, link.tenantId), eq(vehicles.id, link.vehicleId)));
      return { trip, transporter: tenant?.name ?? null, vehicleNo: vehicle?.vehicleNo ?? null };
    });
    if (!found) return NextResponse.json({ error: 'Trip not found. Ask dispatch for a new link.' }, { status: 404 });
    return NextResponse.json({
      tripId: link.tripId,
      vehicleNo: found.vehicleNo,
      transporter: found.transporter,
      origin: found.trip.origin,
      destination: found.trip.destination,
      status: found.trip.status,
      tracking: found.trip.status === 'In Transit',
      linkExpiresAt: new Date(link.exp * 1000).toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/gps/ping (driver)]', err);
    return NextResponse.json({ error: 'Failed to load the trip' }, { status: 500 });
  }
}
