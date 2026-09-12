// GET /api/vehicles — list all vehicles
// POST /api/vehicles — add a new vehicle

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { vehicles } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await db.select().from(vehicles).orderBy(vehicles.id);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/vehicles]', err);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const body = await req.json();

    // Generate next vehicle ID
    const [latest] = await db.select({ id: vehicles.id }).from(vehicles).orderBy(desc(vehicles.id)).limit(1);
    const lastNum = latest ? parseInt(latest.id.replace('V', ''), 10) : 0;
    const nextNum = (!isNaN(lastNum) && lastNum > 0) ? lastNum + 1 : 1;
    const id = `V${String(nextNum).padStart(3, '0')}`;

    const [created] = await db.insert(vehicles).values({
      id,
      vehicleNo: body.vehicleNo,
      type: body.type,
      capacity: body.capacity,
      currentLoad: body.currentLoad ?? 0,
      status: body.status ?? 'Available',
      driverId: body.driverId ?? null,
      location: body.location ?? '',
      lastService: body.lastService ?? null,
      odometerKm: body.odometerKm ?? 0,
      fuelLevel: body.fuelLevel ?? 100,
      activityLog: [{ id: `ACT-${Date.now()}`, title: 'Vehicle Registered & Onboarded into Fleet', timestamp: new Date().toLocaleString('en-IN'), type: 'inspection' }],
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[POST /api/vehicles]', err);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}
