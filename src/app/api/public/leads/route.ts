// POST /api/public/leads — website "Book this load" form → shipper_leads (CRM pipeline)
// Public on purpose (no login). Protected by validation, a honeypot field and a per-IP limit.
// The estimate is recomputed here so the stored quote can't be tampered with from the browser.
// Leads land in the workspace that runs this public site: PUBLIC_LEADS_TENANT_ID
// (defaults to the Legacy Workspace created by drizzle/0002_tenancy_backfill.sql).
// Contact preference, shipping frequency, the optional marketing opt-in and first-touch campaign tags are recorded
// in the lead's notes (transcript_snippet) until the CRM has columns for them. The opt-in is a separate, unticked
// box on the form (DPDP: no "legitimate interest" basis for marketing calls), and the lead's created_at dates it.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { withTenant } from '@/lib/tenancy';
import { shipperLeads, tenants } from '@/lib/schema';
import { parseJsonBody } from '@/lib/validation';
import { nextId } from '@/lib/ids';
import { clientIp, isRateLimited, tooManyRequests } from '@/lib/rateLimit';
import { CARGO_TYPES, estimateQuote, type CargoCode } from '@/lib/pricing/indicativeQuote';

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().transform(s => s.replace(/[\s-]/g, '')).pipe(
    z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number'),
  ),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  company: z.string().trim().max(200).optional(),
  origin: z.string().trim().min(2).max(60),
  destination: z.string().trim().min(2).max(60),
  vehicleCode: z.string().max(40),
  cargoCode: z.enum(CARGO_TYPES.map(c => c.code) as [CargoCode, ...CargoCode[]]),
  weightKg: z.number().positive().max(40000),
  contactPreference: z.enum(['call', 'whatsapp']).optional(),
  shipFrequency: z.enum(['once', 'monthly', 'weekly', 'daily']).optional(),
  marketingOptIn: z.boolean().optional(),
  firstTouch: z.object({
    utm_source: z.string().max(100).optional(),
    utm_medium: z.string().max(100).optional(),
    utm_campaign: z.string().max(100).optional(),
    utm_term: z.string().max(100).optional(),
    utm_content: z.string().max(100).optional(),
    landing: z.string().max(100).optional(),
    referrer: z.string().max(200).optional(),
  }).strict().optional(),
  /** Honeypot: real users never see or fill this field. */
  website: z.string().max(0).optional(),
}).strict();

const PUBLIC_LEADS_TENANT_ID = process.env.PUBLIC_LEADS_TENANT_ID?.trim() || 'ten_legacy_workspace';

export async function POST(req: NextRequest) {
  // 5 requests per 10 minutes per IP (best-effort, per instance)
  if (isRateLimited(`public-leads:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return tooManyRequests('Too many requests. Please try again in a few minutes.');
  }

  const parsed = await parseJsonBody(req, leadSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  const quote = estimateQuote({
    origin: input.origin,
    destination: input.destination,
    vehicleCode: input.vehicleCode,
    cargoCode: input.cargoCode,
    weightKg: input.weightKg,
  });
  if (!quote.ok) {
    return NextResponse.json({ error: quote.message, field: quote.field }, { status: 400 });
  }
  const { estimate } = quote;
  const cargo = CARGO_TYPES.find(c => c.code === input.cargoCode)!;

  const FREQUENCY: Record<string, string> = { once: 'one-off load', monthly: 'about monthly', weekly: 'weekly', daily: 'daily' };
  const touch = input.firstTouch ?? {};
  const source = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
  const tags = source.filter(k => touch[k]).map(k => `${k}=${touch[k]}`).join(', ');
  const notes = [
    `Contact by: ${input.contactPreference === 'whatsapp' ? 'WhatsApp' : 'phone call'}.`,
    input.shipFrequency ? `Ships: ${FREQUENCY[input.shipFrequency]}.` : '',
    `Marketing updates: ${input.marketingOptIn ? 'opted in on the website form' : 'not opted in'}.`,
    tags || touch.referrer || touch.landing
      ? `Source: ${[tags, touch.referrer && `referrer ${touch.referrer}`, touch.landing && `landed on ${touch.landing}`].filter(Boolean).join('; ')}.`
      : '',
  ].filter(Boolean).join(' ');

  try {
    const [owner] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, PUBLIC_LEADS_TENANT_ID));
    if (!owner) {
      console.error(`[POST /api/public/leads] PUBLIC_LEADS_TENANT_ID "${PUBLIC_LEADS_TENANT_ID}" does not exist`);
      return NextResponse.json({ error: 'Online booking is not available right now. Please try again later.' }, { status: 503 });
    }

    const id = await withTenant(owner.id, async (tx) => {
      const leadId = await nextId(tx, 'LEAD');
      await tx.insert(shipperLeads).values({
        id: leadId,
        tenantId: owner.id,
        shipperName: input.name,
        companyName: input.company || null,
        phone: input.phone,
        email: input.email || null,
        originHub: `${estimate.origin.name}, ${estimate.origin.state}`,
        destinationHub: `${estimate.destination.name}, ${estimate.destination.state}`,
        cargoType: cargo.label,
        estimatedWeightKg: Math.round(input.weightKg),
        // Midpoint of the indicative band; the team confirms the final rate
        freightQuote: String(Math.round((estimate.priceLow + estimate.priceHigh) / 2)),
        status: 'New',
        transcriptSnippet:
          `Website instant quote: ${estimate.vehicle.label}, ~${estimate.roadKm} km, ` +
          `₹${estimate.priceLow.toLocaleString('en-IN')}–₹${estimate.priceHigh.toLocaleString('en-IN')} indicative, ` +
          `${estimate.transitDays} day(s) transit. ${notes}`,
      });
      return leadId;
    });

    return NextResponse.json({ success: true, reference: id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/public/leads]', err);
    return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500 });
  }
}
