// ─── Invoices Feature — Hooks (Real API) ──────────────────────────────────────
// Fetches invoices from the real Neon PostgreSQL database via REST API.

'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Invoice } from './types';

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
  ): Promise<string> => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, damageDeduction, receiverName }),
    });
    const data = await res.json();
    await fetchAll();
    return data.id ?? '';
  }, [fetchAll]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const markInvoicePaid = useCallback(async (id: string) => {
    await updateInvoice(id, { status: 'Paid' });
  }, [updateInvoice]);

  return { invoices, loading, generateInvoice, updateInvoice, markInvoicePaid, refetch: fetchAll };
}
