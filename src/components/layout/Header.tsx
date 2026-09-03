'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Bell, Search, Check, X, ShieldAlert, Truck, Menu,
  Package, Users, Navigation, ArrowRight, CornerDownLeft,
  LogOut, User, Building, ShieldCheck
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggleMobileMenu?: () => void;
}

export default function Header({ title, subtitle, onToggleMobileMenu }: HeaderProps) {
  const { alerts, dismissAlert, orders, vehicles, drivers, trips, currentUser, logout } = useStore();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setShowAlerts(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close search and profile menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Universal Search Matches
  const q = searchQuery.trim().toLowerCase();
  const matchedOrders = q
    ? orders.filter(o => o.id.toLowerCase().includes(q) || o.origin.toLowerCase().includes(q) || o.destination.toLowerCase().includes(q) || o.status.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const matchedVehicles = q
    ? vehicles.filter(v => v.vehicleNo.toLowerCase().includes(q) || v.type.toLowerCase().includes(q) || v.status.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const matchedDrivers = q
    ? drivers.filter(d => d.name.toLowerCase().includes(q) || d.phone.includes(q) || d.licenseNo.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const matchedTrips = q
    ? trips.filter(t => t.id.toLowerCase().includes(q) || t.origin.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const totalResults = matchedOrders.length + matchedVehicles.length + matchedDrivers.length + matchedTrips.length;

  const handleSelectResult = (url: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(url);
  };

  return (
    <header className="header">
      <div className="header-left" style={{ gap: 14 }}>
        {/* Mobile Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="mobile-menu-toggle"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu size={19} />
          </button>
        )}

        <div>
          <div className="header-title">{title}</div>
          {subtitle && (
            <div className="hide-mobile" style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="header-right" style={{ gap: 12 }}>
        {/* Universal Search Bar */}
        <div ref={searchContainerRef} style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 10px',
              width: 'clamp(120px, 18vw, 240px)',
              transition: 'all 0.2s ease',
              cursor: 'text'
            }}
            onClick={() => {
              setIsSearchOpen(true);
              searchInputRef.current?.focus();
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search fleet, orders... (Ctrl+K)"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 12,
                width: '100%',
                fontFamily: 'inherit'
              }}
            />
            {searchQuery && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Instant Search Dropdown Results */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 42,
                right: 0,
                width: 380,
                maxWidth: '90vw',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                padding: 12,
                zIndex: 1000,
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                maxHeight: 420,
                overflowY: 'auto'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                Universal Search ({totalResults} matches)
              </div>

              {totalResults === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                  No matching orders, vehicles, or drivers found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Orders Matches */}
                  {matchedOrders.map(o => (
                    <div
                      key={o.id}
                      onClick={() => handleSelectResult('/orders')}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid transparent',
                        transition: 'border-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={14} color="var(--accent)" />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{o.id}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.origin} → {o.destination}</div>
                        </div>
                      </div>
                      <span className="badge badge-yellow" style={{ fontSize: 10 }}>{o.status}</span>
                    </div>
                  ))}

                  {/* Vehicles Matches */}
                  {matchedVehicles.map(v => (
                    <div
                      key={v.id}
                      onClick={() => handleSelectResult('/vehicles')}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid transparent',
                        transition: 'border-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Truck size={14} color="#10b981" />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{v.vehicleNo}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.type} • {v.capacity.toLocaleString()} kg</div>
                        </div>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: 10 }}>{v.status}</span>
                    </div>
                  ))}

                  {/* Drivers Matches */}
                  {matchedDrivers.map(d => (
                    <div
                      key={d.id}
                      onClick={() => handleSelectResult('/drivers')}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid transparent',
                        transition: 'border-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={14} color="#38bdf8" />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.phone} • {d.licenseType}</div>
                        </div>
                      </div>
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>{d.status}</span>
                    </div>
                  ))}

                  {/* Trips Matches */}
                  {matchedTrips.map(t => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectResult('/tracking')}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid transparent',
                        transition: 'border-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Navigation size={14} color="var(--cyan)" />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{t.id}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.origin.split(' ')[0]} → {t.destination} ({t.progress}%)</div>
                        </div>
                      </div>
                      <span className="badge badge-cyan" style={{ fontSize: 10 }}>{t.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date Display */}
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }} className="hide-mobile">
          {now}
        </div>

        {/* System Radar Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 20
          }}
          title="Telematics gateway connected"
        >
          <span className="status-dot dot-green" style={{ width: 6, height: 6 }} />
          <span className="hide-mobile" style={{ fontSize: 10.5, fontWeight: 700, color: '#10b981' }}>RADAR LIVE</span>
        </div>

        {/* Notifications Alert Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="header-btn"
            style={{ position: 'relative' }}
            onClick={() => setShowAlerts(!showAlerts)}
            title="System Alerts"
          >
            <Bell size={15} />
            {alerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 7,
                  height: 7,
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px var(--accent)'
                }}
              />
            )}
          </button>

          {showAlerts && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 44,
                width: 360,
                maxWidth: '90vw',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                padding: 16,
                zIndex: 999,
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={15} color="var(--accent)" />
                  Fleet Alerts & Advisories ({alerts.length})
                </div>
                <button
                  onClick={() => setShowAlerts(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                    <Check size={24} color="#10b981" style={{ margin: '0 auto 8px' }} />
                    All fleet operations normal. No active alerts.
                  </div>
                ) : (
                  alerts.map(a => (
                    <div
                      key={a.id}
                      style={{
                        padding: 10,
                        background: 'var(--bg-tertiary)',
                        borderRadius: 8,
                        borderLeft: `3px solid ${a.severity === 'critical' ? 'var(--danger)' : a.severity === 'warning' ? 'var(--warning)' : 'var(--accent)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{a.title}</span>
                        <button
                          onClick={() => dismissAlert(a.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.35 }}>
                        {a.description}
                      </p>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {a.timestamp}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Interactive User profile & Session Control */}
        <div ref={profileContainerRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid var(--border)', cursor: 'pointer' }}
            title="Account & Security"
          >
            <div className="user-avatar">
              {currentUser?.avatar || 'PL'}
            </div>
            <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12.5, lineHeight: 1.2 }}>{currentUser?.name || 'Dispatch Admin'}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.2, marginTop: 2 }}>{currentUser?.role || 'Operations Hub'}</div>
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div
              className="card animate-fade-in"
              style={{
                position: 'absolute',
                right: 0,
                top: 48,
                width: 250,
                zIndex: 220,
                padding: 14,
                boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div className="user-avatar" style={{ width: 38, height: 38, fontSize: 13 }}>
                  {currentUser?.avatar || 'PL'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser?.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser?.email}
                  </div>
                </div>
              </div>

              <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Role:</span>
                  <span className="badge badge-yellow" style={{ fontSize: 10 }}>{currentUser?.role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Facility:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentUser?.facility}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Status:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Active Terminal</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/login');
                  }}
                  className="btn btn-ghost btn-sm w-full"
                  style={{ justifyContent: 'flex-start', fontSize: 11.5, gap: 8 }}
                >
                  <User size={13} /> Switch Operational Account
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                    router.push('/login');
                  }}
                  className="btn btn-danger btn-sm w-full"
                  style={{ justifyContent: 'center', fontSize: 11.5, gap: 8 }}
                >
                  <LogOut size={13} /> Secure Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
