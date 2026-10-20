// ─── Delivery Feature — Hooks (Real API) ──────────────────────────────────────
// Uses real DB data from API hooks instead of Zustand store.

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTrips } from '@/features/trips/hooks';
import { useOrders } from '@/features/orders/hooks';
import { useCustomers } from '@/features/customers/hooks';
import { useVehicles } from '@/features/vehicles/hooks';
import { useDrivers } from '@/features/drivers/hooks';
import { useInvoices } from '@/features/invoices/hooks';
import { apiMutate } from '@/lib/apiClient';
import type { ConsigneeOtp, PodCaptureInput, PodCaptureResult, PodSummary } from './types';

/** Recorded PODs, keyed by trip. */
export function usePodRecords() {
  const [pods, setPods] = useState<Record<string, PodSummary>>({});

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('/api/pod');
      if (!res.ok) return;
      const rows = await res.json() as PodSummary[];
      setPods(Object.fromEntries(rows.map(p => [p.tripId, p])));
    } catch (err) {
      console.error('[usePodRecords] fetch error', err);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { pods, refetch: fetchAll };
}

export function useDelivery() {
  const { trips, completeDelivery, refetch: refetchTrips } = useTrips();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { generateInvoice } = useInvoices();
  const { pods, refetch: refetchPods } = usePodRecords();

  const deliveredTrips = trips.filter(t => t.status === 'Delivered' || t.progress >= 100);

  /** Records the POD (closing the trip if it is still in transit). Null if the server refused. */
  const capturePod = useCallback(async (tripId: string, input: PodCaptureInput): Promise<PodCaptureResult | null> => {
    const result = await apiMutate<PodCaptureResult>(`/api/trips/${tripId}/pod`, 'POST', input);
    await Promise.all([refetchTrips(), refetchPods()]);
    return result.ok ? result.data : null;
  }, [refetchTrips, refetchPods]);

  /** The code to send to the consignee before delivery. */
  const getConsigneeOtp = useCallback(async (tripId: string): Promise<ConsigneeOtp | { error: string }> => {
    try {
      const res = await fetch(`/api/trips/${tripId}/pod/otp`);
      const data = await res.json().catch(() => ({}));
      return res.ok ? data as ConsigneeOtp : { error: data.error || `Request failed (${res.status})` };
    } catch {
      return { error: 'Network error. Check your connection and try again.' };
    }
  }, []);

  return {
    trips, deliveredTrips, vehicles, drivers, orders, customers, pods,
    completeDelivery, capturePod, getConsigneeOtp, generateInvoice,
  };
}
