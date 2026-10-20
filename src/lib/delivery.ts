// ─── Closing a trip on delivery (server-only) ─────────────────────────────────
// Shared by PATCH /api/trips/[id] (`_action: 'complete'`) and POST /api/trips/[id]/pod, so a trip is
// closed the same way whichever screen closes it. Closing the trip is also what stops the driver's
// trip link: /api/gps/ping only accepts pings for trips that are still In Transit.

import { and, eq, sql } from 'drizzle-orm';
import { drivers, orders, trips, vehicles } from './schema';
import { formatIstTime } from './formatters';
import type { Tx } from './tenancy';

type TripRow = typeof trips.$inferSelect;

/** Marks an In Transit trip Delivered and frees its order, vehicle and driver. Call with the trip row locked. */
export async function completeTrip(tx: Tx, tenantId: string, trip: TripRow): Promise<TripRow> {
  const [updated] = await tx.update(trips).set({
    status: 'Delivered',
    progress: 100,
    completedAt: formatIstTime(new Date()),
    geofenceStatus: 'Arrived',
    speedKmH: 0,
  }).where(and(eq(trips.tenantId, tenantId), eq(trips.id, trip.id))).returning();

  if (trip.orderId) {
    await tx.update(orders).set({ status: 'Delivered' }).where(and(eq(orders.tenantId, tenantId), eq(orders.id, trip.orderId)));
  }
  if (trip.vehicleId) {
    await tx.update(vehicles).set({
      status: 'Available',
      currentLoad: sql`greatest(${vehicles.currentLoad} - ${trip.load ?? 0}, 0)`,
    }).where(and(eq(vehicles.tenantId, tenantId), eq(vehicles.id, trip.vehicleId)));
  }
  if (trip.driverId) {
    await tx.update(drivers).set({ status: 'Available', trips: sql`${drivers.trips} + 1` })
      .where(and(eq(drivers.tenantId, tenantId), eq(drivers.id, trip.driverId)));
  }
  return updated;
}
