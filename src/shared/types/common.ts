// ─── Shared Types — Common Domain Models ──────────────────────────────────────
// Types used by 2 or more features live here.
// Feature-specific types live in src/features/<name>/types.ts

export interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  gstin: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  category: string;
  pricePerKg: number;
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'info' | 'critical';
  timestamp: string;
  category: 'Weather' | 'Fleet' | 'Driver' | 'Route' | 'Warehouse' | 'Cold-Chain' | 'Geofence';
}


export interface InventoryItem {
  productId: string;
  warehouseId: string;
  quantity: number;
  bay: string;
}
