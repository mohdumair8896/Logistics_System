// GET /api/products — list the workspace's products from the Neon DB
// Single source of truth — replaces 5 inline static arrays across the codebase.

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { products } from '@/lib/schema';
import { requireTenant, isAuthError } from '@/lib/auth';
import { withTenant } from '@/lib/tenancy';

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;

  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select().from(products)
      .where(eq(products.tenantId, auth.tenantId))
      .orderBy(products.id));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/products]', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
