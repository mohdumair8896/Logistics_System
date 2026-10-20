# LogisticsEdge — Audit, Competitive Benchmark & Roadmap

| | |
|---|---|
| **Date** | 2026-10-17 |
| **Scope** | Full codebase in `logistics-lms/` (≈17k lines: 37 API routes, 14 console pages, 7 agents, 22 tables) |
| **Method** | Read the code end to end, ran `tsc --noEmit` and ESLint (both pass), checked library sources for runtime behaviour, and benchmarked against ambry.io and the leading logistics platforms |
| **Related** | [HLD.md](./HLD.md) · [LLD.md](./LLD.md) |

---

## 1. Executive summary

LogisticsEdge has an **unusually broad and polished surface** for a single-team product: a cinematic marketing site, a 7-stage onboarding with complexity scoring, 14 operations screens covering the whole order-to-cash flow, a driver GPS page, public tracking, GST invoice PDFs, and a well-structured multi-agent AI layer. The feature-slice folder structure and the agent contracts are good foundations.

Underneath, it is **still a prototype**. Three problems block any real customer:

1. **The core lifecycle does not work at runtime.** Allocation, trip creation, delivery completion, invoice generation and driver reassignment all call `db.transaction()`, which the `neon-http` driver does not support. Every one of those requests fails with a 500, and the UI hides the failure.
2. **There is no tenant isolation.** Operational tables have no `tenant_id`, so every company that signs up sees, and can change, every other company's orders, fleet, drivers and invoices.
3. **Several numbers on screen are invented.** The AI brief and ROI metrics fall back to hard-coded values (₹1,84,000 leakage prevented, 2,143 active shipments, a named consignee "Reliance Retail Hub 4") when real data is empty. That is a credibility and legal risk for a commercial product.

