// The drizzle.__drizzle_migrations row that marks drizzle/*_baseline.sql as applied.
// Shared by scripts/db-baseline.ts and the migration tests, so both use the same bookkeeping
// as drizzle-orm's migrator: hash = sha256(file contents), created_at = the journal's `when`.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface BaselineRecord {
  tag: string;
  hash: string;
  when: number;
}

export function getBaselineRecord(migrationsFolder: string): BaselineRecord {
  const journal = JSON.parse(readFileSync(join(migrationsFolder, 'meta', '_journal.json'), 'utf8')) as {
    entries: { tag: string; when: number }[];
  };
  const entry = journal.entries.find(e => e.tag.endsWith('_baseline'));
  if (!entry) throw new Error('No *_baseline entry in meta/_journal.json');
  const sql = readFileSync(join(migrationsFolder, `${entry.tag}.sql`)).toString();
  return { tag: entry.tag, hash: createHash('sha256').update(sql).digest('hex'), when: entry.when };
}
