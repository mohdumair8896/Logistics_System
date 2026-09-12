// GET /api/invoices/[id]/pdf
// Generates and streams a real GST-compliant A4 PDF invoice.
// Uses @react-pdf/renderer server-side rendering.

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { db } from '@/lib/db';
import { invoices, orders, customers, drivers, vehicles, products } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { InvoicePdf } from '@/features/invoices/InvoicePdf';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;

    // Fetch invoice first
    const [invRow] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invRow) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    // Fetch order and customer in parallel
    const [[orderRow], [customerRow]] = await Promise.all([
      invRow.orderId ? db.select().from(orders).where(eq(orders.id, invRow.orderId)) : Promise.resolve([null]),
      invRow.customerId ? db.select().from(customers).where(eq(customers.id, invRow.customerId)) : Promise.resolve([null]),
    ]);

    if (!orderRow || !customerRow) {
      return NextResponse.json({ error: 'Related data not found' }, { status: 404 });
    }

    // Extract product IDs needed specifically for this invoice's order items
    const itemProductIds = ((orderRow.items as { productId?: string }[]) || [])
      .map(i => i.productId)
      .filter((pid): pid is string => typeof pid === 'string' && pid.length > 0);

    // Fetch driver, vehicle, and targeted products in parallel
    const [[driverRow], [vehicleRow], productRows] = await Promise.all([
      orderRow.driverId ? db.select().from(drivers).where(eq(drivers.id, orderRow.driverId)) : Promise.resolve([null]),
      orderRow.vehicleId ? db.select().from(vehicles).where(eq(vehicles.id, orderRow.vehicleId)) : Promise.resolve([null]),
      itemProductIds.length > 0
        ? db.select().from(products).where(inArray(products.id, itemProductIds))
        : Promise.resolve([]),
    ]);

    // Determine if inter-state shipment (origin ≠ destination state)
    // Simple heuristic: same state if both contain same state abbreviation
    const originLower = (orderRow.origin ?? '').toLowerCase();
    const destLower = (orderRow.destination ?? '').toLowerCase();
    const isInterState = !(
      (originLower.includes('lucknow') || originLower.includes('kanpur') || originLower.includes('up')) &&
      (destLower.includes('lucknow') || destLower.includes('kanpur') || destLower.includes('up') ||
       destLower.includes('agra') || destLower.includes('prayagraj') || destLower.includes('varanasi'))
    );

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
      isInterState,
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
