'use client';
// ─── Knowledge Base Feature — Real API Hook ───────────────────────────────────
// Fetches KB items from /api/knowledge-base (Neon PostgreSQL).
// Replaces useStore().knowledgeBase, addKnowledgeBaseItem, deleteKnowledgeBaseItem.

import { useState, useEffect, useCallback } from 'react';

import type { KnowledgeBaseItem } from './types';
export type { KnowledgeBaseItem, KBCategory } from './types';

export function useKnowledgeBase() {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge-base');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = useCallback(async (item: Omit<KnowledgeBaseItem, 'id' | 'lastUpdated'>): Promise<string> => {
    const res = await fetch('/api/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    await fetchItems();
    return data.id ?? '';
  }, [fetchItems]);

  const deleteItem = useCallback(async (id: string) => {
    await fetch(`/api/knowledge-base/${id}`, { method: 'DELETE' });
    await fetchItems();
  }, [fetchItems]);

  return { items, loading, error, addItem, deleteItem, refetch: fetchItems };
}
