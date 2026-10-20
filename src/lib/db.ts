// ─── Database Connection — Neon PostgreSQL (Serverless) ───────────────────────
// Uses the @neondatabase/serverless WebSocket Pool so interactive transactions
// work (the neon-http driver throws on db.transaction()).
// All API routes import { db } from '@/lib/db'.
// Requires a global WebSocket (Node.js 22+), which the Vercel Node runtime provides.
//
// Local development: DATABASE_URL=pglite:./.pglite runs Postgres in-process (PGlite) with the
// same migrations and RLS, so the dev server never touches production. Create it with
// `npm run db:local`. Only one process may have the folder open (src/lib/pglite-lock.ts).
// This branch is compiled out of production builds.

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL environment variable is not set');
}

function neonDb(connectionString: string) {
  return drizzle({ client: new Pool({ connectionString }), schema });
}
type Db = ReturnType<typeof neonDb>;

// Reuse one client across dev hot reloads instead of leaking a new one per edit.
const globalForDb = globalThis as unknown as { lmsDb?: Db };

function createDb(): Db {
  if (process.env.NODE_ENV !== 'production' && url!.startsWith('pglite:')) {
    // Everything PGlite-related stays inside this branch so production builds drop it.
    const dir = url!.slice('pglite:'.length);
    const openPglite = (): Db => {
      /* eslint-disable @typescript-eslint/no-require-imports */
      const { PGlite } = require('@electric-sql/pglite') as typeof import('@electric-sql/pglite');
      const { drizzle: drizzlePglite } = require('drizzle-orm/pglite') as typeof import('drizzle-orm/pglite');
      const { lockPgliteDir } = require('./pglite-lock') as typeof import('./pglite-lock');
      /* eslint-enable @typescript-eslint/no-require-imports */
      lockPgliteDir(dir);
      const client = new PGlite(dir);
      // Queries still fail on their own; this names the folder once instead of an anonymous unhandled rejection
      client.waitReady.catch((err) => console.error(`[db] PGlite could not open ${dir}:`, err));
      // Same query API as the Neon driver; the cast keeps one type for every caller.
      return drizzlePglite(client, { schema }) as unknown as Db;
    };
    // Opened on first use, not at import: `next dev` also imports route modules in short-lived
    // worker processes (one per new dynamic URL, to look for generateStaticParams) that never
    // query. Each of them opening the folder alongside the server is what corrupted .pglite.
    let real: Db | undefined;
    return new Proxy({} as Db, {
      get(_target, prop) {
        real ??= openPglite();
        const value = Reflect.get(real, prop, real);
        return typeof value === 'function' ? value.bind(real) : value;
      },
    });
  }
  return neonDb(url!);
}

export const db = globalForDb.lmsDb ?? createDb();
if (process.env.NODE_ENV !== 'production') globalForDb.lmsDb = db;

export type DbClient = typeof db;
