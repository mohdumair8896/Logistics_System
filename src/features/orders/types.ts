// ─── Orders Feature — Types ───────────────────────────────────────────────────
// Edit order-related TypeScript types ONLY in this file.

export interface OrderItem {
  productId: string;
  quantity: number;
  batchCode?: string;
  scanned?: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  destination: string;
  origin: string;
  items: OrderItem[];
  totalWeight: number;
  status: 'Pending' | 'Allocated' | 'In Transit' | 'Delivered' | 'Cancelled';
  createdAt: string;
  deadline?: string;
  vehicleId: string | null;
  driverId: string | null;
  distance: number;
  freightRate: number;
  loadingBay?: string;
}
