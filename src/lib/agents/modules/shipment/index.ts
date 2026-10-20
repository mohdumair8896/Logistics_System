// ─── Module 1: Autonomous Shipment Agent ──────────────────────────────────────
// Completely isolated module: parses unformatted shipment orders and schedules them.

import { db } from '@/lib/db';
import { currentTenantId } from '@/lib/tenancy';
import { orders, customers, vehicles } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { nextId } from '@/lib/ids';
import { roadDistanceKm } from '@/lib/pricing/indicativeQuote';
import type { AgentModule, LogisticsEvent, AgentResult, AgentReasoningStep } from '../../core/types';

export interface ShipmentIngestPayload {
  rawText?: string;
  customerId?: string;
  origin?: string;
  destination?: string;
  totalWeight?: number;
  deadline?: string;
  source?: 'EMAIL' | 'WHATSAPP' | 'API' | 'MANUAL';
}

export class ShipmentAgent implements AgentModule<ShipmentIngestPayload> {
  public readonly id = 'shipment-agent';
  public readonly name = 'Shipment Ingestion Agent';
  public readonly version = '1.0.0';
  public readonly description = 'Parses unformatted shipping requests, performs capacity checks, and initializes orders';
  public readonly subscribedEvents = ['SHIPMENT_INGEST_REQUESTED'] as const;

  public async handle(event: LogisticsEvent<ShipmentIngestPayload>): Promise<AgentResult> {
    const steps: AgentReasoningStep[] = [];
    const payload = event.payload || {};

    steps.push({
      step: 1,
      title: 'Ingestion Received',
      action: `Processing order from source [${payload.source || 'MANUAL'}]`,
      timestamp: new Date().toISOString(),
    });

    // 1. Resolve or extract details (nothing is invented: missing facts stop the ingest)
    const origin = payload.origin?.trim() || '';
    let destination = payload.destination?.trim() || '';
    let weight = payload.totalWeight || 0;
    let customerId: string | null = payload.customerId || null;

    // If raw text provided (e.g. WhatsApp/Email dump), perform heuristics
    if (payload.rawText) {
      const text = payload.rawText;
      if (/mumbai/i.test(text)) destination = 'Mumbai Gateway Dock';
      else if (/lucknow/i.test(text)) destination = 'Lucknow Logistics Park';
      else if (/kanpur/i.test(text)) destination = 'Kanpur Hub';

      const weightMatch = text.match(/(\d+[\d,.]*)\s*(kg|ton|tons|quintal)/i);
      if (weightMatch) {
        const val = parseFloat(weightMatch[1].replace(/,/g, ''));
        if (/ton/i.test(weightMatch[2])) weight = val * 1000;
        else if (/quintal/i.test(weightMatch[2])) weight = val * 100;
        else weight = val;
      }
    }

    if (!origin || !destination || !(weight > 0)) {
      const missing = [!origin && 'origin', !destination && 'destination', !(weight > 0) && 'weight'].filter(Boolean).join(', ');
      return {
        success: false,
        agentId: this.id,
        actionSummary: `Could not create an order: missing ${missing}`,
        reasoningSteps: steps,
        error: `Missing ${missing}`,
      };
    }

    steps.push({
      step: 2,
      title: 'Entity Extraction & Normalization',
      action: `Extracted Corridor: ${origin} -> ${destination}, Payload: ${weight} kg`,
      result: 'Parameters validated successfully',
      timestamp: new Date().toISOString(),
    });

    // 2. The customer must exist in this workspace; otherwise the order is left unassigned
    if (customerId) {
      const [cust] = await db.select().from(customers).where(and(eq(customers.tenantId, currentTenantId()), eq(customers.id, customerId))).limit(1);
      if (!cust) customerId = null;
    }

    // 3. Order ID from the shared atomic counter (globally unique)
    const newOrderId = await nextId(db, 'ORD');

    // 4. Check available fleet for preliminary fit
    const availableTrucks = await db.select().from(vehicles).where(and(eq(vehicles.tenantId, currentTenantId()), eq(vehicles.status, 'Available')));
    const matchedTruck = availableTrucks.find((v) => v.capacity >= weight);

    steps.push({
      step: 3,
      title: 'Fleet Capacity Feasibility Check',
      action: `Evaluated ${availableTrucks.length} available vehicles for ${weight} kg load requirement`,
      result: matchedTruck
        ? `Feasible fit identified: ${matchedTruck.vehicleNo} (${matchedTruck.capacity} kg rated)`
        : 'No direct single truck fit; flagged for allocation solver',
      timestamp: new Date().toISOString(),
    });

    // 5. Persist order
    await db.insert(orders).values({ tenantId: currentTenantId(),
      id: newOrderId,
      customerId,
      origin,
      destination,
      totalWeight: weight,
      status: 'Pending',
      distance: roadDistanceKm(origin, destination),
      freightRate: null,
      deadline: payload.deadline || null,
    });

    steps.push({
      step: 4,
      title: 'Order Created in System of Record',
      action: `Created shipment ledger record ${newOrderId}`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      agentId: this.id,
      actionSummary: `Shipment order ${newOrderId} created (${weight} kg to ${destination})`,
      reasoningSteps: steps,
      data: {
        orderId: newOrderId,
        destination,
        weight,
        suggestedVehicle: matchedTruck?.vehicleNo || null,
      },
      emittedEvents: [
        {
          id: `evt-${Date.now()}`,
          type: 'SHIPMENT_INGESTED',
          timestamp: new Date().toISOString(),
          entityId: newOrderId,
          payload: { orderId: newOrderId, weight, destination },
        },
      ],
    };
  }
}

export const shipmentAgent = new ShipmentAgent();
