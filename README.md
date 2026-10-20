# LogisticsEdge Platform (LMS)

> Enterprise Fleet Intelligence & Logistics Management System built with Next.js 15+ (App Router), React 19, TypeScript, TailwindCSS, and Zustand.

---

## 🌟 Overview & Features

Implemented according to the **LogisticsEdge Design System & Architecture**:

1. **Operations Dashboard (`/dashboard`)**:
   - Live interactive SVG Regional Hub Network with corridor connections and region filtering (*North, Europe, East*).
   - Real-time KPI statistics (*Total Orders, Active Trips, Fleet Vehicles, Active Drivers, 87.4% SLA Delivery Rate, Pending Allocations*).
   - Quick Actions panel & system alerts notification feed.

2. **Smart Vehicle Allocation Engine (`/allocation`)**:
   - 3-panel dispatch matching: Order dossier, recommended vehicle match with capacity utilization scoring, and alternative fleet feasibility matrix (*insufficient capacity, maintenance, ETA limits*) with Manager Override capability.

3. **Warehouse Staging & Barcode Verification (`/warehouse`)**:
   - Loading bay assignment (`Bay 4 - North Dispatch`), pallet batch barcode scan verification checklist, and dynamic axle weight distribution balance gauge (*Front 38% / Rear 62%*).

4. **Live Telematics & Corridor Tracking (`/tracking`)**:
   - Telematics HUD (*Speed Gauge 64 km/h, Fuel 78%, Cargo Temp 21.5°C Ambient, Geofence status*).
   - Interactive corridor visualizer with **Fast-Forward Journey Simulation** and waypoint logs.
   - Live direct dispatch chat with drivers.

5. **Electronic Proof of Delivery (e-POD) & Billing (`/delivery` & `/invoices`)**:
   - HTML5 canvas digital consignee signature capture pad.
   - Geo-verified docking photo capture simulator.
   - Automated GST Tax Invoice generation (`INV-1006`) with PDF print support.

6. **Design System & Style Guide (`/design-system`)**:
   - Standardized visual design tokens (`#2A5C9A` Primary Blue, `#1A2B3C` Dark Slate, `#2D8A4E` Emerald, `#64748B` Neutral Slate).
   - Live Dark/Light mode theme customizer.

7. **End-to-End Guided Demo Tour (`DemoTourBar`)**:
   - 7-stage sequential navigation bar with 1-click **Reset Demo Data** button.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15+ (App Router with Turbopack)
- **Language**: TypeScript
- **Styling**: Vanilla CSS Variables & Modern TailwindCSS design system
- **State Management**: Zustand
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server

Develop against a local database so nothing you do touches production. `npm run db:local` creates `.pglite/` (in-process Postgres with every migration) and fills it with the fictional demo workspace; the demo sign-in details are written to `.pglite/DEMO_LOGIN.txt`.

```bash
npm run db:local
```

Then start the dev server with the local database (PowerShell: `$env:DATABASE_URL='pglite:./.pglite'; $env:DB_RLS_ROLE='app_rls'; npm run dev`):

```bash
DATABASE_URL=pglite:./.pglite DB_RLS_ROLE=app_rls npm run dev
```

Only one process at a time may have `.pglite/` open: the dev server, `npm run db:local` or `npm run db:seed`. PGlite runs Postgres inside that process and has no lock of its own, so two processes writing the folder lose rows and in the end break it. Each of these claims the folder in `.pglite/lms-open.lock` (holding its process ID), and a second one stops with "… is already open in process N". Stop the dev server before running `npm run db:local`, and don't point any other tool at the folder (a script, a copy or backup) while it is open. The dev server opens the folder on its first query rather than at startup, because `next dev` also loads route modules in short-lived worker processes that must never open it.

Stopping the dev server in any way (Ctrl+C, closing the terminal, ending the process) keeps every saved change. A `lms-open.lock` and `postmaster.pid` left behind after that are normal; the next process takes them over.

If the local database is damaged anyway (every query fails with `RuntimeError: Aborted()`), stop everything that uses it, move `.pglite/` aside and run `npm run db:local` again. To keep the same demo password, set `SEED_STAFF_PASSWORD` to the one in the old `DEMO_LOGIN.txt` first.

Open [http://localhost:3000](http://localhost:3000) with your browser. Without `DATABASE_URL` set on the command line, the dev server uses the one in `.env.local`.

Design rules (colours, type, motion, sign-in and dashboard patterns) live in [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

### 3. Production Build
```bash
npm run build
npm start
```

---

## 📄 License
MIT © LogisticsEdge Platform
