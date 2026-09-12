'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, Sparkles } from 'lucide-react';

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
            </h1>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 500 }}>Enterprise Autonomous Freight</p>
          </div>
        </Link>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/pricing"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 99,
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
              fontSize: 11.5, fontFamily: 'monospace', fontWeight: 700, color: '#fbbf24',
              textDecoration: 'none',
              boxShadow: '0 0 15px rgba(245,158,11,0.2)',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            title="Explore Commercial Plans & Pricing"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.15)')}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
            <span>GET STARTED NOW →</span>
          </Link>

          <Link
            href="/pricing"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10,
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.15)',
              fontSize: 12, fontWeight: 700, color: '#e2e8f0',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.7)')}
          >
            Pricing
          </Link>

          <Link
            href="/login"
            style={{
              padding: '8px 18px', borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
              fontSize: 12.5, fontWeight: 700, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 0 20px rgba(59,130,246,0.3)',
              transition: 'background 0.15s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
            onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)')}
          >
            Sign In →
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
          Next-Gen Fleet Logistics
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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>

          {/* PRIMARY CALL TO ACTION: Get Started & Choose Plan */}
          <Link
            href="/pricing"
            style={{
              padding: '13px 26px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#0f172a',
              fontSize: 14,
              fontWeight: 900,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 35px rgba(245,158,11,0.45)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 45px rgba(245,158,11,0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 35px rgba(245,158,11,0.45)';
            }}
          >
            <Sparkles style={{ width: 17, height: 17 }} />
            <span>Start Free Trial</span>
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>

          {/* SECONDARY CALL TO ACTION: View Pricing & Plans */}
          <Link
            href="/pricing"
            style={{
              padding: '12px 20px',
              borderRadius: 14,
              border: '1px solid rgba(245,158,11,0.4)',
              background: 'rgba(15,23,42,0.8)',
              backdropFilter: 'blur(12px)',
              color: '#fbbf24',
              fontSize: 13.5,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(245,158,11,0.15)';
              e.currentTarget.style.borderColor = 'rgba(245,158,11,0.7)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(15,23,42,0.8)';
              e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)';
            }}
          >
            <span>Plans &amp; Pricing</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>

          {/* TERTIARY CALL TO ACTION: Instant Quote */}
          <button
            onClick={scrollToQuote}
            style={{
              padding: '12px 18px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(15,23,42,0.5)',
              backdropFilter: 'blur(12px)',
              color: '#cbd5e1',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.5)')}
          >
            <Calculator style={{ width: 15, height: 15 }} />
            <span>Rate Calculator</span>
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
      <div
        onClick={onScrollClick}
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: '#94a3b8',
          fontFamily: 'monospace',
          letterSpacing: 3,
          textTransform: 'uppercase',
          paddingBottom: 8,
          cursor: onScrollClick ? 'pointer' : 'default',
        }}
      >
        Scroll to inspect end-to-end autonomous journey
      </div>
    </div>
  );
};
