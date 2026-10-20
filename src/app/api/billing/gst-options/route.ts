// GET /api/billing/gst-options — this workspace's GTA GST option (Annexure V) per financial year
// PUT /api/billing/gst-options — record the option for a financial year (affects invoices raised after it)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { withTenant } from '@/lib/tenancy';
import { gstOptions } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { parseJsonBody } from '@/lib/validation';
import {
  DEFAULT_GST_SCHEME, GST_SCHEMES, GST_SCHEME_IDS, financialYear, gstinStateCode, isFinancialYear,
} from '@/features/invoices/gst';

const putSchema = z.object({
  financialYear: z.string().refine(isFinancialYear, 'Use a financial year such as 2026-27'),
  scheme: z.enum(GST_SCHEME_IDS as [string, ...string[]]),
  supplierGstin: z.string().trim().toUpperCase().max(15).optional().nullable()
    .refine(v => !v || gstinStateCode(v) !== null, 'Enter a valid 15-character GSTIN'),
}).strict();

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select().from(gstOptions)
      .where(eq(gstOptions.tenantId, auth.tenantId))
      .orderBy(desc(gstOptions.financialYear)));
    return NextResponse.json({
      currentFinancialYear: financialYear(),
      defaultScheme: DEFAULT_GST_SCHEME,
      schemes: GST_SCHEME_IDS.map(id => ({ id, ...GST_SCHEMES[id] })),
      options: rows.map(r => ({ financialYear: r.financialYear, scheme: r.scheme, supplierGstin: r.supplierGstin, updatedAt: r.updatedAt })),
    });
  } catch (err) {
    console.error('[GET /api/billing/gst-options]', err);
    return NextResponse.json({ error: 'Failed to fetch GST options' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'invoice.update');
  if (denied) return denied;
  try {
    const parsed = await parseJsonBody(req, putSchema);
    if (!parsed.ok) return parsed.response;
    const { financialYear: year, scheme } = parsed.data;
    const supplierGstin = parsed.data.supplierGstin || null;

    const [saved] = await withTenant(auth.tenantId, tx => tx.insert(gstOptions)
      .values({ tenantId: auth.tenantId, financialYear: year, scheme, supplierGstin, updatedBy: auth.userId })
      .onConflictDoUpdate({
        target: [gstOptions.tenantId, gstOptions.financialYear],
        set: { scheme, supplierGstin, updatedBy: auth.userId, updatedAt: new Date() },
      })
      .returning());
    return NextResponse.json({ financialYear: saved.financialYear, scheme: saved.scheme, supplierGstin: saved.supplierGstin, updatedAt: saved.updatedAt });
  } catch (err) {
    console.error('[PUT /api/billing/gst-options]', err);
    return NextResponse.json({ error: 'Failed to save the GST option' }, { status: 500 });
  }
}