The good news: none of this needs a rewrite. The [LLD migration plan](./LLD.md#11-migration-plan-from-the-current-code) fixes all three within the current Next.js + Neon stack.

### Scorecard

| Area | Today | Comment |
|---|:-:|---|
| Product breadth | ●●●●○ | Covers lead → cash, onboarding, AI ops |
| UI polish / visual design | ●●●●○ | Strong design system and marketing animation. Data-dense screens need tables, a map and a command palette. |
| Frontend architecture | ●●○○○ | All client components, `useEffect` fetching, polling, no cache, blank screen while auth loads |
| Backend correctness | ●○○○○ | Core transactional flows fail. Mass-assignment `PATCH`es. Racy ID generation. |
| Security | ●○○○○ | No tenant isolation, unauthenticated mutating endpoints, spoofable GPS, PII on public tracking |
| Data model | ●●○○○ | Free-text dates and statuses, no tenant keys, no trip stops, drifted `schema.sql` |
| AI / agents | ●●○○○ | Good contracts. Regex NLU, simulated tools, approvals don't execute, metrics padded. |
| Integrations | ●○○○○ | None live (WhatsApp, e-way bill, GST IRP, payments, GPS vendors, maps routing) |
| DevOps / quality | ●○○○○ | No tests, no CI, `db:push` to prod, cron auth mismatch |

### Phase 0 progress (2026-10-17)

The Phase 0 fixes below have been applied in the working tree (not yet committed). `tsc`, ESLint and `next build` pass. The transactional paths were exercised against the Neon database with read-only or rejected requests only.

| Item | Status |
|---|---|
| P0-1 DB driver → `neon-serverless` Pool; transactions verified on Neon | ✅ fixed |
| P0-2 UI hooks surface server errors (`src/lib/apiClient.ts`); unawaited promises fixed on warehouse and orders pages | ✅ fixed |
| P0-4 Signup links user → tenant; login restores tenant, plan and setup state | ✅ fixed (full tenancy is still Phase 1) |
| P0-5 Auth on `agent/queue`, `agent/brief`, `agent/timeline`; autonomy changes limited to Operations Director; approvals audited | ✅ fixed |
| P0-6 GPS ping needs a signed, expiring per-trip driver link (`/api/trips/[id]/driver-link`) | ✅ fixed |
| P0-7 `proxy.ts` (Next 16), one CSP without `unsafe-eval` in production, geolocation allowed only on `/driver-app` | ✅ fixed |
| P0-8 zod allow-lists + status transitions on every PATCH/POST for orders, trips, invoices, vehicles, drivers, customers, leads | ✅ fixed |
| P0-9 IDs from an atomic `id_counters` table (`src/lib/ids.ts`) | ✅ fixed (race-free; per-tenant display numbers come with UUID primary keys) |
| P0-10 Cron accepts Vercel's `Authorization: Bearer` | ✅ fixed |
| Vercel functions pinned to `sin1`, next to the Singapore DB | ✅ fixed |
| Public tracking: no driver phone, masked registration, no invented speed, ETA or checkpoints | ✅ fixed |
| Fabricated metrics, brief values, risks, telemetry, inventory, crew avatars, social proof removed | ✅ fixed |
| Home-page quote: real cities, km, INR band per truck type, saved as a CRM lead via `/api/public/leads` | ✅ fixed |
| P0-3 Tenant isolation: `tenant_id` on 17 tables, every route and agent scoped, `memberships`, Postgres RLS via the `app_rls` role, server-side entitlements, 24 automated tests | ✅ implemented and **migrated on production 2026-10-18**. Deploy, then enable `DB_RLS_ROLE`: see [MIGRATIONS.md](./MIGRATIONS.md) |
| Team & access control: role permission matrix on every mutating route, revocable server-side sessions, invite links, Team & Roles page, rate limits on login, signup and invites, 27 more tests, GitHub Actions CI | ✅ implemented (not committed). Migrations 0005–0006 **applied on production 2026-10-18**, so the code can be deployed: see [MIGRATIONS.md](./MIGRATIONS.md#00050006-sessions-and-invitations-apply-before-deploying) |

**Additional issues found and fixed while doing Phase 0:**

- The account menu had a role switcher that logged in with a hard-coded password (`Logistics2026!`) shipped in the browser bundle. That same password was used by `scripts/seed.ts`. The switcher is removed, and the seed now requires `SEED_STAFF_PASSWORD`. The seeded accounts are not present in the current database.
- Allocation always assigned driver `D001`, even through "Manager Override". It now uses the vehicle's real driver; overrides need a reason and are audited.
- Lead → order conversion always used customer `C001`, product `P001`, 350 km and Bay 3. It now creates the customer from the lead and derives distance and rate.
- Warehouse "Scan all" fired parallel writes that overwrote each other. It now scans sequentially.
- Server-side times were formatted in the server's UTC clock. They now use IST.
- New drivers defaulted to "documents verified" with a 4.8 rating, which bypassed the compliance check.

**Marketing copy to review (not changed):** claims for features that don't exist yet. These are robotic cross-docking, RFID scanning and electric fleets (`LogisticsSections.tsx`), and on the pricing page a 99.99% SLA, SSO/SCIM and a dedicated isolated database.

---

## 2. Critical defects (P0 — fix before any customer uses it)

| # | Defect | Evidence | Impact | Fix |
|---|---|---|---|---|
| P0-1 | **Transactions are unsupported by the DB driver.** `drizzle-orm/neon-http` throws `"No transactions support in neon-http driver"`. | `src/lib/db.ts` uses `neon-http`; `node_modules/drizzle-orm/neon-http/session.js:151`; called in `orders/[id]/route.ts:34` (allocate), `trips/route.ts:33` (create trip), `trips/[id]/route.ts:33` (complete), `invoices/route.ts:33` (generate), `drivers/[id]/route.ts:34` (reassign) | Allocation, dispatch, delivery, invoicing and reassignment always return 500 | Switch to `drizzle-orm/neon-serverless` with `Pool` ([LLD §10.1](./LLD.md#101-transactions--the-outbox)) |
| P0-2 | **Failures are invisible in the UI.** Hooks never check `res.ok`. | `src/features/orders/hooks.ts` (`allocateVehicle`, `updateOrder`), same pattern in the other hooks | Users think an action succeeded. Optimistic state diverges from the DB. | Check `res.ok` and toast the error envelope |
| P0-3 | **No tenant isolation.** Only `users` has `tenant_id`. Every list query is global. | `src/lib/schema.ts` (orders, trips, vehicles, drivers, invoices… have no tenant column); e.g. `src/app/api/orders/route.ts` | Any signed-up company sees and edits all others' data | `tenant_id` + scoped repositories + RLS ([LLD §3.7](./LLD.md#37-row-level-security)) |
| P0-4 | **Signup doesn't link the user to the tenant, and login drops tenant context.** | `register-subscription/route.ts` inserts the user without `tenantId`; `auth/login/route.ts:55` omits `tenantId`, `isConfigured` and `plan` from the token | After the first logout, the company context is lost | `memberships` table, tenant in the session |
| P0-5 | **Unauthenticated control endpoints.** | `src/app/api/agent/queue/route.ts` (GET + POST: anyone can approve actions or change the autonomy level), `agent/brief`, `agent/timeline` | Anyone on the internet can change AI autonomy and approve financial actions | `requireAuth` + permission check |
| P0-6 | **GPS ingest is open and spoofable.** | `src/app/api/gps/ping/route.ts` has no auth; vehicle ID comes from the URL (`/driver-app?v=V001`) | Fake positions for any vehicle. Vehicle IDs are sequential, so they are trivially guessable. | Driver OTP + device token ([LLD §9](./LLD.md#9-driver-pwa)) |
| P0-7 | **The driver app's own GPS is blocked by the app's header.** | `src/middleware.ts:111` sets `Permissions-Policy: geolocation=()` on every route, including `/driver-app` | `navigator.geolocation` is denied, so live tracking cannot work | Allow `geolocation=(self)` on driver routes |
| P0-8 | **Mass-assignment `PATCH`.** The request body goes straight into `.set(body)`. | `orders/[id]:53`, `trips/[id]:61`, `invoices/[id]:31`, `vehicles/[id]:33`, `drivers/[id]:52` | Any user can set any column: invoice totals, status, IDs | zod allow-list per endpoint ([LLD §5.1](./LLD.md#51-principles)) |
| P0-9 | **Racy, lexicographic ID generation.** `max(id) + 1` on varchar | `orders/route.ts:29`; `vehicles/route.ts:32` pads to 3 digits | Duplicate keys under concurrency. `V1000` sorts before `V999`, so the next insert collides. | Per-tenant counter table ([LLD §3.8](./LLD.md#38-human-readable-numbers)) |
| P0-10 | **Nightly compliance cron is rejected.** Vercel sends `Authorization: Bearer <CRON_SECRET>`; the route checks `x-cron-secret`. | `src/app/api/compliance/check/route.ts:33` | The scheduled run gets a 401, so compliance alerts never fire automatically | Accept the Bearer header |

---

## 3. Security & privacy findings

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| High | Public tracking accepts sequential IDs (`ORD-1001`, `TRP-1001`), so anyone can enumerate every shipment | `src/app/api/track/[id]/route.ts` | Random tracking token per order, rate limit |
| High | Public tracking returns the **driver's real phone number** | `track/[id]/route.ts:76` | Masked call bridge or first name only (DPDP Act) |
| High | Hard-coded fallback signing secret if `AUTH_SECRET` is missing | `src/lib/auth.ts` (`getSecret`) | Fail closed in production |
| High | Sessions can't be revoked (stateless 8 h token; logout only clears the cookie) | `src/lib/auth.ts`, `auth/logout/route.ts` | Server-side `sessions` table (✅ done) |
| Medium | No rate limiting on login, signup or public endpoints | `auth/login/route.ts` | Upstash sliding-window limits ([LLD §10.3](./LLD.md#103-rate-limiting)) (🟡 in-memory limits on login, signup and invites; Upstash pending) |
| Medium | Roles exist but are never enforced; every authenticated user can do everything | all routes use only `requireAuth` | RBAC matrix ([LLD §7.1](./LLD.md#71-identity-sessions--rbac)) (✅ done) |
| Medium | Entitlements and module gating are client-side (`localStorage`) | `src/lib/entitlements/index.ts:106` | Server-side entitlements |
| Medium | Two conflicting CSPs (`next.config.ts` and `middleware.ts`), both with `'unsafe-eval'` | both files | One nonce-based CSP in `proxy.ts` |
| Medium | Error details leaked to clients (`details: String(err)`, raw `err.message`) | `compliance/check`, `agent/*` routes | Error envelope, log details server-side |
| Medium | Ably publishes on global channels (`gps`, `alerts`) with no tenant scoping | `gps/ping`, `compliance/check` | Tenant-scoped channels + token auth ([LLD §7.9](./LLD.md#79-realtime-channels-ably)) |
| Low | `middleware.ts` is the deprecated Next 16 name | `src/middleware.ts` | Rename to `proxy.ts` |
| Low | Leaflet uses raw OSM tiles with attribution disabled | `P44CorridorMap.tsx:116` | Licensed tile provider with attribution shown |

---

## 4. Backend & data findings

| Finding | Where | Recommendation |
|---|---|---|
| Route handlers query Drizzle directly; business rules are duplicated or missing (e.g. allocation doesn't check capacity, status or compliance server-side) | `src/app/api/**` | Service layer per module ([LLD §2](./LLD.md#2-code-structure)) |
| Status changes via `PATCH` with no state machine. A delivered order can go back to pending. | orders, trips, invoices routes | Command endpoints + FSM ([LLD §4](./LLD.md#4-state-machines)) |
| Trip creation silently falls back to vehicle `V001` / driver `D001` and fakes telemetry (speed 62, fuel 88%, "20.8°C") | `src/app/api/trips/route.ts:52-63` | Require an allocated vehicle and driver; telemetry only from real pings |
| Invoice math is hard-coded: ₹2,000 loading, ₹1,500 unloading, flat 18% GST, no CGST/SGST/IGST split, no RCM, no SAC code | `src/app/api/invoices/route.ts:48-52` | Rate cards + GST engine ([LLD §7.5](./LLD.md#75-billing--gst)). GTA rates changed on 22 Sep 2025. |
| Generating an invoice marks the order Delivered but leaves the trip, vehicle and driver untouched | `invoices/route.ts:79` | Invoice follows POD, never the reverse |
| POD signature and photo are captured in the browser but **never uploaded or stored** (`pod_image_url` is never written) | `src/app/(dashboard)/delivery/page.tsx` | Presigned upload to R2/S3 + `pods` table |
| Dates and times stored as display strings (`startedAt: "10:30 AM"`, `eta: "180 min"`, `deadline` text) | `src/lib/schema.ts` (`trips`, `orders`) | `timestamptz` |
| Money stored as `decimal` strings, parsed with `parseFloat` | invoices | `bigint` paise |
| One order equals one trip; no stops, multi-drop or consolidation | schema | `trip_stops` ([LLD §3.2](./LLD.md#32-orders-planning--execution)) |
| `gps_pings` unpartitioned, no geo types, no latest-position table | schema | Partitioned pings + `vehicle_positions` + PostGIS |
| `docs/schema.sql` describes a different schema from the one actually running | `docs/schema.sql` vs `src/lib/schema.ts` | Generate migrations from Drizzle; retire the hand-written SQL |
| Full-table scans for dashboards (`select * from orders` and then filtering in JS) | `agent/brief/route.ts`, `compliance/check` | `count`/`group by` queries and materialised views |
| Agents run synchronously inside the HTTP request on an in-memory bus with unbounded recursion | `src/lib/agents/core/eventBus.ts` | Outbox + durable jobs ([LLD §7.7](./LLD.md#77-intelligence-edgepilot)) |
| Approving an AI action only flips a flag; nothing executes | `eventGraph.ts` (`resolveApproval`), `agent/queue/route.ts` | Proposal → approval → executor |
| Autonomy level is a static in-memory variable shared by all tenants and reset on every cold start | `actionEngine.ts:27` | `tenant_configs.autonomy_level` |
| Driver "NLU" is keyword regex | `agents/modules/driver/index.ts:174-221` | LLM classifier with regex fallback |
| Migrations use `drizzle-kit push` | `package.json` | `generate` + `migrate` in CI |
| No tests, no CI | repo | Vitest + Playwright + GitHub Actions ([LLD §10.5](./LLD.md#105-testing-strategy)) (🟡 Vitest + CI done; Playwright pending) |

---

## 5. Frontend & UX findings

| Finding | Where | Recommendation |
|---|---|---|
| Every console page is a client component. Data loads in `useEffect` with no cache or dedupe; each page re-downloads whole tables. | `src/features/*/hooks.ts` | Server Components for first paint + TanStack Query |
| Console layout renders **nothing** until a client-side `/api/auth/me` call returns (blank flash on every hard load) | `src/app/(dashboard)/layout.tsx` | Server-side session read in the layout |
| Realtime is published but never consumed; tracking polls on an interval | `tracking/page.tsx:51` | Ably subscriptions → query invalidation |
| The map draws a straight line from origin to destination; there is no road route, live fleet view or clustering | `P44CorridorMap.tsx:127` | MapLibre + routing polyline + fleet layer |
| The home-page quote calculator invents the distance from the first letters of the two city names (`charCodeAt`), prices in miles and USD on an INR product, then shows "Freight Booking Confirmed!" without sending anything; marketing leads are lost | `src/components/home/QuoteRequest.tsx:124-163` | Real routing distance + rate card, `POST /api/v1/public/leads` ([LLD §6.5](./LLD.md#65-instant-quote-marketing-site)) |
| Hero animation ships 249 WebP frames (12 MB) | `public/frames/` | Scroll-scrubbed video (~1.5 MB) or a progressive loader; `prefers-reduced-motion` |
| Very large page components (`agent-ops` 1,033 lines, `configure` 853, `orders` 637) with inline styles | `src/app/(dashboard)/*` | Split into feature components; use tokens and Tailwind classes |
| No global search, command palette, saved views, bulk actions or keyboard navigation | console | See [LLD §8.3](./LLD.md#83-interaction-design--what-makes-it-feel-top-tier) |
| No customer (shipper) portal; customers can only use the public tracking page | — | Portal route group |
| No Hindi or regional language support, even for drivers | — | i18n (English + Hindi first) |
| README is out of date (mentions Zustand, "Next.js 15", a `/design-system` page that doesn't exist) | `README.md` | Rewrite and link to HLD/LLD |

---

## 6. Product authenticity (fabricated or hard-coded data)

A commercial customer will notice these, and some could be seen as misleading advertising:

| What the user sees | Source |
|---|---|
| "Freight leakage prevented ₹1,84,000", "142 automated tasks", "48 hours saved", "18 disputed invoices resolved" shown as **minimums** even with zero real activity | `src/lib/agents/core/eventGraph.ts:187-190` |
| Monday brief: 2,143 active shipments, ₹9,24,500 overdue, 12 missing PODs, 7 trucks down when real values are 0 | `src/app/api/agent/brief/route.ts` (`\|\| 184200`, `\|\| 924500`, …) |
| "Top risks" naming real businesses ("Reliance Retail Hub 4", "Sharma Logistics fleet") and an NH-48 monsoon detour, hard-coded | `agent/brief/route.ts:33-36` |
| Trip telemetry (62 km/h, 88% fuel, 20.8 °C) invented at trip creation | `trips/route.ts:63` |
| Public tracking fallback speed of 64 km/h and fake checkpoint times ("10:30 AM") | `track/[id]/route.ts` |
| WhatsApp messages "delivered" by a simulated tool with a placeholder phone number | `actionEngine.ts` (`SEND_WHATSAPP`) |
| Home-page quote: distance from city-name letter codes, USD pricing, a fixed "24.8% carbon savings", and a "Booking Confirmed" toast with a random reference that is never saved | `src/components/home/QuoteRequest.tsx:124-163` |

**Rule going forward:** show real numbers or a helpful empty state. Use a clearly labelled **sandbox tenant** with seeded data for demos.

---

## 7. Competitive benchmark

### 7.1 What the reference platforms do

| Platform | Category | What's worth learning |
|---|---|---|
| **[ambry.io](https://ambry.io/)** | Freight marketplace / "operating system for North America logistics" (**pre-launch**: private beta and a waitlist; it cites 56 teams on the waitlist) | Persona pages (shippers, carriers, brokers, warehouses). A six-step story: list or request → matched → agree → execute → track → close and get paid. Messaging, terms and documents in one thread. Verified partners. Booking pitched at under 10 minutes. *It is a marketing site plus waitlist today, not a working system to copy feature for feature.* |
| **Flexport** | Digital forwarder + platform | Control tower that works even when another carrier hauls the freight. "Flexport Intelligence" plain-language analytics assistant. Instant rate and booking (Rate Explorer). Landed-cost and tariff simulator. Human-in-the-loop AI for airfreight ops. |
| **project44 Movement** | Visibility / decision intelligence | Connect → See → Act → Automate. Predictive multimodal ETAs with **ETA explainability** (why it moved). AI agents (LunaPath acquisition) and a conversational analyst. Execution layer that sits beside the TMS. |
| **FourKites** | Visibility | Predictive ETA and exception alerts on milestones. Yard and warehouse visibility beyond transport. |
| **Samsara / Motive** | Fleet telematics | AI dashcams, driver-safety coaching, ELD/HOS compliance, fuel-tax reporting, maintenance, fuel cards, workforce qualifications. Hardware + software per-vehicle pricing. |
| **Uber Freight** | TMS + brokerage | AI procurement and carrier management, tendering with acceptance, multimodal execution, predictive exception management |
| **Delhivery One / Shiprocket** | Self-serve shipping (India) | Zero-minimum onboarding with a prepaid wallet, one-click sales-channel integration, NDR management, post-purchase communication, rate calculator and serviceability by pincode, FTL freight index |
| **Indian TMS (Fleetx, Shipsy, Fretron, FleetAble)** | India fleet + TMS | E-way bill auto-verify and extension, FASTag integration, AIS-140 and VAHAN compliance, low-network handling, ULIP-based data, freight audit |

### 7.2 Feature matrix

✅ have · 🟡 partial or prototype · ❌ missing

| Capability | LogisticsEdge | Leaders |
|---|:-:|---|
| Marketing site with persona pages | 🟡 (single long page) | ambry, Flexport |
| Instant quote / rate calculator | ❌ (UI exists; numbers are fake and booking is not sent) | Flexport, Delhivery One |
| Self-serve signup + onboarding | ✅ (7-stage questionnaire) | Delhivery One, Shiprocket |
| Customer portal (book, track, POD, invoices, pay) | ❌ | Flexport, Delhivery One |
| Bulk order import (Excel/CSV), ERP connectors | ❌ | All TMS vendors |
| Allocation / dispatch recommendations | 🟡 (first fit, client-side) | Uber Freight, Fleetx |
| Route planning and optimisation (multi-drop, VRP) | ❌ | Locus, FarEye, Shipsy |
| Live fleet map | 🟡 (single-trip straight line) | Samsara, Motive, Fleetx |
| Predictive ETA with explanation | ❌ | project44, FourKites |
| Geofence arrival/departure, detention | ❌ (status strings only) | All visibility vendors |
| Driver app with offline POD | 🟡 (GPS page only; blocked by header) | Motive, Fleetx |
| ePOD (OTP, photo, signature) stored | 🟡 (captured, never saved) | Delhivery, FarEye |
| Hardware GPS / AIS-140 integration | ❌ | Fleetx, Samsara |
| FASTag toll events | ❌ | Fleetx, FleetAble |
| E-way bill generate, update, extend | ❌ | FleetAble, Indian TMS |
| GST-correct invoice + e-invoice IRN | 🟡 (PDF, wrong tax logic) | Indian TMS |
| Payments, payment links, reconciliation | ❌ | Delhivery One, ambry (promised) |
| Collections / dunning | 🟡 (agent stub) | — |
| WhatsApp driver and customer comms | 🟡 (simulated) | Indian TMS |
| Exception management with approvals | 🟡 (queue UI; approvals don't execute) | project44, Uber Freight |
| AI copilot ("ask your data") | ❌ | Flexport Intelligence, project44 Mo |
| Driver safety, dashcam, HOS | ❌ | Samsara, Motive |
| Maintenance, fuel, tyres, expenses | 🟡 (activity log only) | Samsara, Fleetx |
| Carrier tendering / marketplace | ❌ | ambry (planned), Uber Freight |
| Public API + webhooks | ❌ | All |
| Multi-tenant SaaS isolation, RBAC, SSO | 🟡 (isolation, RBAC and team invites; no SSO yet) | All |
| Analytics (on-time %, cost per km, lane profitability) | 🟡 (dashboard tiles) | All |

### 7.3 Where LogisticsEdge can win

1. **India-native compliance in one place:** GST (RCM/FCM), e-invoice, e-way bill, FASTag, VAHAN/SARATHI. The global leaders don't cover this; the Indian vendors cover it piecemeal.
2. **Agentic ops with honest ROI:** the event-graph + autonomy-ladder design is ahead of most Indian TMS products. Make it real (LLM NLU, executing tools, measured savings).
3. **Hindi/Hinglish WhatsApp-first driver experience:** most drivers won't install an app, but they do use WhatsApp.
4. **Composable onboarding:** the archetype → modules → plan engine (`src/lib/onboarding/scoring.ts`) is a genuine differentiator for self-serve SaaS.
5. **Network effects later:** once fleets run on the platform, an ambry-style capacity marketplace becomes possible, with verified carriers backed by real performance data.

---

## 8. Roadmap

Size: **S** ≤ 3 dev-days · **M** ≤ 2 weeks · **L** > 2 weeks.

### Phase 0 — Stabilise (do first)

| Item | Size |
|---|:-:|
| Switch to `neon-serverless` Pool driver; verify the 5 transactional flows end to end | S |
| `res.ok` handling + error toasts in all hooks | S |
| Auth on `agent/queue`, `agent/brief`, `agent/timeline`; fix the cron Bearer header | S |
| Driver-route `Permissions-Policy`; rename to `proxy.ts`; single CSP | S |
| zod allow-lists replace `PATCH set(body)` | S |
| Remove driver phone from public tracking; stop fabricated metrics, brief values and telemetry | S |
| Replace the fake home-page quote maths with real distance + INR rate card; save bookings as leads (rate-limited endpoint) | S |

### Phase 1 — Foundation

| Item | Size |
|---|:-:|
| Tenancy: `tenant_id` everywhere, memberships, tenant in the session, RLS, cross-tenant tests | L |
| RBAC permission matrix + server-side entitlements | M |
| Service layer (`src/server/modules/*`), command endpoints, FSMs, audit log | L |
| IDs (UUID + per-tenant numbers), `timestamptz`, money in paise (migration with dual-write) | M |
| Outbox + durable job runner; move agents off the request path | M |
| Vitest + Playwright + GitHub Actions; `drizzle-kit migrate`; Sentry + structured logs | M |
| Revocable sessions, rate limiting, fail-closed secrets | S |

### Phase 2 — Core operations depth

| Item | Size |
|---|:-:|
| Trip stops (multi-pickup and multi-drop), dock appointments, detention | M |
| MapLibre live fleet map, routing polylines, geofences, ETA v1 with explanations | L |
| Driver PWA: OTP login, offline queue, stop check-in, POD upload to R2 | L |
| Server-side allocation scoring with explain bars; dispatch board (drag and drop) | M |
| GST engine (RCM/FCM 5% or 18%, CGST/SGST/IGST), rate cards, invoice lines, credit notes | M |
| E-way bill (GSP): generate, Part-B update, auto-extend proposals | M |
| Fleet documents (RC, insurance, PUC, permit), maintenance, fuel and expense logs | M |

### Phase 3 — Customer experience & growth

| Item | Size |
|---|:-:|
| Customer portal: book, bulk upload, track, download POD and invoices, pay, dispute | L |
| Instant quote widget, persona pages, interactive product tour (sandbox tenant), trust page | M |
| Branded public tracking by token with realtime and an ETA band | S |
| WhatsApp Business API: driver chat, customer milestones, invoice delivery | M |
| Payment gateway: payment links, UPI, auto-reconciliation, dunning | M |
| e-invoice IRN; Tally/Zoho export | M |
| Public API v1 + webhooks + API keys + OpenAPI docs | M |
| Hindi UI; hero animation performance pass | S |

### Phase 4 — Intelligence

| Item | Size |
|---|:-:|
| LLM gateway (budgets, PII redaction, model routing); driver NLU in Hindi/Hinglish | M |
| Executing tools + approval → execution loop, with measured ROI | M |
| ETA v2 (learned p50/p90), SLA-risk prediction | L |
| Copilot: plain-language questions over the tenant's data | M |
| Freight audit (rate vs contract, detention claims, duplicate tolls); document OCR (LR, POD, invoices) | M |

### Phase 5 — Network & ecosystem

| Item | Size |
|---|:-:|
| Partner carrier portal + tendering (accept/reject, SLAs, scorecards) | L |
| Capacity marketplace (ambry-style requests and offers, verified partners, in-thread terms and documents) | L |
| GPS hardware vendor adapters (AIS-140), FASTag, VAHAN/SARATHI verification | M |
| Driver safety (harsh events, dashcam integration), driver payouts and advances | L |

---

## 9. Sources

- ambry.io home page — https://ambry.io/
- Flexport Winter Release (20+ tools, Control Tower, Flexport Intelligence, Rate Explorer) — https://www.supplychain247.com/article/flexport-unveils-20-new-tools-to-help-businesses-manage-supply-chains/flexport and https://aircargoweek.com/betting-on-human-in-the-loop-ai-for-reliability/
- project44 Movement (decision intelligence, ETA explainability, LunaPath) — https://www.project44.com/?p=68739 · https://www.project44.com/?p=76429 · https://logisticsviewpoints.com/2026/10/06/project44-real-time-logistics-data-execution/
- Samsara vs Motive comparison — https://airpinpoint.com/compare/samsara-vs-motive · Motive product pages — https://gomotive.com/blog/category/dash-cam/
- FourKites and Uber Freight listings — https://www.capterra.com/p/164161/FourKites · https://capterra.com/p/206000/Uber-Freight/
- Delhivery One launch — https://itln.in/logistics/delhivery-launches-digtial-shipping-platform-for-smes-delhivery-one-1349549
- Indian TMS landscape and compliance checklist — https://www.fretron.com/blog/best-tms-software-india-2026/ · https://roado.tech/blog/fleet-management-software-features-checklist-what-indian-fleet-operators-need-in-2026/ · https://www.techjockey.com/detail/fleetable-tms
- GST on GTA after the Sept 2025 rationalisation — https://lakshmisri.com/newsroom/news-briefings/impact-of-gst-rate-changes-on-the-logistic-sector · https://studycafe.in/gst-on-gta-made-simple-comprehensive-guide-to-rcm-fcm-and-exemptions-399846.html
