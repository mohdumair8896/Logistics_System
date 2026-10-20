// GET /api/invoices — list all invoices
// POST /api/invoices — generate a new invoice for an order

import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/tenancy';
import { customers, gstOptions, invoices, orders, trips } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { nextId } from '@/lib/ids';
import { parseJsonBody } from '@/lib/validation';
import { DEFAULT_GST_SCHEME, SUPPLIER_STATE_CODE, computeGst, financialYear, gstinStateCode, isGstScheme } from '@/features/invoices/gst';

const createInvoiceSchema = z.object({
  orderId: z.string().min(1).max(20),
  damageDeduction: z.number().min(0).max(10_000_000).optional().default(0),
  receiverName: z.string().trim().min(1).max(100).optional().default('Authorized Receiver'),
}).strict();

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select().from(invoices)
      .where(eq(invoices.tenantId, auth.tenantId))
      .orderBy(invoices.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/invoices]', err);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'invoice.create');
  if (denied) return denied;
  try {
    const parsed = await parseJsonBody(req, createInvoiceSchema);
    if (!parsed.ok) return parsed.response;
    const { orderId, damageDeduction, receiverName } = parsed.data;

    return await withTenant(auth.tenantId, async (tx) => {
      const [order] = await tx.select().from(orders).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, orderId))).for('update');
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      // An invoice follows proof of delivery, never the other way round
      if (order.status !== 'Delivered') {
        return NextResponse.json({ error: `Order is ${order.status}; complete the delivery before invoicing` }, { status: 409 });
      }
      const [existing] = await tx.select({ id: invoices.id }).from(invoices).where(and(eq(invoices.tenantId, auth.tenantId), eq(invoices.orderId, orderId)));
      if (existing) {
        return NextResponse.json({ error: `Invoice ${existing.id} already exists for this order`, id: existing.id }, { status: 409 });
      }

      // Find associated trip
      const [trip] = await tx.select({ id: trips.id }).from(trips).where(and(eq(trips.tenantId, auth.tenantId), eq(trips.orderId, orderId)));

      // Calculate invoice amounts
      const freight = Math.round(
        (order.totalWeight ?? 0) *
        parseFloat(order.freightRate?.toString() ?? '2.0') *
        (order.distance ?? 0) / 100
      );
      const loading = 2000;
      const unloading = 1500;
      const gross = freight + loading + unloading;
      if (damageDeduction > gross) {
        return NextResponse.json({ error: 'Damage deduction cannot exceed the invoice value' }, { status: 400 });
      }
      const subtotal = gross - damageDeduction;

      // GST follows this financial year's GTA option (reverse charge unless forward charge was declared)
      // and the customer's state (features/invoices/gst.ts)
      const [[option], [customer]] = await Promise.all([
        tx.select().from(gstOptions).where(and(eq(gstOptions.tenantId, auth.tenantId), eq(gstOptions.financialYear, financialYear()))),
        order.customerId
          ? tx.select({ gstin: customers.gstin }).from(customers).where(and(eq(customers.tenantId, auth.tenantId), eq(customers.id, order.customerId)))
          : Promise.resolve([undefined]),
      ]);
      const scheme = isGstScheme(option?.scheme) ? option.scheme : DEFAULT_GST_SCHEME;
      const tax = computeGst(scheme, subtotal, customer?.gstin, gstinStateCode(option?.supplierGstin) ?? SUPPLIER_STATE_CODE);
      const amountOf = (label: string) => tax.lines.find(l => l.label === label)?.amount.toFixed(2) ?? null;
      const gst = tax.charged;
      const total = subtotal + gst;

      const id = await nextId(tx, 'INV');

      const [created] = await tx.insert(invoices).values({
        id,
        tenantId: auth.tenantId,
        orderId,
        customerId: order.customerId,
        tripId: trip?.id ?? null,
        freight: freight.toString(),
        loading: loading.toString(),
        unloading: unloading.toString(),
        damageDeduction: damageDeduction.toString(),
        subtotal: subtotal.toString(),
        gst: gst.toFixed(2),
        gstScheme: tax.scheme,
        placeOfSupply: tax.placeOfSupply.code,
        cgst: amountOf('CGST'),
        sgst: amountOf('SGST'),
        igst: amountOf('IGST'),
        total: total.toFixed(2),
        status: 'Pending',
        podSigned: true,
        receiverName,
      }).returning();


      return NextResponse.json(created, { status: 201 });
    });
  } catch (err) {
    console.error('[POST /api/invoices]', err);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
