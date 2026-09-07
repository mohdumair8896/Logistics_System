'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
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

  const steps = [
    { step: '01', title: 'Consultation & Rate Quote', desc: 'Input weight, route, and cargo specs for instant guaranteed rate calculation.' },
    { step: '02', title: 'Inventory Ingestion', desc: 'Automated RFID scanning & dimensioning at origin cross-dock facility.' },
    { step: '03', title: 'Linehaul Dispatch', desc: 'GPS-guided electric or hybrid transport over telematics-optimized corridors.' },
    { step: '04', title: 'Final Handover & POD', desc: 'Contactless signature capture with timestamped receipt stored in cloud.' },
  ];

  const faqs = [
    {
      q: 'What shipping corridors and regions does LogiFlow operate in?',
      a: 'We operate across domestic North American highway networks, European multimodal transit corridors, and trans-Pacific ocean shipping lanes with full digital customs integration.',
    },
    {
      q: 'How does the predictive AI dispatch route optimization work?',
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
    <div style={{ background: '#020617', color: '#fff', fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>

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
            <p style={{ fontSize: 14, color: '#71717a', maxWidth: 400, lineHeight: 1.7 }}>
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
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', textTransform: 'uppercase', letterSpacing: 1 }}>{s.sub}</span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>{s.title}</h3>
                </div>
                <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.7 }}>{s.desc}</p>
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
              Proven Performance
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: -1, color: '#fff', marginTop: 8, lineHeight: 1.15 }}>
              Skills That Keep Your <br />
              <span style={{ background: 'linear-gradient(90deg, #fbbf24, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Business Moving Forward.
              </span>
            </h2>
            <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.7, marginTop: 16, marginBottom: 32 }}>
              We leverage proprietary telemetry dispatch algorithms and rigorous carrier certification to eliminate deadhead miles, safeguard perishable freight, and maintain exceptional SLA compliance.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {skills.map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'monospace', marginBottom: 6 }}>
                    <span style={{ color: '#d4d4d8', fontWeight: 700 }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 700 }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: stats box */}
          <div style={{ ...glass, padding: 48, borderRadius: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
              {[
                { val: '99.8%', label: 'On-Time Linehaul Delivery', color: '#fbbf24' },
                { val: '2.4M',  label: 'Miles Monitored Annually',  color: '#22d3ee' },
                { val: '0.02%', label: 'Cargo Damage Claim Rate',   color: '#34d399' },
                { val: '< 15s', label: 'Automated Dispatch Response', color: '#a78bfa' },
              ].map((stat, i) => (
                <div key={i}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: stat.color, fontFamily: 'monospace', lineHeight: 1 }}>{stat.val}</span>
                  <p style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, fontFamily: 'monospace' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <TrendingUp style={{ width: 32, height: 32, color: '#34d399', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.6 }}>
                AI load-balancing reduced client fuel expenditures by <strong style={{ color: '#fff' }}>18.4%</strong> across Q2 interstate operations.
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
            <p style={{ fontSize: 14, color: '#71717a', marginTop: 12, lineHeight: 1.7 }}>
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
                <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.7 }}>{item.desc}</p>
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
            {faqs.map((f, i) => (
              <div key={i} style={{ ...glass, borderRadius: 16, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: openFaq === i ? '#fbbf24' : '#e4e4e7', fontSize: 15, fontWeight: 700, textAlign: 'left', cursor: 'pointer', gap: 16 }}
                >
                  <span>{f.q}</span>
                  {openFaq === i
                    ? <ChevronUp style={{ width: 18, height: 18, color: '#fbbf24', flexShrink: 0 }} />
                    : <ChevronDown style={{ width: 18, height: 18, color: '#71717a', flexShrink: 0 }} />
                  }
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 20px', fontSize: 13, color: '#71717a', lineHeight: 1.75, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '64px 24px 32px', background: '#020617' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#1c1917', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
                  LF
                </div>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>LogiFlow</span>
              </div>
              <p style={{ fontSize: 12, color: '#52525b', lineHeight: 1.7 }}>
                Autonomous logistics infrastructure connecting industrial shippers, cross-docks, and final-mile electric delivery fleets.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#52525b', fontWeight: 700, marginBottom: 16 }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Operations Dashboard', '/dashboard'], ['Live Shipment Tracker', '/tracking'], ['Fleet Telematics', '/vehicles'], ['Order Dispatch', '/orders']].map(([label, href]) => (
                  <li key={href}><a href={href} style={{ fontSize: 12, color: '#52525b', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}>{label}</a></li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h4 style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#52525b', fontWeight: 700, marginBottom: 16 }}>Solutions</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Autonomous Sorting & Cross-Dock', 'Cold-Chain Vaccine & Food Transit', 'Intermodal Port & Freight Logistics', 'Final-Mile Green Delivery Routing'].map(s => (
                  <li key={s} style={{ fontSize: 12, color: '#52525b' }}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#52525b', fontWeight: 700, marginBottom: 16 }}>Stay Updated</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  placeholder="Enter work email"
                  style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#fff', outline: 'none', minWidth: 0 }}
                />
                <button style={{ background: '#f59e0b', color: '#1c1917', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontSize: 11, color: '#3f3f46' }}>
            <p>© 2026 LogiFlow Technologies Inc. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 24 }}>
              {['Privacy Policy', 'Terms of Service', 'Security & Compliance'].map(l => (
                <a key={l} href="#" style={{ color: '#3f3f46', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#71717a')} onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
