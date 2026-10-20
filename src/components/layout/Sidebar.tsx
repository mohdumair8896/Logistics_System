'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut, X, PanelLeftClose, PanelLeftOpen, UserCog
} from 'lucide-react';
import { invalidateUserCache, useCurrentUser } from '@/lib/useCurrentUser';
import { can } from '@/lib/permissions';
import { BrandMark } from '@/components/ui/BrandMark';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/Tooltip';

import { DEFAULT_TENANT, getTenantNavigation, TenantProfile, type NavSection } from '@/lib/entitlements';

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
  const [activeTenant, setActiveTenant] = useState<TenantProfile>(DEFAULT_TENANT);
  const [navCounts, setNavCounts] = useState({ pendingOrders: 0, activeTrips: 0, newLeads: 0 });

  // Module entitlements come from the server for the signed-in workspace
  useEffect(() => {
    let cancelled = false;
    fetch('/api/tenant/entitlements')
      .then(res => (res.ok ? res.json() : null))
      .then((profile: Partial<TenantProfile> | null) => {
        if (!cancelled && profile) setActiveTenant(prev => ({ ...prev, ...profile }));
      })
      .catch(() => {});
    try { localStorage.removeItem('logisticsedge_active_tenant'); } catch {}
    return () => { cancelled = true; };
  }, []);

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

  const { user } = useCurrentUser();
  const workspaceSection: NavSection[] = can(user.role, 'team.manage')
    ? [{ label: 'Workspace', items: [{ href: '/settings/team', icon: UserCog, label: 'Team & Roles' }] }]
    : [];
  const navSections = [...getTenantNavigation(activeTenant), ...workspaceSection];

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
            <BrandMark size={32} />
            {!isCollapsed && (
              <div className="logo-text">
                <div className="name truncate max-w-[130px]">{activeTenant.name || 'LogisticsEdge'}</div>
                <div className="sub truncate max-w-[130px]">{activeTenant.plan} · {activeTenant.archetype?.replace('_', ' ') || 'Platform'}</div>
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
              color: 'var(--asphalt-text)', display: 'flex', padding: 4,
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map(section => (
            <div key={section.label} className="nav-section">
              {!isCollapsed && <div className="nav-section-label">{section.label}</div>}
              {isCollapsed && <div className="my-2 mx-auto w-7 h-px bg-[var(--asphalt-3)]" />}
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
                  className="sidebar-signout"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </Tooltip>
            </div>
          ) : (
            <button onClick={handleLogout} className="sidebar-signout"
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
