'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, Radio } from 'lucide-react';

interface HeroOverlayProps {
  onScrollClick?: () => void;
}

export const HeroOverlay: React.FC<HeroOverlayProps> = ({ onScrollClick }) => {
  const scrollToQuote = () => {
    const el = document.getElementById('quote-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: 'clamp(16px, 4vw, 48px)',
      boxSizing: 'border-box',
    }}>

      {/* ── Top Navbar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, width: '100%',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 16, color: '#fbbf24',
            boxShadow: '0 0 20px rgba(245,158,11,0.25)',
          }}>
            LF
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: -0.5 }}>
              LogiFlow
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 99, padding: '2px 8px' }}>
                AI
              </span>
            </h1>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 500 }}>Enterprise Autonomous Freight</p>
          </div>
        </Link>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 99,
            background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(52,211,153,0.35)',
            fontSize: 11, fontFamily: 'monospace', color: '#34d399',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            <span>LIVE TELEMATICS</span>
          </div>

          <Link
            href="/dashboard"
            style={{
              padding: '9px 18px', borderRadius: 12,
              background: '#f59e0b', color: '#1c1917',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 0 25px rgba(245,158,11,0.3)',
              transition: 'background 0.15s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fbbf24')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}
          >
            Dashboard →
          </Link>
        </div>
      </header>

      {/* ── Hero Copy ── */}
      <div style={{ maxWidth: 700, margin: 'auto 0' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 99,
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          fontSize: 11, fontWeight: 700, color: '#fbbf24',
          textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
          Next-Gen AI Fleet Logistics
        </div>

        <h2 style={{
          fontSize: 'clamp(34px, 5.5vw, 68px)',
          fontWeight: 900, letterSpacing: -2, lineHeight: 1.08,
          color: '#fff', margin: '0 0 20px',
          textShadow: '0 2px 20px rgba(0,0,0,0.6)',
        }}>
          Moving Made Easy,{' '}
          <br />
          <span style={{ background: 'linear-gradient(90deg, #fbbf24, #fde68a, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Wherever Cargo Takes You.
          </span>
        </h2>

        <p style={{
          fontSize: 'clamp(14px, 1.4vw, 17px)',
          color: '#cbd5e1',
          lineHeight: 1.7,
          maxWidth: 540,
          margin: '0 0 28px',
          textShadow: '0 1px 10px rgba(0,0,0,0.5)',
        }}>
          Autonomous dispatch, real-time IoT sensory tracking, and zero-latency cross-dock consolidation powered by predictive telematics.
        </p>

        {/* Unified Call to Action & Social proof */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          
          {/* PRIMARY CALL TO ACTION: Get Instant Quote */}
          <button
            onClick={scrollToQuote}
            style={{
              padding: '12px 24px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#1c1917',
              fontSize: 14,
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 30px rgba(245,158,11,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(245,158,11,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(245,158,11,0.35)';
            }}
          >
            <Calculator style={{ width: 17, height: 17 }} />
            Get Instant Quote
            <ArrowRight style={{ width: 16, height: 16 }} />
          </button>

          {/* SECONDARY CALL TO ACTION: Scroll 3D Journey */}
          <button
            onClick={onScrollClick}
            style={{
              padding: '12px 20px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(15,23,42,0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: '#f8fafc',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.6)')}
          >
            Explore 3D Corridor
            <span style={{ color: '#fbbf24', fontSize: 16, animation: 'bounce 1s infinite' }}>↓</span>
          </button>

          {/* Social proof pill */}
          <div style={{
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 20,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ display: 'flex' }}>
              {[['#f59e0b', 'JD'], ['#22d3ee', 'MK'], ['#34d399', 'AS']].map(([bg, text], i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: bg, border: '2px solid #0f172a', marginLeft: i > 0 ? -6 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#1c1917' }}>
                  {text}
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>12,400+ Shipments</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>4.9/5 Trust Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom hint ── */}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: 3, textTransform: 'uppercase', paddingBottom: 8 }}>
        Scroll to inspect end-to-end autonomous journey
      </div>
    </div>
  );
};
