'use client';
// ─── Leads Feature — Real API Hook ───────────────────────────────────────────
// Fetches shipper leads from /api/leads (Neon PostgreSQL).
// Replaces useStore().leads, updateLeadStatus, convertLeadToOrder.

import { useState, useEffect, useCallback } from 'react';

import type { ShipperLead } from './types';
import { apiMutate } from '@/lib/apiClient';
import { roadDistanceKm } from '@/lib/pricing/indicativeQuote';
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

  const updateLeadStatus = useCallback(async (id: string, status: ShipperLead['status']): Promise<boolean> => {
    const result = await apiMutate(`/api/leads/${id}`, 'PATCH', { status });
    await fetchLeads();
    return result.ok;
  }, [fetchLeads]);

  // Convert a lead into a Pending order: create the shipper as a customer, then the order, then link both.
  // Returns the new order ID, or null if any step was refused (the error is shown as a toast).
  const convertLeadToOrder = useCallback(async (leadId: string): Promise<string | null> => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return null;
    if (lead.associatedOrderId) return lead.associatedOrderId; // already converted

    const customer = await apiMutate<{ id: string }>('/api/customers', 'POST', {
      name: lead.companyName || lead.shipperName,
      contact: lead.shipperName,
      ...(lead.phone ? { phone: lead.phone } : {}),
    });
    if (!customer.ok) return null;

    const weight = Math.round(Number(lead.estimatedWeightKg) || 0);
    const distance = roadDistanceKm(lead.originHub ?? '', lead.destinationHub ?? '');
    const quote = Number(lead.freightQuote) || 0;
    // Invoices compute freight = weight × rate × distance / 100, so derive the rate from the quoted price
    const freightRate = quote > 0 && weight > 0 && distance
      ? Math.min(999, Math.round(((quote * 100) / (weight * distance)) * 100) / 100)
      : null;

    const order = await apiMutate<{ id: string }>('/api/orders', 'POST', {
      customerId: customer.data.id,
      origin: lead.originHub,
      destination: lead.destinationHub,
      totalWeight: weight,
      items: [],
      distance,
      freightRate,
    });
    if (!order.ok) return null;

    await apiMutate(`/api/leads/${leadId}`, 'PATCH', { status: 'Allocated', associatedOrderId: order.data.id });
    await fetchLeads();
    return order.data.id;
  }, [leads, fetchLeads]);

  return { leads, loading, error, updateLeadStatus, convertLeadToOrder, refetch: fetchLeads };
}
