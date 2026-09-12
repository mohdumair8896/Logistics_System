'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Truck, Users, ShoppingCart, MapPin,
  Package, Navigation, PackageCheck, FileText, LogOut, Warehouse,
  LucideIcon, X, Sparkles, BookOpen, Search, Cpu,  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { invalidateUserCache } from '@/lib/useCurrentUser';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/Tooltip';

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
    { href: '/agent-ops', icon: Cpu, label: 'LogiPilot AI Ops' },
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [navCounts, setNavCounts] = useState({ pendingOrders: 0, activeTrips: 0, newLeads: 0 });

  useEffect(() => {
    let isCancelled = false;
    async function loadCounts() {
      try {
        const res = await fetch('/api/nav-counts');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) setNavCounts(data);
        }
      } catch {}
    }
    loadCounts();
    const interval = setInterval(loadCounts, 20000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  const pendingCount     = navCounts.pendingOrders;
  const activeTripsCount = navCounts.activeTrips;
  const newLeadsCount    = navCounts.newLeads;

  const handleLogout = async () => {
    invalidateUserCache();
    await fetch('/api/auth/logout', { method: 'POST' });
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

      <aside className={`sidebar${isOpen ? ' drawer-open' : ''}${isCollapsed ? ' collapsed' : ''}`}>
        {/* Rail Collapse Toggle Button on the Dividing Line */}
        {onToggleCollapse && (
          <Tooltip
            placement="right"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            description="Shortcut: ⌘B"
          >
            <button
              type="button"
              onClick={onToggleCollapse}
              className="sidebar-edge-toggle"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
            </button>
          </Tooltip>
        )}

        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/dashboard" className="logo-mark flex items-center gap-2.5 text-inherit no-underline">
            <div className="logo-icon">
              <Truck size={18} color="#fff" />
            </div>
            {!isCollapsed && (
              <div className="logo-text">
                <div className="name">LogiFlow</div>
                <div className="sub">Logistics Platform</div>
              </div>
            )}
          </Link>
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
            <div key={section.label} className="nav-section">
              {!isCollapsed && <div className="nav-section-label">{section.label}</div>}
              {isCollapsed && <div className="my-2 mx-auto w-7 h-px bg-[var(--border,#E6E4DF)]" />}
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const count = getBadgeCount(item.badge);
                const isLive = item.badge === 'activeTrips';

                const navLink = (
                  <Link
                    href={item.href}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    onClick={handleNavClick}
                    title={isCollapsed ? item.label : undefined}
                    aria-label={item.label}
                  >
                    <Icon className="nav-icon" />
                    {!isCollapsed && <span className="nav-label" style={{ flex: 1 }}>{item.label}</span>}
                    {count > 0 && (
                      <span className={isLive ? 'nav-badge-live' : 'nav-badge'}>
                        {count}
                      </span>
                    )}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <div key={item.href} className="nav-item-wrapper-collapsed flex justify-center w-full my-1">
                      <Tooltip
                        placement="right"
                        title={item.label}
                        description={count > 0 ? `${count} active` : undefined}
                      >
                        {navLink}
                      </Tooltip>
                    </div>
                  );
                }

                return <div key={item.href}>{navLink}</div>;
              })}
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="sidebar-footer">
          {isCollapsed ? (
            <div className="flex justify-center w-full">
              <Tooltip placement="right" title="Sign Out" description="End active session">
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '44px', height: '44px', borderRadius: 10,
                    background: 'none', border: '1px solid var(--border)',
                    color: 'var(--text-mid)', cursor: 'pointer', transition: 'all 0.13s',
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
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </Tooltip>
            </div>
          ) : (
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
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
