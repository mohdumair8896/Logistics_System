// GET /api/customers — list the workspace's customers
// POST /api/customers — create a customer

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { customers } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { withTenant } from '@/lib/tenancy';
import { nextId } from '@/lib/ids';
import { parseJsonBody } from '@/lib/validation';

const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  contact: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(500).optional(),
  gstin: z.string().trim().toUpperCase()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Enter a valid 15-character GSTIN')
    .optional().or(z.literal('')),
}).strict();

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select().from(customers)
      .where(eq(customers.tenantId, auth.tenantId))
      .orderBy(customers.id));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/customers]', err);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'customer.manage');
  if (denied) return denied;
  try {
    const parsed = await parseJsonBody(req, createCustomerSchema);
    if (!parsed.ok) return parsed.response;
    const { gstin, ...fields } = parsed.data;

    const created = await withTenant(auth.tenantId, async tx => {
      const id = await nextId(tx, 'CUST');
      const [row] = await tx.insert(customers)
        .values({ ...fields, gstin: gstin || null, id, tenantId: auth.tenantId })
        .returning();
      return row;
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[POST /api/customers]', err);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
