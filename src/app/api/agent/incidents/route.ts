// ─── Agent API — GET / PATCH /api/agent/incidents ─────────────────────────────
// Endpoint to view and manage autonomous operational incidents.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { incidents } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  try {
    const list = await db.select().from(incidents).orderBy(desc(incidents.createdAt)).limit(50);
    return NextResponse.json({ success: true, incidents: list });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const { id, status, resolutionNote } = body || {};

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing incident "id"' }, { status: 400 });
    }

    await db
      .update(incidents)
      .set({
        status: status || 'RESOLVED',
        resolvedAt: new Date(),
        automatedActionTaken: resolutionNote || 'Manually verified and resolved by dispatcher',
      })
      .where(eq(incidents.id, id));

    return NextResponse.json({ success: true, message: `Incident ${id} updated` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
