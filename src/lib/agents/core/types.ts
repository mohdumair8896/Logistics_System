// ─── Decoupled Agent Core — Types & Event Contracts ───────────────────────────
// Standardized DTOs ensuring zero tight coupling between agent modules.

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5;
// Level 0: Observe (passive telemetry)
// Level 1: Recommend (suggest action in queue)
// Level 2: Draft (human sends)
// Level 3: Execute low-risk (auto-notify, update TMS, create incident)
// Level 4: Execute medium-risk (reschedule dock within window, reassign vehicle)
// Level 5: High-value with Approval (freight adjustments, claims, credit notes, payments)

export type ExceptionCategory =
  | 'TRANSPORTATION'
  | 'WAREHOUSE'
  | 'DOCUMENTATION'
  | 'FINANCIAL'
  | 'CUSTOMER';

export type ExceptionCode =
  // Transportation
  | 'DEPARTURE_DELAY'
  | 'ARRIVAL_DELAY'
  | 'ROUTE_DEVIATION'
  | 'PROLONGED_HALT'
  | 'UNAUTHORIZED_HALT'
  | 'GPS_OFFLINE'
  | 'VEHICLE_BREAKDOWN'
  | 'DRIVER_UNAVAILABLE'
  // Warehouse & Dock
  | 'LOADING_DELAY'
  | 'UNLOADING_DETENTION'
  | 'DOCK_UNAVAILABLE'
  | 'GATE_CONGESTION'
  // Documentation
  | 'MISSING_POD'
  | 'INCORRECT_POD'
  | 'EXPIRED_EWAY_BILL'
  | 'LR_MISMATCH'
  // Financial & Leakage
  | 'RATE_MISMATCH'
  | 'EXCESS_FREIGHT'
  | 'DETENTION_DISCREPANCY'
  // Customer & SLA
  | 'MISSED_SLA'
  | 'FAILED_DELIVERY'
  | 'DELIVERY_RESCHEDULE';

export type LogisticsEventType =
  // Shipment Ingestion
  | 'SHIPMENT_INGEST_REQUESTED'
  | 'SHIPMENT_INGESTED'
  // Driver Communications (Hindi/English)
  | 'DRIVER_MESSAGE_RECEIVED'
  | 'DRIVER_REPORTED_DELAY'
  | 'DRIVER_REPORTED_BREAKDOWN'
  | 'DRIVER_REPORTED_DETENTION'
  | 'DRIVER_RESPONSE_SENT'
  // Customer Intelligence
  | 'CUSTOMER_INQUIRY_RECEIVED'
  | 'CUSTOMER_STATUS_REPORTED'
  // Exception & Self-Healing
  | 'TELEMETRY_ANOMALY_DETECTED'
  | 'EXCEPTION_TRIGGERED'
  | 'SCHEDULE_REVISED'
  | 'INCIDENT_CREATED'
  | 'INCIDENT_RESOLVED'
  | 'PLAYBOOK_EXECUTED'
  // Documentation Audit
  | 'DOC_AUDIT_REQUESTED'
  | 'DOC_DISCREPANCY_FLAGGED'
  // Billing & Freight Leakage
  | 'FREIGHT_AUDIT_REQUESTED'
  | 'FREIGHT_DISCREPANCY_FLAGGED'
  // Collections & Dunning
  | 'COLLECTIONS_AUDIT_REQUESTED'
  | 'COLLECTIONS_ESCALATION_SENT'
  // Autonomy & Action Queue
  | 'ACTION_APPROVAL_REQUESTED'
  | 'ACTION_APPROVED'
  | 'ACTION_REJECTED';

export interface OperationalEvidence {
  telemetry?: {
    speedKmH?: number;
    haltDurationMin?: number;
    deviationKm?: number;
    lastPing?: string;
  };
  driverMessage?: string;
  driverLanguage?: 'Hindi' | 'Hinglish' | 'English';
  contractRule?: string;
  slaTarget?: string;
  financialImpactInr?: number;
  confidenceScore?: number;
}

export interface OperationalTimelineEvent {
  id: string;
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
  autonomyLevel: AutonomyLevel;
  approvalRequired: boolean;
  approvalStatus: 'AUTO_APPROVED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  actionDraft?: string;
  createdAt: string;
}

export interface LogisticsEvent<T = Record<string, unknown>> {
  readonly id: string;
  readonly type: LogisticsEventType;
  readonly timestamp: string;
  readonly entityId?: string; // e.g. orderId, tripId, vehicleId
  readonly payload: T;
  readonly metadata?: Record<string, unknown>;
}

export interface AgentReasoningStep {
  step: number;
  title: string;
  action: string;
  result?: string;
  timestamp: string;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  agentId: string;
  actionSummary: string;
  data?: T;
  reasoningSteps?: AgentReasoningStep[];
  emittedEvents?: LogisticsEvent[];
  error?: string;
}

export interface AgentModule<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly subscribedEvents: readonly LogisticsEventType[];

  handle(event: LogisticsEvent<TInput>): Promise<AgentResult<TOutput>>;
}

