// Upgrade path for an existing (pre-tenancy, `drizzle-kit push`) database like production:
// baseline → expand → backfill → contract → RLS, on real Postgres (PGlite).

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { MIGRATIONS_DIR } from './helpers/testDb';
import { getBaselineRecord } from '../scripts/baseline-record';

describe('upgrading a pushed, pre-tenancy database', () => {
  it('links users to their workspaces, adopts orphan rows and enables RLS', async () => {
    const client = new PGlite();

    // 1. The database as `drizzle-kit push` created it (tables exist, no migration history)
    const baselineSql = readFileSync(join(MIGRATIONS_DIR, '0000_baseline.sql'), 'utf8');
    for (const stmt of baselineSql.split('--> statement-breakpoint')) await client.exec(stmt);

    // 2. Data shaped like the live database (2026-10-17 survey)
    await client.exec(`
      insert into tenants (id, name, slug, archetype, is_configured) values
        ('ten_vanguard-express-logistics-5452', 'Vanguard Express Logistics', 'vanguard-express-logistics-5452', 'FLEET_OWNER', true),
        ('ten_apex-freight-lines-7569', 'Apex Freight Lines', 'apex-freight-lines-7569', 'FLEET_OWNER', true);
      insert into users (id, email, password_hash, name, role) values
        ('USR-001', 'ops@legacy.test', 'x', 'Seed Director', 'Operations Director'),
        ('USR-002', 'dispatch@legacy.test', 'x', 'Seed Dispatcher', 'Fleet Dispatcher'),
        ('usr_vanguard-express-logistics_5452', 'admin@vanguard.test', 'x', 'Vanguard Admin', 'Operations Director'),
        ('usr_apex-freight-lines_7569', 'admin@apex.test', 'x', 'Apex Admin', 'Operations Director');
      insert into customers (id, name) values ('C001', 'Old Customer'), ('C004', 'Another Customer');
      insert into vehicles (id, vehicle_no, type, capacity_kg) values ('V001', 'UP32AB1234', 'Truck', 10000);
      insert into drivers (id, name, phone, license_no, license_expiry) values ('D001', 'Old Driver', '1', 'LIC-1', '2030-01-01');
      insert into orders (id, customer_id, origin, destination, total_weight_kg) values ('ORD-1001', 'C001', 'A', 'B', 100);
      insert into knowledge_base (id, category, title, content) values ('KB-105', 'Lane Rates', 't', 'c');
      insert into incidents (id, type, severity, title, description) values ('INC-1', 'DELAY', 'LOW', 't', 'd');
    `);

    // 3. Exactly what `npm run db:baseline` records
    const baseline = getBaselineRecord(MIGRATIONS_DIR);
    await client.exec(`create schema drizzle; create table drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint);`);
    await client.query('insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)', [baseline.hash, baseline.when]);

    // 4. `npm run db:migrate` — must skip 0000 (tables already exist) and apply the rest
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_DIR });

    const one = async <T>(q: string) => (await client.query<T>(q)).rows;
    const journal = JSON.parse(readFileSync(join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf8')) as { entries: unknown[] };
    const applied = [{ n: journal.entries.length }];
    expect(await one(`select count(*)::int as n from drizzle.__drizzle_migrations`)).toEqual(applied);

    expect(await one(`select id, tenant_id from users order by id`)).toEqual([
      { id: 'USR-001', tenant_id: 'ten_legacy_workspace' },
      { id: 'USR-002', tenant_id: 'ten_legacy_workspace' },
      { id: 'usr_apex-freight-lines_7569', tenant_id: 'ten_apex-freight-lines-7569' },
      { id: 'usr_vanguard-express-logistics_5452', tenant_id: 'ten_vanguard-express-logistics-5452' },
    ]);
    expect(await one(`select count(*)::int as n from memberships`)).toEqual([{ n: 4 }]);
    expect(await one(`select role from memberships where user_id = 'USR-002'`)).toEqual([{ role: 'Fleet Dispatcher' }]);

    for (const table of ['customers', 'vehicles', 'drivers', 'orders', 'knowledge_base', 'incidents']) {
      expect(await one(`select distinct tenant_id from ${table}`), table).toEqual([{ tenant_id: 'ten_legacy_workspace' }]);
    }

    const counters = Object.fromEntries((await one<{ kind: string; last_value: number }>(`select kind, last_value from id_counters`))
      .map(r => [r.kind, Number(r.last_value)]));
    expect(counters).toMatchObject({ ORD: 1001, CUST: 4, VEH: 1, DRV: 1, KB: 105, TRP: 1000, INV: 1000, LEAD: 1000 });

    expect(await one(`select is_nullable from information_schema.columns where table_name = 'orders' and column_name = 'tenant_id'`))
      .toEqual([{ is_nullable: 'NO' }]);
    expect(await one(`select relrowsecurity as rls, relforcerowsecurity as forced from pg_class where relname = 'orders'`))
      .toEqual([{ rls: true, forced: true }]);

    expect(await one(`select relrowsecurity as rls, relforcerowsecurity as forced from pg_class where relname = 'invitations'`))
      .toEqual([{ rls: true, forced: true }]);

    // Re-running migrate is a no-op
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_DIR });
    expect(await one(`select count(*)::int as n from drizzle.__drizzle_migrations`)).toEqual(applied);
  });

  it('builds a fresh database from scratch', async () => {
    const client = new PGlite();
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_DIR });
    expect((await client.query<{ id: string }>(`select id from tenants`)).rows).toEqual([{ id: 'ten_legacy_workspace' }]);
  });
});
