// GET  /api/leads         — list all shipper leads (newest first)
// POST /api/leads         — create a new lead
// PATCH /api/leads/[id]   — update lead status

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shipperLeads } from '@/lib/schema';
import { requireAuth, isAuthError } from '@/lib/auth';
import { desc } from 'drizzle-orm';

// ─── GET /api/leads ───────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const rows = await db
      .select()
      .from(shipperLeads)
      .orderBy(desc(shipperLeads.createdAt));

    const leads = rows.map(r => ({
      id: r.id,
      shipperName: r.shipperName,
      companyName: r.companyName ?? '',
      phone: r.phone ?? '',
      email: r.email ?? '',
      originHub: r.originHub ?? '',
      destinationHub: r.destinationHub ?? '',
      cargoType: r.cargoType ?? 'Standard Freight',
      estimatedWeightKg: r.estimatedWeightKg ?? 0,
      freightQuote: Number(r.freightQuote ?? 0),
      targetDeliveryDate: r.targetDeliveryDate ?? '',
      isUrgent: r.isUrgent ?? false,
      status: (r.status ?? 'New') as 'New' | 'Allocated' | 'Contacted' | 'Archived',
      transcriptSnippet: r.transcriptSnippet ?? undefined,
      associatedOrderId: r.associatedOrderId ?? undefined,
      createdAt: r.createdAt ? r.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }));

    return NextResponse.json({ leads });
  } catch (err) {
    console.error('[GET /api/leads]', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

// ─── POST /api/leads ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const [latest] = await db.select({ id: shipperLeads.id }).from(shipperLeads).orderBy(desc(shipperLeads.id)).limit(1);
    const lastNum = latest ? parseInt(latest.id.replace('LEAD-', ''), 10) : 0;
    const nextNum = (!isNaN(lastNum) && lastNum > 0) ? lastNum + 1 : 1001;
    const id = `LEAD-${nextNum}`;

    await db.insert(shipperLeads).values({
      id,
      shipperName: body.shipperName,
      companyName: body.companyName,
      phone: body.phone,
      email: body.email,
      originHub: body.originHub,
      destinationHub: body.destinationHub,
      cargoType: body.cargoType,
      estimatedWeightKg: body.estimatedWeightKg,
      freightQuote: String(body.freightQuote ?? 0),
      targetDeliveryDate: body.targetDeliveryDate,
      isUrgent: body.isUrgent ?? false,
      status: 'New',
      transcriptSnippet: body.transcriptSnippet,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/leads]', err);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
