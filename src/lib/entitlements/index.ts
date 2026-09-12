// ─── Composable Logistics OS: Entitlement Engine & Tenant Profiles ────────────
// Enforces module gating, role-based visibility, and provides instant reference presets.

import { LucideIcon, LayoutDashboard, Truck, Users, ShoppingCart, MapPin, Package, Navigation, PackageCheck, FileText, Warehouse, Sparkles, BookOpen, Search, Cpu } from 'lucide-react';
import { ArchetypeCode, PlanTier } from '@/lib/onboarding/scoring';

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

// ─── Reference Presets for 1-Click Testing ───────────────────────────────────
export const PRESET_TENANTS: Record<string, TenantProfile> = {
  ABC_TRANSPORT: {
    id: 'ten_abc_transport',
    name: 'ABC National Transport',
    archetype: 'FLEET_OWNER',
    plan: 'GROWTH',
    score: 28,
    enabledModules: ['FLEET', 'TMS', 'TRIPS', 'CORRIDOR_TRACKING', 'DELIVERY_POD', 'INVOICING', 'ALLOCATION', 'WAREHOUSE', 'DRIVER_AGENT'],
    autonomyLevel: 3,
    fleetSize: '26-100',
    monthlyShipments: '500-2500',
    geography: 'NATIONAL',
  },
  APEX_3PL: {
    id: 'ten_apex_3pl',
    name: 'Apex Global 3PL & Forwarding',
    archetype: '3PL_PROVIDER',
    plan: 'SCALE',
    score: 38,
    enabledModules: ['TMS', 'CORRIDOR_TRACKING', 'CUSTOMER_PORTAL', 'INVOICING', 'FREIGHT_AUDIT', 'EXCEPTION_AGENT', 'LEADS_CRM'],
    autonomyLevel: 4,
    fleetSize: '0',
    monthlyShipments: '2500-10000',
    geography: 'INTERNATIONAL',
  },
  SWIFTCITY_EXPRESS: {
    id: 'ten_swiftcity',
    name: 'SwiftCity Last-Mile Express',
    archetype: 'COURIER_LAST_MILE',
    plan: 'FLEX',
    score: 16,
    enabledModules: ['TMS', 'DRIVER_APP', 'DELIVERY_POD', 'CUSTOMER_PORTAL', 'DRIVER_AGENT'],
    autonomyLevel: 2,
    fleetSize: '6-25',
    monthlyShipments: '2500-10000',
    geography: 'LOCAL',
  },
};

// ─── Full Master Navigation Taxonomy ─────────────────────────────────────────
const MASTER_NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/agent-ops', icon: Cpu, label: 'LogiPilot AI Ops', requiredModule: 'EXCEPTION_AGENT' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { href: '/orders', icon: ShoppingCart, label: 'Orders', badge: 'orders', requiredModule: 'TMS' },
      { href: '/allocation', icon: MapPin, label: 'Allocation', badge: 'allocation', requiredModule: 'ALLOCATION' },
      { href: '/warehouse', icon: Warehouse, label: 'Warehouse & Bays', requiredModule: 'WAREHOUSE' },
      { href: '/trips', icon: Navigation, label: 'Trips', requiredModule: 'TRIPS' },
    ],
  },
  {
    label: 'DELIVERY & BILLING',
    items: [
      { href: '/tracking', icon: Package, label: 'Corridor Tracking', badge: 'activeTrips', requiredModule: 'CORRIDOR_TRACKING' },
      { href: '/track', icon: Search, label: 'Customer Tracking', requiredModule: 'CUSTOMER_PORTAL' },
      { href: '/delivery', icon: PackageCheck, label: 'Delivery & POD', requiredModule: 'DELIVERY_POD' },
      { href: '/invoices', icon: FileText, label: 'Invoices & Billing', requiredModule: 'INVOICING' },
    ],
  },
  {
    label: 'FLEET & ROSTER',
    items: [
      { href: '/vehicles', icon: Truck, label: 'Vehicles', badge: 'vehicles', requiredModule: 'FLEET' },
      { href: '/drivers', icon: Users, label: 'Drivers', requiredModule: 'FLEET' },
    ],
  },
  {
    label: 'TOOLS & CRM',
    items: [
      { href: '/leads', icon: Sparkles, label: 'Leads CRM', badge: 'leads', requiredModule: 'LEADS_CRM' },
      { href: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
    ],
  },
];

// ─── Active Tenant State Management ──────────────────────────────────────────
export function getActiveTenant(): TenantProfile {
  if (typeof window === 'undefined') {
    return PRESET_TENANTS.ABC_TRANSPORT;
  }
  try {
    const raw = localStorage.getItem('logiflow_active_tenant');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return PRESET_TENANTS.ABC_TRANSPORT;
}

export function setActiveTenant(tenant: TenantProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('logiflow_active_tenant', JSON.stringify(tenant));
    window.dispatchEvent(new CustomEvent('logiflow_tenant_changed', { detail: tenant }));
  } catch {}
}

// ─── Dynamic Navigation Derivation ───────────────────────────────────────────
export function getTenantNavigation(tenant?: TenantProfile): NavSection[] {
  const active = tenant || getActiveTenant();
  const enabled = new Set(active.enabledModules || []);

  // Always enable core Dashboard and KB
  return MASTER_NAV_SECTIONS.map((sec) => ({
    label: sec.label,
    items: sec.items.filter((item) => {
      if (!item.requiredModule) return true;
      return enabled.has(item.requiredModule);
    }),
  })).filter((sec) => sec.items.length > 0);
}

// ─── Route Entitlement Guard ─────────────────────────────────────────────────
export function isRouteAllowed(pathname: string, tenant?: TenantProfile): boolean {
  const active = tenant || getActiveTenant();
  const enabled = new Set(active.enabledModules || []);

  const routeModuleMap: Record<string, string> = {
    '/orders': 'TMS',
    '/allocation': 'ALLOCATION',
    '/warehouse': 'WAREHOUSE',
    '/trips': 'TRIPS',
    '/tracking': 'CORRIDOR_TRACKING',
    '/track': 'CUSTOMER_PORTAL',
    '/delivery': 'DELIVERY_POD',
    '/invoices': 'INVOICING',
    '/vehicles': 'FLEET',
    '/drivers': 'FLEET',
    '/leads': 'LEADS_CRM',
    '/agent-ops': 'EXCEPTION_AGENT',
  };

  const required = routeModuleMap[pathname];
  if (!required) return true;
  return enabled.has(required);
}
