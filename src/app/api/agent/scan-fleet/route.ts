// ─── Agent API — POST /api/agent/scan-fleet ───────────────────────────────────
// Runs an autonomous fleet-wide sweep across Exceptions, Billing, Collections, and Compliance.

import { NextRequest, NextResponse } from 'next/server';
import { requireTenant, isAuthError } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { runAsTenant, withTenant } from '@/lib/tenancy';
import { agents } from '@/lib/agents/core/registry';
import { trips } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import type { LogisticsEvent } from '@/lib/agents/core/types';

export async function POST(req: NextRequest) {
  const auth = await requireTenant(req);
  if (isAuthError(auth)) return auth;
  const denied = requirePermission(auth, 'agent.run');
  if (denied) return denied;

  try {
    const sweepResults: Record<string, unknown> = {};

    // 1. Exception Scan: Find in-transit trips with progress issues or deviations
    const activeTrips = await withTenant(auth.tenantId, tx => tx.select().from(trips)
      .where(and(eq(trips.tenantId, auth.tenantId), eq(trips.status, 'In Transit'))));
    const exceptionEvents: LogisticsEvent[] = [];

    for (const trip of activeTrips) {
      if (trip.geofenceStatus === 'Deviated' || ((trip.progress ?? 0) < 50 && trip.speedKmH === 0)) {
        exceptionEvents.push({
          id: `evt-sweep-${trip.id}-${Date.now()}`,
          type: 'TELEMETRY_ANOMALY_DETECTED',
          timestamp: new Date().toISOString(),
          entityId: trip.id,
          payload: {
            tripId: trip.id,
            orderId: trip.orderId,
            vehicleId: trip.vehicleId,
            driverId: trip.driverId,
            delayMinutes: 90,
            reason: trip.geofenceStatus === 'Deviated' ? 'Unplanned Route Deviation' : 'Extended Stationary Stoppage (>90 mins)',
          },
        });
      }
    }

    // Publish exception events
    const exceptionResults = [];
    for (const evt of exceptionEvents) {
      const res = await runAsTenant(auth.tenantId, () => agents.publish(evt));
      exceptionResults.push(...res);
    }
    sweepResults.exceptions = {
      scannedTrips: activeTrips.length,
      anomaliesTriggered: exceptionEvents.length,
      results: exceptionResults,
    };

    // 2. Billing Freight Audit
    const freightAuditRes = await runAsTenant(auth.tenantId, () => agents.publish({
      id: `evt-freight-sweep-${Date.now()}`,
      type: 'FREIGHT_AUDIT_REQUESTED',
      timestamp: new Date().toISOString(),
      payload: {},
    }));
    sweepResults.billing = freightAuditRes.find((r) => r.agentId === 'billing-agent')?.data;

    // 3. Collections Dunning Sweep
    const collectionsRes = await runAsTenant(auth.tenantId, () => agents.publish({
      id: `evt-coll-sweep-${Date.now()}`,
      type: 'COLLECTIONS_AUDIT_REQUESTED',
      timestamp: new Date().toISOString(),
      payload: { minOverdueDays: 7 },
    }));
    sweepResults.collections = collectionsRes.find((r) => r.agentId === 'collections-agent')?.data;

    // 4. Documentation & Compliance Audit
    const docRes = await runAsTenant(auth.tenantId, () => agents.publish({
      id: `evt-doc-sweep-${Date.now()}`,
      type: 'DOC_AUDIT_REQUESTED',
      timestamp: new Date().toISOString(),
      payload: {},
    }));
    sweepResults.compliance = docRes.find((r) => r.agentId === 'documentation-agent')?.data;

    return NextResponse.json({
      success: true,
      sweepTimestamp: new Date().toISOString(),
      sweepResults,
    });
  } catch (err: unknown) {
    console.error('[/api/agent/scan-fleet]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
