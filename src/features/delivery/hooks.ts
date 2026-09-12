// ─── Delivery Feature — Hooks (Real API) ──────────────────────────────────────
// Uses real DB data from API hooks instead of Zustand store.

'use client';
import { useTrips } from '@/features/trips/hooks';
import { useOrders } from '@/features/orders/hooks';
import { useCustomers } from '@/features/customers/hooks';
import { useVehicles } from '@/features/vehicles/hooks';
import { useDrivers } from '@/features/drivers/hooks';
import { useInvoices } from '@/features/invoices/hooks';

export function useDelivery() {
  const { trips, completeDelivery } = useTrips();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { generateInvoice } = useInvoices();

  const deliveredTrips = trips.filter(t => t.status === 'Delivered' || t.progress >= 100);

  return { trips, deliveredTrips, vehicles, drivers, orders, customers, completeDelivery, generateInvoice };
}
