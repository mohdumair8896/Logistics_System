// GET /api/orders/[id]
// PATCH /api/orders/[id] — update order (status, vehicleId, driverId, scan items, etc.)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, vehicles, drivers } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const [row] = await db.select().from(orders).where(eq(orders.id, id));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[GET /api/orders/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();

    // Special: allocate vehicle + driver to order inside transaction
    if (body._action === 'allocate') {
      const { vehicleId, driverId } = body;
      return await db.transaction(async (tx) => {
        const [updated] = await tx.update(orders).set({ status: 'Allocated', vehicleId, driverId }).where(eq(orders.id, id)).returning();
        await tx.update(vehicles).set({ status: 'In Transit' }).where(eq(vehicles.id, vehicleId));
        if (driverId) await tx.update(drivers).set({ status: 'On Trip' }).where(eq(drivers.id, driverId));
        return NextResponse.json(updated);
      });
    }

    // Special: scan an order item (barcode)
    if (body._action === 'scanItem') {
      const { productId } = body;
      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const newItems = (order.items as { productId: string; quantity: number; batchCode?: string; scanned?: boolean }[])
        .map(item => item.productId === productId ? { ...item, scanned: true } : item);
      const [updated] = await db.update(orders).set({ items: newItems }).where(eq(orders.id, id)).returning();
      return NextResponse.json(updated);
    }

    const [updated] = await db.update(orders).set(body).where(eq(orders.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/orders/[id]]', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
