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
      background: 'var(--surface, #F8F7F4)',
      color: 'var(--text-high, #141414)',
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
        background: 'radial-gradient(circle, rgba(0, 87, 255, 0.05) 0%, rgba(0, 87, 255, 0.02) 50%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 580,
        width: '100%',
        textAlign: 'center',
        background: 'var(--surface-1, #FFFFFF)',
        border: '1px solid var(--border, #E6E4DF)',
        borderRadius: 24,
        padding: 'clamp(32px, 5vw, 52px)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
      }}>
        
        {/* Radar / Lost Signal Badge */}
        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 20px' }}>
          <div style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            background: 'rgba(0, 87, 255, 0.12)',
            filter: 'blur(10px)',
          }} />
          <div style={{
            position: 'relative',
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'rgba(0, 87, 255, 0.08)',
            border: '1px solid rgba(0, 87, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Radio style={{ width: 32, height: 32, color: 'var(--brand, #0057FF)', animation: 'pulse 2s infinite' }} />
          </div>
        </div>

        {/* Error Code & Title */}
        <div style={{
          display: 'inline-block',
          fontSize: 12,
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: 700,
          color: 'var(--brand, #0057FF)',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 12,
          background: 'rgba(0, 87, 255, 0.08)',
          border: '1px solid rgba(0, 87, 255, 0.2)',
          padding: '4px 14px',
          borderRadius: 99,
        }}>
          Status Code: 404 &bull; GPS Signal Lost
        </div>

        <h1 style={{
          fontSize: 'clamp(26px, 4vw, 34px)',
          fontWeight: 900,
          letterSpacing: -1,
          color: 'var(--text-high, #141414)',
          margin: '0 0 14px',
        }}>
          Route Diverted or Waybill Missing
        </h1>

        <p style={{
          fontSize: 15,
          color: 'var(--text-mid, #525252)',
          lineHeight: 1.7,
          margin: '0 0 32px',
        }}>
          The coordinate or dispatch manifest you are navigating to does not exist on our corridor network. The trailer may have been rerouted or the link has expired.
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
              padding: '13px 24px',
              borderRadius: 12,
              background: 'var(--brand, #0057FF)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0, 87, 255, 0.25)',
              transition: 'opacity 0.15s',
            }}
          >
            <Home style={{ width: 18, height: 18 }} />
            Return to Logistics Command Hub
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            <Link
              href="/track"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 12,
                background: 'var(--surface-2, #F3F2EF)',
                border: '1px solid var(--border, #E6E4DF)',
                color: 'var(--text-high, #141414)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Search style={{ width: 15, height: 15, color: 'var(--brand, #0057FF)' }} />
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
                background: 'var(--surface-2, #F3F2EF)',
                border: '1px solid var(--border, #E6E4DF)',
                color: 'var(--text-high, #141414)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Truck style={{ width: 15, height: 15, color: 'var(--brand, #0057FF)' }} />
              Operations Center
            </Link>
          </div>
        </div>

      </div>

      {/* Footer hint */}
      <div style={{ marginTop: 28, fontSize: 12, color: 'var(--text-low, #909090)', fontFamily: 'var(--font-mono, monospace)' }}>
        LogiFlow Autonomous Mesh Gateway &bull; Node ID #ERR-404-GEO
      </div>
    </div>
  );
}
