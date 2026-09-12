// GET /api/invoices — list all invoices
// POST /api/invoices — generate a new invoice for an order

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices, orders, trips } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await db.select().from(invoices).orderBy(invoices.createdAt);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/invoices]', err);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json();
    const { orderId, damageDeduction = 0, receiverName = 'Authorized Receiver' } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    return await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Find associated trip
      const [trip] = await tx.select({ id: trips.id }).from(trips).where(eq(trips.orderId, orderId));

      // Calculate invoice amounts
      const freight = Math.round(
        (order.totalWeight ?? 0) *
        parseFloat(order.freightRate?.toString() ?? '2.0') *
        (order.distance ?? 0) / 100
      );
      const loading = 2000;
      const unloading = 1500;
      const gross = freight + loading + unloading;
      const subtotal = Math.max(0, gross - damageDeduction);
      const gst = Math.round(subtotal * 0.18);
      const total = subtotal + gst;

      // Generate next invoice ID
      const [latest] = await tx.select({ id: invoices.id }).from(invoices).orderBy(desc(invoices.id)).limit(1);
      const lastNum = latest ? parseInt(latest.id.replace('INV-', ''), 10) : 0;
      const nextNum = (!isNaN(lastNum) && lastNum > 0) ? lastNum + 1 : 1001;
      const id = `INV-${nextNum}`;

      const [created] = await tx.insert(invoices).values({
        id,
        orderId,
        customerId: order.customerId,
        tripId: trip?.id ?? null,
        freight: freight.toString(),
        loading: loading.toString(),
        unloading: unloading.toString(),
        damageDeduction: damageDeduction.toString(),
        subtotal: subtotal.toString(),
        gst: gst.toString(),
        total: total.toString(),
        status: 'Pending',
        podSigned: true,
        receiverName,
      }).returning();

      // Mark order as Delivered
      await tx.update(orders).set({ status: 'Delivered' }).where(eq(orders.id, orderId));

      return NextResponse.json(created, { status: 201 });
    });
  } catch (err) {
    console.error('[POST /api/invoices]', err);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
