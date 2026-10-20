// GET /api/drivers/[id]
// PATCH /api/drivers/[id] — update driver (status, vehicleId, rating, etc.)

import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/tenancy';
import { drivers, vehicles } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission, type Permission } from '@/lib/permissions';
import { z } from 'zod';
import { parseJsonBody, isoDate } from '@/lib/validation';

const reassignSchema = z.object({
  _action: z.literal('reassignVehicle'),
  newVehicleId: z.string().min(1).max(20).nullable(),
}).strict();

/** Editable driver fields. Trip count, rating and vehicle link are maintained by the system. */
const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().min(6).max(20).optional(),
  licenseNo: z.string().trim().min(4).max(30).optional(),
  licenseExpiry: isoDate.optional(),
  status: z.enum(['Available', 'Off Duty']).optional(),
  documentVerified: z.boolean().optional(),
}).strict();

const bodySchema = z.union([reassignSchema, updateSchema]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const [row] = await withTenant(auth.tenantId, tx => tx.select().from(drivers).where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, id))));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[GET /api/drivers/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch driver' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(req, bodySchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // Document verification is a compliance decision; other edits are fleet management
    const needed: Permission[] = [];
    if ('_action' in body) needed.push('fleet.manage');
    else {
      const { documentVerified, ...rest } = body;
      if (documentVerified !== undefined) needed.push('driver.verify');
      if (Object.keys(rest).length > 0) needed.push('fleet.manage');
    }
    for (const permission of needed) {
      const denied = requirePermission(auth, permission);
      if (denied) return denied;
    }

    // Special: reassign vehicle — keeps both sides of the driver ⇄ vehicle link consistent
    if ('_action' in body) {
      const { newVehicleId } = body;
      return await withTenant(auth.tenantId, async (tx) => {
        const [driver] = await tx.select().from(drivers).where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, id))).for('update');
        if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        if (driver.status === 'On Trip') {
          return NextResponse.json({ error: `${driver.name} is on a trip; reassign after it completes` }, { status: 409 });
        }

        if (newVehicleId) {
          const [vehicle] = await tx.select().from(vehicles).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, newVehicleId))).for('update');
          if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
          // Detach the vehicle's previous driver, if any
          if (vehicle.driverId && vehicle.driverId !== id) {
            await tx.update(drivers).set({ vehicleId: null }).where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, vehicle.driverId)));
          }
        }
        // Detach from old vehicle
        if (driver.vehicleId && driver.vehicleId !== newVehicleId) {
          await tx.update(vehicles).set({ driverId: null }).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, driver.vehicleId)));
        }
        // Attach to new vehicle
        const [updated] = await tx.update(drivers).set({ vehicleId: newVehicleId }).where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, id))).returning();
        if (newVehicleId) {
          await tx.update(vehicles).set({ driverId: id }).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, newVehicleId)));
        }
        return NextResponse.json(updated);
      });
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }
    return await withTenant(auth.tenantId, async (tx) => {
      const [current] = await tx.select({ status: drivers.status }).from(drivers).where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, id))).for('update');
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (body.status && current.status === 'On Trip') {
        return NextResponse.json({ error: 'Driver is on a trip; status changes when the trip completes' }, { status: 409 });
      }

      const [updated] = await tx.update(drivers)
        .set(body)
        .where(and(eq(drivers.tenantId, auth.tenantId), eq(drivers.id, id)))
        .returning();
      return NextResponse.json(updated);
    });
  } catch (err) {
    console.error('[PATCH /api/drivers/[id]]', err);
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
  }
}
