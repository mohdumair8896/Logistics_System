// GET /api/track/[id] — Public live shipment tracking endpoint
// Intentionally public: Allows consignees and customers to look up delivery progress
// without requiring internal staff credentials.
// Sanitizes output to avoid leaking company-wide rosters or unassociated customer records.
//
// Tenancy: the shipment is located across all workspaces by its (globally unique) ID using
// the system connection, then every related lookup runs inside that shipment's own tenant.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withTenant } from '@/lib/tenancy';
import { trips, orders, customers, drivers, vehicles } from '@/lib/schema';
import { and, eq, sql } from 'drizzle-orm';

/** "MH12AB4521" → "MH12 •• 4521": enough for the receiver to recognise the truck. */
function maskRegistration(vehicleNo: string): string {
  const compact = vehicleNo.replace(/[\s-]/g, '');
  if (compact.length < 6) return '••••';
  return `${compact.slice(0, 4)} •• ${compact.slice(-4)}`;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id || '').trim();
    if (!cleanId || cleanId.length > 30) {
      return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 });
    }

    // 1. Locate the shipment (trip or order ID, case-insensitive) and its workspace
    const [tripHit] = await db.select({ tenantId: trips.tenantId, id: trips.id }).from(trips)
      .where(sql`LOWER(${trips.id}) = LOWER(${cleanId})`).limit(1);
    const [orderHit] = tripHit ? [] : await db.select({ tenantId: orders.tenantId, id: orders.id }).from(orders)
      .where(sql`LOWER(${orders.id}) = LOWER(${cleanId})`).limit(1);
    const tenantId = tripHit?.tenantId ?? orderHit?.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // 2. Everything else is read within that workspace only
    const view = await withTenant(tenantId, async (tx) => {
      let trip = tripHit
        ? (await tx.select().from(trips).where(and(eq(trips.tenantId, tenantId), eq(trips.id, tripHit.id))).limit(1))[0]
        : undefined;
      const orderId = trip?.orderId ?? orderHit?.id;
      const order = orderId
        ? (await tx.select().from(orders).where(and(eq(orders.tenantId, tenantId), eq(orders.id, orderId))).limit(1))[0]
        : undefined;
      if (!trip && order) {
        trip = (await tx.select().from(trips).where(and(eq(trips.tenantId, tenantId), eq(trips.orderId, order.id))).limit(1))[0];
      }

      const driverId = trip?.driverId || order?.driverId;
      const vehicleId = trip?.vehicleId || order?.vehicleId;
      const [custRes, dRes, vRes] = await Promise.all([
        order?.customerId
          ? tx.select({ name: customers.name }).from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.id, order.customerId))).limit(1)
          : Promise.resolve([]),
        driverId
          ? tx.select({ name: drivers.name }).from(drivers).where(and(eq(drivers.tenantId, tenantId), eq(drivers.id, driverId))).limit(1)
          : Promise.resolve([]),
        vehicleId
          ? tx.select({ vehicleNo: vehicles.vehicleNo, type: vehicles.type }).from(vehicles).where(and(eq(vehicles.tenantId, tenantId), eq(vehicles.id, vehicleId))).limit(1)
          : Promise.resolve([]),
      ]);
      return { trip, order, customer: custRes[0], driver: dRes[0], vehicle: vRes[0] };
    });

    const { trip, order } = view;
    const customerName = view.customer?.name ?? null;
    // Public endpoint: share the driver's first name only and a masked registration number
    const driverInfo = view.driver ? { name: view.driver.name.split(' ')[0] } : null;
    const vehicleInfo = view.vehicle
      ? { vehicleNo: maskRegistration(view.vehicle.vehicleNo), type: view.vehicle.type }
      : null;

    const isDelivered = trip?.status === 'Delivered' || order?.status === 'Delivered';
    const origin = trip?.origin || order?.origin || '';
    const destination = trip?.destination || order?.destination || '';
    const distance = trip?.distance || order?.distance || 0;
    const progress = trip ? (trip.progress ?? (isDelivered ? 100 : 0)) : (isDelivered ? 100 : 0);

    const checkpoints =
      trip?.checkpoints && Array.isArray(trip.checkpoints) && trip.checkpoints.length > 0
        ? trip.checkpoints
        : [
            { name: `${origin} Dispatch`, location: origin, passed: !!trip, time: trip?.startedAt || undefined },
            { name: `${destination} Delivery`, location: destination, passed: isDelivered, time: isDelivered ? (trip?.completedAt || undefined) : undefined },
          ];

    return NextResponse.json({
      orderId: order?.id || trip?.orderId || cleanId,
      tripId: trip?.id || null,
      status: trip?.status || order?.status || 'Pending',
      isDelivered,
      origin,
      destination,
      distance,
      progress,
      eta: isDelivered ? 'Completed' : (trip?.eta || null),
      startedAt: trip?.startedAt || null,
      completedAt: trip?.completedAt || null,
      speedKmH: isDelivered ? 0 : (trip?.speedKmH ?? null),
      customerName,
      driver: driverInfo,
      vehicle: vehicleInfo,
      checkpoints,
    });
  } catch (err) {
    console.error('[GET /api/track/[id]]', err);
    return NextResponse.json({ error: 'Failed to retrieve shipment tracking' }, { status: 500 });
  }
}
