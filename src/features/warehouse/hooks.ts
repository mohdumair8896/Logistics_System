// ─── Warehouse Feature — Hooks ────────────────────────────────────────────────
import { useStore } from '@/lib/store';

export function useWarehouse() {
  const { orders, inventory, vehicles, drivers, customers, products, confirmLoading, addTrip, scanOrderItem } = useStore();
  const allocatedOrders = orders.filter(o => o.status === 'Allocated');
  return { orders, allocatedOrders, inventory, vehicles, drivers, customers, products, confirmLoading, addTrip, scanOrderItem };
}
