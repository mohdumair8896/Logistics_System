// GET /api/trips — list all trips
// POST /api/trips — create a new trip from an allocated order

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenant } from '@/lib/tenancy';
import { trips, orders, vehicles } from '@/lib/schema';
import { and, eq, ne } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { nextId } from '@/lib/ids';
import { parseJsonBody } from '@/lib/validation';
import { formatIstTime } from '@/lib/formatters';

const createTripSchema = z.object({ orderId: z.string().min(1).max(20) }).strict();

/** Orders that may be dispatched: allocated, or already loaded at the bay. */
const DISPATCHABLE = new Set(['Allocated', 'In Transit']);

/** Planning speed for an initial ETA until live GPS refines it. */
const PLANNING_SPEED_KMH = 45;

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select().from(trips)
      .where(eq(trips.tenantId, auth.tenantId))
      .orderBy(trips.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/trips]', err);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'trip.dispatch');
  if (denied) return denied;
  try {
    const parsed = await parseJsonBody(req, createTripSchema);
    if (!parsed.ok) return parsed.response;
    const { orderId } = parsed.data;

    return await withTenant(auth.tenantId, async (tx) => {
      // Lock the order so two dispatch clicks can't create two trips
      const [order] = await tx.select().from(orders).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, orderId))).for('update');
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      if (!DISPATCHABLE.has(order.status ?? '')) {
        return NextResponse.json({ error: `Order is ${order.status}; allocate it before dispatching` }, { status: 409 });
      }
      if (!order.vehicleId || !order.driverId) {
        return NextResponse.json({ error: 'Order has no allocated vehicle and driver' }, { status: 409 });
      }

      const [existing] = await tx.select({ id: trips.id }).from(trips)
        .where(and(eq(trips.tenantId, auth.tenantId), eq(trips.orderId, orderId), ne(trips.status, 'Cancelled')));
      if (existing) {
        return NextResponse.json({ error: `Trip ${existing.id} already exists for this order`, id: existing.id }, { status: 409 });
      }

      const id = await nextId(tx, 'TRP');

      const [vehicle] = await tx.select({ fuelLevel: vehicles.fuelLevel }).from(vehicles).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, order.vehicleId)));
      const now = new Date();
      const etaMinutes = order.distance ? Math.round((order.distance / PLANNING_SPEED_KMH) * 60) : null;

      const [created] = await tx.insert(trips).values({
        id,
        tenantId: auth.tenantId,
        orderId,
        vehicleId: order.vehicleId,
        driverId: order.driverId,
        origin: order.origin,
        destination: order.destination,
        distance: order.distance ?? 0,
        load: order.totalWeight,
        status: 'In Transit',
        progress: 0,
        startedAt: formatIstTime(now),
        eta: etaMinutes !== null ? `${etaMinutes} min` : null,
        completedAt: null,
        // Live telemetry stays empty until the driver's phone or a GPS device reports it
        speedKmH: null,
        fuelPercent: vehicle?.fuelLevel ?? null,
        cargoTemp: null,
        geofenceStatus: 'Inside Corridor',
        checkpoints: [
          { name: `${order.origin} Dispatch Gate`, location: order.origin, passed: true, time: formatIstTime(now) },
          { name: `${order.destination} Ingate Checkpoint`, location: order.destination, passed: false },
        ],
      }).returning();

      // Update order status to In Transit
      await tx.update(orders).set({ status: 'In Transit' }).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, orderId)));

      return NextResponse.json(created, { status: 201 });
    });
  } catch (err) {
    console.error('[POST /api/trips]', err);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
