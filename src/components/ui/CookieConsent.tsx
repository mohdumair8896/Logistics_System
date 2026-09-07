'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie, X, Check, SlidersHorizontal } from 'lucide-react';

const STORAGE_KEY = 'logiflow_cookie_consent_v1';

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  // GDPR: analytics must default to FALSE (opt-in, not opt-out)
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage may be blocked in private browsing
    }
  }, []);

  const saveConsent = (acceptedAll: boolean, analytics: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        acceptedAll,
        analytics,
        timestamp: new Date().toISOString(),
        version: 'v1',
      }));
      // Dispatch event so analytics can initialize or shut down accordingly
      window.dispatchEvent(new CustomEvent('logiflow_consent_change', {
        detail: { acceptedAll, analytics }
      }));
    } catch {
      // Ignore storage failures (private browsing)
    }
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent preferences"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        left: 24,
        maxWidth: 540,
        marginLeft: 'auto',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 25px rgba(245,158,11,0.1)',
        borderRadius: 20,
        padding: 24,
        color: '#f8fafc',
        fontFamily: 'var(--font-geist-sans, sans-serif)',
        animation: 'fadeInUp 0.4s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Cookie style={{ width: 20, height: 20, color: '#fbbf24' }} aria-hidden="true" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#fff', letterSpacing: -0.3 }}>
              Privacy &amp; Cookie Preferences
            </h2>
            <button
              onClick={() => saveConsent(false, false)}
              aria-label="Decline non-essential cookies and close"
              style={{
                background: 'transparent', border: 'none', color: '#a8b8c8',
                cursor: 'pointer', padding: 4, display: 'flex',
              }}
            >
              <X style={{ width: 18, height: 18 }} aria-hidden="true" />
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#a8b8c8', margin: '8px 0 0', lineHeight: 1.6 }}>
            We use strictly necessary cookies to keep the platform secure. Optional analytics cookies help us improve performance — your choice.{' '}
            <Link href="/cookies" style={{ color: '#fbbf24', textDecoration: 'underline' }}>
              Cookie Policy
            </Link>{' '}·{' '}
            <Link href="/privacy" style={{ color: '#fbbf24', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Preferences panel */}
      {showPreferences && (
        <div style={{
          background: 'rgba(2,6,23,0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 16,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Essential — always on */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Essential</span>
              <p style={{ fontSize: 11, color: '#a8b8c8', margin: '2px 0 0' }}>
                Required for authentication and security (session cookie). Cannot be disabled.
              </p>
            </div>
            <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>
              ALWAYS ON
            </span>
          </div>

          {/* Analytics — opt-in */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
            <label
              htmlFor="analytics-consent-toggle"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', gap: 16 }}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Analytics (Optional)</span>
                <p style={{ fontSize: 11, color: '#a8b8c8', margin: '2px 0 0' }}>
                  Privacy-first, cookieless page analytics (Plausible). No personal data stored. Off by default.
                </p>
              </div>
              <input
                id="analytics-consent-toggle"
                type="checkbox"
                checked={analyticsConsent}
                onChange={e => setAnalyticsConsent(e.target.checked)}
                aria-label="Allow analytics cookies"
                style={{ width: 18, height: 18, accentColor: '#f59e0b', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          aria-expanded={showPreferences}
          aria-controls="cookie-preferences-panel"
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            color: '#cbd5e1', borderRadius: 10, padding: '8px 14px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <SlidersHorizontal style={{ width: 14, height: 14 }} aria-hidden="true" />
          {showPreferences ? 'Hide Options' : 'Customize'}
        </button>

        <button
          onClick={() => saveConsent(false, false)}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#cbd5e1', borderRadius: 10, padding: '8px 16px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Essential Only
        </button>

        <button
          onClick={() => saveConsent(true, showPreferences ? analyticsConsent : true)}
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none', color: '#1c1917', borderRadius: 10,
            padding: '8px 18px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 0 15px rgba(245,158,11,0.25)',
          }}
        >
          <Check style={{ width: 14, height: 14 }} aria-hidden="true" />
          Accept All
        </button>
      </div>
    </aside>
  );
}
