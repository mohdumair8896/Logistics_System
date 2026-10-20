// ─── Logistics Event Graph (Operational Context Graph) ────────────────────────
// The canonical machine-readable operational history connecting Orders, Shipments,
// Vehicles (GPS), Drivers (WhatsApp), Routes, PODs, Invoices, and Actions.

import { db } from '@/lib/db';
import { currentTenantId } from '@/lib/tenancy';
import { operationalEvents } from '@/lib/schema';
import { and, eq, desc, gte, sql } from 'drizzle-orm';
import { OperationalTimelineEvent, OperationalEvidence, AutonomyLevel } from './types';

export class LogisticsEventGraph {
  /**
   * Record a canonical operational event to the event graph and database.
   */
  public static async recordEvent(data: {
    shipmentId?: string;
    tripId?: string;
    vehicleId?: string;
    driverId?: string;
    eventType: string;
    actor: 'SYSTEM' | 'DRIVER' | 'CUSTOMER' | 'CONTROL_TOWER' | 'BILLING' | 'COLLECTIONS' | 'DISPATCHER';
    title: string;
    description: string;
    location?: string;
    lat?: number;
    lng?: number;
    payload?: Record<string, unknown>;
    evidence?: OperationalEvidence;
    policyId?: string;
    autonomyLevel?: AutonomyLevel;
    approvalRequired?: boolean;
    approvalStatus?: 'AUTO_APPROVED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
    actionDraft?: string;
  }): Promise<string> {
    const id = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      await db.insert(operationalEvents).values({ tenantId: currentTenantId(),
        id,
        shipmentId: data.shipmentId || null,
        tripId: data.tripId || null,
        vehicleId: data.vehicleId || null,
        driverId: data.driverId || null,
        eventType: data.eventType,
        actor: data.actor,
        title: data.title,
        description: data.description,
        location: data.location || null,
        lat: data.lat ? data.lat.toString() : null,
        lng: data.lng ? data.lng.toString() : null,
        payload: data.payload || {},
        evidence: data.evidence || {},
        policyId: data.policyId || null,
        autonomyLevel: data.autonomyLevel ?? 3,
        approvalRequired: data.approvalRequired ?? false,
        approvalStatus: data.approvalStatus || (data.approvalRequired ? 'PENDING_APPROVAL' : 'AUTO_APPROVED'),
        actionDraft: data.actionDraft || null,
      });

      return id;
    } catch (err) {
      console.error('[EventGraph] Failed to persist operational event:', err);
      return id;
    }
  }

  /**
   * Retrieve the complete operational history timeline for a shipment.
   */
  public static async getShipmentTimeline(shipmentId: string): Promise<OperationalTimelineEvent[]> {
    try {
      const records = await db
        .select()
        .from(operationalEvents)
        .where(and(eq(operationalEvents.tenantId, currentTenantId()), eq(operationalEvents.shipmentId, shipmentId)))
        .orderBy(desc(operationalEvents.createdAt));

      return records.map(r => ({
        id: r.id,
        shipmentId: r.shipmentId || undefined,
        tripId: r.tripId || undefined,
        vehicleId: r.vehicleId || undefined,
        driverId: r.driverId || undefined,
        eventType: r.eventType,
        actor: r.actor as OperationalTimelineEvent['actor'],
        title: r.title,
        description: r.description,
        location: r.location || undefined,
        lat: r.lat ? parseFloat(r.lat) : undefined,
        lng: r.lng ? parseFloat(r.lng) : undefined,
        payload: (r.payload as Record<string, unknown>) || {},
        evidence: (r.evidence as OperationalEvidence) || {},
        policyId: r.policyId || undefined,
        autonomyLevel: (r.autonomyLevel ?? 3) as AutonomyLevel,
        approvalRequired: !!r.approvalRequired,
        approvalStatus: (r.approvalStatus as OperationalTimelineEvent['approvalStatus']) || 'AUTO_APPROVED',
        actionDraft: r.actionDraft || undefined,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.error('[EventGraph] Error fetching shipment timeline:', err);
      return [];
    }
  }

  /**
   * Get active items in the AI Operations Queue.
   */
  public static async getOperationsQueue(status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED') {
    try {
      const query = status
        ? db.select().from(operationalEvents).where(and(eq(operationalEvents.tenantId, currentTenantId()), eq(operationalEvents.approvalStatus, status))).orderBy(desc(operationalEvents.createdAt)).limit(50)
        : db.select().from(operationalEvents).where(eq(operationalEvents.tenantId, currentTenantId())).orderBy(desc(operationalEvents.createdAt)).limit(50);

      const records = await query;
      return records.map(r => ({
        id: r.id,
        shipmentId: r.shipmentId,
        tripId: r.tripId,
        vehicleId: r.vehicleId,
        driverId: r.driverId,
        eventType: r.eventType,
        actor: r.actor,
        title: r.title,
        description: r.description,
        location: r.location,
        evidence: r.evidence as OperationalEvidence,
        policyId: r.policyId,
        autonomyLevel: r.autonomyLevel,
        approvalRequired: r.approvalRequired,
        approvalStatus: r.approvalStatus,
        actionDraft: r.actionDraft,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.error('[EventGraph] Error fetching operations queue:', err);
      return [];
    }
  }

  /**
   * Update the approval status for a queued action.
   */
  public static async resolveApproval(
    eventId: string,
    decision: 'APPROVED' | 'REJECTED',
    notes?: string
  ): Promise<boolean> {
    try {
      const updated = await db
        .update(operationalEvents)
        .set({
          approvalStatus: decision,
          actionDraft: notes ? `[${decision}] ${notes}` : undefined,
        })
        .where(and(eq(operationalEvents.tenantId, currentTenantId()), eq(operationalEvents.id, eventId)))
        .returning({ id: operationalEvents.id });

      return updated.length > 0;
    } catch (err) {
      console.error('[EventGraph] Error resolving approval:', err);
      return false;
    }
  }

  /**
   * Aggregated ROI and productivity metrics from the Event Graph for the last 7 days.
   * Only executed actions (auto-approved or approved) count; nothing is padded.
   */
  public static async getOperationsMetrics() {
    const empty = {
      totalAutomatedTasks: 0,
      hoursSaved: 0,
      pendingApprovals: 0,
      freightLeakagePreventedInr: 0,
      disputedInvoicesResolved: 0,
      activeWorkforceCount: 0,
    };
    try {
      const executed = sql`${operationalEvents.approvalStatus} in ('AUTO_APPROVED', 'APPROVED')`;
      const impact = sql`${operationalEvents.evidence}->>'financialImpactInr'`;
      const [row] = await db.select({
        automated: sql<number>`count(*) filter (where ${executed})::int`,
        pending: sql<number>`count(*) filter (where ${operationalEvents.approvalStatus} = 'PENDING_APPROVAL')::int`,
        leakage: sql<number>`coalesce(sum(case when ${impact} ~ '^[0-9]+([.][0-9]+)?$' then (${impact})::numeric end) filter (where ${executed}), 0)::float`,
        disputesResolved: sql<number>`count(*) filter (where ${executed} and ${operationalEvents.eventType} = 'FREIGHT_DISCREPANCY_FLAGGED')::int`,
        actors: sql<number>`count(distinct ${operationalEvents.actor})::int`,
      }).from(operationalEvents)
        .where(and(eq(operationalEvents.tenantId, currentTenantId()), gte(operationalEvents.createdAt, sql`now() - interval '7 days'`)));

      if (!row) return empty;
      return {
        totalAutomatedTasks: row.automated,
        // Estimate: ~20 minutes of manual coordination per automated action
        hoursSaved: Math.round((row.automated * 20) / 60),
        pendingApprovals: row.pending,
        freightLeakagePreventedInr: Math.round(row.leakage),
        disputedInvoicesResolved: row.disputesResolved,
        activeWorkforceCount: row.actors,
      };
    } catch (err) {
      console.error('[EventGraph] Error computing operations metrics:', err);
      return empty;
    }
  }
}
