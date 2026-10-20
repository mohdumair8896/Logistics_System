// ─── Invoices Feature — Hooks (Real API) ──────────────────────────────────────
// Fetches invoices from the real Neon PostgreSQL database via REST API.

'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Invoice } from './types';
import { apiMutate } from '@/lib/apiClient';

const amountOrNull = (v: unknown) => (v == null ? null : Number(v));

function mapInvoice(r: Record<string, unknown>): Invoice {
  return {
    id: (r.id as string) ?? '',
    orderId: ((r.orderId ?? r.order_id) as string) ?? '',
    customerId: ((r.customerId ?? r.customer_id) as string) ?? '',
    tripId: (r.tripId ?? r.trip_id ?? null) as string | null,
    freight: Number(r.freight ?? 0),
    loading: Number(r.loading ?? r.loading_charge ?? 0),
    unloading: Number(r.unloading ?? r.unloading_charge ?? 0),
    damageDeduction: Number(r.damageDeduction ?? r.damage_deduction ?? 0),
    subtotal: Number(r.subtotal ?? 0),
    gst: Number(r.gst ?? 0),
    gstScheme: (r.gstScheme ?? r.gst_scheme ?? null) as string | null,
    placeOfSupply: (r.placeOfSupply ?? r.place_of_supply ?? null) as string | null,
    cgst: amountOrNull(r.cgst),
    sgst: amountOrNull(r.sgst),
    igst: amountOrNull(r.igst),
    total: Number(r.total ?? 0),
    status: (r.status as Invoice['status']) ?? 'Pending',
    createdAt: (((r.createdAt ?? r.created_at) as string) ?? '').split('T')[0],
    podSigned: Boolean(r.podSigned ?? r.pod_signed ?? false),
    podImageUrl: (r.podImageUrl ?? r.pod_image_url ?? undefined) as string | undefined,
    receiverName: (r.receiverName ?? r.receiver_name ?? undefined) as string | undefined,
  };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data.map(mapInvoice));
    } catch (err) {
      console.error('[useInvoices] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const generateInvoice = useCallback(async (
    orderId: string,
    damageDeduction = 0,
    receiverName = 'Authorized Receiver'
  ): Promise<string | null> => {
    const result = await apiMutate<{ id: string }>('/api/invoices', 'POST', { orderId, damageDeduction, receiverName });
    await fetchAll();
    return result.ok ? result.data.id : null;
  }, [fetchAll]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>): Promise<boolean> => {
    const result = await apiMutate(`/api/invoices/${id}`, 'PATCH', updates);
    if (result.ok) setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    return result.ok;
  }, []);

  const markInvoicePaid = useCallback(async (id: string): Promise<boolean> => {
    return updateInvoice(id, { status: 'Paid' });
  }, [updateInvoice]);

  return { invoices, loading, generateInvoice, updateInvoice, markInvoicePaid, refetch: fetchAll };
}

export interface GstOptionsInfo {
  currentFinancialYear: string;
  defaultScheme: string;
  schemes: { id: string; label: string; rate: number; reverseCharge: boolean }[];
  options: { financialYear: string; scheme: string; supplierGstin: string | null }[];
}

/** The workspace's GST option (Annexure V) per financial year */
export function useGstOptions() {
  const [info, setInfo] = useState<GstOptionsInfo | null>(null);

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/gst-options');
      if (res.ok) setInfo(await res.json());
    } catch (err) {
      console.error('[useGstOptions] fetch error', err);
    }
  }, []);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  const saveOption = useCallback(async (financialYear: string, scheme: string, supplierGstin: string): Promise<boolean> => {
    const result = await apiMutate('/api/billing/gst-options', 'PUT', { financialYear, scheme, supplierGstin: supplierGstin.trim() || null });
    if (result.ok) await fetchOptions();
    return result.ok;
  }, [fetchOptions]);

  return { info, saveOption };
}
