// PATCH /api/leads/[id] — update lead status or associatedOrderId

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { shipperLeads, orders } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { parseJsonBody } from '@/lib/validation';
import { and, eq } from 'drizzle-orm';

const updateLeadSchema = z.object({
  status: z.enum(['New', 'Allocated', 'Contacted', 'Archived']).optional(),
  associatedOrderId: z.string().min(1).max(20).nullable().optional(),
}).strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'lead.manage');
  if (denied) return denied;

  const { id } = await params;
  try {
    const parsed = await parseJsonBody(request, updateLeadSchema);
    if (!parsed.ok) return parsed.response;
    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    return await withTenant(auth.tenantId, async tx => {
      // A lead may only link to an order in the same workspace
      if (updates.associatedOrderId) {
        const [order] = await tx.select({ id: orders.id }).from(orders)
          .where(and(eq(orders.tenantId, auth.tenantId), eq(orders.id, updates.associatedOrderId)));
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      const updated = await tx.update(shipperLeads).set(updates)
        .where(and(eq(shipperLeads.tenantId, auth.tenantId), eq(shipperLeads.id, id)))
        .returning({ id: shipperLeads.id });
      if (updated.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true });
    });
  } catch (err) {
    console.error(`[PATCH /api/leads/${id}]`, err);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}
