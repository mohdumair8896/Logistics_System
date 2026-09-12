// ─── Declarative Playbook Engine ──────────────────────────────────────────────
// Evaluates company-approved policies across the 20 exception taxonomies.
// Executes deterministic resolution workflows or queues for human approval.

import { ExceptionCode, AutonomyLevel, OperationalEvidence } from './types';
import { LogisticsEventGraph } from './eventGraph';
import { db } from '@/lib/db';
import { incidents } from '@/lib/schema';

export interface PlaybookDefinition {
  code: ExceptionCode;
  title: string;
  category: 'TRANSPORTATION' | 'WAREHOUSE' | 'DOCUMENTATION' | 'FINANCIAL' | 'CUSTOMER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defaultAutonomyLevel: AutonomyLevel;
  requiredApprovalOverInr?: number;
  steps: string[];
}

export const EXCEPTION_PLAYBOOKS: Record<ExceptionCode, PlaybookDefinition> = {
  // Transportation
  DEPARTURE_DELAY: {
    code: 'DEPARTURE_DELAY',
    title: 'Departure Delay > 60m',
    category: 'TRANSPORTATION',
    severity: 'MEDIUM',
    defaultAutonomyLevel: 3,
    steps: [
      'Contact driver via WhatsApp/SMS to verify reason',
      'Check loading dock clearance status',
      'Recalculate route ETA to consignee',
      'If delay > 2h, notify customer operations with revised window',
    ],
  },
  ARRIVAL_DELAY: {
    code: 'ARRIVAL_DELAY',
    title: 'Predicted Arrival Delay > 90m',
    category: 'TRANSPORTATION',
    severity: 'HIGH',
    defaultAutonomyLevel: 3,
    steps: [
      'Ping driver for corridor conditions / toll traffic',
      'Check destination warehouse unloading cut-off time',
      'Request revised delivery appointment from customer dock manager',
      'Update TMS shipment status',
    ],
  },
  ROUTE_DEVIATION: {
    code: 'ROUTE_DEVIATION',
    title: 'Unplanned Route Deviation > 15km',
    category: 'TRANSPORTATION',
    severity: 'HIGH',
    defaultAutonomyLevel: 3,
    steps: [
      'Audit live GPS coordinates against approved highway corridor',
      'Check driver WhatsApp for highway obstruction / roadblock reports',
      'Alert fleet controller if no valid obstruction confirmed',
      'Re-estimate fuel consumption and revised ETA',
    ],
  },
  PROLONGED_HALT: {
    code: 'PROLONGED_HALT',
    title: 'Prolonged Unscheduled Halt > 60m',
    category: 'TRANSPORTATION',
    severity: 'HIGH',
    defaultAutonomyLevel: 3,
    steps: [
      'Trigger automated driver check-in message in Hindi/English',
      'Analyze driver reply for puncture, breakdown, or rest stop',
      'If vehicle breakdown confirmed, query closest available replacement fleet',
      'Notify consignee of delay mitigation plan',
    ],
  },
  UNAUTHORIZED_HALT: {
    code: 'UNAUTHORIZED_HALT',
    title: 'Unauthorized Halt in Restricted Zone',
    category: 'TRANSPORTATION',
    severity: 'CRITICAL',
    defaultAutonomyLevel: 4,
    steps: [
      'Trigger urgent siren ping to driver terminal',
      'Verify cargo seal status',
      'Escalate incident immediately to security controller',
    ],
  },
  GPS_OFFLINE: {
    code: 'GPS_OFFLINE',
    title: 'Telematics / GPS Offline > 45m',
    category: 'TRANSPORTATION',
    severity: 'MEDIUM',
    defaultAutonomyLevel: 3,
    steps: [
      'Ping backup smartphone driver tracking app',
      'Send SMS status inquiry to driver phone',
      'Flag vehicle hardware for maintenance check at next hub',
    ],
  },
  VEHICLE_BREAKDOWN: {
    code: 'VEHICLE_BREAKDOWN',
    title: 'Vehicle Mechanical Breakdown / Tyre Puncture',
    category: 'TRANSPORTATION',
    severity: 'CRITICAL',
    defaultAutonomyLevel: 4,
    requiredApprovalOverInr: 10000,
    steps: [
      'Record breakdown coordinates from GPS and driver message',
      'Query nearby partner workshops and spare tyre mechanics',
      'Source replacement vehicle from nearby hub if repair > 4 hours',
      'Draft customer delay notification with replacement truck plate',
    ],
  },
  DRIVER_UNAVAILABLE: {
    code: 'DRIVER_UNAVAILABLE',
    title: 'Driver Duty Hours Exceeded / Unavailable',
    category: 'TRANSPORTATION',
    severity: 'HIGH',
    defaultAutonomyLevel: 4,
    steps: [
      'Verify driver continuous driving hours against safety limit (8h)',
      'Assign relief driver from nearest transit depot',
      'Update trip assignment in TMS',
    ],
  },

  // Warehouse & Dock
  LOADING_DELAY: {
    code: 'LOADING_DELAY',
    title: 'Origin Loading Dock Delay > 2h',
    category: 'WAREHOUSE',
    severity: 'MEDIUM',
    defaultAutonomyLevel: 3,
    steps: [
      'Confirm truck gate-in timestamp',
      'Check warehouse staging bay inventory readiness',
      'Record origin detention counter for billing',
    ],
  },
  UNLOADING_DETENTION: {
    code: 'UNLOADING_DETENTION',
    title: 'Destination Unloading Detention > 3h',
    category: 'WAREHOUSE',
    severity: 'HIGH',
    defaultAutonomyLevel: 4,
    requiredApprovalOverInr: 5000,
    steps: [
      'Verify GPS arrival timestamp inside destination warehouse geofence',
      'Capture driver report on dock congestion / labor unavailability',
      'Calculate contracted detention fee (₹500/hr past free 2h allowance)',
      'Notify consignee logistics lead with detention clock notification',
      'Log detention debit note in billing queue',
    ],
  },
  DOCK_UNAVAILABLE: {
    code: 'DOCK_UNAVAILABLE',
    title: 'Destination Dock Closed / Slot Refused',
    category: 'WAREHOUSE',
    severity: 'HIGH',
    defaultAutonomyLevel: 4,
    steps: [
      'Contact receiving dock coordinator for next available morning slot',
      'Direct driver to secure authorized transit parking nearby',
      'Issue revised appointment confirmation to consignee',
    ],
  },
  GATE_CONGESTION: {
    code: 'GATE_CONGESTION',
    title: 'Facility Gate Congestion > 10 Trucks',
    category: 'WAREHOUSE',
    severity: 'MEDIUM',
    defaultAutonomyLevel: 3,
    steps: [
      'Audit gate entry speed and queue wait time',
      'Stagger arrivals of upcoming scheduled shipments to avoid gridlock',
    ],
  },

  // Documentation
  MISSING_POD: {
    code: 'MISSING_POD',
    title: 'Missing Proof of Delivery (POD) > 24h Post-Delivery',
    category: 'DOCUMENTATION',
    severity: 'HIGH',
    defaultAutonomyLevel: 3,
    steps: [
      'Check delivery confirmation timestamp in TMS',
      'Send WhatsApp photo upload request to driver with camera link',
      'Audit uploaded scan for physical receiver stamp and signature',
      'Release pending freight invoice for billing once POD is verified',
    ],
  },
  INCORRECT_POD: {
    code: 'INCORRECT_POD',
    title: 'POD Discrepancy (Missing Stamp or Damage Endorsement)',
    category: 'DOCUMENTATION',
    severity: 'HIGH',
    defaultAutonomyLevel: 3,
    steps: [
      'Audit POD remarks for shortages, carton damage, or missing seal',
      'Flag invoice for commercial review before sending to customer AP',
      'Create claim docket with photo evidence',
    ],
  },
  EXPIRED_EWAY_BILL: {
    code: 'EXPIRED_EWAY_BILL',
    title: 'E-Way Bill Expiring in < 6h While In Transit',
    category: 'DOCUMENTATION',
    severity: 'CRITICAL',
    defaultAutonomyLevel: 3,
    steps: [
      'Calculate remaining distance vs e-way bill validity cut-off',
      'Auto-draft extension request payload for government tax portal API',
      'Notify driver of extended validity number',
    ],
  },
  LR_MISMATCH: {
    code: 'LR_MISMATCH',
    title: 'Lorry Receipt (LR) vs Weighbridge Weight Discrepancy',
    category: 'DOCUMENTATION',
    severity: 'MEDIUM',
    defaultAutonomyLevel: 3,
    steps: [
      'Compare LR gross weight against origin weighbridge slip',
      'Recalculate freight payable if billed per ton/km',
    ],
  },

  // Financial & Leakage
  RATE_MISMATCH: {
    code: 'RATE_MISMATCH',
    title: 'Invoice Freight Exceeds Contracted Rate Card',
    category: 'FINANCIAL',
    severity: 'CRITICAL',
    defaultAutonomyLevel: 5,
    requiredApprovalOverInr: 2500,
    steps: [
      'Retrieve contracted customer rate card for origin-destination lane',
      'Compare baseline freight vs billed freight amount',
      'Identify unauthorized extra surcharges (fuel/toll)',
      'Hold invoice and generate Discrepancy Note for CFO/Manager approval',
    ],
  },
  EXCESS_FREIGHT: {
    code: 'EXCESS_FREIGHT',
    title: 'Excess Distance or Duplicate Freight Charge Claimed',
    category: 'FINANCIAL',
    severity: 'HIGH',
    defaultAutonomyLevel: 5,
    requiredApprovalOverInr: 2000,
    steps: [
      'Match GPS actual odometer km (e.g. 740 km) against billed km (e.g. 890 km)',
      'Adjust invoice to approved lane distance formula',
      'Require manager sign-off before approving transporter payment',
    ],
  },
  DETENTION_DISCREPANCY: {
    code: 'DETENTION_DISCREPANCY',
    title: 'Claimed Detention Hours Conflict With GPS Timestamps',
    category: 'FINANCIAL',
    severity: 'HIGH',
    defaultAutonomyLevel: 4,
    requiredApprovalOverInr: 3000,
    steps: [
      'Compare transporter detention claim against geofence entry and exit time',
      'Recalculate verified detention hours (actual dwell time minus 2h free grace)',
      'Approve verified detention and reject unverified balance',
    ],
  },

  // Customer & SLA
  MISSED_SLA: {
    code: 'MISSED_SLA',
    title: 'Customer Delivery SLA Breach Imminent / Occurred',
    category: 'CUSTOMER',
    severity: 'CRITICAL',
    defaultAutonomyLevel: 4,
    requiredApprovalOverInr: 5000,
    steps: [
      'Evaluate customer SLA penalty clause (e.g. 2% deduction per 24h delay)',
      'Send proactive notification to customer supply chain head with root-cause analysis',
      'Provide expedited recovery tracking link',
    ],
  },
  FAILED_DELIVERY: {
    code: 'FAILED_DELIVERY',
    title: 'Delivery Attempt Failed (Consignee Unavailable/Refused)',
    category: 'CUSTOMER',
    severity: 'CRITICAL',
    defaultAutonomyLevel: 4,
    steps: [
      'Record gate refusal note and driver statement',
      'Notify booking customer for re-direction or secondary delivery address',
      'Secure cargo in authorized hub pending customer instruction',
    ],
  },
  DELIVERY_RESCHEDULE: {
    code: 'DELIVERY_RESCHEDULE',
    title: 'Consignee Requested Delivery Window Reschedule',
    category: 'CUSTOMER',
    severity: 'MEDIUM',
    defaultAutonomyLevel: 3,
    steps: [
      'Check warehouse dock schedule for proposed new delivery slot',
      'Adjust driver delivery route and update TMS schedule',
    ],
  },
};

