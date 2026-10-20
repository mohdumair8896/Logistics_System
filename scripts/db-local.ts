#!/usr/bin/env tsx
// ─── Local development database ──────────────────────────────────────────────
// Creates (or brings up to date) an in-process Postgres in ./.pglite with every migration,
// then fills it with the fictional demo workspace. Production is never touched.
// Command: npm run db:local   ·   then run the dev server with DATABASE_URL=pglite:./.pglite
// Demo sign-in details are written to .pglite/DEMO_LOGIN.txt (git-ignored).

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { lockPgliteDir } from '../src/lib/pglite-lock';

const DIR = path.resolve(process.cwd(), '.pglite');
const LOGIN_FILE = path.join(DIR, 'DEMO_LOGIN.txt');

async function main() {
  // Fails if a dev server (or anything else) has the folder open; held until the seed exits
  lockPgliteDir(DIR);
  const client = new PGlite(DIR);
  await migrate(drizzle(client), { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });
  await client.close();
  console.log(`Migrations applied to ${DIR}`);

  // Reuse the demo password if the database was created before
  const previous = existsSync(LOGIN_FILE) ? readFileSync(LOGIN_FILE, 'utf8').match(/password: (\S+)/)?.[1] : undefined;
  const password = process.env.SEED_STAFF_PASSWORD ?? previous ?? randomBytes(12).toString('base64url');
  writeFileSync(LOGIN_FILE, [
    'Local demo workspace (fictional data). Sign in at http://localhost:<port>/login',
    'Operations Director: admin@demo.logisticsedge.test',
    'Fleet Dispatcher:    dispatch@demo.logisticsedge.test',
    'Compliance Officer:  compliance@demo.logisticsedge.test',
    `password: ${password}`,
    '',
  ].join('\n'));

  // The seed script reads these; it never falls back to .env.local's production URL for this run.
  process.env.DATABASE_URL = `pglite:${DIR}`;
  process.env.SEED_STAFF_PASSWORD = password;
  console.log(`Demo sign-in details: ${LOGIN_FILE}`);
  await import('./seed'); // seeds, then exits
}

main().catch((err) => {
  console.error('db:local failed:', err);
  process.exit(1);
});
