// GET /api/vehicles — list all vehicles
// POST /api/vehicles — add a new vehicle

import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/tenancy';
import { vehicles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { nextId } from '@/lib/ids';
import { z } from 'zod';
import { parseJsonBody, isoDate } from '@/lib/validation';
import { formatIstTime } from '@/lib/formatters';

// New vehicles start empty and unassigned; drivers are linked via the driver reassign action.
const createVehicleSchema = z.object({
  vehicleNo: z.string().trim().min(4).max(20),
  type: z.string().trim().min(1).max(50),
  capacity: z.number().int().positive().max(100000),
  status: z.enum(['Available', 'Maintenance']).optional(),
  location: z.string().max(200).optional(),
  lastService: isoDate.nullable().optional().or(z.literal('')),
  odometerKm: z.number().int().min(0).max(10_000_000).optional(),
  fuelLevel: z.number().int().min(0).max(100).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select().from(vehicles)
      .where(eq(vehicles.tenantId, auth.tenantId))
      .orderBy(vehicles.id));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/vehicles]', err);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'fleet.manage');
  if (denied) return denied;
  try {
    const parsed = await parseJsonBody(req, createVehicleSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // Generate next vehicle ID
    const created = await withTenant(auth.tenantId, async (tx) => {
    const id = await nextId(tx, 'VEH');

    const [row] = await tx.insert(vehicles).values({
      id,
      tenantId: auth.tenantId,
      vehicleNo: body.vehicleNo,
      type: body.type,
      capacity: body.capacity,
      currentLoad: 0,
      status: body.status ?? 'Available',
      driverId: null,
      location: body.location ?? '',
      lastService: body.lastService ? body.lastService : null,
      odometerKm: body.odometerKm ?? 0,
      fuelLevel: body.fuelLevel ?? 100,
      activityLog: [{ id: `ACT-${Date.now()}`, title: 'Vehicle Registered & Onboarded into Fleet', timestamp: `${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} ${formatIstTime(new Date())}`, type: 'inspection' }],
    }).returning();
    return row;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[POST /api/vehicles]', err);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}
