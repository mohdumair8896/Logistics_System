// GET /api/trips/[id]/driver-link — issue a signed, expiring GPS link for the trip's driver.
// The driver opens it on their phone; /api/gps/ping only accepts pings carrying this token.

import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/tenancy';
import { trips } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { requireTenant, isAuthError, createDriverLinkToken } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'trip.dispatch');
  if (denied) return denied;
  try {
    const { id } = await params;
    const [trip] = await withTenant(auth.tenantId, tx => tx.select({ id: trips.id, vehicleId: trips.vehicleId, status: trips.status })
      .from(trips).where(and(eq(trips.tenantId, auth.tenantId), eq(trips.id, id))));
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    if (!trip.vehicleId) return NextResponse.json({ error: 'Trip has no vehicle assigned' }, { status: 409 });

    const { token, exp } = await createDriverLinkToken(auth.tenantId, trip.vehicleId, trip.id);
    const query = new URLSearchParams({ v: trip.vehicleId, t: trip.id, k: token });

    return NextResponse.json({
      path: `/driver-app?${query.toString()}`,
      expiresAt: new Date(exp * 1000).toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/trips/[id]/driver-link]', err);
    return NextResponse.json({ error: 'Failed to create driver link' }, { status: 500 });
  }
}
