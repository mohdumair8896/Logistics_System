// ─── Customers Feature — Hook ────────────────────────────────────────────────
// Single source of truth for customer accounts.
// Decoupled from orders to prevent redundant full-table fetching across unrelated pages.

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/shared/types/common';

function mapCustomer(r: Record<string, unknown>): Customer {
  return {
    id: (r.id as string) ?? '',
    name: (r.name as string) ?? '',
    contact: (r.contact as string) ?? '',
    phone: (r.phone as string) ?? '',
    address: (r.address as string) ?? '',
    gstin: (r.gstin as string) ?? '',
  };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.map(mapCustomer));
      }
    } catch (err) {
      console.error('[useCustomers] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, loading, refetch: fetchCustomers };
}
