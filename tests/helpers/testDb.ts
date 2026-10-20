// In-process Postgres (PGlite, Postgres 18) with every migration in drizzle/ applied.
// Tests mock '@/lib/db' with this instance, so route handlers run real SQL — including
// the RLS role switch (DB_RLS_ROLE=app_rls is set in vitest.config.ts).

import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/lib/schema';

export const MIGRATIONS_DIR = path.resolve(process.cwd(), 'drizzle');

async function create() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return { client, db };
}

let instance: ReturnType<typeof create> | undefined;

/** One migrated database per test file (Vitest isolates modules per file). */
export function getTestDb() {
  instance ??= create();
  return instance;
}
