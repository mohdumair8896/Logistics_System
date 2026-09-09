// ─── Trips Feature — Types ────────────────────────────────────────────────────
// Edit trip-related TypeScript types ONLY in this file.

export interface Waypoint {
  name: string;
  passed: boolean;
  time?: string;
  location: string;
}

export interface Trip {
  id: string;
  orderId: string;
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  distance: number;
  load: number;
  status: 'In Transit' | 'Delivered' | 'Cancelled';
  progress: number;
  startedAt: string;
  eta: string | null;
  completedAt: string | null;
  speedKmH?: number;
  fuelPercent?: number;
  cargoTemp?: string;
  geofenceStatus?: 'Inside Corridor' | 'Deviated' | 'Arrived';
  checkpoints?: Waypoint[];
}
