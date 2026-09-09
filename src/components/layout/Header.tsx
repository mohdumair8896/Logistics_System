'use client';
import { useState } from 'react';
import { Bell, Check, X, ShieldAlert, Sparkles, Menu, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { triggerLiveAlert } from '@/lib/liveNotifications';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { User, LogOut, Settings, Shield } from 'lucide-react';


interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggleMobileMenu?: () => void;
}

export default function Header({ title, subtitle, onToggleMobileMenu }: HeaderProps) {
  const { alerts, dismissAlert, clearAllAlerts, currentUser } = useStore();
  const [showAlerts, setShowAlerts] = useState(false);
  const now = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const severityColor = (s: string) =>
    s === 'critical' ? '#334F99' : s === 'warning' ? '#3366CC' : 'var(--brand)';

  return (
    <header className="header">
      <div className="header-left">
        {/* Mobile hamburger */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="mobile-menu-btn header-btn"
            aria-label="Toggle navigation menu"
            style={{ display: 'none' }}
          >
            <Menu size={17} />
          </button>
        )}

        <div>
          <div className="header-title">{title}</div>
          {subtitle && (
            <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
      </div>

      <div className="header-right" style={{ position: 'relative' }}>
        {/* Live indicator */}
        <Link
          href="/tracking"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 99,
            background: 'var(--brand-10)', border: '1px solid var(--brand-20)',
            color: 'var(--brand)', fontSize: 10.5, fontWeight: 700,
            textDecoration: 'none', fontFamily: 'var(--font-mono)',
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span>LIVE</span>
        </Link>

        <div style={{ fontSize: 11.5, color: 'var(--text-low)' }} className="hidden-mobile">{now}</div>

        {/* Alerts dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="header-btn"
            style={{ position: 'relative' }}
            onClick={() => setShowAlerts(!showAlerts)}
            aria-label={`Alerts (${alerts.length})`}
          >
            <Bell size={15} />
            {alerts.length > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 15, height: 15, padding: '0 3px',
                background: 'var(--brand)', color: '#fff',
                fontSize: 9, fontWeight: 800, borderRadius: 99,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 6px var(--brand-glow)',
              }}>
                {alerts.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                style={{
                  position: 'absolute', right: 0, top: 42, width: 360,
                  maxWidth: '90vw', background: 'var(--surface-1)',
                  border: '1px solid var(--border)', borderRadius: 14,
                  padding: 14, zIndex: 999,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                  transformOrigin: 'top right',
                }}
              >
                {/* Dropdown header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={15} color="var(--brand)" />
                    Alerts ({alerts.length})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {alerts.length > 0 && (
                      <button
                        onClick={clearAllAlerts}
                        style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 6px', borderRadius: 4 }}
                      >
                        <Trash2 size={11} /> Clear
                      </button>
                    )}
                    <button
                      onClick={() => setShowAlerts(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', padding: 3, display: 'flex', borderRadius: 5 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Stream status */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', background: 'var(--surface-2)', borderRadius: 7,
                  marginBottom: 10, border: '1px solid var(--border)', fontSize: 11,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--brand)', fontWeight: 600 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brand)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                    Stream: Active
                  </div>
                  <button
                    onClick={() => triggerLiveAlert()}
                    style={{
                      background: 'var(--brand-10)', border: '1px solid var(--brand-20)',
                      color: 'var(--brand)', borderRadius: 5, padding: '2px 7px',
                      fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}
                  >
                    <Sparkles size={10} /> Simulate
                  </button>
                </div>

                {/* Alert list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 280, overflowY: 'auto' }}>
                  {alerts.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-low)', fontSize: 12 }}>
                      <Check size={24} color="var(--brand)" style={{ margin: '0 auto 7px' }} />
                      All systems normal. No alerts.
                    </div>
                  ) : (
                    alerts.map(a => (
                      <motion.div
                        key={a.id}
                        layout
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          padding: '9px 10px', background: 'var(--surface-2)', borderRadius: 8,
                          borderLeft: `3px solid ${severityColor(a.severity)}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-high)' }}>{a.title}</span>
                          <button
                            onClick={() => dismissAlert(a.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', padding: 2, display: 'flex' }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3, lineHeight: 1.35 }}>{a.description}</p>
                        <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 3, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{a.timestamp}</span>
                          {a.category && <span style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{a.category}</span>}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
          <div className="user-avatar">
            {currentUser?.avatar || 'OP'}
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-high)' }}>{currentUser?.name || 'Operations Admin'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-low)' }}>{currentUser?.role || 'Fleet Operations'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
