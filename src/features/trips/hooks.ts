// ─── Trips Feature — Hooks ────────────────────────────────────────────────────
import { useStore } from '@/lib/store';

export function useTrips() {
  const { trips, orders, vehicles, drivers, addTrip, updateTrip, completeDelivery } = useStore();
  return { trips, orders, vehicles, drivers, addTrip, updateTrip, completeDelivery };
}
