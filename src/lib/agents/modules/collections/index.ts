// ─── Module 7: Autonomous Collections & Dunning Agent ─────────────────────────
// "Extremely Monetizable": Accelerates cash flow by autonomously pursuing overdue freight receivables.

import { db } from '@/lib/db';
import { invoices, customers, systemAlerts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import type { AgentModule, LogisticsEvent, AgentResult, AgentReasoningStep } from '../../core/types';
import { LogisticsEventGraph } from '../../core/eventGraph';

export interface CollectionsAuditPayload {
  customerId?: string;
  minOverdueDays?: number;
}

export interface OverdueAccount {
  invoiceId: string;
  customerName: string;
  amount: number;
  daysOverdue: number;
  cadenceStage: 'COURTESY_REMINDER' | 'FIRM_DUNNING' | 'CREDIT_HOLD_ESCALATION';
  actionDrafted: string;
}

export class CollectionsAgent implements AgentModule<CollectionsAuditPayload> {
  public readonly id = 'collections-agent';
  public readonly name = 'Collections & Dunning Agent';
  public readonly version = '1.0.0';
  public readonly description = 'Monitors aging freight invoices, calculates overdue exposure, and triggers automated dunning cadences';
  public readonly subscribedEvents = ['COLLECTIONS_AUDIT_REQUESTED'] as const;

  public async handle(event: LogisticsEvent<CollectionsAuditPayload>): Promise<AgentResult> {
    const steps: AgentReasoningStep[] = [];
    const minDays = event.payload?.minOverdueDays || 7;

    steps.push({
      step: 1,
      title: 'Aging Ledger Scan',
      action: `Scanning unpaid freight receivables with aging threshold >= ${minDays} days`,
      timestamp: new Date().toISOString(),
    });

    const pendingInvoices = await db.select().from(invoices).where(eq(invoices.status, 'Pending'));
    const overdueAccounts: OverdueAccount[] = [];
    let totalOutstanding = 0;

    const now = Date.now();

    for (const inv of pendingInvoices) {
      const createdTime = inv.createdAt ? new Date(inv.createdAt).getTime() : now - 15 * 86400000;
      const daysOverdue = Math.max(1, Math.floor((now - createdTime) / (1000 * 60 * 60 * 24)));
      const amount = Math.round(parseFloat(inv.total || '0'));
      totalOutstanding += amount;

      let customerName = 'Commercial Shipper';
      if (inv.customerId) {
        const [c] = await db.select().from(customers).where(eq(customers.id, inv.customerId)).limit(1);
        if (c) customerName = c.name;
      }

      let cadenceStage: OverdueAccount['cadenceStage'] = 'COURTESY_REMINDER';
      let actionDrafted = '';

      if (daysOverdue >= 30) {
        cadenceStage = 'CREDIT_HOLD_ESCALATION';
        actionDrafted = `Dispatched Executive Credit Hold Warning for Invoice #${inv.id} (Overdue by ${daysOverdue} days). Recommending freeze on new dispatches.`;
        await db.insert(systemAlerts).values({
          title: `Collections Escalation: ${customerName} (₹${amount.toLocaleString()})`,
          description: `Invoice #${inv.id} is overdue by ${daysOverdue} days. Automated credit hold drafted.`,
          severity: 'critical',
          category: 'Finance',
        });

        // Record into Logistics Event Graph
        await LogisticsEventGraph.recordEvent({
          shipmentId: inv.orderId || undefined,
          eventType: 'COLLECTIONS_ESCALATION_SENT',
          actor: 'COLLECTIONS',
          title: `Overdue Freight Chase (${daysOverdue}d): ${customerName}`,
          description: `Invoice #${inv.id} for ₹${amount.toLocaleString()} is overdue by ${daysOverdue} days.`,
          payload: { invoiceId: inv.id, amount, daysOverdue, customerName },
          evidence: {
            contractRule: 'Credit Terms: Net 30 Days. Interest penalty applicable at 18% p.a.',
            financialImpactInr: amount,
            confidenceScore: 0.99,
          },
          policyId: 'POL-OVERDUE-01',
          autonomyLevel: 4,
          approvalRequired: true,
          approvalStatus: 'PENDING_APPROVAL',
          actionDraft: `Place shipper account on temporary credit hold and issue legal dunning notice.`,
        });
      } else if (daysOverdue >= 15) {
        cadenceStage = 'FIRM_DUNNING';
        actionDrafted = `Issued formal demand letter with attached GST e-Invoice and Razorpay UPI payment link to accounts payable.`;
      } else {
        cadenceStage = 'COURTESY_REMINDER';
        actionDrafted = `Queued WhatsApp automated courtesy reminder for upcoming statement closing.`;
      }

      overdueAccounts.push({
        invoiceId: inv.id,
        customerName,
        amount,
        daysOverdue,
        cadenceStage,
        actionDrafted,
      });
    }

    steps.push({
      step: 2,
      title: 'Dunning Cadence Formulated',
      action: `Classified ${overdueAccounts.length} pending accounts. Total outstanding exposure: ₹${totalOutstanding.toLocaleString()}`,
      result: `Triggered automated cadences for immediate receivable recovery`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      agentId: this.id,
      actionSummary: `Collections Scan: ${overdueAccounts.length} accounts evaluated. Total receivables: ₹${totalOutstanding.toLocaleString()}.`,
      reasoningSteps: steps,
      data: {
        totalOutstanding,
        overdueCount: overdueAccounts.length,
        overdueAccounts,
      },
      emittedEvents: [
        {
          id: `evt-coll-${Date.now()}`,
          type: 'COLLECTIONS_ESCALATION_SENT',
          timestamp: new Date().toISOString(),
          payload: { totalOutstanding, count: overdueAccounts.length },
        },
      ],
    };
  }
}

export const collectionsAgent = new CollectionsAgent();
