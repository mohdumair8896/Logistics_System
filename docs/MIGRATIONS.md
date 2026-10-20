# Tenant Isolation — Migration Runbook

| | |
|---|---|
| **Date** | 2026-10-17 |
| **Applies to** | The production Neon database (`ap-southeast-1`), currently built with `drizzle-kit push` |
| **Migrations** | `drizzle/0000_baseline` → `0001_tenancy_expand` → `0002_tenancy_backfill` → `0003_tenancy_contract` → `0004_tenancy_rls` → `0005_sessions_invitations` → `0006_sessions_invitations_rls` → `0007_password_resets` → `0008_password_resets_rls` |
| **Status** | 0000–0006 **applied to production on 2026-10-18**, 0007–0008 (password reset links) **on 2026-10-19**. 0009 onwards **not applied yet**. Next: deploy the code (step 4), then turn on RLS (step 6). |

## Applied 2026-10-18: results

- Seed accounts USR-001–003 disabled on the production branch (`ep-morning-smoke-…`) before migrating.
- `db:baseline` recorded 0000, then `db:migrate` applied 0001–0004 in one transaction. 5 migrations are recorded.
- Users: the 3 signup admins are linked to Vanguard, Apex and Horizon. The 3 seed staff are in the Legacy Workspace. There are 6 memberships.
- All 374 existing business rows kept their counts and now belong to `ten_legacy_workspace`. No row is without a tenant.
- `tenant_id` is NOT NULL on 22 tables. RLS is enabled and forced, with a `tenant_isolation` policy, on 23 tables.
- `app_rls`: NOLOGIN, no bypass, no access to `users`. `neondb_owner` can `SET ROLE` to it.
- Live probes in rolled-back transactions: each workspace sees only its own rows. With no tenant set, nothing is visible. A cross-tenant insert fails with `42501 row-level security`.
- Smoke test of the new code against this database, RLS off and on (`DB_RLS_ROLE=app_rls`): 18 endpoints × 2 workspaces all returned 200 with correct isolation. Public tracking works; unauthenticated access returns 401.

**Until the new code is deployed,** the old deployment can still read but its inserts fail (`tenant_id` is now required). Deploy next (step 4).

## 0005–0006: sessions and invitations (apply before deploying)

The current code signs people in with a server-side session row and checks that row on every request. It also adds team invitations. Both need two new tables.

| Migration | What it does |
|---|---|
| `0005_sessions_invitations` | Creates `sessions` (one row per sign-in; revoked on sign-out, role change or removal) and `invitations` (stores only a SHA-256 hash of each invite token; 7-day expiry, single use). |
| `0006_sessions_invitations_rls` | Forces RLS on `invitations` with the same `tenant_isolation` policy as the other business tables. Removes all `app_rls` access to `sessions` (only the owner role reads or writes it). |

**Applied 2026-10-18.** `db:migrate` applied only 0005 and 0006; 7 migrations are now recorded. 15 checks passed:
- columns, foreign keys and indexes match the schema;
- RLS is forced on `invitations` with `tenant_isolation`;
- `app_rls` can't touch `sessions`;
- in rolled-back probes, an invite is visible only to its own workspace and a cross-workspace insert fails with `42501`.

A click-through on a local dev server against this database, with RLS on, also passed:
- invite, withdraw, accept a new account, and reuse a used link (refused);
- a Dispatcher is kept off the team page;
- sign-out, a role change and removal each ended the affected session;
- inviting an existing member returns 409.

It ran in a throwaway workspace (`ten_qa_access_check`), which was deleted afterwards. The 4 real workspaces and 6 users are unchanged.

Both migrations only add tables, so the deployment running today is unaffected. **The order matters:**

1. `npm run db:migrate`. It applies only 0005 and 0006, because 0000–0004 are already recorded.
2. Check the result:
   ```sql
   SELECT count(*) FROM drizzle.__drizzle_migrations;                          -- 7
   SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class
    WHERE relname IN ('sessions', 'invitations');                              -- invitations: t, t
   SELECT has_table_privilege('app_rls', 'sessions', 'SELECT');                -- f
   ```
3. Deploy the code (step 4). **If the code is deployed before the migration, every sign-in fails**, because login writes to `sessions`.
4. After the deploy, everyone signs in once more. Older cookies carry no session id, so they are refused with "Your session has ended".

Rollback: redeploy the previous build. The two tables can stay; nothing else reads them.

## 0009–0010: GST options and invoice tax columns (apply before deploying)

GTA forward charge needs to know each workspace's Annexure V option, and each invoice needs to keep the GST it was raised with.

