// ─── Composable Logistics OS: Entitlement Engine & Tenant Profiles ────────────
// Enforces module gating, role-based visibility, and provides instant reference presets.

import { LucideIcon, LayoutDashboard, Truck, Users, ShoppingCart, MapPin, Package, Navigation, PackageCheck, FileText, Warehouse, Sparkles, BookOpen, Search, Cpu } from 'lucide-react';
import { ArchetypeCode, PlanTier } from '@/lib/onboarding/scoring';
import { DEFAULT_ENABLED_MODULES } from './defaults';

export interface TenantProfile {
  id: string;
  name: string;
  archetype: ArchetypeCode;
  plan: PlanTier;
  score: number;
  enabledModules: string[];
  autonomyLevel: number;
  fleetSize?: string;
  monthlyShipments?: string;
  geography?: string;
  customFields?: Record<string, unknown>;
}

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
  requiredModule?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// ─── Default Clean Workspace Profile ──────────────────────────────────────────
export const DEFAULT_TENANT: TenantProfile = {
  id: 'ten_primary_workspace',
  name: 'My Logistics Workspace',
  archetype: 'FLEET_OWNER',
  plan: 'GROWTH',
  score: 0,
  enabledModules: [...DEFAULT_ENABLED_MODULES],
  autonomyLevel: 2,
  fleetSize: '0',
  monthlyShipments: '0',
  geography: 'NATIONAL',
};

// ─── Full Master Navigation Taxonomy ─────────────────────────────────────────
const MASTER_NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/agent-ops', icon: Cpu, label: 'EdgePilot AI Ops', requiredModule: 'EXCEPTION_AGENT' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/orders', icon: ShoppingCart, label: 'Orders', badge: 'orders', requiredModule: 'TMS' },
      { href: '/allocation', icon: MapPin, label: 'Allocation', badge: 'allocation', requiredModule: 'ALLOCATION' },
      { href: '/warehouse', icon: Warehouse, label: 'Warehouse & Bays', requiredModule: 'WAREHOUSE' },
      { href: '/trips', icon: Navigation, label: 'Trips', requiredModule: 'TRIPS' },
    ],
  },
  {
    label: 'Delivery & billing',
    items: [
      { href: '/tracking', icon: Package, label: 'Corridor Tracking', badge: 'activeTrips', requiredModule: 'CORRIDOR_TRACKING' },
      { href: '/track', icon: Search, label: 'Customer Tracking', requiredModule: 'CUSTOMER_PORTAL' },
      { href: '/delivery', icon: PackageCheck, label: 'Delivery & POD', requiredModule: 'DELIVERY_POD' },
      { href: '/invoices', icon: FileText, label: 'Invoices & Billing', requiredModule: 'INVOICING' },
    ],
  },
  {
    label: 'Fleet & drivers',
    items: [
      { href: '/vehicles', icon: Truck, label: 'Vehicles', badge: 'vehicles', requiredModule: 'FLEET' },
      { href: '/drivers', icon: Users, label: 'Drivers', requiredModule: 'FLEET' },
    ],
  },
  {
    label: 'Sales & knowledge',
    items: [
      { href: '/leads', icon: Sparkles, label: 'Leads CRM', badge: 'leads', requiredModule: 'LEADS_CRM' },
      { href: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
    ],
  },
];

// The active workspace profile comes from GET /api/tenant/entitlements (server-side source of truth).

// ─── Dynamic Navigation Derivation ───────────────────────────────────────────
export function getTenantNavigation(tenant: TenantProfile): NavSection[] {
  const enabled = new Set(tenant.enabledModules || []);

  // Always enable core Dashboard and KB
  return MASTER_NAV_SECTIONS.map((sec) => ({
    label: sec.label,
    items: sec.items.filter((item) => {
      if (!item.requiredModule) return true;
      return enabled.has(item.requiredModule);
    }),
  })).filter((sec) => sec.items.length > 0);
}
