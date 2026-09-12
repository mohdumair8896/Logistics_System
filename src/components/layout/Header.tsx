'use client';
import { useState } from 'react';
import { Bell, Check, X, ShieldAlert, Menu, Trash2, Bug, Sliders } from 'lucide-react';
import { useSystemAlerts } from '@/lib/liveNotifications';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ExpandableSearch } from '@/components/ui/ExpandableSearch';
import { DotPulse } from '@/components/ui/DotPulse';
import { AccountDropdown } from '@/components/layout/AccountDropdown';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { BugReportForm } from '@/components/forms/BugReportForm';
import { FormRhfCheckbox } from '@/components/forms/FormRhfCheckbox';

import { TenantSwitcher } from '@/components/layout/TenantSwitcher';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggleMobileMenu?: () => void;
}

export default function Header({
  title,
  subtitle,
  onToggleMobileMenu,
}: HeaderProps) {
  const { alerts, dismissAlert, clearAll } = useSystemAlerts(30000);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const now = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const severityColor = (s: string) =>
    s === 'critical' ? 'var(--status-error, #DC2626)' : s === 'warning' ? 'var(--status-warn, #D97706)' : 'var(--brand)';

  return (
    <header className="header">
      <div className="header-left flex items-center gap-3">
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

        <div className="hidden sm:block ml-2">
          <TenantSwitcher />
        </div>
      </div>

      <div className="header-right" style={{ position: 'relative' }}>
        {/* Quick global waybill lookup */}
        <ExpandableSearch placeholder="Lookup waybill / trip..." />

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
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block', animation: 'dotPulse 1.4s infinite ease-in-out' }} />
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
                        onClick={clearAll}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--brand)', fontWeight: 600 }}>
                    <DotPulse size={4} color="var(--brand)" />
                    <span>Stream: Live</span>
                  </div>

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

        {/* Quick Bug Report */}
        <button
          className="header-btn"
          title="Report Bug (React Hook Form + Zod)"
          onClick={() => setShowBugModal(true)}
          aria-label="Report Bug"
        >
          <Bug size={15} />
        </button>

        {/* Quick Notification Preferences */}
        <button
          className="header-btn"
          title="Notification Preferences (RHF Checkbox)"
          onClick={() => setShowPrefsModal(true)}
          aria-label="Notification Preferences"
        >
          <Sliders size={15} />
        </button>

        {/* Interactive Account & Role Switcher */}
        <div style={{ paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
          <AccountDropdown />
        </div>
      </div>

      {/* Bug Report Modal */}
      {showBugModal && (
        <ModalPortal>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setShowBugModal(false)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowBugModal(false)}
                className="modal-close-btn"
                style={{
                  position: 'absolute', top: 14, right: 14,
                  zIndex: 10,
                }}
                aria-label="Close Bug Report Modal"
              >
                <X size={16} />
              </button>
              <BugReportForm />
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Notification Preferences Modal */}
      {showPrefsModal && (
        <ModalPortal>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setShowPrefsModal(false)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowPrefsModal(false)}
                className="modal-close-btn"
                style={{
                  position: 'absolute', top: 14, right: 14,
                  zIndex: 10,
                }}
                aria-label="Close Notification Preferences Modal"
              >
                <X size={16} />
              </button>
              <FormRhfCheckbox />
            </div>
          </div>
        </ModalPortal>
      )}
    </header>
  );
}
