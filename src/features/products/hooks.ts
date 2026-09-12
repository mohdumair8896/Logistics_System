'use client';
// ─── Products Feature — Hook ────────────────────────────────────────────────
// Single source of truth for the product catalog.
// Replaces all 5 inline static arrays previously scattered across the codebase.

import { useState, useEffect, useCallback } from 'react';

export interface Product {
  id: string;
  name: string;
  unit: string;
  category: string | null;
  price_per_kg: string | null; // decimal comes as string from Neon
}

// Convenience getter for numeric price
export function getPrice(p: Product): number {
  return parseFloat(p.price_per_kg ?? '0');
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, loading, error };
}
