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
  // How GST was worked out (see ./gst.ts); null on invoices raised before GST options existed
  gstScheme?: string | null;
  placeOfSupply?: string | null;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  total: number;
  status: 'Paid' | 'Pending';
  createdAt: string;
  podSigned?: boolean;
  podImageUrl?: string;
  receiverName?: string;
}
