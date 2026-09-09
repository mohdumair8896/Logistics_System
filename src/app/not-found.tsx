import React from 'react';
import Link from 'next/link';
import { Home, Search, Truck, Radio } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Route Diverted | LogiFlow Logistics',
  description: 'The requested manifest, telemetry node, or waybill page was not found on the LogiFlow logistics network.',
};

export default function NotFound() {
  return (
    <div style={{
      background: '#020617',
      color: '#f8fafc',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, rgba(34,211,238,0.04) 50%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 600,
        width: '100%',
        textAlign: 'center',
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 28,
        padding: 'clamp(32px, 5vw, 56px)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        
        {/* Radar / Lost Signal Badge */}
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
          <div style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: 'rgba(245,158,11,0.15)',
            filter: 'blur(12px)',
          }} />
          <div style={{
            position: 'relative',
            width: 80,
            height: 80,
            borderRadius: 24,
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Radio style={{ width: 36, height: 36, color: '#fbbf24', animation: 'pulse 2s infinite' }} />
          </div>
        </div>

        {/* Error Code & Title */}
        <div style={{
          display: 'inline-block',
          fontSize: 12,
          fontFamily: 'monospace',
          fontWeight: 700,
          color: '#fbbf24',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 12,
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.25)',
          padding: '4px 14px',
          borderRadius: 99,
        }}>
          Status Code: 404 &bull; GPS Signal Lost
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 38px)',
          fontWeight: 900,
          letterSpacing: -1,
          color: '#fff',
          margin: '0 0 16px',
        }}>
          Route Diverted or Waybill Missing
        </h1>

        <p style={{
          fontSize: 15,
          color: '#94a3b8',
          lineHeight: 1.7,
          margin: '0 0 36px',
        }}>
          The coordinate or dispatch manifest you are navigating to does not exist on our corridor network. The trailer may have been rerouted or the link is expired.
        </p>

        {/* Quick Recovery Navigation Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '14px 24px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#1c1917',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 0 25px rgba(245,158,11,0.25)',
              transition: 'transform 0.15s',
            }}
          >
            <Home style={{ width: 18, height: 18 }} />
            Return to Logistics Command Hub
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            <Link
              href="/tracking"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Search style={{ width: 15, height: 15, color: '#38bdf8' }} />
              Live Tracker
            </Link>

            <Link
              href="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Truck style={{ width: 15, height: 15, color: '#fbbf24' }} />
              Operations Center
            </Link>
          </div>
        </div>

      </div>

      {/* Footer hint */}
      <div style={{ marginTop: 32, fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
        LogiFlow Autonomous Mesh Gateway &bull; Node ID #ERR-404-GEO
      </div>
    </div>
  );
}
