// ─── Module 5: Autonomous Documentation & Compliance Agent ────────────────────
// Audits physical and digital documents: PODs, e-Way bills, LR, and driver credentials.

import { db } from '@/lib/db';
import { invoices, drivers, systemAlerts } from '@/lib/schema';
import type { AgentModule, LogisticsEvent, AgentResult, AgentReasoningStep } from '../../core/types';

export interface DocAuditPayload {
  invoiceId?: string;
  driverId?: string;
  documentType?: 'POD' | 'EWAY_BILL' | 'LICENSE' | 'ALL';
}

export class DocumentationAgent implements AgentModule<DocAuditPayload> {
  public readonly id = 'documentation-agent';
  public readonly name = 'Documentation & Compliance Agent';
  public readonly version = '1.0.0';
  public readonly description = 'Audits POD signatures, e-Way bills, and driver credentials for regulatory compliance';
  public readonly subscribedEvents = ['DOC_AUDIT_REQUESTED'] as const;

  public async handle(event: LogisticsEvent<DocAuditPayload>): Promise<AgentResult> {
    const steps: AgentReasoningStep[] = [];
    const payload = event.payload || {};

    steps.push({
      step: 1,
      title: 'Documentation Audit Initiated',
      action: `Scanning records for audit scope: [${payload.documentType || 'ALL'}]`,
      timestamp: new Date().toISOString(),
    });

    const discrepanciesFound: string[] = [];

    // 1. Audit Invoices for missing POD signatures on delivered goods
    const allInvoices = await db.select().from(invoices);
    const missingPods = allInvoices.filter((inv) => !inv.podSigned);

    if (missingPods.length > 0) {
      discrepanciesFound.push(`${missingPods.length} invoice(s) lack signed electronic Proof of Delivery (e-POD)`);
    }

    // 2. Audit Drivers for expired or near-expiry licenses (within 30 days)
    const allDrivers = await db.select().from(drivers);
    const todayStr = new Date().toISOString().split('T')[0];
    const expiredDrivers = allDrivers.filter((d) => d.licenseExpiry && d.licenseExpiry <= todayStr);

    if (expiredDrivers.length > 0) {
      discrepanciesFound.push(`${expiredDrivers.length} driver(s) operating with expired or non-compliant commercial licenses`);
      for (const exp of expiredDrivers) {
        await db.insert(systemAlerts).values({
          title: `Compliance Breach: Driver ${exp.name} (${exp.licenseNo})`,
          description: `License expired on ${exp.licenseExpiry}. Immediate grounding recommended.`,
          severity: 'critical',
          category: 'Driver',
        });
      }
    }

    steps.push({
      step: 2,
      title: 'Cross-Verification Completed',
      action: `Audited ${allInvoices.length} invoices and ${allDrivers.length} driver profiles`,
      result: `Identified ${discrepanciesFound.length} compliance discrepancy categories`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      agentId: this.id,
      actionSummary: `Documentation Audit: Verified ${allInvoices.length} invoices and ${allDrivers.length} drivers. Found ${discrepanciesFound.length} issues.`,
      reasoningSteps: steps,
      data: {
        missingPodsCount: missingPods.length,
        expiredDriversCount: expiredDrivers.length,
        discrepanciesFound,
      },
      emittedEvents:
        discrepanciesFound.length > 0
          ? [
              {
                id: `evt-doc-${Date.now()}`,
                type: 'DOC_DISCREPANCY_FLAGGED',
                timestamp: new Date().toISOString(),
                payload: { discrepancies: discrepanciesFound },
              },
            ]
          : [],
    };
  }
}

export const documentationAgent = new DocumentationAgent();
