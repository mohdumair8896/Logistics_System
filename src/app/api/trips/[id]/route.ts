// GET /api/trips/[id]
// PATCH /api/trips/[id] — update trip (progress, GPS, status, complete delivery)

import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/tenancy';
import { trips } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { parseJsonBody, transitionError } from '@/lib/validation';
import { completeTrip } from '@/lib/delivery';

const completeSchema = z.object({ _action: z.literal('complete') }).strict();

/** Live-trip fields a dispatcher may correct. Status changes go through `_action: 'complete'`. */
const updateSchema = z.object({
  progress: z.number().int().min(0).max(100).optional(),
  eta: z.string().max(50).nullable().optional(),
  geofenceStatus: z.enum(['Inside Corridor', 'Deviated', 'Arrived']).optional(),
  cargoTemp: z.string().max(40).nullable().optional(),
  fuelPercent: z.number().int().min(0).max(100).nullable().optional(),
  checkpoints: z.array(z.object({
    name: z.string().max(200),
    location: z.string().max(200),
    passed: z.boolean(),
    time: z.string().max(50).optional(),
  }).strict()).max(50).optional(),
}).strict();

const bodySchema = z.union([completeSchema, updateSchema]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const [row] = await withTenant(auth.tenantId, tx => tx.select().from(trips).where(and(eq(trips.tenantId, auth.tenantId), eq(trips.id, id))));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[GET /api/trips/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 });
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
    const denied = requirePermission(auth, '_action' in body ? 'trip.complete' : 'trip.update');
    if (denied) return denied;

    // Special: complete delivery — updates trip + order + vehicle + driver inside transaction
    if ('_action' in body) {
      return await withTenant(auth.tenantId, async (tx) => {
        const [trip] = await tx.select().from(trips).where(and(eq(trips.tenantId, auth.tenantId), eq(trips.id, id))).for('update');
        if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (trip.status !== 'In Transit') return transitionError('Trip', trip.status, 'Delivered');

        return NextResponse.json(await completeTrip(tx, auth.tenantId, trip));
      });
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }
    return await withTenant(auth.tenantId, async (tx) => {
      const [current] = await tx.select({ status: trips.status }).from(trips).where(and(eq(trips.tenantId, auth.tenantId), eq(trips.id, id))).for('update');
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (current.status !== 'In Transit') {
        return NextResponse.json({ error: `Trip is ${current.status} and can no longer be edited` }, { status: 409 });
      }

      const [updated] = await tx.update(trips).set(body).where(and(eq(trips.tenantId, auth.tenantId), eq(trips.id, id))).returning();
      return NextResponse.json(updated);
    });
  } catch (err) {
    console.error('[PATCH /api/trips/[id]]', err);
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}
