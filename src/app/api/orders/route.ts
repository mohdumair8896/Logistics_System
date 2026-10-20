// GET /api/orders — list the workspace's orders
// POST /api/orders — create a new order

import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { orders, customers } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { nextId } from '@/lib/ids';
import { parseJsonBody } from '@/lib/validation';

// New orders always start as Pending and unallocated; status, vehicle and driver are
// set later by allocation, so any such fields in the body are ignored (stripped).
const createOrderSchema = z.object({
  customerId: z.string().min(1).max(20).nullable().optional(),
  origin: z.string().trim().min(1).max(200),
  destination: z.string().trim().min(1).max(200),
  items: z.array(z.object({
    productId: z.string().min(1).max(20),
    quantity: z.number().nonnegative().max(1_000_000),
    batchCode: z.string().max(50).optional(),
  })).max(200).optional().default([]),
  totalWeight: z.number().int().positive().max(100000),
  distance: z.number().int().min(0).max(10000).nullable().optional(),
  freightRate: z.number().min(0).max(999).nullable().optional(),
  loadingBay: z.string().max(20).nullable().optional(),
  deadline: z.string().max(50).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select().from(orders)
      .where(eq(orders.tenantId, auth.tenantId))
      .orderBy(orders.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'order.create');
  if (denied) return denied;
  try {
    const parsed = await parseJsonBody(req, createOrderSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    return await withTenant(auth.tenantId, async tx => {
      // The customer must belong to this workspace
      if (body.customerId) {
        const [customer] = await tx.select({ id: customers.id }).from(customers)
          .where(and(eq(customers.tenantId, auth.tenantId), eq(customers.id, body.customerId)));
        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      const id = await nextId(tx, 'ORD');
      const [created] = await tx.insert(orders).values({
        id,
        tenantId: auth.tenantId,
        customerId: body.customerId ?? null,
        origin: body.origin,
        destination: body.destination,
        items: body.items.map(item => ({ ...item, scanned: false })),
        totalWeight: body.totalWeight,
        status: 'Pending',
        vehicleId: null,
        driverId: null,
        distance: body.distance ?? null,
        freightRate: body.freightRate != null ? body.freightRate.toString() : null,
        loadingBay: body.loadingBay ?? null,
        deadline: body.deadline ?? null,
      }).returning();

      return NextResponse.json(created, { status: 201 });
    });
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
