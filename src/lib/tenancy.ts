// ─── Tenant context (server-only) ─────────────────────────────────────────────
// Every tenant-scoped request runs inside withTenant(): one transaction that
//   1. switches to the RLS role (when DB_RLS_ROLE is set — see drizzle/0004_tenancy_rls.sql),
//   2. sets app.tenant_id so Postgres policies only expose this tenant's rows.
// Route code ALSO filters by tenant_id explicitly; RLS is the backstop for a forgotten filter.
//
// The AI agents use the shared pool rather than one long transaction, so they get the
// tenant from runAsTenant() / currentTenantId() and filter explicitly.

import { AsyncLocalStorage } from 'node:async_hooks';
import { sql } from 'drizzle-orm';
import { db } from './db';

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
/** Anything that can run queries: the pool-backed db or an open transaction. */
export type Executor = typeof db | Tx;

const RLS_ROLE = (process.env.DB_RLS_ROLE ?? '').trim();
if (RLS_ROLE && !/^[a-z_][a-z0-9_]*$/.test(RLS_ROLE)) {
  throw new Error('DB_RLS_ROLE must be a plain Postgres role name (e.g. app_rls)');
}
if (process.env.NODE_ENV === 'development') {
  console.info(`[tenancy] row-level security role: ${RLS_ROLE || 'off (explicit tenant filters only)'}`);
}

const tenantStore = new AsyncLocalStorage<{ tenantId: string }>();

/** Runs `fn` in a transaction scoped to `tenantId` (RLS role + app.tenant_id). */
export async function withTenant<T>(tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!tenantId) throw new Error('withTenant() requires a tenantId');
  return db.transaction(async (tx) => {
    if (RLS_ROLE) await tx.execute(sql.raw(`set local role ${RLS_ROLE}`));
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return tenantStore.run({ tenantId }, () => fn(tx));
  });
}

/** Sets the tenant context for pool-based code (agents) without opening a transaction. */
export function runAsTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  if (!tenantId) throw new Error('runAsTenant() requires a tenantId');
  return tenantStore.run({ tenantId }, fn);
}

/** The tenant of the current request. Throws if called outside withTenant()/runAsTenant(). */
export function currentTenantId(): string {
  const ctx = tenantStore.getStore();
  if (!ctx) throw new Error('No tenant context: wrap the call in withTenant() or runAsTenant()');
  return ctx.tenantId;
}
