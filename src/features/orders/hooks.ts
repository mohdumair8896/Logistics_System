// ─── Orders Feature — Hooks ───────────────────────────────────────────────────
import { useStore } from '@/lib/store';

export function useOrders() {
  const { orders, customers, products, addOrder, updateOrder, scanOrderItem } = useStore();
  return { orders, customers, products, addOrder, updateOrder, scanOrderItem };
}
