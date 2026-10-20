# LogisticsEdge — Tech Stack Decision

| | |
|---|---|
| **Date** | 2026-10-17 |
| **Question** | Is the current stack good enough for a fast, smooth, interactive product with no downtime, or should we switch? |
| **Related** | [HLD.md](./HLD.md) · [LLD.md](./LLD.md) · [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) |

## 1. Verdict

**Keep the core stack. Upgrade specific modules around it.**

Next.js 16 + React 19 + TypeScript + Tailwind v4 + Postgres (Drizzle) + Vercel + Ably is the same class of stack that modern SaaS leaders run on. Nothing in it limits speed, interactivity or uptime. The problems found in the audit come from **how** it is used: the wrong DB driver, everything rendered on the client, polling instead of realtime, no job queue, no tenant isolation, and no tests.

A rewrite (for example to a NestJS API + React SPA, or Go microservices) would cost several months and make nothing faster for users. The same results come from fixing usage and adding the missing pieces below.

**The one decision with real consequences is where the database lives** (§4). Today the DB is in Singapore while Vercel functions run in its default US region, which makes every request slow from India.

---

## 2. Layer by layer

✅ keep · 🔁 change · ➕ add

| Layer | Today | Decision | Why |
|---|---|---|---|
| Framework | Next.js 16.3 App Router | ✅ keep, **use it properly** | Turn on `cacheComponents` + `partialPrefetching` for instant navigations, React `<ViewTransition>` for smooth page changes, `reactCompiler` for automatic memoisation, Server Components for first paint. All are in the bundled Next 16 docs. |
| Language | TypeScript 5 | ✅ keep | |
| Styling | Tailwind v4 + CSS tokens | ✅ keep | Replace inline `style={{…}}` objects with tokens and classes |
| UI primitives | Custom `components/ui` (cva) | ✅ keep + ➕ Radix / Base UI underneath | Accessible menus, dialogs and popovers without hand-rolled focus management |
| Animation | `motion` | ✅ keep | Plus View Transitions for route changes |
| Icons, toasts | Lucide, Sonner | ✅ keep | |
| Client data | `useEffect` + `fetch` | 🔁 **TanStack Query v5** | Cache, dedupe, background refetch, optimistic updates, retries, offline-aware |
| URL state | none | ➕ **nuqs** | Shareable filters, sort and map views |
| Tables | hand-built | ➕ **TanStack Table + TanStack Virtual** | 10k-row tables at 60 fps, column chooser, saved views |
| Command palette | none | ➕ **cmdk** | ⌘K search and actions |
| Drag and drop | none | ➕ **dnd-kit** | Dispatch board |
| Forms | react-hook-form + zod | ✅ keep | Share zod schemas between forms and APIs |
| Charts | Recharts | ✅ keep | Fine at dashboard scale |
| Maps | Leaflet + raw OSM tiles (attribution off) | 🔁 **MapLibre GL JS** (`react-map-gl`) + licensed tiles (MapTiler / Stadia) + **deck.gl** for big fleets | GPU vector maps, smooth truck animation, clustering, heat layers. The OSM tile policy forbids heavy commercial use. |
| Geocoding & routing (India) | none | ➕ **Mappls (MapmyIndia)** or **Ola Maps**, behind a `RoutingService` adapter | Indian addresses and pincodes geocode far better with India-native providers. OSRM/Valhalla self-hosted is the low-cost fallback. |
| Database | Neon Postgres (Singapore) | ✅ keep Postgres. Neon for now; see §4. | Branching per PR, PITR, autoscaling. Standard Postgres, so no lock-in. |
| DB driver | `drizzle-orm/neon-http` | 🔁 **`drizzle-orm/neon-serverless` (Pool)** | `neon-http` cannot run transactions, which broke five core flows |
| ORM / migrations | Drizzle, `db:push` | ✅ Drizzle, 🔁 `generate` + `migrate` in CI | Reviewable, repeatable migrations |
| Geo | decimal lat/lng | ➕ **PostGIS** | Geofences, nearest vehicle, distance from route |
| Cache, rate limit, locks | none | ➕ **Upstash Redis** | Login and OTP throttling, idempotency keys, hot caches |
| Background jobs | none (agents run inside the request) | ➕ **Inngest** (alternative: Trigger.dev) | Durable multi-step workflows with retries that survive timeouts and redeploys. Also replaces Vercel cron. |
| Realtime | Ably publish only | ✅ keep Ably, ➕ client subscriptions with token auth | Live map, approvals, chat. Polling stays as a fallback only. |
| Auth | Custom HMAC cookie | 🔁 **Better Auth** (organization, two-factor and phone-number plugins, Drizzle adapter) | Tenants, memberships and roles out of the box. Revocable DB sessions, MFA, phone OTP for drivers, and it runs in your own DB with no per-user fee. Managed alternative: Clerk. |
| Files | none (POD never stored) | ➕ **Cloudflare R2** (S3 API, presigned URLs) | No egress fees for POD photos and PDFs |
| PDF | `@react-pdf/renderer` | ✅ keep | |
| WhatsApp | simulated | ➕ **WhatsApp Cloud API** or an Indian BSP (Gupshup, Interakt, AiSensy) | Driver and customer messaging, templates |
| SMS / email | none | ➕ **MSG91** (DLT-compliant OTP/SMS in India) + **Resend** (email) | |
| Payments | none | ➕ **Razorpay** (UPI, payment links, subscriptions); alternative Cashfree | |
| GST e-invoice / e-way bill | none | ➕ **GSP API** (e.g. ClearTax, Masters India, IRIS) behind an adapter | NIC/IRP access is through a GSP |
| AI | regex "NLU", simulated tools | ➕ **Claude API** via `@anthropic-ai/sdk` (§5) | Hindi/Hinglish understanding, agent reasoning, copilot |
| i18n | none | ➕ **next-intl** | English + Hindi |
| Driver app | `/driver-app` web page | 🔁 **Expo (React Native)** for drivers, PWA as fallback | Background GPS with the screen off is the core of tracking, and browsers can't do it reliably. Expo shares TypeScript and zod schemas with the web app. |
| Product analytics, flags | none | ➕ **PostHog** | Funnels, session replay, feature flags for safe rollouts |
| Errors, traces, logs | `console.log` | ➕ **Sentry** + **OpenTelemetry** (`@vercel/otel`) + a log drain (Axiom / Better Stack) | |
| Uptime & status page | none | ➕ **Better Stack** or **Checkly** | Synthetic checks, public status page |
| Tests | none | ➕ **Vitest** + Testing Library + **Playwright** + MSW, **k6** for load | |
| CI/CD | none | ➕ **GitHub Actions** → Vercel previews + Neon branch per PR | |
| Search | none | Postgres full-text + `pg_trgm` first; Typesense later | Avoid another system until it's needed |

