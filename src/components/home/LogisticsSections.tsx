'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe2,
  MapPinned,
  Truck,
  ShieldCheck,
  Headphones,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingUp,
  Award,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import QuoteRequest from './QuoteRequest';

const glass = {
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
} as const;

export default function LogisticsSections() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterHoneypot, setNewsletterHoneypot] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Spam honeypot detection
    if (newsletterHoneypot) {
      setNewsletterEmail('');
      return;
    }

    // 2. GDPR consent required before collecting email
    if (!newsletterConsent) {
      toast.error('Please confirm you agree to our Privacy Policy before subscribing.');
      return;
    }

    // 3. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newsletterEmail || !emailRegex.test(newsletterEmail.trim())) {
      toast.error('Please enter a valid work email address');
      return;
    }

    setIsSubscribing(true);
    setTimeout(() => {
      setIsSubscribing(false);
      setNewsletterEmail('');
      toast.success('Subscribed!', {
        description: 'You will now receive weekly freight intelligence reports.',
      });
    }, 600);
  };

  const services = [
    {
      title: 'Global Freight Reach',
      sub: 'Intermodal Air & Ocean',
      desc: 'Seamless international customs clearance with priority port berth reservation and multimodal container routing.',
      icon: <Globe2 style={{ width: 24, height: 24, color: '#fbbf24' }} />,
    },
    {
      title: 'Smart Telematics Tracking',
      sub: 'Sub-Meter IoT Telemetry',
      desc: 'Continuous real-time asset monitoring with temperature, humidity, shock sensors, and tamper detection.',
      icon: <MapPinned style={{ width: 24, height: 24, color: '#22d3ee' }} />,
    },
    {
      title: 'Express & Dedicated Delivery',
      sub: 'Time-Definite Freight',
      desc: 'Guaranteed scheduled delivery windows with dedicated non-stop expedited linehauls and driver relays.',
      icon: <Truck style={{ width: 24, height: 24, color: '#34d399' }} />,
    },
    {
      title: 'Secure Automated Storage',
      sub: 'Robotic Cross-Docking',
      desc: 'Climate-controlled fulfillment hubs with autonomous mobile robots for rapid sortation and cross-docking.',
      icon: <ShieldCheck style={{ width: 24, height: 24, color: '#a78bfa' }} />,
    },
    {
      title: '24/7 Mission Control Support',
      sub: 'Enterprise SLA Assistance',
      desc: 'Dedicated dispatch coordinators and automated exception handling for 100% on-time delivery assurance.',
      icon: <Headphones style={{ width: 24, height: 24, color: '#fb7185' }} />,
    },
  ];

  const skills = [
    { label: 'Advanced Logistics Route Optimization', pct: 98, color: '#f59e0b' },
    { label: 'Real-Time Sensor Telematics & Visibility', pct: 96, color: '#22d3ee' },
    { label: 'Automated Cross-Docking & Warehousing', pct: 92, color: '#a78bfa' },
    { label: 'Customer SLA Satisfaction & Retention', pct: 99, color: '#34d399' },
  ];
  // Note: skill percentages are indicative performance targets, not verified averages.

  const steps = [
    { step: '01', title: 'Consultation & Rate Quote', desc: 'Input weight, route, and cargo specs for instant guaranteed rate calculation.' },
    { step: '02', title: 'Inventory Ingestion', desc: 'Automated RFID scanning & dimensioning at origin cross-dock facility.' },
    { step: '03', title: 'Linehaul Dispatch', desc: 'GPS-guided electric or hybrid transport over telematics-optimized corridors.' },
    { step: '04', title: 'Final Handover & POD', desc: 'Contactless signature capture with timestamped receipt stored in cloud.' },
  ];

  const faqs = [
    {
      q: 'What shipping corridors and regions does LogiFlow operate in?',
      a: 'We operate across India’s national highway network including the Golden Quadrilateral (NH-44, NH-48, NH-19, NH-16), key industrial corridors (Delhi-Mumbai, Eastern Dedicated Freight Corridor), and regional feeder routes connecting Tier-2 and Tier-3 cities across Uttar Pradesh, Maharashtra, Gujarat, and Rajasthan.',
    },
    {
      q: 'How does the predictive dispatch route optimization work?',
      a: 'Our algorithmic engine analyzes real-time weather, port congestion, highway traffic, and fuel tariffs to dynamically re-route shipments before bottlenecks occur.',
    },
    {
      q: 'Can I monitor cold-chain sensitive pharmaceuticals or perishable goods?',
      a: 'Yes. Every refrigerated asset is linked to cellular IoT temperature probes that send automated alerts if the cargo drifts outside pre-set threshold limits.',
    },
    {
      q: 'What is the standard proof-of-delivery (POD) turnaround time?',
      a: 'PODs with contactless digital signatures and timestamped geotagged photos are generated instantaneously upon handover and synced to your dashboard within 3 seconds.',
    },
  ];

  return (
    <div style={{ background: '#020617', color: '#fff', fontFamily: 'var(--font-inter, system-ui, sans-serif)' }} role="main">

      {/* ── SECTION 1: SERVICES GRID ─────────────────────────────────── */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 64 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#fbbf24', fontFamily: 'monospace' }}>
                Our Core Capabilities
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: -1, color: '#fff', marginTop: 8, lineHeight: 1.1 }}>
                Trusted Enterprise Logistics Services
              </h2>
            </div>
            <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 400, lineHeight: 1.7 }}>
              End-to-end supply chain reliability engineered with modern automation, dynamic routing, and round-the-clock visibility.
            </p>
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {services.map((s, idx) => (
              <div
                key={idx}
                style={{ ...glass, padding: '32px', borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 16, transition: 'border-color 0.2s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              >
                <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <div>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{s.sub}</span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>{s.title}</h3>
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}

            {/* CTA card */}
            <div style={{ padding: 32, borderRadius: 24, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#1c1917', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 60px rgba(245,158,11,0.25)' }}>
              <div>
                <Award style={{ width: 40, height: 40, marginBottom: 16 }} />
                <h3 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>Ready to Upgrade Your Supply Chain?</h3>
                <p style={{ fontSize: 13, fontWeight: 500, marginTop: 8, color: '#451a03' }}>
                  Connect your ERP or WMS with our unified API in less than 48 hours.
                </p>
              </div>
              <a
                href="#quote-section"
                style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, background: '#020617', color: '#fff', padding: '12px 20px', borderRadius: 12, textDecoration: 'none', width: 'fit-content' }}
              >
                Get Immediate Quote <ArrowRight style={{ width: 16, height: 16 }} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: SKILLS & STATS ────────────────────────────────── */}
      <section style={{ padding: '96px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.3)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 64, alignItems: 'center' }}>

          {/* Left: text + bars */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#22d3ee', fontFamily: 'monospace' }}>
              Performance Targets
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: -1, color: '#fff', marginTop: 8, lineHeight: 1.15 }}>
              Skills That Keep Your <br />
              <span style={{ background: 'linear-gradient(90deg, #fbbf24, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Business Moving Forward.
              </span>
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginTop: 16, marginBottom: 32 }}>
              We leverage proprietary telemetry dispatch algorithms and rigorous carrier certification to eliminate deadhead miles, safeguard perishable freight, and maintain exceptional SLA compliance.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {skills.map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'monospace', marginBottom: 6 }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 700 }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 12, fontFamily: 'monospace' }}>
              * Indicative performance targets. Actual results vary by route and cargo type.
            </p>
          </div>

          {/* Right: stats box — Law of Proximity: stats grouped, fuel savings clearly separated */}
          <div style={{ ...glass, padding: 48, borderRadius: 32 }}>
            {/* Stats group — uniform connectedness: same card style = same data type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 8 }}>
              {[
                { val: '99.8%*', label: 'On-Time Delivery Rate', color: '#fbbf24' },
                { val: '2.4M*', label: 'Miles Tracked Annually', color: '#22d3ee' },
                { val: '0.02%*', label: 'Cargo Damage Rate', color: '#34d399' },
                { val: '<15s*', label: 'Dispatch Response Time', color: '#a78bfa' },
              ].map((stat, i) => (
                <div key={i}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: stat.color, fontFamily: 'monospace', lineHeight: 1 }}>{stat.val}</span>
                  <p style={{ fontSize: 11, color: '#a8b8c8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, fontFamily: 'monospace' }}>{stat.label}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', marginBottom: 20 }}>* Simulated demo data. Results may vary.</p>

            {/* Fuel savings — visually separated from stats (Law of Proximity: different meaning = different group) */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <TrendingUp style={{ width: 32, height: 32, color: '#34d399', flexShrink: 0 }} aria-hidden="true" />
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                Algorithmic load-balancing reduced client fuel costs by <strong style={{ color: '#34d399' }}>18.4%</strong> on average across Q2 interstate routes.*
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: PROCESS TIMELINE ──────────────────────────────── */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 80px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#fbbf24', fontFamily: 'monospace' }}>
              Structured Execution
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#fff', marginTop: 8, letterSpacing: -1 }}>
              Our Seamless Moving Process
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 12, lineHeight: 1.7 }}>
              From initial cargo booking to optical confirmation at destination, our transparent lifecycle keeps you completely informed.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40 }}>
            {steps.map((item, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: 20, color: '#fbbf24' }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: QUOTE REQUEST ──────────────────────────────────── */}
      <QuoteRequest />

      {/* ── SECTION 5: FAQ ───────────────────────────────────────────── */}
      <section id="faq" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#22d3ee', fontFamily: 'monospace' }}>
              Got Questions?
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', marginTop: 8, letterSpacing: -1 }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((f, i) => {
              const panelId = `faq-panel-${i}`;
              const isOpen = openFaq === i;
              return (
                <div key={i} style={{ ...glass, borderRadius: 16, overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    style={{ width: '100%', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: isOpen ? '#fbbf24' : '#e4e4e7', fontSize: 15, fontWeight: 700, textAlign: 'left', cursor: 'pointer', gap: 16 }}
                  >
                    <span>{f.q}</span>
                    {isOpen
                      ? <ChevronUp style={{ width: 18, height: 18, color: '#fbbf24', flexShrink: 0 }} aria-hidden="true" />
                      : <ChevronDown style={{ width: 18, height: 18, color: '#a8b8c8', flexShrink: 0 }} aria-hidden="true" />
                    }
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-label={f.q}
                    hidden={!isOpen}
                    style={{ padding: isOpen ? '0 24px 20px' : undefined, fontSize: 14, color: '#cbd5e1', lineHeight: 1.75, borderTop: isOpen ? '1px solid rgba(255,255,255,0.05)' : undefined, paddingTop: isOpen ? 16 : undefined }}
                  >
                    {f.a}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Peak-End Rule: end on an inspiring action, not just legal text */}
      <div style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(245,158,11,0.04) 100%)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px 24px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontFamily: 'monospace', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>Ready to Ship?</p>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: -1, marginBottom: 20 }}>
            Move your first load today
          </h2>
          <a
            href="#quote-section"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#1c1917', padding: '14px 28px', borderRadius: 14,
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 0 30px rgba(245,158,11,0.3)',
            }}
          >
            <ArrowRight style={{ width: 18, height: 18 }} aria-hidden="true" />
            Get Instant Rate
          </a>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '48px 24px 32px', background: '#020617' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#1c1917', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>LF</div>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>LogiFlow</span>
              </div>
              <p style={{ fontSize: 13, color: '#a8b8c8', lineHeight: 1.7 }}>
                Autonomous logistics infrastructure — connecting industrial shippers, cross-docks, and final-mile electric delivery fleets.
              </p>
            </div>

            {/* Hick's Law: removed Quick Links column — fewer choices = faster decisions */}
            {/* Solutions */}
            <div>
              <h4 style={{ fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#cbd5e1', fontWeight: 700, marginBottom: 16 }}>What We Move</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Cold-Chain & Pharmaceutical',
                  'Intermodal Container Freight',
                  'Final-Mile Green Delivery',
                  'Flatbed & Oversized Loads',
                ].map(s => (
                  <li key={s} style={{ fontSize: 13, color: '#a8b8c8' }}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Newsletter with GDPR consent */}
            <div>
              <h4 style={{ fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#cbd5e1', fontWeight: 700, marginBottom: 16 }}>Stay Updated</h4>
              <p style={{ fontSize: 12, color: '#a8b8c8', marginBottom: 12 }}>Weekly freight index and telematics reports. Unsubscribe anytime.</p>

              <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" name="user_work_code" tabIndex={-1} autoComplete="off" value={newsletterHoneypot} onChange={e => setNewsletterHoneypot(e.target.value)} style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }} aria-hidden="true" />

                <div style={{ display: 'flex', gap: 8 }}>
                  <label htmlFor="newsletter-email" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>Work email address</label>
                  <input
                    id="newsletter-email" type="email" required
                    placeholder="Work email"
                    value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)}
                    style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none', minWidth: 0 }}
                  />
                  <button
                    type="submit" disabled={isSubscribing}
                    aria-busy={isSubscribing}
                    aria-label={isSubscribing ? 'Subscribing, please wait' : 'Subscribe to newsletter'}
                    style={{ background: '#f59e0b', color: '#1c1917', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: isSubscribing ? 'wait' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, opacity: isSubscribing ? 0.7 : 1 }}
                  >
                    {isSubscribing ? 'Sending…' : 'Subscribe'}
                    <Send style={{ width: 14, height: 14 }} aria-hidden="true" />
                  </button>
                </div>

                {/* GDPR consent — Law of Proximity: consent right below the subscribe button */}
                <label htmlFor="newsletter-consent" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 11, color: '#a8b8c8', lineHeight: 1.5 }}>
                  <input id="newsletter-consent" type="checkbox" checked={newsletterConsent} onChange={e => setNewsletterConsent(e.target.checked)} required style={{ width: 14, height: 14, accentColor: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
                  I agree to receive emails and accept the{' '}
                  <a href="/privacy" style={{ color: '#fbbf24', textDecoration: 'underline' }}>Privacy Policy</a>.
                </label>
              </form>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontSize: 12, color: '#a8b8c8' }}>
            <div>
              <p style={{ margin: '0 0 2px', color: '#a8b8c8' }}>&copy; 2026 Precision Logistics Technologies Pvt. Ltd. All rights reserved.</p>
              {/* TODO: Replace CIN and GST with your actual registration numbers */}
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>CIN: U72900UP2024PTC000000 &bull; GST: 09AAACP0000A1Z5 &bull; Lucknow, Uttar Pradesh, India</p>
            </div>
            <nav aria-label="Legal links">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                {[
                  ['Privacy Policy', '/privacy'],
                  ['Terms of Service', '/terms'],
                  ['Cookie Policy', '/cookies'],
                  ['Refund Policy', '/refund'],
                ].map(([label, href]) => (
                  <Link key={label} href={href} style={{ color: '#a8b8c8', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#a8b8c8')}>
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
