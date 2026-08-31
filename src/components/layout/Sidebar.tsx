'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Truck, Users, ShoppingCart, MapPin,
  Package, Navigation, PackageCheck, FileText, LogOut, Warehouse,
  ShieldCheck, Palette, LucideIcon
} from 'lucide-react';
import { useStore } from '@/lib/store';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
  countKey?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navItems: NavSection[] = [
  { label: 'OVERVIEW', items: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { label: 'FLEET & ROSTER', items: [
    { href: '/vehicles', icon: Truck, label: 'Vehicles', countKey: 'vehicles' },
    { href: '/drivers', icon: Users, label: 'Drivers', countKey: 'drivers' },
  ]},
  { label: 'OPERATIONS', items: [
    { href: '/orders', icon: ShoppingCart, label: 'Orders', badge: 'orders' },
    { href: '/allocation', icon: MapPin, label: 'Allocation', badge: 'allocation' },
    { href: '/warehouse', icon: Warehouse, label: 'Warehouse & Bays' },
    { href: '/trips', icon: Navigation, label: 'Trips' },
  ]},
  { label: 'DELIVERY & BILLING', items: [
    { href: '/tracking', icon: Package, label: 'Live Tracking', badge: 'activeTrips' },
    { href: '/delivery', icon: PackageCheck, label: 'Delivery & POD' },
    { href: '/invoices', icon: FileText, label: 'Invoices' },
  ]},
  { label: 'DESIGN TOKENS', items: [
    { href: '/design-system', icon: Palette, label: 'Design System' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, orders, trips } = useStore();

  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const activeTripsCount = trips.filter(t => t.status === 'In Transit').length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">
            <Truck size={20} color="white" />
          </div>
          <div className="logo-text">
            <div className="name">Precision Logistics</div>
            <div className="sub">Fleet Intelligence LMS</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(section => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              let badgeText: string | number | null = null;
              if (item.badge === 'orders' && pendingCount > 0) badgeText = pendingCount;
              if (item.badge === 'allocation' && pendingCount > 0) badgeText = pendingCount;
              if (item.badge === 'activeTrips' && activeTripsCount > 0) badgeText = 'LIVE';

              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                  {badgeText && (
                    <span className="nav-badge" style={{ background: item.badge === 'activeTrips' ? '#06b6d4' : '#3b82f6' }}>
                      {badgeText}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ padding: '8px 12px', marginBottom: 8, background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={14} color="#34d399" />
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>System Live</span> • MVP Mode
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item w-full" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, width: '100%', fontSize: 13, fontWeight: 500 }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
