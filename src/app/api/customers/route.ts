// GET /api/customers — list all customers
// POST /api/customers — create a customer

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await db.select().from(customers).orderBy(customers.id);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/customers]', err);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json();
    const [latest] = await db.select({ id: customers.id }).from(customers).orderBy(desc(customers.id)).limit(1);
    const lastNum = latest ? parseInt(latest.id.replace('C', ''), 10) : 0;
    const nextNum = (!isNaN(lastNum) && lastNum > 0) ? lastNum + 1 : 1;
    const id = `C${String(nextNum).padStart(3, '0')}`;

    const [created] = await db.insert(customers).values({ id, ...body }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[POST /api/customers]', err);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
