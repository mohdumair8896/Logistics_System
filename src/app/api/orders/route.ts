// GET /api/orders — list all orders
// POST /api/orders — create a new order

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await db.select().from(orders).orderBy(orders.createdAt);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json();

    // Generate next order ID
    const [latest] = await db.select({ id: orders.id }).from(orders).orderBy(desc(orders.id)).limit(1);
    const lastNum = latest ? parseInt(latest.id.replace('ORD-', ''), 10) : 0;
    const nextNum = (!isNaN(lastNum) && lastNum > 0) ? lastNum + 1 : 1001;
    const id = `ORD-${nextNum}`;

    const [created] = await db.insert(orders).values({
      id,
      customerId: body.customerId,
      origin: body.origin,
      destination: body.destination,
      items: body.items ?? [],
      totalWeight: body.totalWeight,
      status: body.status ?? 'Pending',
      vehicleId: body.vehicleId ?? null,
      driverId: body.driverId ?? null,
      distance: body.distance ?? null,
      freightRate: body.freightRate?.toString() ?? null,
      loadingBay: body.loadingBay ?? null,
      deadline: body.deadline ?? null,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
