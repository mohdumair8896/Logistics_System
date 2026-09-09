// ─── Delivery Feature — Types ─────────────────────────────────────────────────
// Delivery/POD-specific types.

export interface DeliveryForm {
  deliveredQty: number;
  damagedQty: number;
  receiver: string;
  remarks: string;
  podUploaded: boolean;
  hasSigned: boolean;
}

export interface AuditChecks {
  sealIntact: boolean;
  tempVerified: boolean;
  countVerified: boolean;
}
