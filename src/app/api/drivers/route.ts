// GET /api/drivers — list all drivers
// POST /api/drivers — add a new driver

import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/tenancy';
import { drivers, vehicles } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { nextId } from '@/lib/ids';
import { z } from 'zod';
import { parseJsonBody, isoDate } from '@/lib/validation';

// Trip count, rating and document verification are maintained by the system / compliance,
// so they are not accepted here (extra keys are stripped).
const createDriverSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  licenseNo: z.string().trim().min(4).max(30),
  licenseExpiry: isoDate,
  vehicleId: z.string().min(1).max(20).nullable().optional(),
  status: z.enum(['Available', 'Off Duty']).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const rows = await withTenant(auth.tenantId, tx => tx.select().from(drivers)
      .where(eq(drivers.tenantId, auth.tenantId))
      .orderBy(drivers.id));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/drivers]', err);
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'fleet.manage');
  if (denied) return denied;
  try {
    const parsed = await parseJsonBody(req, createDriverSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    return await withTenant(auth.tenantId, async (tx) => {
      // Keep both sides of the driver ⇄ vehicle link consistent
      if (body.vehicleId) {
        const [vehicle] = await tx.select({ id: vehicles.id, driverId: vehicles.driverId })
          .from(vehicles).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, body.vehicleId))).for('update');
        if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        if (vehicle.driverId) {
          await tx.update(drivers).set({ vehicleId: null }).where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, vehicle.driverId)));
        }
      }

      const id = await nextId(tx, 'DRV');
      const [created] = await tx.insert(drivers).values({
        id,
        tenantId: auth.tenantId,
        name: body.name,
        phone: body.phone,
        licenseNo: body.licenseNo,
        licenseExpiry: body.licenseExpiry,
        vehicleId: body.vehicleId ?? null,
        status: body.status ?? 'Available',
        documentVerified: false, // verified later by compliance (PATCH documentVerified)
      }).returning();

      if (body.vehicleId) {
        await tx.update(vehicles).set({ driverId: id }).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, body.vehicleId)));
      }
      return NextResponse.json(created, { status: 201 });
    });
  } catch (err) {
    console.error('[POST /api/drivers]', err);
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
}
