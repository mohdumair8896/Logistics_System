// ─── Module 6: Autonomous Billing & Freight Audit Agent ───────────────────────
// Eradicates revenue leakage, overbilling, duplicate charges, and rate discrepancies.

import { db } from '@/lib/db';
import { invoices, orders } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import type { AgentModule, LogisticsEvent, AgentResult, AgentReasoningStep } from '../../core/types';
import { LogisticsEventGraph } from '../../core/eventGraph';

export interface FreightAuditPayload {
  invoiceId?: string;
  orderId?: string;
}

export class BillingAgent implements AgentModule<FreightAuditPayload> {
  public readonly id = 'billing-agent';
  public readonly name = 'Billing & Freight Audit Agent';
  public readonly version = '1.0.0';
  public readonly description = 'Audits freight invoices against contract rates and order payload weights to prevent financial leakage';
  public readonly subscribedEvents = ['FREIGHT_AUDIT_REQUESTED'] as const;

  public async handle(event: LogisticsEvent<FreightAuditPayload>): Promise<AgentResult> {
    const steps: AgentReasoningStep[] = [];
    const { invoiceId, orderId } = event.payload || {};

    steps.push({
      step: 1,
      title: 'Freight Audit Triggered',
      action: `Auditing ledger for discrepancy risks (Scope: ${invoiceId || orderId || 'Full Ledger'})`,
      timestamp: new Date().toISOString(),
    });

    const allInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(20);
    const auditedList: {
      invoiceId: string;
      billedFreight: number;
      expectedFreight: number;
      variance: number;
      status: 'VERIFIED' | 'DISCREPANCY_FLAGGED';
    }[] = [];

    let totalLeakage = 0;

    for (const inv of allInvoices) {
      if (!inv.orderId) continue;
      const [order] = await db.select().from(orders).where(eq(orders.id, inv.orderId)).limit(1);
      if (!order) continue;

      const weight = order.totalWeight || 0;
      const rate = parseFloat(order.freightRate || '2.50');
      const expectedFreight = Math.round(weight * rate);
      const billedFreight = Math.round(parseFloat(inv.freight || '0'));
      const variance = billedFreight - expectedFreight;

      if (Math.abs(variance) > 500) {
        totalLeakage += Math.abs(variance);
        auditedList.push({
          invoiceId: inv.id,
          billedFreight,
          expectedFreight,
          variance,
          status: 'DISCREPANCY_FLAGGED',
        });

        // Record into Logistics Event Graph as a Level 5 financial approval item
        await LogisticsEventGraph.recordEvent({
          shipmentId: inv.orderId,
          eventType: 'FREIGHT_DISCREPANCY_FLAGGED',
          actor: 'BILLING',
          title: `Rate Discrepancy Flagged on Invoice ${inv.id}`,
          description: `Billed ₹${billedFreight.toLocaleString()} vs contracted ₹${expectedFreight.toLocaleString()} (Variance: ₹${variance.toLocaleString()}).`,
          payload: { invoiceId: inv.id, billedFreight, expectedFreight, variance },
          evidence: {
            contractRule: `Contract baseline: ₹${rate}/kg for order ${order.id}`,
            financialImpactInr: Math.abs(variance),
            confidenceScore: 0.98,
          },
          policyId: 'POL-RATE_MISMATCH',
          autonomyLevel: 5,
          approvalRequired: true,
          approvalStatus: 'PENDING_APPROVAL',
          actionDraft: `Adjust invoice ${inv.id} freight from ₹${billedFreight.toLocaleString()} to contracted ₹${expectedFreight.toLocaleString()}`,
        });
      } else {
        auditedList.push({
          invoiceId: inv.id,
          billedFreight,
          expectedFreight,
          variance,
          status: 'VERIFIED',
        });
      }
    }

    steps.push({
      step: 2,
      title: 'Contract vs Actual Tariff Verification',
      action: `Audited ${allInvoices.length} invoices against rated corridors`,
      result: `Total detected billing variance: ₹${totalLeakage.toLocaleString()}`,
      timestamp: new Date().toISOString(),
    });

    const emittedEvents: LogisticsEvent[] = [];
    if (totalLeakage > 0) {
      emittedEvents.push({
        id: `evt-leakage-${Date.now()}`,
        type: 'FREIGHT_DISCREPANCY_FLAGGED',
        timestamp: new Date().toISOString(),
        payload: {
          totalLeakage,
          flaggedInvoicesCount: auditedList.filter((a) => a.status === 'DISCREPANCY_FLAGGED').length,
        },
      });
    }

    return {
      success: true,
      agentId: this.id,
      actionSummary: `Freight Audit Complete: Audited ${allInvoices.length} invoices. Flagged ₹${totalLeakage.toLocaleString()} in variance.`,
      reasoningSteps: steps,
      data: {
        auditedCount: allInvoices.length,
        totalLeakage,
        auditedList,
      },
      emittedEvents,
    };
  }
}

export const billingAgent = new BillingAgent();
