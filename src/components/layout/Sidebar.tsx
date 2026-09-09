'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Truck, Users, ShoppingCart, MapPin,
  Package, Navigation, PackageCheck, FileText, LogOut, Warehouse,
  LucideIcon, X, Sparkles, BookOpen, Search
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

const navItems: NavSection[] = [
  { label: 'OVERVIEW', items: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { label: 'OPERATIONS', items: [
    { href: '/orders',     icon: ShoppingCart, label: 'Orders',           badge: 'orders' },
    { href: '/allocation', icon: MapPin,        label: 'Allocation',       badge: 'allocation' },
    { href: '/warehouse',  icon: Warehouse,     label: 'Warehouse & Bays' },
    { href: '/trips',      icon: Navigation,    label: 'Trips' },
  ]},
  { label: 'DELIVERY & BILLING', items: [
    { href: '/tracking',   icon: Package,      label: 'Live Tracking',    badge: 'activeTrips' },
    { href: '/track',      icon: Search,       label: 'Customer Tracking' },
    { href: '/delivery',   icon: PackageCheck, label: 'Delivery & POD' },
    { href: '/invoices',   icon: FileText,     label: 'Invoices' },
  ]},
  { label: 'FLEET & ROSTER', items: [
    { href: '/vehicles', icon: Truck,  label: 'Vehicles', badge: 'vehicles' },
    { href: '/drivers',  icon: Users,  label: 'Drivers' },
  ]},
  { label: 'TOOLS', items: [
    { href: '/leads',          icon: Sparkles, label: 'Leads CRM',     badge: 'leads' },
    { href: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
  ]},
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, orders, trips, leads } = useStore();

  const pendingCount     = orders.filter(o => o.status === 'Pending').length;
  const activeTripsCount = trips.filter(t => t.status === 'In Transit').length;
  const newLeadsCount    = leads.filter(l => l.status === 'New').length;

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully', {
      description: 'Your session has been cleared.',
      duration: 3000,
    });
    router.push('/login');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const getBadgeCount = (badge?: string): number => {
    if (badge === 'orders')      return pendingCount;
    if (badge === 'activeTrips') return activeTripsCount;
    if (badge === 'leads')       return newLeadsCount;
    return 0;
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`mobile-sidebar-backdrop${isOpen ? ' active' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar${isOpen ? ' drawer-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">
              <Truck size={18} color="#fff" />
            </div>
            <div className="logo-text">
              <div className="name">LogiFlow</div>
              <div className="sub">Logistics Platform</div>
            </div>
          </div>
        </div>

        {/* Close button (mobile) */}
        {isOpen && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 14,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-low)', display: 'flex', padding: 4,
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map(section => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const count = getBadgeCount(item.badge);
                const isLive = item.badge === 'activeTrips';

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    onClick={handleNavClick}
                  >
                    <Icon className="nav-icon" />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {count > 0 && (
                      <span className={isLive ? 'nav-badge-live' : 'nav-badge'}>
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              width: '100%', padding: '9px 12px', borderRadius: 8,
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-mid)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.13s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-10)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-mid)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
