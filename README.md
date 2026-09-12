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
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 3. Production Build
```bash
npm run build
npm start
```

---

## 📄 License
MIT © LogisticsEdge Platform
