'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { DotSpinner } from '@/components/ui/DotSpinner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PingStatus {
  lat: number;
  lng: number;
  speed: number;
  accuracy: number;
  lastPing: string;
  pingCount: number;
}

// ─── Main Client Component ─────────────────────────────────────────────────────
function DriverGpsApp() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('v') || '';
  const tripId = searchParams.get('t') || '';

  const [status, setStatus] = useState<'idle' | 'requesting' | 'active' | 'error' | 'stopped'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [pingStatus, setPingStatus] = useState<PingStatus | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestPositionRef = useRef<GeolocationPosition | null>(null);

  // Send a GPS ping to the server
  const sendPing = useCallback(async (position: GeolocationPosition) => {
    const { latitude, longitude, speed, accuracy } = position.coords;
    const speedKmH = speed ? speed * 3.6 : 0; // m/s → km/h

    try {
      await fetch('/api/gps/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          tripId: tripId || undefined,
          lat: latitude,
          lng: longitude,
          speedKmH: Math.round(speedKmH * 10) / 10,
          accuracy,
        }),
      });

      const pingTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setPingStatus(prev => ({
        lat: latitude,
        lng: longitude,
        speed: Math.round(speedKmH),
        accuracy: Math.round(accuracy),
        lastPing: pingTime,
        pingCount: (prev?.pingCount ?? 0) + 1,
      }));
    } catch (err) {
      console.warn('[DriverGPS] Ping transmission failed (will retry on next interval):', err);
    }
  }, [vehicleId, tripId]);

  const startTracking = useCallback(() => {
    if (!vehicleId) {
      setErrorMsg('No vehicle ID. Ask your dispatcher to share the correct link.');
      setStatus('error');
      return;
    }

    if (!navigator.geolocation) {
      setErrorMsg('Your browser or device does not support GPS. Please use Chrome or Safari.');
      setStatus('error');
      return;
    }

    setStatus('requesting');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        latestPositionRef.current = position;
        setStatus('active');
        setPingStatus(prev => ({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: Math.round((position.coords.speed ?? 0) * 3.6),
          accuracy: Math.round(position.coords.accuracy),
          lastPing: prev?.lastPing ?? '--',
          pingCount: prev?.pingCount ?? 0,
        }));
      },
      (err) => {
        setStatus('error');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErrorMsg('GPS permission denied. Please allow location access in your browser settings and try again.');
            break;
          case err.POSITION_UNAVAILABLE:
            setErrorMsg('GPS signal unavailable. Please move to an open area and try again.');
            break;
          case err.TIMEOUT:
            setErrorMsg('GPS timed out. Please check your location settings and try again.');
            break;
          default:
            setErrorMsg('GPS error. Please try again.');
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    // Send pings every 5 seconds
    pingIntervalRef.current = setInterval(() => {
      if (latestPositionRef.current) {
        sendPing(latestPositionRef.current);
      }
    }, 5000);
  }, [vehicleId, sendPing]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    setStatus('stopped');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, []);

  // Keep screen awake using Wake Lock API (if supported)
  useEffect(() => {
    if (status !== 'active') return;
    let wakeLock: WakeLockSentinel | null = null;
    if ('wakeLock' in navigator) {
      (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } })
        .wakeLock.request('screen').then(lock => { wakeLock = lock; }).catch(() => {});
    }
    return () => { wakeLock?.release(); };
  }, [status]);

  const statusColor = status === 'active' ? '#22c55e' : status === 'error' ? '#ef4444' : status === 'stopped' ? '#f59e0b' : '#3b82f6';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1b3e 50%, #0a1628 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '32px 20px',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: '#fff' }}>
          🚛 LogisticsEdge
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Driver GPS App
        </div>
      </div>

      {/* Vehicle info card */}
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '16px 20px',
        width: '100%',
        maxWidth: 360,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Vehicle</div>
            <div style={{ fontWeight: 700, fontSize: 20, fontFamily: 'monospace', color: '#60a5fa' }}>
              {vehicleId || '—'}
            </div>
          </div>
          {tripId && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Trip</div>
              <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace', color: '#93c5fd' }}>
                {tripId}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status card */}
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${statusColor}40`,
        borderRadius: 16,
        padding: '20px',
        width: '100%',
        maxWidth: 360,
        marginBottom: 24,
        textAlign: 'center',
      }}>
        {/* Animated status dot */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 12px ${statusColor}`,
            animation: status === 'active' ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: statusColor, textTransform: 'uppercase', letterSpacing: 1 }}>
            {status === 'idle' && 'Ready'}
            {status === 'requesting' && 'Acquiring GPS...'}
            {status === 'active' && 'Transmitting Live'}
            {status === 'error' && 'Error'}
            {status === 'stopped' && 'Stopped'}
          </span>
        </div>

        {status === 'error' && (
          <p style={{ fontSize: 13, color: '#fca5a5', marginBottom: 12, lineHeight: 1.5 }}>{errorMsg}</p>
        )}

        {pingStatus && status === 'active' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Speed</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{pingStatus.speed}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}> km/h</span></div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Accuracy</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{pingStatus.accuracy}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}> m</span></div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Latitude</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace' }}>{pingStatus.lat.toFixed(6)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Longitude</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace' }}>{pingStatus.lng.toFixed(6)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px', gridColumn: 'span 2' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Last Ping Sent</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}>{pingStatus.lastPing || '--'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      {status !== 'active' ? (
        <button
          onClick={startTracking}
          disabled={status === 'requesting'}
          style={{
            width: '100%',
            maxWidth: 360,
            padding: '18px',
            borderRadius: 16,
            border: 'none',
            background: status === 'requesting'
              ? 'rgba(255,255,255,0.1)'
              : 'linear-gradient(135deg, #0057FF, #0040CC)',
            color: '#fff',
            fontSize: 17,
            fontWeight: 800,
            cursor: status === 'requesting' ? 'not-allowed' : 'pointer',
            letterSpacing: 0.3,
            boxShadow: status !== 'requesting' ? '0 8px 32px rgba(0,87,255,0.45)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {status === 'requesting' ? '⌛ Acquiring GPS...' : '📍 Start GPS Tracking'}
        </button>
      ) : (
        <button
          onClick={stopTracking}
          style={{
            width: '100%',
            maxWidth: 360,
            padding: '18px',
            borderRadius: 16,
            border: '2px solid #ef4444',
            background: 'transparent',
            color: '#ef4444',
            fontSize: 17,
            fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: 0.3,
            transition: 'all 0.2s',
          }}
        >
          ⏹ Stop Tracking
        </button>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: 28, width: '100%', maxWidth: 360,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          <b style={{ color: 'rgba(255,255,255,0.7)' }}>Instructions:</b><br />
          1. Keep this page open while driving<br />
          2. Allow location permission when asked<br />
          3. Your GPS updates dispatch every 5 seconds<br />
          4. Keep your screen on (do not lock phone)<br />
          5. Use passenger wifi or mobile data
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        LogisticsEdge Fleet Operations • GPS pings every 5s
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export default function DriverGpsAppClient() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 14 }}>
        <DotSpinner size={36} color="var(--brand, #0057FF)" />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Initializing driver GPS telematics…</span>
      </div>
    }>
      <DriverGpsApp />
    </Suspense>
  );
}
