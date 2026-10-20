'use client';

// Driver trip link. Before any location is read, the driver sees a short Hindi + English notice saying who
// receives it (the transporter running the trip), why, and when it stops (DPDP: the browser's permission
// prompt is not a notice). Points are queued in IndexedDB and sent in order, so tracking survives highway
// black spots; the server refuses pings once the trip is delivered or cancelled, and the page then stops.

import { useState, useEffect, useRef, useCallback, useSyncExternalStore, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle, CheckCircle2, CloudOff, Info, Languages, MapPin, MapPinOff, Radio, Square, Wifi,
} from 'lucide-react';
import { DotSpinner } from '@/components/ui/DotSpinner';
import { STRINGS, noticeText, type Lang } from './i18n';
import { enqueue, flushQueue, openPingStore, type PingStore, type QueuedPing, type SendResult } from './pingQueue';
import styles from './driver-app.module.css';

type Phase = 'idle' | 'requesting' | 'active' | 'stopped' | 'closed' | 'error';
type Delivery = { kind: 'sending' } | { kind: 'sent'; at: number } | { kind: 'queued'; n: number } | null;
type MessageKey = 'linkInvalid' | 'linkIncomplete' | 'noGps' | 'permissionDenied' | 'positionUnavailable' | 'timeout' | 'gpsError';

interface TripInfo {
  transporter: string | null;
  vehicleNo: string | null;
  origin: string;
  destination: string;
  tracking: boolean;
}

const PING_INTERVAL_MS = 5000;
const SEND_TIMEOUT_MS = 15000;
const LANG_KEY = 'le-driver-lang';
const noticeKey = (tripId: string) => `le-driver-notice:v1:${tripId}`;

// localStorage can throw (private mode, blocked storage): the page must still work without it
const saved = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* the notice is shown again next time */ }
  },
};

// Browser-only values read through useSyncExternalStore: the server render uses the fallback, and the
// browser's value replaces it after hydration without a mismatch.
const subscribeNetwork = (onChange: () => void) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};
const subscribeStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};

