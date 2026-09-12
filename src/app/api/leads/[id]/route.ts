// PATCH /api/leads/[id] — update lead status or associatedOrderId

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipperLeads } from '@/lib/schema';
import { requireAuth, isAuthError } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.associatedOrderId !== undefined) updates.associatedOrderId = body.associatedOrderId;

    await db.update(shipperLeads).set(updates).where(eq(shipperLeads.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[PATCH /api/leads/${id}]`, err);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}
