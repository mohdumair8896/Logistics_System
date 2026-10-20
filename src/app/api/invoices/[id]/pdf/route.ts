// GET /api/invoices/[id]/pdf
// Generates and streams a real GST-compliant A4 PDF invoice.
// Uses @react-pdf/renderer server-side rendering.

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { invoices, orders, customers, drivers, vehicles, products } from '@/lib/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { InvoicePdf } from '@/features/invoices/InvoicePdf';
import { requireTenant, isAuthError } from '@/lib/auth';
import { withTenant } from '@/lib/tenancy';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;

    // Load the invoice and everything it references, within this workspace only
    const loaded = await withTenant(auth.tenantId, async (tx) => {
      const [invRow] = await tx.select().from(invoices).where(and(eq(invoices.tenantId, auth.tenantId), eq(invoices.id, id)));
      if (!invRow) return null;

      const [[orderRow], [customerRow]] = await Promise.all([
        invRow.orderId ? tx.select().from(orders).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, invRow.orderId))) : Promise.resolve([null]),
        invRow.customerId ? tx.select().from(customers).where(and(eq(customers.tenantId, auth.tenantId), eq(customers.id, invRow.customerId))) : Promise.resolve([null]),
      ]);
      if (!orderRow || !customerRow) return { invRow, orderRow: null, customerRow: null, driverRow: null, vehicleRow: null, productRows: [] };

      // Extract product IDs needed specifically for this invoice's order items
      const itemProductIds = ((orderRow.items as { productId?: string }[]) || [])
        .map(i => i.productId)
        .filter((pid): pid is string => typeof pid === 'string' && pid.length > 0);

      const [[driverRow], [vehicleRow], productRows] = await Promise.all([
        orderRow.driverId ? tx.select().from(drivers).where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, orderRow.driverId))) : Promise.resolve([null]),
        orderRow.vehicleId ? tx.select().from(vehicles).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, orderRow.vehicleId))) : Promise.resolve([null]),
        itemProductIds.length > 0
          ? tx.select().from(products).where(and(eq(products.tenantId, auth.tenantId), inArray(products.id, itemProductIds)))
          : Promise.resolve([]),
      ]);
      return { invRow, orderRow, customerRow, driverRow, vehicleRow, productRows };
    });

    if (!loaded) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const { invRow, orderRow, customerRow, driverRow, vehicleRow, productRows } = loaded;
    if (!orderRow || !customerRow) {
      return NextResponse.json({ error: 'Related data not found' }, { status: 404 });
    }

    const data = {
      invoice: {
        id: invRow.id,
        createdAt: invRow.createdAt
          ? new Date(invRow.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : new Date().toLocaleDateString('en-IN'),
        status: (invRow.status as 'Paid' | 'Pending') ?? 'Pending',
        freight: parseFloat(invRow.freight ?? '0'),
        loading: parseFloat(invRow.loading ?? '0'),
        unloading: parseFloat(invRow.unloading ?? '0'),
        damageDeduction: parseFloat(invRow.damageDeduction ?? '0'),
        subtotal: parseFloat(invRow.subtotal ?? '0'),
        gst: parseFloat(invRow.gst ?? '0'),
        gstScheme: invRow.gstScheme,
        placeOfSupply: invRow.placeOfSupply,
        cgst: invRow.cgst == null ? null : parseFloat(invRow.cgst),
        sgst: invRow.sgst == null ? null : parseFloat(invRow.sgst),
        igst: invRow.igst == null ? null : parseFloat(invRow.igst),
        total: parseFloat(invRow.total ?? '0'),
        podSigned: invRow.podSigned ?? false,
        receiverName: invRow.receiverName ?? 'Authorized Representative',
      },
      order: {
        id: orderRow.id,
        origin: orderRow.origin ?? '',
        destination: orderRow.destination ?? '',
        totalWeight: orderRow.totalWeight ?? 0,
        distance: orderRow.distance ?? 0,
        items: (orderRow.items as { productId: string; quantity: number }[]) ?? [],
        loadingBay: orderRow.loadingBay ?? '',
        deadline: orderRow.deadline ?? '',
      },
      customer: {
        name: customerRow.name ?? '',
        contact: customerRow.contact ?? '',
        phone: customerRow.phone ?? '',
        address: customerRow.address ?? '',
        gstin: customerRow.gstin ?? '',
      },
      driver: driverRow ? { name: driverRow.name ?? '', phone: driverRow.phone ?? '' } : undefined,
      vehicle: vehicleRow ? { vehicleNo: vehicleRow.vehicleNo ?? '', type: vehicleRow.type ?? '' } : undefined,
      products: productRows.map(p => ({ id: p.id, name: p.name ?? '' })),
    };

    // Server-side render PDF to buffer
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePdf, { data }) as unknown as ReactElement<DocumentProps>
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[GET /api/invoices/[id]/pdf]', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
