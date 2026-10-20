// DELETE /api/knowledge-base/[id] — remove a KB item

import { NextRequest, NextResponse } from 'next/server';
import { knowledgeBase } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { and, eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'kb.manage');
  if (denied) return denied;

  const { id } = await params;
  try {
    const deleted = await withTenant(auth.tenantId, tx => tx.delete(knowledgeBase)
      .where(and(eq(knowledgeBase.tenantId, auth.tenantId), eq(knowledgeBase.id, id)))
      .returning({ id: knowledgeBase.id }));
    if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[DELETE /api/knowledge-base/${id}]`, err);
    return NextResponse.json({ error: 'Failed to delete KB item' }, { status: 500 });
  }
}
