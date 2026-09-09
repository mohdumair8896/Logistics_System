// ─── Warehouse Feature — Types ────────────────────────────────────────────────
// Warehouse/loading bay specific types.

export interface SafetyChecks {
  tirePressure: boolean;
  cargoStraps: boolean;
  sealVerified: boolean;
  manifestSigned: boolean;
}
