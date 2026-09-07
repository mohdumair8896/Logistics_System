/**
 * LogiFlow Privacy-First Telemetry & Analytics Tracker
 * Respects User Cookie Preferences and GDPR/CCPA directives
 */

export interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'logiflow_cookie_consent_v1';

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed.acceptedAll || parsed.analytics);
  } catch {
    return false;
  }
}

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  // Always log in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.debug('[LogiFlow Telemetry]', event);
  }

  // Check consent before forwarding to external providers (GA4, Plausible, etc.)
  if (!hasAnalyticsConsent()) {
    return;
  }

  // Forward to gtag if present
  if (typeof window !== 'undefined' && 'gtag' in window && typeof (window as unknown as { gtag: (...args: unknown[]) => void }).gtag === 'function') {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', event.action, {
      event_category: event.category || 'general',
      event_label: event.label,
      value: event.value,
      ...event.metadata,
    });
  }

  // Dispatch custom DOM event for any embedded observers
  window.dispatchEvent(new CustomEvent('logiflow_metric', { detail: event }));
}

export function trackPageView(url: string): void {
  trackEvent({
    action: 'page_view',
    category: 'navigation',
    label: url,
    metadata: {
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      timestamp: Date.now(),
    },
  });
}
