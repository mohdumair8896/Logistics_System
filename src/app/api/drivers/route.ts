// GET /api/drivers — list all drivers
// POST /api/drivers — add a new driver

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drivers } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await db.select().from(drivers).orderBy(drivers.id);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/drivers]', err);
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json();

    // Generate next driver ID
    const [latest] = await db.select({ id: drivers.id }).from(drivers).orderBy(desc(drivers.id)).limit(1);
    const lastNum = latest ? parseInt(latest.id.replace('D', ''), 10) : 0;
    const nextNum = (!isNaN(lastNum) && lastNum > 0) ? lastNum + 1 : 1;
    const id = `D${String(nextNum).padStart(3, '0')}`;

    const [created] = await db.insert(drivers).values({
      id,
      name: body.name,
      phone: body.phone,
      licenseNo: body.licenseNo,
      licenseExpiry: body.licenseExpiry,
      vehicleId: body.vehicleId ?? null,
      status: body.status ?? 'Available',
      trips: body.trips ?? 0,
      rating: body.rating?.toString() ?? '5.0',
      documentVerified: body.documentVerified ?? false,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[POST /api/drivers]', err);
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
}