---

## 3. Fast and smooth: what actually makes it feel fast

| Lever | Effect | Where |
|---|---|---|
| **Pin Vercel functions to the DB region** | Removes 2 × 200+ ms of cross-Pacific hops per DB round trip | `vercel.json` → `"regions": ["sin1"]` (done in Phase 0) |
| Server Components + streaming for console pages | First paint without a blank screen or spinners | `(dashboard)` layout and pages |
| Cache Components + Partial Prefetching | Click → page appears immediately from the prefetched shell | `next.config.ts` |
| View Transitions | Rows morph into detail sheets; routes slide instead of flashing | React `<ViewTransition>` |
| TanStack Query + optimistic updates | Actions feel instant, with automatic rollback on error | feature hooks |
| Ably realtime instead of polling | Map, queue and status update within ~1 s, with no wasted requests | `RealtimeProvider` |
| MapLibre + deck.gl | Thousands of moving trucks at 60 fps | tracking, dashboard |
| Virtualised tables | Large lists scroll smoothly | all list pages |
| Hero animation as a video | 12 MB of frames → about 1.5 MB | marketing home |
| React Compiler | Fewer wasted re-renders without manual `useMemo` | `next.config.ts` |

---

## 4. "No downtime": realistic design

No platform gives 100% uptime. The goal is **99.9–99.95%**, plus graceful degradation so users rarely notice when a component fails.

| Risk | Design |
|---|---|
| Bad deploy | Vercel atomic deploys, **Skew Protection**, **Rolling Releases** (5% → 100%), **instant rollback**. Feature flags (PostHog) decouple deploy from release. |
| Schema change breaks the running version | **Expand → migrate → contract** migrations: add a nullable column, dual-write, backfill, switch reads, then drop the old column in a later release. Never rename in place. |
| Database outage | Neon: storage replicated across availability zones, PITR, read replica for reports. Exit path below. |
| Long or failing side-effects | Outbox + Inngest: retries with backoff, idempotency keys, dead-letter queue. A WhatsApp or GSP outage delays messages; it never fails the user's action. |
| Integration down | Circuit breaker per adapter. Fallbacks: WhatsApp → SMS, LLM → rule-based NLU, routing API → cached distance. |
| Realtime down | Clients fall back to polling automatically |
| Bad network on the highway | Driver app queues pings, POD and messages offline and syncs later |
| Silent failure | Uptime checks, Sentry alerts, SLO dashboards (ingest lag, error rate, p95 latency), on-call runbooks, public status page |