export class PlaybookEngine {
  /**
   * Execute a company-approved playbook for a detected exception.
   */
  public static async executePlaybook(params: {
    code: ExceptionCode;
    shipmentId?: string;
    tripId?: string;
    vehicleId?: string;
    driverId?: string;
    location?: string;
    lat?: number;
    lng?: number;
    evidence: OperationalEvidence;
    currentSystemAutonomyLevel?: AutonomyLevel;
  }) {
    const playbook = EXCEPTION_PLAYBOOKS[params.code];
    if (!playbook) {
      throw new Error(`Unknown exception code: ${params.code}`);
    }

    const systemAutonomy = params.currentSystemAutonomyLevel ?? 3;
    const financialImpact = params.evidence.financialImpactInr ?? 0;
    
    // Check if human approval is required:
    // 1. Playbook requires Level 5, but system is below Level 5.
    // 2. Financial impact exceeds approval threshold.
    // 3. System autonomy level is below the playbook's default requirement.
    const requiresApproval =
      playbook.defaultAutonomyLevel > systemAutonomy ||
      (playbook.requiredApprovalOverInr !== undefined && financialImpact >= playbook.requiredApprovalOverInr) ||
      systemAutonomy <= 1;

    const approvalStatus = requiresApproval ? 'PENDING_APPROVAL' : 'AUTO_APPROVED';

    // Formulate the action draft or executed summary
    const actionDraft = `[${playbook.code}] ${playbook.steps.join(' → ')}`;

    // 1. Record canonical event in the Event Graph
    const eventId = await LogisticsEventGraph.recordEvent({
      shipmentId: params.shipmentId,
      tripId: params.tripId,
      vehicleId: params.vehicleId,
      driverId: params.driverId,
      eventType: 'PLAYBOOK_EXECUTED',
      actor: 'CONTROL_TOWER',
      title: `${playbook.title} (${requiresApproval ? 'Action Queued' : 'Self-Healed'})`,
      description: `Executed playbook steps: ${playbook.steps[0]}. ${playbook.steps[1] || ''}`,
      location: params.location,
      lat: params.lat,
      lng: params.lng,
      evidence: params.evidence,
      policyId: `POL-${params.code}`,
      autonomyLevel: playbook.defaultAutonomyLevel,
      approvalRequired: requiresApproval,
      approvalStatus,
      actionDraft,
    });

    // 2. Persist in incidents table for cross-compatibility
    const incidentId = `INC-${Date.now().toString().slice(-6)}`;
    try {
      await db.insert(incidents).values({
        id: incidentId,
        orderId: params.shipmentId || null,
        tripId: params.tripId || null,
        vehicleId: params.vehicleId || null,
        driverId: params.driverId || null,
        type: params.code,
        severity: playbook.severity,
        title: playbook.title,
        description: `Playbook policy POL-${params.code} triggered. Evidence: ${params.evidence.driverMessage || params.evidence.telemetry?.lastPing || 'Telemetry anomaly'}.`,
        status: requiresApproval ? 'OPEN' : 'AUTO_RESOLVED',
        automatedActionTaken: requiresApproval ? `Queued for manager review: ${actionDraft}` : `Executed automatically: ${actionDraft}`,
        financialImpact: financialImpact.toString(),
        metadata: {
          playbookCode: params.code,
          eventId,
          steps: playbook.steps,
          evidence: params.evidence,
        },
      });
    } catch (err) {
      console.error('[PlaybookEngine] Error saving incident record:', err);
    }

    return {
      eventId,
      incidentId,
      playbook,
      requiresApproval,
      approvalStatus,
      actionDraft,
    };
  }
}
