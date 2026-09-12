// GET /api/trips — list all trips
// POST /api/trips — create a new trip from an order

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trips, orders } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await db.select().from(trips).orderBy(trips.createdAt);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/trips]', err);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    return await db.transaction(async (tx) => {
      // Fetch the order to build trip from it
      const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Generate next trip ID
      const [latest] = await tx.select({ id: trips.id }).from(trips).orderBy(desc(trips.id)).limit(1);
      const lastNum = latest ? parseInt(latest.id.replace('TRP-', ''), 10) : 0;
      const nextNum = (!isNaN(lastNum) && lastNum > 0) ? lastNum + 1 : 1001;
      const id = `TRP-${nextNum}`;

      const now = new Date();
      const etaMinutes = order.distance ? Math.round((order.distance / 60) * 60) : 180;

      const [created] = await tx.insert(trips).values({
        id,
        orderId,
        vehicleId: order.vehicleId ?? 'V001',
        driverId: order.driverId ?? 'D001',
        origin: order.origin,
        destination: order.destination,
        distance: order.distance ?? 0,
        load: order.totalWeight,
        status: 'In Transit',
        progress: 0,
        startedAt: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        eta: `${etaMinutes} min`,
        completedAt: null,
        speedKmH: 62,
        fuelPercent: 88,
        cargoTemp: '20.8°C Ambient',
        geofenceStatus: 'Inside Corridor',
        checkpoints: [
          { name: `${order.origin} Dispatch Gate`, location: order.origin, passed: true, time: 'Just now' },
          { name: 'Midway Highway Corridor Toll', location: 'NH Expressway', passed: false },
          { name: `${order.destination} Ingate Checkpoint`, location: order.destination, passed: false },
        ],
      }).returning();

      // Update order status to In Transit
      await tx.update(orders).set({ status: 'In Transit' }).where(eq(orders.id, orderId));

      return NextResponse.json(created, { status: 201 });
    });
  } catch (err) {
    console.error('[POST /api/trips]', err);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
