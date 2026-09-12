import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileCheck, Scale, AlertTriangle, Truck, CheckCircle2, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | LogisticsEdge Logistics',
  description: 'LogisticsEdge master service terms, carrier network conditions, freight liability policies, and service level agreements.',
  alternates: { canonical: '/terms' },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://logisticsedge.io" },
    { "@type": "ListItem", "position": 2, "name": "Terms & Conditions", "item": "https://logisticsedge.io/terms" },
  ]
};

export default function TermsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div style={{ background: 'var(--surface, #F8F7F4)', color: 'var(--text-high, #141414)', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', background: 'var(--surface-1, #FFFFFF)', border: '1px solid var(--border, #E6E4DF)', borderRadius: 20, padding: '40px 48px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        
        {/* Navigation back */}
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-mid, #525252)',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 10,
              background: 'var(--surface-2, #F3F2EF)',
              border: '1px solid var(--border, #E6E4DF)',
              transition: 'color 0.2s',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--border, #E6E4DF)', paddingBottom: 28, marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(0, 87, 255, 0.08)', border: '1px solid rgba(0, 87, 255, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileCheck style={{ width: 20, height: 20, color: 'var(--brand, #0057FF)' }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--brand, #0057FF)', fontWeight: 700 }}>
              Master Service Agreement
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 900, letterSpacing: -1, color: 'var(--text-high, #141414)', margin: '0 0 12px' }}>
            Terms and Conditions of Service
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-mid, #525252)', margin: 0 }}>
            Effective Date: January 1, 2026 &bull; Version 4.2
          </p>
        </div>

        {/* Terms Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36, lineHeight: 1.8, fontSize: 15, color: 'var(--text-mid, #525252)' }}>
          
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-high, #141414)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Scale style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, submitting freight manifests, or integrating APIs with the LogisticsEdge Logistics Platform (&ldquo;Platform&rdquo;), you (&ldquo;Customer&rdquo;, &ldquo;Shipper&rdquo;, or &ldquo;Carrier&rdquo;) agree to be bound unconditionally by these Terms and Conditions. If you are accepting on behalf of an enterprise entity, you warrant that you hold legal signing authority.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-high, #141414)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Truck style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              2. Logistics Services & Dispatch
            </h2>
            <p>
              LogisticsEdge provides digital freight brokerage, autonomous dispatch coordination, automated manifest verification, IoT sensory tracking, and cross-dock allocation software:
            </p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                <strong style={{ color: 'var(--text-high, #141414)' }}>Manifest Accuracy:</strong> Shippers must provide strictly truthful cargo weight, volume, hazmat classification, and temperature constraints prior to pickup induction.
              </li>
              <li>
                <strong style={{ color: 'var(--text-high, #141414)' }}>Autonomous Matching:</strong> Our algorithmic dispatch engine pairs loads with certified third-party haulers based on safety scores, geofence availability, and equipment qualifications.
              </li>
              <li>
                <strong style={{ color: 'var(--text-high, #141414)' }}>Proof of Delivery (POD):</strong> Digital signatures, geo-stamped receipts, and optical photos uploaded via the Driver Portal constitute conclusive proof of handover.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-high, #141414)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              3. Carrier Liability & Cargo Insurance
            </h2>
            <p>
              All shipments dispatched through the Platform are covered by standard carrier cargo liability under the Carmack Amendment / CMR Convention up to the declared value specified at booking, capped at $250,000 per trailer load unless supplemental high-value cargo rider insurance is bound in advance.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-high, #141414)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              4. Service Availability & SLA
            </h2>
            <p>
              LogisticsEdge guarantees a 99.9% uptime SLA for operational dispatch APIs and live tracking webhooks. Planned maintenance windows are communicated at least 72 hours in advance. In no event shall LogisticsEdge be liable for indirect, incidental, consequential, or punitive damages resulting from third-party road blockages, acts of God (force majeure), or carrier labor disputes.
            </p>
          </section>

          <section id="security">
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-high, #141414)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              5. Security, Invoicing & Billing
            </h2>
            <p>
              Automated electronic invoices are generated upon verified POD delivery with Net-30 payment terms for approved commercial accounts. Overdue balances incur interest at 1.5% per month or the legal maximum. Enterprise access requires TLS 1.3 encryption and mandatory multi-factor authentication for administrative dispatchers.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--border, #E6E4DF)', textAlign: 'center', fontSize: 13, color: 'var(--text-mid, #525252)' }}>
          &copy; 2026 LogisticsEdge Technologies Inc. All rights reserved. &bull; <Link href="/privacy" style={{ color: 'var(--brand, #0057FF)', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>

      </div>
    </div>
    </>
  );
}
