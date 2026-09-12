// ─── Action Engine & Autonomy Gateway ─────────────────────────────────────────
// Controls execution of operational tools across TMS, WhatsApp, ERP, and Finance.
// Enforces 5-Level Autonomy Ladder, permission checks, and strict audit logging.

import { AutonomyLevel } from './types';
import { LogisticsEventGraph } from './eventGraph';
import { db } from '@/lib/db';
import { orders, trips, invoices, agentAuditLogs } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export interface ActionRequest {
  actionType:
    | 'SEND_WHATSAPP'
    | 'RESCHEDULE_DOCK'
    | 'UPDATE_TMS_STATUS'
    | 'HOLD_INVOICE'
    | 'APPROVE_INVOICE'
    | 'DISPATCH_REPLACEMENT_FLEET'
    | 'DISPATCH_POD_CHASE';
  targetEntityId: string;
  parameters: Record<string, unknown>;
  reasoning: string;
  financialImpactInr?: number;
}

export class ActionEngine {
  private static globalAutonomyLevel: AutonomyLevel = 4; // Default to Level 4 in production ops deck

  public static getAutonomyLevel(): AutonomyLevel {
    return this.globalAutonomyLevel;
  }

  public static setAutonomyLevel(level: AutonomyLevel) {
    this.globalAutonomyLevel = level;
  }

  /**
   * Evaluate and execute an action through the autonomy gateway.
   */
  public static async executeAction(request: ActionRequest) {
    const level = this.globalAutonomyLevel;
    const impact = request.financialImpactInr ?? 0;

    // Determine required autonomy level for this tool
    let requiredLevel: AutonomyLevel = 3;
    if (request.actionType === 'RESCHEDULE_DOCK') requiredLevel = 4;
    if (request.actionType === 'DISPATCH_REPLACEMENT_FLEET') requiredLevel = 4;
    if (request.actionType === 'APPROVE_INVOICE' || request.actionType === 'HOLD_INVOICE') requiredLevel = 5;
    if (impact > 10000) requiredLevel = 5;

    // Check if human approval is required
    const requiresApproval = level < requiredLevel || (requiredLevel === 5 && impact > 5000);

    if (requiresApproval) {
      // Queue action for human 1-click approval
      const eventId = await LogisticsEventGraph.recordEvent({
        shipmentId: request.targetEntityId,
        eventType: 'ACTION_APPROVAL_REQUESTED',
        actor: 'CONTROL_TOWER',
        title: `Approval Required: ${request.actionType}`,
        description: `Action requires Level ${requiredLevel} authorization. Proposed: ${request.reasoning}`,
        payload: { ...request.parameters, actionType: request.actionType },
        evidence: { financialImpactInr: impact },
        autonomyLevel: requiredLevel,
        approvalRequired: true,
        approvalStatus: 'PENDING_APPROVAL',
        actionDraft: JSON.stringify(request.parameters),
      });

      return {
        executed: false,
        status: 'QUEUED_FOR_APPROVAL',
        requiredAutonomyLevel: requiredLevel,
        currentAutonomyLevel: level,
        eventId,
        message: `Action queued for manager review. Financial impact: ₹${impact.toLocaleString()}`,
      };
    }

    // Otherwise, execute tool immediately
    const executionResult = await this.invokeTool(request.actionType, request.targetEntityId, request.parameters);

    // Record executed action in Event Graph and Audit Log
    await LogisticsEventGraph.recordEvent({
      shipmentId: request.targetEntityId,
      eventType: 'ACTION_APPROVED',
      actor: 'CONTROL_TOWER',
      title: `Auto-Executed: ${request.actionType}`,
      description: `Action executed autonomously under Level ${level} policy: ${request.reasoning}`,
      payload: { ...request.parameters, result: executionResult },
      evidence: { financialImpactInr: impact },
      autonomyLevel: requiredLevel,
      approvalRequired: false,
      approvalStatus: 'AUTO_APPROVED',
    });

    try {
      await db.insert(agentAuditLogs).values({
        agentId: 'action-engine',
        eventType: request.actionType,
        entityId: request.targetEntityId,
        message: `Executed tool ${request.actionType}: ${request.reasoning}`,
        payload: { parameters: request.parameters, result: executionResult },
      });
    } catch {
      // non-fatal
    }

    return {
      executed: true,
      status: 'SUCCESS',
      requiredAutonomyLevel: requiredLevel,
      currentAutonomyLevel: level,
      result: executionResult,
    };
  }

  /**
   * Internal tool invocations simulating or updating real systems.
   */
  private static async invokeTool(actionType: ActionRequest['actionType'], targetId: string, params: Record<string, unknown>) {
    switch (actionType) {
      case 'SEND_WHATSAPP': {
        const phone = (params.phone as string) || '+91-9876543210';
        const text = (params.text as string) || 'Update from FleetOS';
        return { channel: 'WhatsApp', recipient: phone, messageSnippet: text.slice(0, 80), deliveredAt: new Date().toISOString() };
      }

      case 'RESCHEDULE_DOCK': {
        const newSlot = (params.newSlot as string) || 'Tomorrow 09:00 AM';
        try {
          await db.update(orders).set({ loadingBay: `Rescheduled: ${newSlot}` }).where(eq(orders.id, targetId));
        } catch {}
        return { shipmentId: targetId, newAppointmentSlot: newSlot, warehouseNotified: true };
      }

      case 'UPDATE_TMS_STATUS': {
        const newStatus = (params.status as string) || 'Delayed';
        try {
          await db.update(orders).set({ status: newStatus }).where(eq(orders.id, targetId));
        } catch {}
        return { shipmentId: targetId, updatedStatus: newStatus };
      }

      case 'HOLD_INVOICE': {
        try {
          await db.update(invoices).set({ status: 'Disputed' }).where(eq(invoices.id, targetId));
        } catch {}
        return { invoiceId: targetId, status: 'Disputed / On Hold', noticeDispatchedToAP: true };
      }

      case 'APPROVE_INVOICE': {
        try {
          await db.update(invoices).set({ status: 'Paid' }).where(eq(invoices.id, targetId));
        } catch {}
        return { invoiceId: targetId, status: 'Approved for Payment', paymentScheduled: true };
      }

      case 'DISPATCH_REPLACEMENT_FLEET': {
        const replacementPlate = (params.replacementPlate as string) || 'UP32-EX-9900';
        try {
          await db.update(trips).set({ eta: 'Adjusted (+2h replacement)' }).where(eq(trips.orderId, targetId));
        } catch {}
        return { orderId: targetId, replacementVehicleNo: replacementPlate, driverNotified: true };
      }

      case 'DISPATCH_POD_CHASE': {
        return { invoiceId: targetId, linkDispatched: `https://fleetos.internal/pod/upload/${targetId}`, reminderSent: true };
      }

      default:
        return { success: true };
    }
  }
}
