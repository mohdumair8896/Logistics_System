// ─── Delivery Feature — Hooks ─────────────────────────────────────────────────
import { useStore } from '@/lib/store';

export function useDelivery() {
  const { trips, vehicles, drivers, orders, customers, completeDelivery, generateInvoice } = useStore();
  const deliveredTrips = trips.filter(t => t.status === 'Delivered' || t.progress >= 100);
  return { trips, deliveredTrips, vehicles, drivers, orders, customers, completeDelivery, generateInvoice };
}
