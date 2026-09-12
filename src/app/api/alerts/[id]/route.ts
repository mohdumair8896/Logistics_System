// DELETE /api/alerts/[id] — dismiss an alert (sets dismissedAt timestamp)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemAlerts } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    await db.update(systemAlerts)
      .set({ dismissedAt: sql`now()` })
      .where(eq(systemAlerts.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/alerts/[id]]', err);
    return NextResponse.json({ error: 'Failed to dismiss alert' }, { status: 500 });
  }
}
