'use client';
/**
 * NotificationBell — inspired by watermelon.sh notification-2
 *
 * Compact bell icon in the header that opens a dropdown notification list.
 * Reads alerts from Zustand store and marks them read on view.
 *
 * Usage:
 *   <NotificationBell />   ← drop into Header
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/lib/store';
import type { SystemAlert } from '@/lib/store';

const SEVERITY_CONFIG: Record<SystemAlert['severity'], {
  Icon: typeof Info; color: string; bg: string;
}> = {
  critical: { Icon: XCircle,      color: 'var(--status-error)',  bg: 'var(--status-error-bg)'  },
  warning:  { Icon: AlertTriangle, color: 'var(--status-warn)',   bg: 'var(--status-warn-bg)'   },
  info:     { Icon: Info,          color: 'var(--status-active)', bg: 'var(--status-active-bg)' },
};


export function NotificationBell() {
  const { alerts } = useStore();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visible    = alerts.filter((_, i) => !dismissed.has(i));
  const unreadCount = visible.length;

  const dismiss = (i: number) => setDismissed(d => new Set(d).add(i));
  const clearAll = () => setDismissed(new Set(alerts.map((_, i) => i)));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        className="header-btn"
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{ position: 'relative' }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--brand)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--surface-1)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 320,
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              zIndex: 200,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Bell size={14} color="var(--brand)" />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-high)' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 20,
                    background: 'var(--brand)',
                    color: '#fff',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: 'var(--brand)',
                    cursor: 'pointer',
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Items */}
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              <AnimatePresence initial={false}>
                {visible.length === 0 ? (
                  <div style={{
                    padding: '32px 14px',
                    textAlign: 'center',
                    fontSize: 13,
                    color: 'var(--text-low)',
                  }}>
                    All caught up 🎉
                  </div>
                ) : (
                  alerts.map((alert, i) => {
                    if (dismissed.has(i)) return null;
                    const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
                    const Icon = cfg.Icon;
                    return (
                      <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, padding: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '11px 14px',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: cfg.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: 1,
                        }}>
                          <Icon size={14} color={cfg.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)' }}>
                            {alert.title}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>
                            {alert.description}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-xlow)', marginTop: 3 }}>
                            {alert.timestamp}
                          </div>
                        </div>
                        <button
                          onClick={() => dismiss(i)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--icon-muted)', padding: 2, flexShrink: 0,
                          }}
                          aria-label="Dismiss"
                        >
                          <X size={13} />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
