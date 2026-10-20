// POST /api/invoices/tally-export — TallyPrime XML (ledgers + sales vouchers) for the selected invoices.
// Export only; see src/features/invoices/tally.ts for what the file contains.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { withTenant } from '@/lib/tenancy';
import { customers, gstOptions, invoices, orders } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';
import { parseJsonBody } from '@/lib/validation';
import { financialYear } from '@/features/invoices/gst';
import { buildTallyXml, tallyDate, type TallyInvoice } from '@/features/invoices/tally';

const exportSchema = z.object({
  ids: z.array(z.string().min(1).max(20)).min(1).max(500),
}).strict();

const num = (v: string | null) => (v == null ? 0 : parseFloat(v));
const numOrNull = (v: string | null) => (v == null ? null : parseFloat(v));

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  try {
    const parsed = await parseJsonBody(req, exportSchema);
    if (!parsed.ok) return parsed.response;
    const ids = [...new Set(parsed.data.ids)];

    const loaded = await withTenant(auth.tenantId, async (tx) => {
      const invRows = await tx.select().from(invoices)
        .where(and(eq(invoices.tenantId, auth.tenantId), inArray(invoices.id, ids)))
        .orderBy(invoices.createdAt);
      const customerIds = [...new Set(invRows.map(r => r.customerId).filter((c): c is string => !!c))];
      const orderIds = [...new Set(invRows.map(r => r.orderId).filter((o): o is string => !!o))];
      const [customerRows, orderRows, optionRows] = await Promise.all([
        customerIds.length ? tx.select().from(customers).where(and(eq(customers.tenantId, auth.tenantId), inArray(customers.id, customerIds))) : Promise.resolve([]),
        orderIds.length
          ? tx.select({ id: orders.id, origin: orders.origin, destination: orders.destination }).from(orders)
              .where(and(eq(orders.tenantId, auth.tenantId), inArray(orders.id, orderIds)))
          : Promise.resolve([]),
        tx.select().from(gstOptions).where(eq(gstOptions.tenantId, auth.tenantId)),
      ]);
      return { invRows, customerRows, orderRows, optionRows };
    });

    const { invRows, customerRows, orderRows, optionRows } = loaded;
    const missing = ids.filter(id => !invRows.some(r => r.id === id));
    if (missing.length) {
      return NextResponse.json({ error: `Invoice not found: ${missing.join(', ')}` }, { status: 404 });
    }

    const data: TallyInvoice[] = invRows.map(r => {
      const customer = customerRows.find(c => c.id === r.customerId);
      const order = orderRows.find(o => o.id === r.orderId);
      const option = optionRows.find(o => o.financialYear === financialYear(r.createdAt ?? new Date()));
      return {
        id: r.id,
        orderId: r.orderId,
        createdAt: r.createdAt,
        freight: num(r.freight),
        loading: num(r.loading),
        unloading: num(r.unloading),
        damageDeduction: num(r.damageDeduction),
        subtotal: num(r.subtotal),
        gst: num(r.gst),
        gstScheme: r.gstScheme,
        placeOfSupply: r.placeOfSupply,
        cgst: numOrNull(r.cgst),
        sgst: numOrNull(r.sgst),
        igst: numOrNull(r.igst),
        total: num(r.total),
        origin: order?.origin,
        destination: order?.destination,
        customer: {
          id: r.customerId ?? '',
          name: customer?.name ?? r.customerId ?? 'Unknown customer',
          gstin: customer?.gstin ?? null,
          address: customer?.address ?? null,
        },
        supplierGstin: option?.supplierGstin ?? null,
      };
    });

    return new NextResponse(buildTallyXml(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="Tally-Invoices-${tallyDate(new Date())}.xml"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[POST /api/invoices/tally-export]', err);
    return NextResponse.json({ error: 'Failed to build the Tally export' }, { status: 500 });
  }
}
