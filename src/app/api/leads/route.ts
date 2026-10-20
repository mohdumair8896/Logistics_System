// GET  /api/leads         — list all shipper leads (newest first)
// POST /api/leads         — create a new lead
// PATCH /api/leads/[id]   — update lead status

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { shipperLeads } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { nextId } from '@/lib/ids';
import { parseJsonBody, isoDate } from '@/lib/validation';
import { desc, eq } from 'drizzle-orm';

const createLeadSchema = z.object({
  shipperName: z.string().trim().min(1).max(100),
  companyName: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  originHub: z.string().trim().max(200).optional(),
  destinationHub: z.string().trim().max(200).optional(),
  cargoType: z.string().trim().max(50).optional(),
  estimatedWeightKg: z.number().int().min(0).max(100000).optional(),
  freightQuote: z.number().min(0).max(100_000_000).optional(),
  targetDeliveryDate: isoDate.optional().or(z.literal('')),
  isUrgent: z.boolean().optional(),
  transcriptSnippet: z.string().max(5000).optional(),
});

// ─── GET /api/leads ───────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;

  try {
    const rows = await withTenant(auth.tenantId, tx => tx
      .select()
      .from(shipperLeads)
      .where(eq(shipperLeads.tenantId, auth.tenantId))
      .orderBy(desc(shipperLeads.createdAt)));

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
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'lead.manage');
  if (denied) return denied;

  try {
    const parsed = await parseJsonBody(request, createLeadSchema);
    if (!parsed.ok) return parsed.response;
    const { freightQuote, email, targetDeliveryDate, ...fields } = parsed.data;

    const id = await withTenant(auth.tenantId, async tx => {
      const newId = await nextId(tx, 'LEAD');
      await tx.insert(shipperLeads).values({
        ...fields,
        id: newId,
        tenantId: auth.tenantId,
        email: email || null,
        targetDeliveryDate: targetDeliveryDate || null,
        freightQuote: String(freightQuote ?? 0),
        status: 'New',
      });
      return newId;
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/leads]', err);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
