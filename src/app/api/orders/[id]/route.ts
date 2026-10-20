// GET /api/orders/[id]
// PATCH /api/orders/[id] — update order (allow-listed fields, status transitions, allocate, scan items)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenant } from '@/lib/tenancy';
import { orders, vehicles, drivers, agentAuditLogs } from '@/lib/schema';
import { and, eq, sql } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission, type Permission } from '@/lib/permissions';
import { parseJsonBody, transitionError } from '@/lib/validation';

const allocateSchema = z.object({
  _action: z.literal('allocate'),
  vehicleId: z.string().min(1).max(20),
  driverId: z.string().min(1).max(20),
  /** Dispatcher override: lets a busy vehicle or unavailable driver be assigned, with a reason on record. */
  overrideReason: z.string().trim().min(3).max(200).optional(),
}).strict();

const scanItemSchema = z.object({
  _action: z.literal('scanItem'),
  productId: z.string().min(1).max(20),
}).strict();

const updateSchema = z.object({
  status: z.enum(['In Transit', 'Cancelled']).optional(),
  origin: z.string().trim().min(1).max(200).optional(),
  destination: z.string().trim().min(1).max(200).optional(),
  totalWeight: z.number().int().positive().max(100000).optional(),
  distance: z.number().int().min(0).max(10000).optional(),
  freightRate: z.number().min(0).max(999).optional(),
  deadline: z.string().max(50).optional(),
  loadingBay: z.string().max(20).optional(),
}).strict();

const bodySchema = z.union([allocateSchema, scanItemSchema, updateSchema]);

/** Status changes allowed through PATCH. Delivery happens via trip completion / invoicing. */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Pending: ['Cancelled'],
  Allocated: ['In Transit', 'Cancelled'],
};

/** Field edits are only allowed before the goods leave the dock. */
const EDITABLE_STATUSES = new Set(['Pending', 'Allocated']);

