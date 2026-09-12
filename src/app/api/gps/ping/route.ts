// POST /api/gps/ping — receive live GPS from driver smartphone
// Called every ~5 seconds from the /driver-app page on driver's phone.
// Updates trip lat/lng in DB and broadcasts via Ably in real-time.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gpsPings, trips, vehicles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { publishToAbly } from '@/lib/ably-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vehicleId, tripId, lat, lng, speedKmH, accuracy } = body;

    if (!vehicleId || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'vehicleId, lat, lng are required' }, { status: 400 });
    }

    // Build trip updates if active trip is attached
    const tripUpdatePromise = tripId
      ? db.update(trips).set({
          lat: lat.toString(),
          lng: lng.toString(),
          ...(speedKmH !== undefined ? { speedKmH: Math.round(speedKmH) } : {}),
        }).where(eq(trips.id, tripId))
      : Promise.resolve();

    // Parallelize DB writes: ping history, vehicle live location, trip live location
    await Promise.all([
      db.insert(gpsPings).values({
        vehicleId,
        tripId: tripId ?? null,
        lat: lat.toString(),
        lng: lng.toString(),
        speedKmH: speedKmH?.toString() ?? null,
        accuracy: accuracy?.toString() ?? null,
      }),
      db.update(vehicles)
        .set({ lat: lat.toString(), lng: lng.toString() })
        .where(eq(vehicles.id, vehicleId)),
      tripUpdatePromise,
    ]);

    // ─── Phase 4: Broadcast via Ably for real-time map update ─────────────────
    // No-op if ABLY_API_KEY is not in .env.local — falls back to 8s DB polling.
    await publishToAbly('gps', 'ping', { vehicleId, tripId, lat, lng, speedKmH: Math.round(speedKmH ?? 0) });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/gps/ping]', err);
    return NextResponse.json({ error: 'Failed to save GPS ping' }, { status: 500 });
  }
}

// GET /api/gps/ping?vehicleId=V001 — get latest position
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicleId query param required' }, { status: 400 });
    }

    const [vehicle] = await db.select({ lat: vehicles.lat, lng: vehicles.lng, location: vehicles.location })
      .from(vehicles)
      .where(eq(vehicles.id, vehicleId));

    return NextResponse.json(vehicle ?? { lat: null, lng: null });
  } catch (err) {
    console.error('[GET /api/gps/ping]', err);
    return NextResponse.json({ error: 'Failed to get GPS position' }, { status: 500 });
  }
}
