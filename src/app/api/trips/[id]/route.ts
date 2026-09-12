// GET /api/trips/[id]
// PATCH /api/trips/[id] — update trip (progress, GPS, status, complete delivery)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trips, orders, vehicles, drivers } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const [row] = await db.select().from(trips).where(eq(trips.id, id));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[GET /api/trips/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();

    // Special: complete delivery — updates trip + order + vehicle + driver inside transaction
    if (body._action === 'complete') {
      return await db.transaction(async (tx) => {
        const [trip] = await tx.select().from(trips).where(eq(trips.id, id));
        if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const [updated] = await tx.update(trips).set({
          status: 'Delivered',
          progress: 100,
          completedAt: now,
          geofenceStatus: 'Arrived',
          speedKmH: 0,
        }).where(eq(trips.id, id)).returning();

        if (trip.orderId) {
          await tx.update(orders).set({ status: 'Delivered' }).where(eq(orders.id, trip.orderId));
        }
        if (trip.vehicleId) {
          await tx.update(vehicles).set({ status: 'Available', currentLoad: 0 }).where(eq(vehicles.id, trip.vehicleId));
        }
        if (trip.driverId) {
          await tx.update(drivers).set({ status: 'Available' }).where(eq(drivers.id, trip.driverId));
        }

        return NextResponse.json(updated);
      });
    }

    const [updated] = await db.update(trips).set(body).where(eq(trips.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/trips/[id]]', err);
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}