type OrderItem = { productId: string; quantity: number; batchCode?: string; scanned?: boolean };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const [row] = await withTenant(auth.tenantId, tx => tx.select().from(orders).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, id))));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[GET /api/orders/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(req, bodySchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // Who may do what: allocate (override needs a manager), warehouse scans/loading, office edits
    const needed: Permission[] = [];
    if ('_action' in body && body._action === 'allocate') {
      needed.push('order.allocate');
      if (body.overrideReason) needed.push('order.allocate.override');
    } else if ('_action' in body && body._action === 'scanItem') {
      needed.push('warehouse.load');
    } else {
      const { status: newStatus, loadingBay, ...rest } = body as z.infer<typeof updateSchema>;
      if (newStatus === 'In Transit') needed.push('warehouse.load');
      if (newStatus === 'Cancelled' || Object.keys(rest).length > 0 || (loadingBay !== undefined && newStatus !== 'In Transit')) {
        needed.push('order.update');
      }
    }
    for (const permission of needed) {
      const denied = requirePermission(auth, permission);
      if (denied) return denied;
    }

    // ── Allocate vehicle + driver (one transaction, rows locked) ───────────────
    if ('_action' in body && body._action === 'allocate') {
      const { vehicleId, driverId, overrideReason } = body;
      const overrides: string[] = [];
      return await withTenant(auth.tenantId, async (tx) => {
        const [order] = await tx.select().from(orders).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, id))).for('update');
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        if (order.status !== 'Pending') return transitionError('Order', order.status, 'Allocated');

        const [vehicle] = await tx.select().from(vehicles).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, vehicleId))).for('update');
        if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        if (vehicle.status === 'Maintenance') {
          return NextResponse.json({ error: `Vehicle ${vehicle.vehicleNo} is in maintenance and cannot be allocated` }, { status: 409 });
        }
        if (vehicle.status !== 'Available') {
          if (!overrideReason) {
            return NextResponse.json({ error: `Vehicle ${vehicle.vehicleNo} is ${vehicle.status}. Use a manager override with a reason to queue it.` }, { status: 409 });
          }
          overrides.push(`vehicle ${vehicle.vehicleNo} was ${vehicle.status}`);
        }
        const remaining = vehicle.capacity - (vehicle.currentLoad ?? 0);
        if (order.totalWeight > remaining) {
          return NextResponse.json({
            error: `Order weight ${order.totalWeight.toLocaleString('en-IN')} kg exceeds remaining capacity ${remaining.toLocaleString('en-IN')} kg`,
          }, { status: 409 });
        }

        const [driver] = await tx.select().from(drivers).where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, driverId))).for('update');
        if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        if (driver.status !== 'Available') {
          if (!overrideReason) {
            return NextResponse.json({ error: `Driver ${driver.name} is ${driver.status}. Use a manager override with a reason to assign anyway.` }, { status: 409 });
          }
          overrides.push(`driver ${driver.name} was ${driver.status}`);
        }
        if (driver.licenseExpiry && new Date(driver.licenseExpiry) < new Date(new Date().toDateString())) {
          return NextResponse.json({ error: `Driver ${driver.name}'s licence expired on ${driver.licenseExpiry}` }, { status: 409 });
        }

        const [updated] = await tx.update(orders)
          .set({ status: 'Allocated', vehicleId, driverId })
          .where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, id))).returning();
        await tx.update(vehicles)
          .set({ status: 'In Transit', currentLoad: sql`${vehicles.currentLoad} + ${order.totalWeight}` })
          .where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, vehicleId)));
        await tx.update(drivers).set({ status: 'On Trip' }).where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, driverId)));
        if (overrides.length > 0) {
          await tx.insert(agentAuditLogs).values({
            tenantId: auth.tenantId,
            agentId: 'dispatch',
            eventType: 'ALLOCATION_OVERRIDE',
            entityId: id,
            message: `Override by ${auth.name} (${auth.role}): ${overrideReason}`,
            payload: { userId: auth.userId, vehicleId, driverId, overridden: overrides },
          });
        }
        return NextResponse.json(updated);
      });
    }

    // ── Scan an order item (barcode) ──────────────────────────────────────────
    if ('_action' in body && body._action === 'scanItem') {
      const { productId } = body;
      return await withTenant(auth.tenantId, async (tx) => {
        // Lock the row: each scan rewrites the whole item list
        const [order] = await tx.select().from(orders).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, id))).for('update');
        if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const items = (order.items as OrderItem[]) ?? [];
        if (!items.some(item => item.productId === productId)) {
          return NextResponse.json({ error: `Product ${productId} is not on this order` }, { status: 400 });
        }
        const newItems = items.map(item => item.productId === productId ? { ...item, scanned: true } : item);
        const [updated] = await tx.update(orders).set({ items: newItems }).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, id))).returning();
        return NextResponse.json(updated);
      });
    }

    // ── Plain field / status update ───────────────────────────────────────────
    const updates = body as z.infer<typeof updateSchema>;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    return await withTenant(auth.tenantId, async (tx) => {
      const [order] = await tx.select().from(orders).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, id))).for('update');
      if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const { status, freightRate, ...fields } = updates;
      const hasFieldEdits = Object.keys(fields).length > 0 || freightRate !== undefined;
      if (hasFieldEdits && !EDITABLE_STATUSES.has(order.status ?? '')) {
        return NextResponse.json({ error: `Order is ${order.status} and can no longer be edited` }, { status: 409 });
      }
      if (status && status !== order.status && !ALLOWED_TRANSITIONS[order.status ?? '']?.includes(status)) {
        return transitionError('Order', order.status, status);
      }

      const [updated] = await tx.update(orders).set({
        ...fields,
        ...(freightRate !== undefined ? { freightRate: freightRate.toString() } : {}),
        ...(status ? { status } : {}),
      }).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, id))).returning();

      // Cancelling an allocated order frees its vehicle capacity and driver
      if (status === 'Cancelled' && order.status === 'Allocated') {
        if (order.vehicleId) {
          await tx.update(vehicles).set({
            status: 'Available',
            currentLoad: sql`greatest(${vehicles.currentLoad} - ${order.totalWeight}, 0)`,
          }).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, order.vehicleId)));
        }
        if (order.driverId) {
          await tx.update(drivers).set({ status: 'Available' }).where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, order.driverId)));
        }
      }

      return NextResponse.json(updated);
    });
  } catch (err) {
    console.error('[PATCH /api/orders/[id]]', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
