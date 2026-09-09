// ─── Drivers Feature — Types ──────────────────────────────────────────────────
// Edit driver-related TypeScript types ONLY in this file.

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  licenseExpiry: string;
  vehicleId: string | null;
  status: 'Available' | 'On Trip' | 'Off Duty';
  trips: number;
  rating: number;
  documentVerified: boolean;
}
