'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Cookie, X, Check, SlidersHorizontal } from 'lucide-react';

import { CONSENT_EVENT, CONSENT_STORAGE_KEY as STORAGE_KEY } from '@/lib/analytics';

const emptySubscribe = () => () => {};

export default function CookieConsent() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  // GDPR: analytics must default to FALSE (opt-in, not opt-out)
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
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
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, {
        detail: { acceptedAll, analytics }
      }));
    } catch {
      // Ignore storage failures (private browsing)
    }
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  // A small, non-blocking notice (not a modal): both choices carry equal weight.
  return (
    <aside role="region" aria-label="Cookie preferences" className="cookie-notice">
      <div className="cookie-notice-head">
        <Cookie size={16} aria-hidden="true" />
        <h2>Cookies</h2>
        <button type="button" onClick={() => saveConsent(false, false)} aria-label="Close and keep essential cookies only" className="cookie-notice-close">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <p>
        We use essential cookies to keep you signed in. Optional analytics help us improve the product.{' '}
        <Link href="/cookies">Cookie policy</Link> · <Link href="/privacy">Privacy</Link>
      </p>

      {showPreferences && (
        <label className="cookie-notice-pref">
          <input type="checkbox" checked={analyticsConsent} onChange={e => setAnalyticsConsent(e.target.checked)} />
          <span>Allow analytics cookies</span>
        </label>
      )}

      <div className="cookie-notice-actions">
        {showPreferences ? (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => saveConsent(false, analyticsConsent)}>
            <Check size={14} aria-hidden="true" /> Save choice
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPreferences(true)}>
              <SlidersHorizontal size={14} aria-hidden="true" /> Choose
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => saveConsent(false, false)}>Essential only</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => saveConsent(true, true)}>Accept all</button>
          </>
        )}
      </div>
    </aside>
  );
}
