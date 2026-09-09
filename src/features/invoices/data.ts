// ─── Invoices Feature — Mock Data ─────────────────────────────────────────────
// Edit invoice seed/mock data ONLY in this file.

import type { Invoice } from './types';

export const initialInvoices: Invoice[] = [
  {
    id: 'INV-1004',
    orderId: 'ORD-0992',
    customerId: 'C004',
    tripId: 'TRP-1002',
    freight: 13800,
    loading: 2000,
    unloading: 1500,
    damageDeduction: 0,
    subtotal: 17300,
    gst: 3114,
    total: 20414,
    status: 'Paid',
    createdAt: '2026-08-25',
    podSigned: true,
    receiverName: 'Sanjay Patel'
  },
  {
    id: 'INV-1005',
    orderId: 'ORD-0988',
    customerId: 'C005',
    tripId: null,
    freight: 14322,
    loading: 2000,
    unloading: 1500,
    damageDeduction: 0,
    subtotal: 17822,
    gst: 3208,
    total: 21030,
    status: 'Pending',
    createdAt: '2026-08-22',
    podSigned: true,
    receiverName: 'Nisha Jain'
  },
];
