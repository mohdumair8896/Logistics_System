'use client';
// ─── Loads analytics after consent; records first-touch campaign tags ─────────
// Mounted once in the root layout next to the cookie notice. See src/lib/analytics.ts.

import { useEffect } from 'react';
import {
  CONSENT_EVENT, analyticsConfigured, analyticsConsentGranted, captureFirstTouch, loadAnalytics, pauseAnalytics,
} from '@/lib/analytics';

export function AnalyticsLoader() {
  useEffect(() => {
    captureFirstTouch();
    if (!analyticsConfigured) return;
    if (analyticsConsentGranted()) loadAnalytics();
    const onChange = (e: Event) => {
      const analytics = (e as CustomEvent<{ analytics?: boolean }>).detail?.analytics;
      if (analytics) loadAnalytics();
      else pauseAnalytics();
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);
  return null;
}