function DriverGpsApp() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('v') || '';
  const tripId = searchParams.get('t') || '';
  const linkToken = searchParams.get('k') || '';

  const savedLang = useSyncExternalStore(subscribeStorage, () => (saved.get(LANG_KEY) === 'en' ? 'en' : 'hi'), () => 'hi' as Lang);
  const [langChoice, setLangChoice] = useState<Lang | null>(null);
  const lang = langChoice ?? savedLang;
  const online = useSyncExternalStore(subscribeNetwork, () => navigator.onLine, () => true);
  const savedAccepted = useSyncExternalStore(subscribeStorage, () => !!tripId && !!saved.get(noticeKey(tripId)), () => false);
  const [acceptedNow, setAcceptedNow] = useState(false);
  const noticeAccepted = acceptedNow || savedAccepted;
  const [noticeChoice, setNoticeOpen] = useState<boolean | null>(null);
  const noticeOpen = noticeChoice ?? !noticeAccepted;
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<MessageKey | null>(null);
  const [gpsWarning, setGpsWarning] = useState<MessageKey | null>(null);
  const [delivery, setDelivery] = useState<Delivery>(null);
  const [dropped, setDropped] = useState(0);
  const [reading, setReading] = useState<{ speed: number; accuracy: number } | null>(null);
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [memoryOnly, setMemoryOnly] = useState(false);

  const t = STRINGS[lang];
  const storeRef = useRef<Promise<PingStore> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestRef = useRef<GeolocationPosition | null>(null);
  const flushingRef = useRef(false);
  const endedRef = useRef(false); // trip closed or link refused: take no more points

  const getStore = useCallback(() => {
    storeRef.current ??= openPingStore().then(store => {
      if (!store.persistent) setMemoryOnly(true);
      return store;
    });
    return storeRef.current;
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    watchIdRef.current = null;
    intervalRef.current = null;
  }, []);

  const send = useCallback(async (batch: QueuedPing[]): Promise<SendResult> => {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), SEND_TIMEOUT_MS);
    try {
      const res = await fetch('/api/gps/ping', {
        method: 'POST',
        signal: abort.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Driver ${linkToken}` },
        body: JSON.stringify({
          vehicleId,
          tripId,
          pings: batch.map(({ lat, lng, speedKmH, accuracy, recordedAt }) => ({ lat, lng, speedKmH, accuracy, recordedAt })),
        }),
      });
      if (res.ok) return 'ok';
      if (res.status === 409) return 'closed';
      if (res.status === 400) return 'rejected';
      if ([401, 403, 404].includes(res.status)) return 'invalid';
      return 'retry'; // 5xx, rate limits: the points stay queued
    } catch {
      return 'retry'; // no network, or the request timed out
    } finally {
      clearTimeout(timer);
    }
  }, [vehicleId, tripId, linkToken]);

  const endTracking = useCallback((status: 'closed' | 'invalid', droppedPoints: number) => {
    endedRef.current = true;
    stopWatching();
    setDropped(droppedPoints);
    setDelivery(null);
    setReading(null);
    if (status === 'closed') {
      setPhase('closed');
    } else {
      setMessage('linkInvalid');
      setPhase('error');
    }
  }, [stopWatching]);

  /** Sends whatever is queued, oldest first, and says honestly where the points are. */
  const flush = useCallback(async () => {
    if (flushingRef.current || !tripId || !linkToken) return;
    flushingRef.current = true;
    try {
      const store = await getStore();
      const queued = await store.count(tripId);
      if (queued === 0) return;
      if (!navigator.onLine) {
        setDelivery({ kind: 'queued', n: queued });
        return;
      }
      if (queued > 1) setDelivery({ kind: 'sending' }); // catching up after a gap in coverage
      const outcome = await flushQueue(store, tripId, send);
      if (outcome.status === 'sent') {
        setDelivery({ kind: 'sent', at: Date.now() });
      } else if (outcome.status === 'waiting') {
        setDelivery({ kind: 'queued', n: outcome.queued });
      } else {
        endTracking(outcome.status, outcome.dropped);
      }
    } finally {
      flushingRef.current = false;
    }
  }, [tripId, linkToken, getStore, send, endTracking]);

  const tick = useCallback(async () => {
    const pos = latestRef.current;
    if (!pos || endedRef.current) return;
    // A fix's own timestamp, unless the phone reports something absurd
    const takenAt = Math.abs(pos.timestamp - Date.now()) < 24 * 60 * 60 * 1000 ? pos.timestamp : Date.now();
    await enqueue(await getStore(), {
      tripId,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      speedKmH: pos.coords.speed === null ? undefined : pos.coords.speed * 3.6, // m/s → km/h
      accuracy: pos.coords.accuracy,
      recordedAt: new Date(takenAt).toISOString(),
    });
    await flush();
  }, [tripId, getStore, flush]);

  const startTracking = useCallback(() => {
    if (!vehicleId || !tripId || !linkToken) {
      setMessage('linkIncomplete');
      setPhase('error');
      return;
    }
    if (!('geolocation' in navigator)) {
      setMessage('noGps');
      setPhase('error');
      return;
    }
    stopWatching();
    setMessage(null);
    setGpsWarning(null);
    setPhase('requesting');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        latestRef.current = position;
        setGpsWarning(null);
        setReading({ speed: Math.round((position.coords.speed ?? 0) * 3.6), accuracy: Math.round(position.coords.accuracy) });
        setPhase(p => (p === 'requesting' ? 'active' : p));
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          stopWatching();
          setMessage('permissionDenied');
          setPhase('error');
          return;
        }
        // No fix for now (tunnel, cab roof, cold start): keep watching, it usually comes back by itself
        setGpsWarning(err.code === err.POSITION_UNAVAILABLE ? 'positionUnavailable' : err.code === err.TIMEOUT ? 'timeout' : 'gpsError');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    );
    intervalRef.current = setInterval(() => { void tick(); }, PING_INTERVAL_MS);
  }, [vehicleId, tripId, linkToken, stopWatching, tick]);

  const stopTracking = useCallback(() => {
    stopWatching();
    setPhase('stopped');
    setReading(null);
    void flush(); // points taken before Stop still go out
  }, [stopWatching, flush]);

  const acceptNotice = () => {
    setNoticeOpen(false);
    if (noticeAccepted) return;
    saved.set(noticeKey(tripId), new Date().toISOString());
    setAcceptedNow(true);
    startTracking();
  };

  const toggleLang = () => {
    const next: Lang = lang === 'hi' ? 'en' : 'hi';
    setLangChoice(next);
    saved.set(LANG_KEY, next);
  };

  // On open: who runs this trip (for the notice), whether it is still tracked, and any points left over
  useEffect(() => {
    if (!vehicleId || !tripId || !linkToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/gps/ping', { headers: { Authorization: `Driver ${linkToken}` } });
        if (cancelled) return;
        if (res.status === 401 || res.status === 404) {
          const store = await getStore();
          const leftover = await store.count(tripId);
          await store.clear(tripId);
          endTracking('invalid', leftover);
          return;
        }
        if (res.ok) {
          const info = await res.json() as TripInfo;
          if (cancelled) return;
          setTrip(info);
          if (!info.tracking) {
            const store = await getStore();
            const leftover = await store.count(tripId);
            await store.clear(tripId);
            endTracking('closed', leftover);
            return;
          }
        }
      } catch {
        // Offline on open: the notice names the transporter generically and queued points wait
      }
      if (!cancelled) await flush();
    })();
    return () => { cancelled = true; };
  }, [vehicleId, tripId, linkToken, getStore, endTracking, flush]);

  // Network comes back, or the driver returns to the page: send what was saved
  useEffect(() => {
    const goOnline = () => { void flush(); };
    const onVisible = () => { if (document.visibilityState === 'visible') void flush(); };
    window.addEventListener('online', goOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', goOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [flush]);

  // Stop the GPS when the page goes away
  useEffect(() => stopWatching, [stopWatching]);

  // Keep the screen awake while sharing (Wake Lock API, where supported)
  useEffect(() => {
    if (phase !== 'active') return;
    let wakeLock: WakeLockSentinel | null = null;
    if ('wakeLock' in navigator) {
      (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } })
        .wakeLock.request('screen').then(lock => { wakeLock = lock; }).catch(() => {});
    }
    return () => { wakeLock?.release(); };
  }, [phase]);

  // ─── What to say ────────────────────────────────────────────────────────────
  const queuedText = (n: number) => {
    const text = online ? t.queuedRetry(n) : t.queued(n);
    return memoryOnly ? `${text} ${t.queuedMemoryOnly}` : text;
  };
  let tone: 'ok' | 'warn' | 'error' | 'muted' = 'muted';
  let Icon = MapPinOff;
  let headline = t.idle;
  let detail: string | null = null;

  if (phase === 'error' && message) {
    tone = 'error'; Icon = AlertTriangle; headline = t[message];
    if (dropped > 0) detail = t.droppedOnClose(dropped);
  } else if (phase === 'closed') {
    tone = 'muted'; Icon = CheckCircle2; headline = t.tripClosed;
    if (dropped > 0) detail = t.droppedOnClose(dropped);
  } else if (phase === 'requesting') {
    tone = 'warn'; Icon = MapPin; headline = t.requesting;
  } else if (phase === 'active') {
    if (delivery?.kind === 'queued') { tone = 'warn'; Icon = CloudOff; headline = queuedText(delivery.n); }
    else if (delivery?.kind === 'sent') {
      tone = 'ok'; Icon = Radio;
      headline = t.sent(new Date(delivery.at).toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' }));
    }
    else { tone = 'ok'; Icon = Radio; headline = t.sending; }
  } else if (delivery?.kind === 'queued') {
    tone = 'warn'; Icon = CloudOff; headline = phase === 'stopped' ? t.stoppedQueued(delivery.n) : queuedText(delivery.n);
  } else if (phase === 'stopped') {
    headline = t.stopped;
  }
  if (gpsWarning && (phase === 'active' || phase === 'requesting')) detail = t[gpsWarning];

  const ended = phase === 'closed' || (phase === 'error' && message === 'linkInvalid');
  const showNotice = noticeOpen && !ended;
  const notices = (lang === 'hi' ? (['hi', 'en'] as const) : (['en', 'hi'] as const))
    .map(l => noticeText(l, { transporter: trip?.transporter ?? null, tripId: tripId || '—' }));

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.topbar}>
          <div>
            <div className={styles.brand}>LogisticsEdge</div>
            <div className={styles.brandSub}>{t.appTitle}</div>
          </div>
          <button type="button" className={styles.langButton} onClick={toggleLang} aria-label={`${t.changeLanguage}: ${STRINGS[lang === 'hi' ? 'en' : 'hi'].langName}`}>
            <Languages size={24} aria-hidden />
            {STRINGS[lang === 'hi' ? 'en' : 'hi'].langName}
          </button>
        </div>

        <section className={styles.card} aria-label={t.trip}>
          <div className={styles.tripRow}>
            <div>
              <div className={styles.label}>{t.truck}</div>
              <div className={styles.value}>{trip?.vehicleNo || vehicleId || '—'}</div>
            </div>
            <div className={styles.right}>
              <div className={styles.label}>{t.trip}</div>
              <div className={styles.value}>{tripId || '—'}</div>
            </div>
          </div>
          {trip && <div className={styles.route}>{trip.origin} → {trip.destination}</div>}
          <div className={`${styles.net} ${online ? styles.ok : styles.warn}`}>
            {online ? <Wifi size={18} aria-hidden /> : <CloudOff size={18} aria-hidden />}
            {online ? t.online : t.offline}
          </div>
        </section>

        {showNotice ? (
          <section className={styles.card} aria-labelledby="drv-notice-title">
            {notices.map((n, i) => (
              <div key={n.title} lang={i === 0 ? lang : (lang === 'hi' ? 'en' : 'hi')}>
                {i > 0 && <hr className={styles.noticeDivider} />}
                <div id={i === 0 ? 'drv-notice-title' : undefined} className={styles.noticeTitle}>{n.title}</div>
                <ul className={styles.noticeList}>
                  {n.points.map(p => <li key={p}>{p}</li>)}
                </ul>
              </div>
            ))}
            <hr className={styles.noticeDivider} />
            <button type="button" className={`${styles.bigButton} ${styles.primary}`} onClick={acceptNotice}>
              <MapPin size={28} aria-hidden />
              {noticeAccepted ? `${notices[0].ok} / ${notices[1].ok}` : `${notices[0].agree} / ${notices[1].agree}`}
            </button>
          </section>
        ) : (
          <>
            <section className={styles.card} aria-live="polite">
              <div className={styles.status}>
                <div className={`${styles.statusIcon} ${styles[tone]}`}>
                  {delivery?.kind === 'sending' && phase === 'active'
                    ? <DotSpinner size={26} color="var(--brand-on-dark)" />
                    : <Icon size={28} aria-hidden />}
                </div>
                <div>
                  <div className={`${styles.statusText} ${styles[tone]}`}>{headline}</div>
                  {detail && <div className={styles.statusSub}>{detail}</div>}
                </div>
              </div>
              {reading && phase === 'active' && (
                <div className={styles.readings}>
                  <div className={styles.reading}>
                    <div className={styles.label}>{t.speed}</div>
                    <div className={styles.readingValue}>{reading.speed}<span className={styles.readingUnit}> km/h</span></div>
                  </div>
                  <div className={styles.reading}>
                    <div className={styles.label}>{t.accuracy}</div>
                    <div className={styles.readingValue}>{reading.accuracy}<span className={styles.readingUnit}> m</span></div>
                  </div>
                </div>
              )}
            </section>

            {!ended && (phase === 'active' || phase === 'requesting' ? (
              <button type="button" className={`${styles.bigButton} ${styles.danger}`} onClick={stopTracking}>
                <Square size={28} aria-hidden />
                {t.stop}
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.bigButton} ${styles.primary}`}
                onClick={() => (noticeAccepted ? startTracking() : setNoticeOpen(true))}
              >
                <MapPin size={28} aria-hidden />
                {t.start}
              </button>
            ))}

            {!ended && (
              <ul className={styles.tips}>
                {t.tips.map(tip => <li key={tip}>{tip}</li>)}
              </ul>
            )}

            {!ended && (
              <button type="button" className={styles.linkButton} onClick={() => setNoticeOpen(true)}>
                <Info size={20} aria-hidden />
                {t.showNotice}
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function DriverGpsAppClient() {
  return (
    <Suspense fallback={
      <div className={styles.loading}>
        <DotSpinner size={36} color="var(--brand-on-dark)" />
        <span>लोड हो रहा है… / Loading…</span>
      </div>
    }>
      <DriverGpsApp />
    </Suspense>
  );
}
