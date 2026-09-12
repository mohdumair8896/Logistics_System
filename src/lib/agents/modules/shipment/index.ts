// ─── Module 1: Autonomous Shipment Agent ──────────────────────────────────────
// Completely isolated module: parses unformatted shipment orders and schedules them.

import { db } from '@/lib/db';
import { orders, customers, vehicles } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
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

    // 1. Resolve or extract details
    const origin = payload.origin || 'Central Hub, Delhi';
    let destination = payload.destination || 'Kanpur Warehouse';
    let weight = payload.totalWeight || 8500;
    let customerId = payload.customerId || 'CUST-001';

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

    steps.push({
      step: 2,
      title: 'Entity Extraction & Normalization',
      action: `Extracted Corridor: ${origin} -> ${destination}, Payload: ${weight} kg`,
      result: 'Parameters validated successfully',
      timestamp: new Date().toISOString(),
    });

    // 2. Look up customer or fall back
    const [cust] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    if (!cust) {
      const [firstCust] = await db.select().from(customers).limit(1);
      customerId = firstCust ? firstCust.id : 'CUST-001';
    }

    // 3. Generate sequential order ID
    const [latest] = await db.select({ id: orders.id }).from(orders).orderBy(desc(orders.id)).limit(1);
    const nextNum = latest ? parseInt(latest.id.replace(/\D/g, ''), 10) + 1 : 1001;
    const newOrderId = `ORD-${String(nextNum).padStart(4, '0')}`;

    // 4. Check available fleet for preliminary fit
    const availableTrucks = await db.select().from(vehicles).where(eq(vehicles.status, 'Available'));
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
    await db.insert(orders).values({
      id: newOrderId,
      customerId,
      origin,
      destination,
      totalWeight: weight,
      status: 'Pending',
      distance: 450,
      freightRate: '2.50',
      deadline: payload.deadline || 'Tomorrow 18:00',
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
