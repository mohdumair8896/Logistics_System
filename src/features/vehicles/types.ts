// ─── Vehicles Feature — Types ─────────────────────────────────────────────────
// Edit vehicle-related TypeScript types ONLY in this file.

export interface ActivityLogItem {
  id: string;
  title: string;
  timestamp: string;
  type: 'maintenance' | 'delivery' | 'inspection';
}

export interface Vehicle {
  id: string;
  vehicleNo: string;
  type: string;
  capacity: number;
  currentLoad: number;
  status: 'Available' | 'In Transit' | 'Maintenance';
  driverId: string | null;
  location: string;
  lastService: string;
  odometerKm?: number;
  fuelLevel?: number;
  activityLog?: ActivityLogItem[];
}