| Migration | What it does |
|---|---|
| `0009_gst_options` | Creates `gst_options`: one row per workspace and financial year, holding the option (`RCM_5`, `FCM_5` or `FCM_18`) and the GSTIN it was filed for. Adds 5 nullable columns to `invoices`: `gst_scheme`, `place_of_supply`, `cgst`, `sgst` and `igst`. Existing invoices keep NULLs, and the app reads them as they were charged. |
| `0010_gst_options_rls` | Forces RLS on `gst_options` with the same `tenant_isolation` policy as the other business tables. |

**The order matters:**

1. Apply the migrations with `npm run db:migrate` first.
2. Then deploy the code. **If the code is deployed first, every invoice read fails** ("column gst_scheme does not exist"). That covers the invoices and tracking pages, the PDF, and the billing, collections and documentation agents.

Both migrations only add things, so the deployment running today is unaffected by them. Rollback: redeploy the previous build. The new table and columns can stay.

## 0007–0008: password reset links (applied 2026-10-19)

Operations Directors can create a one-time password reset link for a member from Team & Roles (no email provider: they share it by copy or WhatsApp). It works for 24 hours, and using it ends every session of that account in every workspace.

| Migration | What it does |
|---|---|
| `0007_password_resets` | Creates `password_resets`. Stores only a SHA-256 hash of each token, plus the issuing workspace, expiry, and used and revoked times. |
| `0008_password_resets_rls` | Removes all `app_rls` access to `password_resets`. Like `sessions`, it's a system table: the public reset endpoint finds a link by its hash before any workspace is known. |

Both only add a table, so the deployment running today is unaffected. Without the table, issuing or using a reset link fails; sign-in and everything else keep working.

**Applied 2026-10-19, to the production branch (`ep-morning-smoke-…`), as `neondb_owner`.** Beforehand, 7 migrations were recorded (last: 0006) and `password_resets` didn't exist. Now 9 are recorded. 11 checks passed:
- the 0007 and 0008 rows carry the SHA-256 hashes of their SQL files;
- the 9 columns, primary key, unique `token_hash`, 3 foreign keys and `idx_password_resets_user` match the schema;
- `app_rls` holds no privilege on the table;
- in a rolled-back probe, `SET LOCAL ROLE app_rls` then reading it fails with `42501`;
- the table is empty;
- nothing from 0009 onwards was applied (no `gst_options`, `pod_records`, `invoices.gst_scheme` or `gps_pings.recorded_at`).

**How it was applied.** `npm run db:migrate` applies *every* pending migration, and 0009–0012 already existed but weren't approved. So `drizzle-kit migrate` ran with the same connection, against a copy of `drizzle/` ending at 0008: byte-identical SQL files, and journal entries 0–8 with their original timestamps. The next `npm run db:migrate` therefore applies 0009 onwards, and only those.

The checks, for reference:
```sql
SELECT count(*) FROM drizzle.__drizzle_migrations;                          -- 9
SELECT has_table_privilege('app_rls', 'password_resets', 'SELECT');         -- f
```

Next: deploy the code. Rollback: redeploy the previous build. The table can stay; nothing else reads it.

## What this changes

- Every business table gets a required `tenant_id` (foreign key to `tenants`). Every API route filters by it and stamps it on inserts.
- New `memberships` table (user ⇄ workspace ⇄ role) and `id_counters` table (race-free IDs).
- Vehicle and licence numbers become unique **per workspace** instead of globally.
- Postgres Row-Level Security on 23 tables. It takes effect when the app runs tenant requests as the restricted `app_rls` role (see step 6).
- Existing data: the 3 signup admins are linked to the workspace created with them. Seed staff and all existing operational rows go to a new **Legacy Workspace** (`ten_legacy_workspace`).

## 0. Do this now, before anything else

The three seed accounts (`USR-001`, `USR-002`, `USR-003`, `@precisionlogistics.com`) still use the password `Logistics2026!`, which was published in the repository and in the old browser bundle. Disable them, or reset their passwords, in the Neon SQL editor:

```sql
UPDATE users SET is_active = false WHERE id IN ('USR-001', 'USR-002', 'USR-003');
```

## 1. Back up

In the Neon console, create a branch from `main` named `pre-tenancy-2026-10-17`. That's your instant rollback. Point-in-time restore also works.

## 2. Mark the existing schema as the baseline (once)

```bash
npm run db:baseline
```

This records `0000_baseline` as applied without running it, because your tables already exist. It does nothing on a fresh database or if run twice.

## 3. Apply the tenancy migrations

```bash
npm run db:migrate
```

This applies 0001–0004 in **one transaction**: all or nothing. Run step 4 straight after: once 0003 lands, the old deployment's inserts fail because they don't send `tenant_id`.

