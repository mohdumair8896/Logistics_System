// GET  /api/knowledge-base         — list all KB items
// POST /api/knowledge-base         — create a new item
// DELETE /api/knowledge-base/[id]  — delete an item

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { knowledgeBase } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { nextId } from '@/lib/ids';
import { parseJsonBody } from '@/lib/validation';
import { desc, eq } from 'drizzle-orm';

const createItemSchema = z.object({
  category: z.string().trim().min(1).max(50),
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1).max(20000),
  keywords: z.array(z.string().trim().max(60)).max(50).optional().default([]),
}).strict();

// ─── GET /api/knowledge-base ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;

  try {
    const rows = await withTenant(auth.tenantId, tx => tx
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.tenantId, auth.tenantId))
      .orderBy(desc(knowledgeBase.createdAt)));

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
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'kb.manage');
  if (denied) return denied;

  try {
    const parsed = await parseJsonBody(request, createItemSchema);
    if (!parsed.ok) return parsed.response;

    const id = await withTenant(auth.tenantId, async tx => {
      const newId = await nextId(tx, 'KB');
      await tx.insert(knowledgeBase).values({ id: newId, tenantId: auth.tenantId, ...parsed.data });
      return newId;
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/knowledge-base]', err);
    return NextResponse.json({ error: 'Failed to create KB item' }, { status: 500 });
  }
}