### Database region decision

| Option | Latency from India | HA / uptime | Effort | When |
|---|---|---|---|---|
| **Neon Singapore + Vercel `sin1`** (recommended now) | ~60–70 ms to the app, then DB calls stay in-region | Multi-AZ storage, PITR, fast compute restart | None: pin the region | Phases 0–3 |
| AWS Aurora PostgreSQL Serverless v2, Multi-AZ, `ap-south-1` Mumbai + Vercel `bom1` | Lowest | Hot standby failover | Medium: no branching, more ops | Customers require India data residency or a 99.95%+ SLA |
| Supabase (Mumbai region) | Low | Plan-dependent | Medium: different auth and realtime model | If you want auth, storage and realtime bundled with the DB |

Neon has no Mumbai region today (its AWS list ends at Singapore for Asia). Vercel does run in Mumbai (`bom1`). Because both options are plain Postgres and Drizzle, moving later is a dump/restore or logical replication plus a connection-string change.

---

## 5. AI layer

Use the official TypeScript SDK (`@anthropic-ai/sdk`). Default model: **Claude Opus 5.5 (`claude-opus-5-5`)**. Tune cost and latency with the `effort` setting per job, measured against a small eval set, before considering a second model.

| Job | Model | Settings | Notes |
|---|---|---|---|
| Driver message understanding (Hindi/Hinglish → intent, delay minutes, location, reason) | `claude-opus-5-5` | `effort: "low"`, structured outputs (`output_config.format` with a JSON schema) | High volume. Once an eval exists, test Claude Haiku 5.5 (`claude-haiku-5-5`) on the same set; switching is your call, based on measured accuracy. Regex rules stay as the offline fallback. |
| Exception agents (halts, deviations, detention, rescheduling) with tools | `claude-opus-5-5` | `effort: "high"`, tool runner with zod tools (`betaZodTool`), `strict: true` | Tools call domain commands; the policy engine decides auto-execute vs approval. Forced `tool_choice` is not supported on this model: use `auto` with clear instructions. |
| Copilot ("which lanes lost money last month?") | `claude-opus-5-5` | streaming, read-only SQL/report tools scoped to the tenant | Never give the model write tools here |
| Document OCR (LR, POD, invoices) | `claude-opus-5-5` | vision input + structured outputs | |
| Bulk overnight work (freight audit across all invoices) | `claude-opus-5-5` | **Message Batches API** (async, lower cost) | |

Cross-cutting: prompt caching on the stable system prompt and tool list, server-side refusal fallbacks (`fallbacks: "default"` with beta `server-side-fallback-2026-07-01`), per-tenant monthly token budgets, PII redaction (phone numbers, GSTIN) before sending, and every AI action stored with its evidence.

---

## 6. Adoption order

| When | Adds |
|---|---|
| **Phase 0 (now)** | DB driver fix, `sin1` region pin, `proxy.ts`, zod allow-lists, error handling in hooks |
| Phase 1 | Better Auth (tenancy + RBAC), Upstash, Inngest + outbox, Sentry + OTel, Vitest/Playwright + CI, migrations |
| Phase 2 | TanStack Query/Table, MapLibre + deck.gl, Mappls/Ola routing, PostGIS, R2, Expo driver app, Cache Components + View Transitions |
| Phase 3 | WhatsApp, MSG91, Resend, Razorpay, GSP, next-intl, PostHog |
| Phase 4 | Claude API agents and copilot |

## 7. Sources

- Next.js 16 bundled docs: `node_modules/next/dist/docs/01-app/02-guides/{instant-navigation,view-transitions,offline-support,progressive-web-apps,content-security-policy}.md`
- Neon regions — https://neon.com/docs/introduction/regions
- Vercel regions (`bom1`, `sin1`) — https://vercel.com/docs/regions · Rolling releases — https://vercel.com/docs/rolling-releases · Instant rollback — https://vercel.com/docs/deployments/instant-rollback
- Durable workflow engines compared — https://upstash.com/blog/durable-workflow-engines-compared-every-major-option-in-2026.md · https://automationatlas.io/guides/trigger-dev-vs-inngest-2026-comparison/
- Better Auth with Drizzle — https://nexty.dev/blogs/nextjs-boilerplate-better-auth-drizzle