Verify in the Neon SQL editor:

```sql
SELECT count(*) FROM orders WHERE tenant_id IS NULL;                    -- expect 0
SELECT id, tenant_id FROM users ORDER BY id;                            -- every user has a workspace
SELECT count(*) FROM memberships;                                       -- one per user
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('orders', 'invoices');  -- true
```

## 4. Deploy the new code

In Vercel, set:

| Variable | Value |
|---|---|
| `AUTH_SECRET` | 32+ random characters (production refuses to start sessions without it) |
| `CRON_SECRET` | random string; Vercel Cron sends it as a Bearer token |
| `PUBLIC_LEADS_TENANT_ID` | workspace that receives website bookings (default `ten_legacy_workspace`) |
| `DB_RLS_ROLE` | **leave unset for now** |

Then deploy. Everyone has to sign in again, because sessions issued before workspaces existed are rejected. Driver GPS links must be re-issued from the Tracking page.

## 5. Smoke test

- Sign in as a Vanguard, an Apex and a Legacy user. Each sees only its own orders, fleet, invoices and leads.
- Create an order, then allocate, dispatch, deliver and invoice it.
- Open `/track/<order id>` while signed out: it works and shows no phone numbers.

## 6. Turn on Row-Level Security

Set `DB_RLS_ROLE=app_rls` in Vercel and redeploy. Tenant requests now run `SET LOCAL ROLE app_rls`. Postgres itself then refuses cross-tenant reads and writes, even if a query forgets its filter. Repeat step 5.

**Why a role switch?** Your Neon user `neondb_owner` has `BYPASSRLS`, so policies never apply to it directly. `app_rls` has no bypass. System work (login, signup, public tracking lookups, the nightly cron) stays on the owner role on purpose.

## Rollback

| Problem | Action |
|---|---|
| Something breaks after step 6 | Unset `DB_RLS_ROLE` and redeploy. RLS stops applying immediately; explicit filters still isolate tenants. |
| Something breaks after step 3/4 | Restore the `pre-tenancy-2026-10-17` branch and redeploy the previous commit. |
| Rolling back past the password-hash change (`src/lib/passwords.ts`) | **Careful:** from that deploy on, every sign-in, invite acceptance, sign-up and password reset stores a `v2$…` hash, which older builds can't read. After a rollback those people can't sign in until a Director sends them a reset link (once the fixed build is back) or support resets them. Prefer fixing forward. |

## Moving legacy data to a real workspace

All pre-existing operational rows (1 order, 4 customers, 1 vehicle, 1 driver, knowledge base, 34 incidents, agent logs) were assigned to the Legacy Workspace. If they belong to a customer, move them in one transaction, for example to Vanguard:

```sql
BEGIN;
UPDATE customers SET tenant_id = 'ten_vanguard-express-logistics-5452' WHERE tenant_id = 'ten_legacy_workspace';
UPDATE orders    SET tenant_id = 'ten_vanguard-express-logistics-5452' WHERE tenant_id = 'ten_legacy_workspace';
-- …repeat for vehicles, drivers, trips, invoices, products, inventory, knowledge_base, incidents, etc.
COMMIT;
```

Move related rows together. An order and its customer must end up in the same workspace.

## Changing the schema from now on

1. Edit `src/lib/schema.ts`.
2. `npm run db:generate`, then **review the SQL** in `drizzle/`.
3. Breaking changes go in steps: add a nullable column → backfill → make it required in a later migration. Never rename in place.
4. `npm test` (runs every migration on a fresh Postgres plus the tenant-isolation suite).
5. `npm run db:migrate` against a Neon branch first, then production.

`npm run db:push` is disabled on purpose: it bypasses migrations and can prompt to truncate tables.

## Tests

```bash
npm test
```

- `tests/migrations.test.ts` replays this exact upgrade on a copy of today's schema with data shaped like production.
- `tests/tenancy.test.ts` calls the real route handlers as two workspaces under the `app_rls` role and checks neither can read, edit, allocate against, dispatch, invoice, track or GPS-ping the other's records.
- `tests/access.test.ts` covers the role matrix on real routes, sign-out and role changes ending sessions, the invitation flow (single use, expiry, withdrawal, existing accounts), password reset links (single use, expiry, superseding, sessions ending in every workspace, no cross-workspace resets), the last-Director guard and rate limits.
- GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, lint, a check that `src/lib/schema.ts` has no changes missing a migration, the tests and a production build on every push and pull request.
- To prove both layers independently, run `DB_RLS_ROLE= npm test`. Only the two RLS-specific tests fail; the rest pass on explicit filters alone.
