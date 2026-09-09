// ─── Invoices Feature — Types ─────────────────────────────────────────────────
// Edit invoice-related TypeScript types ONLY in this file.

export interface Invoice {
  id: string;
  orderId: string;
  customerId: string;
  tripId: string | null;
  freight: number;
  loading: number;
  unloading: number;
  damageDeduction?: number;
  subtotal: number;
  gst: number;
  total: number;
  status: 'Paid' | 'Pending';
  createdAt: string;
  podSigned?: boolean;
  podImageUrl?: string;
  receiverName?: string;
}
