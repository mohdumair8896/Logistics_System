// DELETE /api/knowledge-base/[id] — remove a KB item

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeBase } from '@/lib/schema';
import { requireAuth, isAuthError } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  try {
    await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[DELETE /api/knowledge-base/${id}]`, err);
    return NextResponse.json({ error: 'Failed to delete KB item' }, { status: 500 });
  }
}
