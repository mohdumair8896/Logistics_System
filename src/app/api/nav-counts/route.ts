// GET /api/nav-counts — lightweight count aggregator for sidebar badges
// Prevents downloading full tables of orders, trips, and leads across all dashboard pages.

import { NextRequest, NextResponse } from 'next/server';
import { orders, trips, shipperLeads } from '@/lib/schema';
import { and, eq, sql } from 'drizzle-orm';
import { requireTenant, isAuthError } from '@/lib/auth';
import { withTenant } from '@/lib/tenancy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireTenant(request);
  if (isAuthError(auth)) return auth;

  try {
    const counts = await withTenant(auth.tenantId, async tx => {
      const count = sql<number>`count(*)::int`;
      const [[pendingOrders], [activeTrips], [newLeads]] = await Promise.all([
        tx.select({ count }).from(orders).where(and(eq(orders.tenantId, auth.tenantId), eq(orders.status, 'Pending'))),
        tx.select({ count }).from(trips).where(and(eq(trips.tenantId, auth.tenantId), eq(trips.status, 'In Transit'))),
        tx.select({ count }).from(shipperLeads).where(and(eq(shipperLeads.tenantId, auth.tenantId), eq(shipperLeads.status, 'New'))),
      ]);
      return {
        pendingOrders: pendingOrders?.count ?? 0,
        activeTrips: activeTrips?.count ?? 0,
        newLeads: newLeads?.count ?? 0,
      };
    });
    return NextResponse.json(counts);
  } catch (err) {
    console.error('[GET /api/nav-counts]', err);
    return NextResponse.json({ pendingOrders: 0, activeTrips: 0, newLeads: 0 });
  }
}
