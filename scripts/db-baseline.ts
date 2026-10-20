/**
 * Mark drizzle/0000_baseline.sql as already applied — run ONCE on a database that was
 * created earlier with `drizzle-kit push` (its tables already exist).
 *
 *   npm run db:baseline      # then: npm run db:migrate
 *
 * Fresh databases don't need this: `npm run db:migrate` creates everything from 0000.
 * Safe to re-run: it does nothing if any migration is already recorded.
 */
import { join } from 'node:path';
import * as dotenv from 'dotenv';
import { Pool } from '@neondatabase/serverless';
import { getBaselineRecord } from './baseline-record';

dotenv.config({ path: '.env.local' });

const url = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL (or DATABASE_URL_MIGRATIONS) is not set');

const baseline = getBaselineRecord(join(process.cwd(), 'drizzle'));

async function main() {
  const pool = new Pool({ connectionString: url });
  try {
    const { rows: [{ exists }] } = await pool.query(`select to_regclass('public.orders') is not null as exists`);
    if (!exists) {
      console.log('Fresh database (no public.orders table): nothing to baseline. Run `npm run db:migrate`.');
      return;
    }
    await pool.query('create schema if not exists drizzle');
    await pool.query('create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)');
    const { rows } = await pool.query('select hash, created_at from drizzle.__drizzle_migrations order by created_at');
    if (rows.length > 0) {
      console.log(`Already initialised (${rows.length} migration(s) recorded). Nothing to do.`);
      return;
    }
    await pool.query('insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)', [baseline.hash, baseline.when]);
    console.log(`Recorded ${baseline.tag} as applied. Next: npm run db:migrate`);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
