// GET /api/vehicles/[id]
// PATCH /api/vehicles/[id] — update vehicle (status, location, load, GPS, etc.)
// DELETE /api/vehicles/[id]

import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/tenancy';
import { vehicles } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { z } from 'zod';
import { parseJsonBody, isoDate } from '@/lib/validation';

/** Editable vehicle fields. Load, GPS position, driver link and trip status are set by the system. */
const updateSchema = z.object({
  vehicleNo: z.string().trim().min(4).max(20).optional(),
  type: z.string().trim().min(1).max(50).optional(),
  capacity: z.number().int().positive().max(100000).optional(),
  status: z.enum(['Available', 'Maintenance']).optional(),
  location: z.string().max(200).optional(),
  lastService: isoDate.nullable().optional(),
  odometerKm: z.number().int().min(0).max(10_000_000).optional(),
  fuelLevel: z.number().int().min(0).max(100).optional(),
  traccarDeviceId: z.number().int().positive().nullable().optional(),
}).strict();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const [row] = await withTenant(auth.tenantId, tx => tx.select().from(vehicles).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, id))));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[GET /api/vehicles/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'fleet.manage');
  if (denied) return denied;
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(req, updateSchema);
    if (!parsed.ok) return parsed.response;
    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    return await withTenant(auth.tenantId, async (tx) => {
      const [current] = await tx.select({ status: vehicles.status, currentLoad: vehicles.currentLoad })
        .from(vehicles).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, id))).for('update');
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (updates.status && current.status === 'In Transit') {
        return NextResponse.json({ error: 'Vehicle is on a trip; its status changes when the trip completes' }, { status: 409 });
      }
      if (updates.capacity !== undefined && updates.capacity < (current.currentLoad ?? 0)) {
        return NextResponse.json({ error: 'Capacity cannot be lower than the current load' }, { status: 400 });
      }

      const [updated] = await tx.update(vehicles)
        .set(updates)
        .where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, id)))
        .returning();
      return NextResponse.json(updated);
    });
  } catch (err) {
    console.error('[PATCH /api/vehicles/[id]]', err);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'fleet.delete');
  if (denied) return denied;
  try {
    const { id } = await params;
    return await withTenant(auth.tenantId, async (tx) => {
      const [current] = await tx.select({ status: vehicles.status }).from(vehicles)
        .where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, id))).for('update');
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (current.status === 'In Transit') {
        return NextResponse.json({ error: 'Vehicle is on a trip and cannot be removed' }, { status: 409 });
      }
      await tx.delete(vehicles).where(and(eq(vehicles.tenantId, auth.tenantId), eq(vehicles.id, id)));
      return NextResponse.json({ success: true });
    });
  } catch (err) {
    console.error('[DELETE /api/vehicles/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
