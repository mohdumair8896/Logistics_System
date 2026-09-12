'use client';
// ─── Leads Feature — Real API Hook ───────────────────────────────────────────
// Fetches shipper leads from /api/leads (Neon PostgreSQL).
// Replaces useStore().leads, updateLeadStatus, convertLeadToOrder.

import { useState, useEffect, useCallback } from 'react';

import type { ShipperLead } from './types';
export type { ShipperLead, LeadStatus, CargoType } from './types';

export function useLeads() {
  const [leads, setLeads] = useState<ShipperLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateLeadStatus = useCallback(async (id: string, status: ShipperLead['status']) => {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchLeads();
  }, [fetchLeads]);

  // Convert lead to an active order via /api/orders and link back to lead
  const convertLeadToOrder = useCallback(async (leadId: string): Promise<string> => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return '';

    // Create order
    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'C001',
        origin: lead.originHub,
        destination: lead.destinationHub,
        totalWeight: lead.estimatedWeightKg,
        items: [{ productId: 'P001', quantity: lead.estimatedWeightKg }],
        status: 'Pending',
        distance: 350,
        freightRate: 2.2,
        loadingBay: 'Bay 3',
        vehicleId: null,
        driverId: null,
      }),
    });
    const orderData = await orderRes.json();
    const orderId: string = orderData.id ?? '';

    // Update lead to Allocated + link order
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Allocated', associatedOrderId: orderId }),
    });

    await fetchLeads();
    return orderId;
  }, [leads, fetchLeads]);

  return { leads, loading, error, updateLeadStatus, convertLeadToOrder, refetch: fetchLeads };
}
