'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, rgba(99, 102, 241, 0.18) 50%, rgba(16, 185, 129, 0.18) 100%)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.35)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        zIndex: 50,
        position: 'sticky',
        top: 0,
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 999,
            background: 'rgba(245, 158, 11, 0.25)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            color: '#fbbf24',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.5,
            fontFamily: 'monospace',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
          LIVE DEMO SANDBOX
        </div>

        <p style={{ margin: 0, fontSize: 12.5, color: '#e2e8f0', fontWeight: 500 }}>
          You are freely exploring simulated fleet, dispatch queue, GPS corridors &amp; AI workforce.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Link
          href="/pricing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#0f172a',
            fontSize: 12,
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
          }}
        >
          <Sparkles style={{ width: 14, height: 14 }} />
          Choose Plan &amp; Gain Full Access
          <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>

        <Link
          href="/"
          style={{
            fontSize: 11.5,
            color: '#94a3b8',
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(15,23,42,0.4)',
          }}
        >
          Exit Demo
        </Link>
      </div>
    </div>
  );
}
