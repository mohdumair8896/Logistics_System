// ─── Analytics: consent-gated loader, funnel events, first-touch UTMs ─────────
// Nothing loads until the visitor accepts analytics in the cookie notice (components/ui/CookieConsent.tsx),
// and nothing loads at all unless an ID is configured:
//   NEXT_PUBLIC_GA_ID          Google Analytics 4 measurement ID (G-…)
//   NEXT_PUBLIC_CLARITY_ID     Microsoft Clarity project ID
//   NEXT_PUBLIC_POSTHOG_KEY    PostHog project API key (phc_…), with NEXT_PUBLIC_POSTHOG_HOST
// The script hosts are allowed in the CSP (src/proxy.ts) only when the matching ID is set.

export const CONSENT_STORAGE_KEY = 'logisticsedge_cookie_consent_v1';
export const CONSENT_EVENT = 'logisticsedge_consent_change';

export const ANALYTICS = {
  gaId: process.env.NEXT_PUBLIC_GA_ID?.trim() || '',
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID?.trim() || '',
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || '',
  posthogHost: (process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com').replace(/\/$/, ''),
};

export const analyticsConfigured = Boolean(ANALYTICS.gaId || ANALYTICS.clarityId || ANALYTICS.posthogKey);

/** The funnel we measure (docs/DESIGN_SYSTEM.md §8): quote → lead → contact */
export type FunnelEvent =
  | 'quote_started'        // first interaction with the rate calculator
  | 'quote_shown'          // an indicative price was displayed
  | 'quote_contact_opened' // "Book this load" pressed
  | 'lead_submitted'       // call-back request saved
  | 'whatsapp_clicked'
  | 'call_clicked'
  | 'cta_clicked';

type Win = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  posthog?: { init: (k: string, o: object) => void; capture: (e: string, p?: object) => void; opt_out_capturing?: () => void; opt_in_capturing?: () => void };
};

export function analyticsConsentGranted(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? Boolean(JSON.parse(raw).analytics) : false;
  } catch {
    return false;
  }
}

function addScript(src: string, onload?: () => void) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  if (onload) s.onload = onload;
  document.head.appendChild(s);
}

let loaded = false;

/** Loads whichever tools are configured. Call only after consent. */
export function loadAnalytics() {
  if (loaded || typeof window === 'undefined' || !analyticsConfigured) return;
  loaded = true;
  const w = window as Win;

  if (ANALYTICS.gaId) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() { (w.dataLayer as unknown[]).push(arguments); }; // eslint-disable-line prefer-rest-params
    w.gtag('js', new Date());
    w.gtag('config', ANALYTICS.gaId, { anonymize_ip: true });
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ANALYTICS.gaId)}`);
  }

  if (ANALYTICS.clarityId) {
    const q: unknown[] = [];
    const clarity = ((...args: unknown[]) => { q.push(args); }) as Win['clarity'] & object;
    clarity.q = q;
    w.clarity = clarity;
    addScript(`https://www.clarity.ms/tag/${encodeURIComponent(ANALYTICS.clarityId)}`);
  }

  if (ANALYTICS.posthogKey) {
    const assets = ANALYTICS.posthogHost.replace('.i.posthog.com', '-assets.i.posthog.com');
    addScript(`${assets}/static/array.js`, () => {
      w.posthog?.init(ANALYTICS.posthogKey, {
        api_host: ANALYTICS.posthogHost,
        person_profiles: 'identified_only',
        capture_pageview: true,
        persistence: 'localStorage+cookie',
      });
    });
  }
}

/** Stops sending events after consent is withdrawn (scripts already loaded stay until reload). */
export function pauseAnalytics() {
  const w = window as Win;
  w.posthog?.opt_out_capturing?.();
  if (ANALYTICS.gaId) w.gtag?.('consent', 'update', { analytics_storage: 'denied' });
}

export function track(event: FunnelEvent, props: Record<string, string | number | boolean | undefined> = {}) {
  if (typeof window === 'undefined' || !loaded || !analyticsConsentGranted()) return;
  const w = window as Win;
  w.gtag?.('event', event, props);
  w.posthog?.capture(event, props);
  w.clarity?.('event', event);
}

// ── First-touch campaign tags, sent only with a form the visitor submits ──────

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const UTM_STORAGE_KEY = 'logisticsedge_first_touch';

export type FirstTouch = Partial<Record<(typeof UTM_KEYS)[number] | 'landing' | 'referrer', string>>;

export function captureFirstTouch() {
  try {
    if (sessionStorage.getItem(UTM_STORAGE_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const touch: FirstTouch = { landing: window.location.pathname.slice(0, 100) };
    UTM_KEYS.forEach(k => { const v = params.get(k); if (v) touch[k] = v.slice(0, 100); });
    const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : '';
    if (ref) touch.referrer = ref.slice(0, 200);
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(touch));
  } catch {
    // storage blocked: attribution is simply missing
  }
}

export function firstTouch(): FirstTouch {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) || '{}') as FirstTouch;
  } catch {
    return {};
  }
}
