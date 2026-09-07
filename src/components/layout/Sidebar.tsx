'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Truck, Users, ShoppingCart, MapPin,
  Package, Navigation, PackageCheck, FileText, LogOut, Warehouse,
  LucideIcon, X, Sparkles, BookOpen
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// Ordered by Pareto principle — most-used features first (80% of daily actions)
const navItems: NavSection[] = [
  { label: 'OVERVIEW', items: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { label: 'OPERATIONS', items: [
    { href: '/orders',      icon: ShoppingCart, label: 'Orders',           badge: 'orders' },
    { href: '/allocation',  icon: MapPin,        label: 'Allocation',       badge: 'allocation' },
    { href: '/warehouse',   icon: Warehouse,     label: 'Warehouse & Bays' },
    { href: '/trips',       icon: Navigation,    label: 'Trips' },
  ]},
  { label: 'DELIVERY & BILLING', items: [
    { href: '/tracking',    icon: Package,      label: 'Live Tracking',    badge: 'activeTrips' },
    { href: '/delivery',    icon: PackageCheck, label: 'Delivery & POD' },
    { href: '/invoices',    icon: FileText,     label: 'Invoices' },
  ]},
  { label: 'FLEET & ROSTER', items: [
    { href: '/vehicles',    icon: Truck,  label: 'Vehicles',    badge: 'vehicles' },
    { href: '/drivers',     icon: Users,  label: 'Drivers' },
  ]},
  { label: 'TOOLS', items: [
    { href: '/leads',          icon: Sparkles, label: 'Shipper Leads CRM', badge: 'leads' },
    { href: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
  ]},
];
// Total: 12 items across 5 sections — DESIGN TOKENS removed from production

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, orders, trips, leads } = useStore();

  const pendingCount    = orders.filter(o => o.status === 'Pending').length;
  const activeTripsCount = trips.filter(t => t.status === 'In Transit').length;
  const newLeadsCount   = leads.filter(l => l.status === 'New').length;

  const handleLogout = () => {
    logout();
    // Peak-End Rule: end the session on a positive, reassuring note
    toast.success('Signed out securely', {
      description: 'Your session has been cleared. See you next time.',
      duration: 3000,
    });
    router.push('/login');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'drawer-open' : ''}`}>
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo-mark">
          <div className="logo-icon" style={{ fontWeight: 900, fontSize: 13, color: '#1c1917', letterSpacing: -0.5 }}>
            LF
          </div>
          <div className="logo-text">
            <div className="name">LogiFlow</div>
            <div className="sub">Fleet Intelligence LMS</div>
          </div>
        </div>

        {/* Mobile Close — Fitts's Law: min 44×44px touch target */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              // Fitts's Law: minimum 44×44px touch target
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
            }}
            className="mobile-close-btn"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(section => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              let badgeText: string | number | null = null;
              if (item.badge === 'orders'     && pendingCount > 0)     badgeText = pendingCount;
              if (item.badge === 'allocation' && pendingCount > 0)     badgeText = pendingCount;
              if (item.badge === 'activeTrips' && activeTripsCount > 0) badgeText = 'LIVE';
              if (item.badge === 'leads'      && newLeadsCount > 0)    badgeText = newLeadsCount;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`nav-item ${active ? 'active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="nav-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                  {badgeText && (
                    <span className={item.badge === 'activeTrips' ? 'nav-badge-live' : 'nav-badge'}>
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
        <button
          onClick={handleLogout}
          className="nav-item w-full"
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            // Fitts's Law: adequate touch target
            padding: '10px 12px',
            borderRadius: 8, width: '100%',
            fontSize: 13, fontWeight: 500,
          }}
        >
          <LogOut size={16} aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
