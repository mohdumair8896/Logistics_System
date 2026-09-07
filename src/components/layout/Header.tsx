'use client';
import { useState } from 'react';
import { Bell, AlertTriangle, Check, X, ShieldAlert, Truck } from 'lucide-react';
import { useStore } from '@/lib/store';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggleMobileMenu?: () => void;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { alerts, dismissAlert, orders } = useStore();
  const [showAlerts, setShowAlerts] = useState(false);
  const now = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  return (
    <header className="header">
      <div className="header-left">
        <div>
          <div className="header-title">{title}</div>
          {subtitle && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>

      <div className="header-right" style={{ position: 'relative' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 6 }}>{now}</div>

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
              <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 6px #ef4444' }} />
            )}
          </button>

          {showAlerts && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 44,
              width: 360,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: 12,
              padding: 16,
              zIndex: 999,
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={15} color="#f59e0b" />
                  Alerts ({alerts.length})
                </div>
                <button
                  onClick={() => setShowAlerts(false)}
                  aria-label="Close alerts panel"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 8px', minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                {/* Serial Position: newest alerts first */}
                {alerts.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                    <Check size={24} color="#10b981" style={{ margin: '0 auto 8px' }} />
                    All fleet operations normal. No active alerts.
                  </div>
                ) : (
                  [...alerts].sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)).map(a => (
                    <div key={a.id} style={{
                      padding: 10,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 8,
                      borderLeft: `3px solid ${a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#3b82f6'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{a.title}</span>
                        <button
                          onClick={() => dismissAlert(a.id)}
                          aria-label={`Dismiss alert: ${a.title}`}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 8px', minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.35 }}>{a.description}</p>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{a.timestamp}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #2a5c9a, #1a2b3c)', border: '1px solid rgba(59,130,246,0.3)', width: 32, height: 32, fontSize: 12 }}>
            PL
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Dispatch Admin</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Operations Hub</div>
          </div>
        </div>
      </div>
    </header>
  );
}
