// PATCH /api/invoices/[id] — update invoice (mark paid, upload POD, etc.)

import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/tenancy';
import { invoices } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { z } from 'zod';
import { parseJsonBody, transitionError } from '@/lib/validation';

/** Only these invoice fields can change after issue. Amounts are fixed once generated. */
const updateSchema = z.object({
  status: z.enum(['Pending', 'Paid', 'Disputed']).optional(),
  receiverName: z.string().trim().min(1).max(100).optional(),
}).strict();

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Pending: ['Paid', 'Disputed'],
  Disputed: ['Pending', 'Paid'],
  Paid: [], // final
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const [row] = await withTenant(auth.tenantId, tx => tx.select().from(invoices).where(and(eq(invoices.tenantId, auth.tenantId), eq(invoices.id, id))));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[GET /api/invoices/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'invoice.update');
  if (denied) return denied;
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(req, updateSchema);
    if (!parsed.ok) return parsed.response;
    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    return await withTenant(auth.tenantId, async (tx) => {
      const [current] = await tx.select({ status: invoices.status }).from(invoices)
        .where(and(eq(invoices.tenantId, auth.tenantId), eq(invoices.id, id))).for('update');
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (current.status === 'Paid') {
        return NextResponse.json({ error: 'Paid invoices cannot be changed; issue a credit note instead' }, { status: 409 });
      }
      if (updates.status && updates.status !== current.status && !ALLOWED_TRANSITIONS[current.status ?? '']?.includes(updates.status)) {
        return transitionError('Invoice', current.status, updates.status);
      }

      const [updated] = await tx.update(invoices)
        .set(updates)
        .where(and(eq(invoices.tenantId, auth.tenantId), eq(invoices.id, id)))
        .returning();
      return NextResponse.json(updated);
    });
  } catch (err) {
    console.error('[PATCH /api/invoices/[id]]', err);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
