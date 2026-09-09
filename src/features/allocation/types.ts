// ─── Allocation Feature — Types ───────────────────────────────────────────────
// Allocation-specific types — vehicle evaluation for order matching.

export interface EvaluatedVehicle {
  id: string;
  vehicleNo: string;
  type: string;
  capacity: number;
  currentLoad: number;
  status: string;
  driverId: string | null;
  driver: { id: string; name: string; status: string } | null;
  availableCap: number;
  diff: number;
  isFit: boolean;
  utilization: number;
  reason: string | null;
  canOverride: boolean;
  isRecommended: boolean;
}
