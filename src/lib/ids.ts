// ─── Human-readable record IDs (server-only) ──────────────────────────────────
// IDs like ORD-1001 / V007 come from an atomic counter row per kind (id_counters),
// so two concurrent requests can never get the same number. Call inside the same
// transaction as the insert. IDs remain globally unique because they are primary keys;
// per-tenant display numbers arrive with the UUID primary-key migration (docs/LLD.md §3.8).

import { sql } from 'drizzle-orm';
import { idCounters } from './schema';
import type { Executor } from './tenancy';

/** Kinds, prefixes and first values. Must match the seeds in drizzle/0002_tenancy_backfill.sql. */
export const ID_KINDS = {
  ORD: { prefix: 'ORD-', start: 1001, pad: 0 },
  TRP: { prefix: 'TRP-', start: 1001, pad: 0 },
  INV: { prefix: 'INV-', start: 1001, pad: 0 },
  CUST: { prefix: 'C', start: 1, pad: 3 },
  DRV: { prefix: 'D', start: 1, pad: 3 },
  VEH: { prefix: 'V', start: 1, pad: 3 },
  LEAD: { prefix: 'LEAD-', start: 1001, pad: 0 },
  KB: { prefix: 'KB-', start: 101, pad: 3 },
} as const;

export type IdKind = keyof typeof ID_KINDS;

/** Returns the next ID for `kind`, e.g. nextId(tx, 'ORD') → "ORD-1002". */
export async function nextId(executor: Executor, kind: IdKind): Promise<string> {
  const { prefix, start, pad } = ID_KINDS[kind];
  const [row] = await executor
    .insert(idCounters)
    .values({ kind, lastValue: start })
    .onConflictDoUpdate({ target: idCounters.kind, set: { lastValue: sql`${idCounters.lastValue} + 1` } })
    .returning({ value: idCounters.lastValue });
  const n = Number(row.value);
  return `${prefix}${pad > 0 ? String(n).padStart(pad, '0') : n}`;
}
