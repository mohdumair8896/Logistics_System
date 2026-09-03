'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck, Bot, ShieldCheck, Zap, ArrowRight, Calculator,
  Radio, Gauge, CheckCircle2, AlertTriangle, Phone, ExternalLink,
  Layers, Lock, Database, Sparkles, ChevronRight, BarChart3
} from 'lucide-react';

export default function LandingPage() {
  // ROI Calculator Sliders
  const [fleetSize, setFleetSize] = useState(25);
  const [avgDistanceKm, setAvgDistanceKm] = useState(450);
  const [deadheadPercent, setDeadheadPercent] = useState(22);
  const [phoneHoursWeek, setPhoneHoursWeek] = useState(25);

  // Dynamic ROI Calculations
  const calculations = useMemo(() => {
    const monthlyTrips = fleetSize * 16;
    const totalKmPerMonth = monthlyTrips * avgDistanceKm;
    const deadheadKm = totalKmPerMonth * (deadheadPercent / 100);
    const fuelLossMonthly = deadheadKm * 24; // ~24 INR per km fuel + tire wear
    const laborLossMonthly = phoneHoursWeek * 4 * 650; // ~650 INR/hr dispatcher phone time
    const totalLossMonthly = fuelLossMonthly + laborLossMonthly;
    const annualSavingsPotential = Math.round(totalLossMonthly * 12 * 0.72); // 72% recoverable with automated AI dispatch

    return {
      monthlyTrips,
      deadheadKm: Math.round(deadheadKm),
      fuelLossMonthly: Math.round(fuelLossMonthly),
      laborLossMonthly: Math.round(laborLossMonthly),
      totalLossMonthly: Math.round(totalLossMonthly),
      annualSavingsPotential
    };
  }, [fleetSize, avgDistanceKm, deadheadPercent, phoneHoursWeek]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0C0A09',
      color: '#FAFAF9',
      fontFamily: 'var(--font-inter, sans-serif)',
      overflowX: 'hidden'
    }}>
      {/* JSON-LD SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'LogiFlow Logistics AI',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Cloud Web App',
            description: '24/7 Autonomous Logistics Dispatcher & Shipper Lead Platform with live telematics tracking and spot quotation.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            }
          })
        }}
      />

      {/* Global Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(12, 10, 9, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
        padding: '0 24px'
      }}>
        <div style={{
          maxWidth: 1240,
          margin: '0 auto',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Brand */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(245,158,11,0.45)',
              color: '#1C1917'
            }}>
              <Truck size={22} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FAFAF9', letterSpacing: '-0.2px' }}>
                Precision Logistics
              </div>
              <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                LogiFlow AI Copilot
              </div>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 13, fontWeight: 500, color: '#A8A29E' }}>
            <a href="#roi-calculator" style={{ color: '#D6D3D1', textDecoration: 'none' }}>ROI Calculator</a>
            <a href="#sandbox-preview" style={{ color: '#D6D3D1', textDecoration: 'none' }}>Live Sandbox</a>
            <a href="#architecture" style={{ color: '#D6D3D1', textDecoration: 'none' }}>Architecture & Safety</a>
            <a href="#embed-pipeline" style={{ color: '#D6D3D1', textDecoration: 'none' }}>Embed Widget SDK</a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/login"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#FAFAF9',
                textDecoration: 'none',
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)'
              }}
            >
              Sign In
            </Link>
            <Link
              href="/login"
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: '#1C1917',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                boxShadow: '0 0 20px rgba(245,158,11,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              Launch LMS Portal <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ position: 'relative', padding: '70px 24px 80px', overflow: 'hidden' }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 200, right: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1040, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px',
            borderRadius: 30,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.3)',
            marginBottom: 20
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              24/7 Autonomous Dispatch Copilot • LogiFlow Engine
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5.5vw, 56px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-1px',
            color: '#FAFAF9',
            marginBottom: 20
          }}>
            The 24/7 Autonomous AI Dispatcher for Modern Freight Fleets
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 19px)',
            color: '#A8A29E',
            maxWidth: 780,
            margin: '0 auto 36px',
            lineHeight: 1.55
          }}>
            DentaFlow-inspired AI triage engineered specifically for freight supply chains. Instantly answer shipper telematics tracking, generate verified spot rate quotes, intake cargo bookings, and triage highway emergencies with zero dispatcher delay.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <a
              href="#sandbox-preview"
              style={{
                padding: '14px 28px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#1C1917',
                fontWeight: 800,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 8px 25px rgba(245,158,11,0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Sparkles size={16} /> Test Live Sandbox Assistant ↓
            </a>
            <a
              href="#roi-calculator"
              style={{
                padding: '14px 28px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FAFAF9',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Calculator size={16} /> Calculate Inefficient Mile Losses
            </a>
          </div>

          {/* Quick Telemetry Highlights */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginTop: 50,
            padding: '20px 24px',
            borderRadius: 14,
            background: '#141210',
            border: '1px solid rgba(245,158,11,0.2)'
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono, monospace)' }}>35ms</div>
              <div style={{ fontSize: 11, color: '#A8A29E', marginTop: 2 }}>GPS Telematics Latency</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono, monospace)' }}>99.8%</div>
              <div style={{ fontSize: 11, color: '#A8A29E', marginTop: 2 }}>Corridor On-Time SLA</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#00D4FF', fontFamily: 'var(--font-mono, monospace)' }}>₹38.5L+</div>
              <div style={{ fontSize: 11, color: '#A8A29E', marginTop: 2 }}>Avg. Annual Deadhead Recovered</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FAFAF9', fontFamily: 'var(--font-mono, monospace)' }}>Zero-Wait</div>
              <div style={{ fontSize: 11, color: '#A8A29E', marginTop: 2 }}>24/7 Shipper Chat & Intake</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator: "The Cost of Inefficient Freight & Deadhead Miles" */}
      <section id="roi-calculator" style={{ padding: '80px 24px', background: '#100E0C', borderTop: '1px solid #1C1917' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Interactive Supply Chain Economics
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#FAFAF9', marginTop: 6 }}>
              The Real Cost of Doing Nothing: Deadhead & Dispatch Dwell
            </h2>
            <p style={{ fontSize: 14, color: '#A8A29E', maxWidth: 640, margin: '8px auto 0' }}>
              Every empty return trip and phone call inquiry drains fleet profitability. Calculate how much capital your supply chain bleeds annually.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 28,
            alignItems: 'stretch'
          }}>
            {/* Left: Interactive Input Sliders */}
            <div style={{
              background: '#141210',
              border: '1px solid #292524',
              borderRadius: 16,
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 22
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FAFAF9', borderBottom: '1px solid #292524', paddingBottom: 12 }}>
                Fleet Operating Variables
              </div>

              {/* Slider 1: Fleet Size */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                  <span style={{ color: '#D6D3D1' }}>Active Commercial Vehicles:</span>
                  <span style={{ color: '#F59E0B', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>{fleetSize} Trucks</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={150}
                  value={fleetSize}
                  onChange={e => setFleetSize(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#F59E0B' }}
                />
              </div>

              {/* Slider 2: Average Corridor Haul Distance */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                  <span style={{ color: '#D6D3D1' }}>Avg. Corridor Haul Distance:</span>
                  <span style={{ color: '#F59E0B', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>{avgDistanceKm} KM</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={1200}
                  step={25}
                  value={avgDistanceKm}
                  onChange={e => setAvgDistanceKm(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#F59E0B' }}
                />
              </div>

              {/* Slider 3: Deadhead Empty Mile Ratio */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                  <span style={{ color: '#D6D3D1' }}>Unmonitored Empty Return (Deadhead) %:</span>
                  <span style={{ color: '#ef4444', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>{deadheadPercent}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={45}
                  value={deadheadPercent}
                  onChange={e => setDeadheadPercent(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#ef4444' }}
                />
                <div style={{ fontSize: 10.5, color: '#78716C', marginTop: 4 }}>
                  Industry avg: 20-28% of trucks return without backhaul payload
                </div>
              </div>

              {/* Slider 4: Weekly Phone Call Inquiries */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                  <span style={{ color: '#D6D3D1' }}>Dispatcher Phone Time on Status Calls:</span>
                  <span style={{ color: '#F59E0B', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>{phoneHoursWeek} Hrs / Week</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={phoneHoursWeek}
                  onChange={e => setPhoneHoursWeek(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#F59E0B' }}
                />
              </div>
            </div>

            {/* Right: Calculated Loss & Recovery Card */}
            <div style={{
              background: 'linear-gradient(135deg, #1C1917, #141210)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 16,
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
            }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                  Monthly Capital Drainage
                </div>
                <div style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1.1 }}>
                  ₹{calculations.totalLossMonthly.toLocaleString()}
                  <span style={{ fontSize: 13, color: '#A8A29E', fontWeight: 500, marginLeft: 6 }}>/ month</span>
                </div>
                <div style={{ fontSize: 11, color: '#78716C', marginTop: 4 }}>
                  Includes ~₹{calculations.fuelLossMonthly.toLocaleString()} in empty diesel burn + ₹{calculations.laborLossMonthly.toLocaleString()} staff tracking dwell.
                </div>

                <div style={{ marginTop: 24, padding: '16px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
                    Recoverable Margin with LogiFlow AI
                  </div>
                  <div style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
                    ₹{calculations.annualSavingsPotential.toLocaleString()}
                    <span style={{ fontSize: 13, color: '#D6D3D1', fontWeight: 600, marginLeft: 6 }}>/ year</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#A8A29E', marginTop: 8, lineHeight: 1.4 }}>
                    By automating spot quotations, backhaul matching, and 24/7 tracking queries directly inside the embeddable chat widget.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <Link
                  href="/login"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#1C1917',
                    fontWeight: 800,
                    fontSize: 13,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 16px rgba(245,158,11,0.3)'
                  }}
                >
                  Deploy LogiFlow to Stop Inefficient Losses <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Sandbox Preview */}
      <section id="sandbox-preview" style={{ padding: '80px 24px', background: '#0C0A09' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#00D4FF', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Host Isolation & Embed Pipeline
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#FAFAF9', marginTop: 6 }}>
              Test the Live Sandbox Copilot
            </h2>
            <p style={{ fontSize: 14, color: '#A8A29E', maxWidth: 620, margin: '8px auto 0' }}>
              Simulates a shipper looking up loads or requesting lane quotes from their company portal. Test live interactions below.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 28,
            alignItems: 'center'
          }}>
            {/* Explanatory Feature Callouts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: '#141210',
                border: '1px solid #292524',
                borderRadius: 14,
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F59E0B', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  <Radio size={16} /> 1. Live Telematics Track & Trace
                </div>
                <p style={{ fontSize: 12.5, color: '#A8A29E', lineHeight: 1.45 }}>
                  Shippers enter their order or trip reference (e.g. <code>ORD-1001</code>). The AI immediately returns live speed, corridor ETA, and geofence status.
                </p>
              </div>

              <div style={{
                background: '#141210',
                border: '1px solid #292524',
                borderRadius: 14,
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  <Calculator size={16} /> 2. Instant Spot Rate Quotation
                </div>
                <p style={{ fontSize: 12.5, color: '#A8A29E', lineHeight: 1.45 }}>
                  AI computes dynamic pricing based on corridor distance and payload weight with automated 18% GST tax breakdowns.
                </p>
              </div>

              <div style={{
                background: '#141210',
                border: '1px solid #292524',
                borderRadius: 14,
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  <AlertTriangle size={16} /> 3. Emergency Bypass Protocol
                </div>
                <p style={{ fontSize: 12.5, color: '#A8A29E', lineHeight: 1.45 }}>
                  Corridor breakdowns, reefer temperature alarms, or highway incidents immediately trigger high-priority roadside dispatch hotlines.
                </p>
              </div>

              <div style={{
                background: '#141210',
                border: '1px solid #292524',
                borderRadius: 14,
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00D4FF', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  <Layers size={16} /> 4. 1-Click Order Allocation in LMS
                </div>
                <p style={{ fontSize: 12.5, color: '#A8A29E', lineHeight: 1.45 }}>
                  Every booking captured inside the chat widget is instantly synced into our central <strong>Shipper Leads CRM</strong>, ready for one-click trailer pairing.
                </p>
              </div>
            </div>

            {/* Embedded Live Iframe Sandbox Frame */}
            <div style={{
              background: '#141210',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 20,
              padding: 16,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)'
            }}>
              {/* Fake Browser Window Chrome */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                <div style={{
                  flex: 1,
                  background: '#1C1917',
                  borderRadius: 6,
                  padding: '3px 12px',
                  fontSize: 10.5,
                  color: '#78716C',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono, monospace)'
                }}>
                  shipper-portal.company.com/track
                </div>
              </div>

              {/* Embedded Live Widget Frame */}
              <div style={{ width: '100%', height: 520, borderRadius: 12, overflow: 'hidden', border: '1px solid #292524' }}>
                <iframe
                  src="/widget-frame"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="LogiFlow Sandbox Assistant"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embed Pipeline: One-Line Integration */}
      <section id="embed-pipeline" style={{ padding: '70px 24px', background: '#100E0C', borderTop: '1px solid #1C1917' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Zero-Conflict Integration
          </span>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800, color: '#FAFAF9', marginTop: 6, marginBottom: 16 }}>
            Embed on Any Shipper Portal in 30 Seconds
          </h2>
          <p style={{ fontSize: 13.5, color: '#A8A29E', maxWidth: 640, margin: '0 auto 24px' }}>
            Like DentaFlow's host-isolated embed, our lightweight vanilla JS loader (<span style={{ color: '#F59E0B' }}>&lt;5KB</span>) works across WordPress, custom intranets, SAP, and Webflow without CSS pollution.
          </p>

          <div style={{
            background: '#141210',
            border: '1px solid #292524',
            borderRadius: 12,
            padding: '16px 20px',
            textAlign: 'left',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 12,
            color: '#00D4FF',
            overflowX: 'auto',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
          }}>
            <code>
              &lt;script src=&quot;http://localhost:3005/widget/loader.js&quot; data-client-key=&quot;PL-CORP-9842&quot; defer&gt;&lt;/script&gt;
            </code>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '36px 24px',
        borderTop: '1px solid #1C1917',
        background: '#0C0A09',
        fontSize: 12,
        color: '#78716C'
      }}>
        <div style={{
          maxWidth: 1240,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            © 2026 Precision Logistics System. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/login" style={{ color: '#A8A29E', textDecoration: 'none' }}>Admin LMS Login</Link>
            <Link href="/widget-frame" style={{ color: '#A8A29E', textDecoration: 'none' }}>Standalone Widget</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
