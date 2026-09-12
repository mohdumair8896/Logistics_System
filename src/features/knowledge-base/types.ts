// ─── Knowledge Base Feature — Types ──────────────────────────────────────────

export type KBCategory =
  | 'Hours & Operations'
  | 'Lane Rates'
  | 'Safety & HAZMAT'
  | 'GST & Invoicing'
  | 'Cold-Chain SLA';

export interface KnowledgeBaseItem {
  id: string;
  category: KBCategory;
  title: string;
  content: string;
  keywords: string[];
  lastUpdated: string;
}
