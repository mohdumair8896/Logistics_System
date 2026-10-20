// ─── Delivery Feature — Types ─────────────────────────────────────────────────
// Delivery/POD-specific types.

import type { PodConfirmation, PodLocation } from './pod';

export interface AuditChecks {
  sealIntact: boolean;
  tempVerified: boolean;
  countVerified: boolean;
}

/** One recorded POD, as listed by GET /api/pod. */
export interface PodSummary {
  tripId: string;
  orderId: string | null;
  receiverName: string;
  confirmation: PodConfirmation;
  capturedAt: string;
  damageDeduction: string;
  recordHash: string;
}

/** What the delivery page sends to POST /api/trips/[id]/pod. */
export interface PodCaptureInput {
  receiverName: string;
  confirmation: PodConfirmation;
  otp?: string;
  deliveredKg: number;
  damagedKg: number;
  remarks: string;
  checks: AuditChecks;
  signaturePng?: string;
}

export interface PodCaptureResult {
  id: string;
  tripId: string;
  recordHash: string;
  capturedAt: string;
  damageDeduction: number;
  location: PodLocation | null;
  record: string;
}

export interface ConsigneeOtp {
  otp: string;
  message: string;
  customerName: string | null;
  whatsappUrl: string | null;
}
