// GET /api/vehicles/[id]
// PATCH /api/vehicles/[id] — update vehicle (status, location, load, GPS, etc.)
// DELETE /api/vehicles/[id]

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { vehicles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[GET /api/vehicles/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db.update(vehicles)
      .set(body)
      .where(eq(vehicles.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/vehicles/[id]]', err);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/vehicles/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
