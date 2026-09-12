// GET /api/drivers/[id]
// PATCH /api/drivers/[id] — update driver (status, vehicleId, rating, etc.)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drivers, vehicles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const [row] = await db.select().from(drivers).where(eq(drivers.id, id));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[GET /api/drivers/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch driver' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();

    // Special: reassign vehicle — handles bidirectional FK update inside transaction
    if (body._action === 'reassignVehicle') {
      const { newVehicleId } = body;
      return await db.transaction(async (tx) => {
        const [driver] = await tx.select().from(drivers).where(eq(drivers.id, id));
        if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

        // Detach from old vehicle
        if (driver.vehicleId) {
          await tx.update(vehicles).set({ driverId: null }).where(eq(vehicles.id, driver.vehicleId));
        }
        // Attach to new vehicle
        const [updated] = await tx.update(drivers).set({ vehicleId: newVehicleId }).where(eq(drivers.id, id)).returning();
        if (newVehicleId) {
          await tx.update(vehicles).set({ driverId: id }).where(eq(vehicles.id, newVehicleId));
        }
        return NextResponse.json(updated);
      });
    }

    const [updated] = await db.update(drivers)
      .set(body)
      .where(eq(drivers.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/drivers/[id]]', err);
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
  }
}
