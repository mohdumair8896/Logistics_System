// ─── Invoices Feature — Hooks ─────────────────────────────────────────────────
import { useStore } from '@/lib/store';

export function useInvoices() {
  const { invoices, orders, customers, generateInvoice } = useStore();
  return { invoices, orders, customers, generateInvoice };
}
