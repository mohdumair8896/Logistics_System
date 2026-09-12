// GET /api/alerts — list active (non-dismissed) alerts
// POST /api/alerts — create a real system alert

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemAlerts } from '@/lib/schema';
import { isNull, desc, sql } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await db.select()
      .from(systemAlerts)
      .where(isNull(systemAlerts.dismissedAt))
      .orderBy(desc(systemAlerts.createdAt))
      .limit(50);

    // Map DB format to app format
    const mapped = rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      severity: r.severity,
      category: r.category,
      timestamp: r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Just now',
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error('[GET /api/alerts]', err);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json();
    const [created] = await db.insert(systemAlerts).values({
      title: body.title,
      description: body.description,
      severity: body.severity,
      category: body.category,
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[POST /api/alerts]', err);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    await db.update(systemAlerts)
      .set({ dismissedAt: sql`now()` })
      .where(isNull(systemAlerts.dismissedAt));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/alerts]', err);
    return NextResponse.json({ error: 'Failed to dismiss all alerts' }, { status: 500 });
  }
}
