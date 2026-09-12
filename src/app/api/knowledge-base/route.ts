// GET  /api/knowledge-base         — list all KB items
// POST /api/knowledge-base         — create a new item
// DELETE /api/knowledge-base/[id]  — delete an item

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeBase } from '@/lib/schema';
import { requireAuth, isAuthError } from '@/lib/auth';
import { desc } from 'drizzle-orm';

// ─── GET /api/knowledge-base ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const rows = await db
      .select()
      .from(knowledgeBase)
      .orderBy(desc(knowledgeBase.createdAt));

    const items = rows.map(r => ({
      id: r.id,
      category: r.category as 'Hours & Operations' | 'Lane Rates' | 'Safety & HAZMAT' | 'GST & Invoicing' | 'Cold-Chain SLA',
      title: r.title,
      content: r.content,
      keywords: Array.isArray(r.keywords) ? r.keywords : [],
      lastUpdated: r.lastUpdated ?? new Date().toISOString().split('T')[0],
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[GET /api/knowledge-base]', err);
    return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 });
  }
}

// ─── POST /api/knowledge-base ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const [latest] = await db.select({ id: knowledgeBase.id }).from(knowledgeBase).orderBy(desc(knowledgeBase.id)).limit(1);
    const lastNum = latest ? parseInt(latest.id.replace('KB-', ''), 10) : 0;
    const nextNum = (!isNaN(lastNum) && lastNum > 0) ? lastNum + 1 : 101;
    const id = `KB-${nextNum}`;

    await db.insert(knowledgeBase).values({
      id,
      category: body.category,
      title: body.title,
      content: body.content,
      keywords: body.keywords ?? [],
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/knowledge-base]', err);
    return NextResponse.json({ error: 'Failed to create KB item' }, { status: 500 });
  }
}
