import React from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, XCircle, Clock, Phone, Mail, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | LogisticsEdge Logistics',
  description: 'LogisticsEdge freight cancellation terms, refund eligibility, and dispute resolution process under the Consumer Protection Act 2019.',
  alternates: { canonical: '/refund' },
};

const section = { display: 'flex', flexDirection: 'column' as const, gap: 12 };
const h2style = {
  fontSize: 20, fontWeight: 700, color: 'var(--text-high, #141414)', marginBottom: 12,
  display: 'flex', alignItems: 'center', gap: 10,
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://logisticsedge.io" },
    { "@type": "ListItem", "position": 2, "name": "Refund Policy", "item": "https://logisticsedge.io/refund" },
  ]
};

export default function RefundPolicyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div style={{ background: 'var(--surface, #F8F7F4)', color: 'var(--text-high, #141414)', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', background: 'var(--surface-1, #FFFFFF)', border: '1px solid var(--border, #E6E4DF)', borderRadius: 20, padding: '40px 48px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

        {/* Back link */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, color: 'var(--text-mid, #525252)', textDecoration: 'none',
            padding: '8px 16px', borderRadius: 10,
            background: 'var(--surface-2, #F3F2EF)', border: '1px solid var(--border, #E6E4DF)',
          }}>
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
              <RefreshCw style={{ width: 20, height: 20, color: 'var(--brand, #0057FF)' }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--brand, #0057FF)', fontWeight: 700 }}>
              Legal &amp; Compliance
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 900, letterSpacing: -1, color: 'var(--text-high, #141414)', margin: '0 0 12px' }}>
            Refund &amp; Cancellation Policy
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-mid, #525252)', margin: 0 }}>
            Effective Date: September 1, 2026 &bull; Jurisdiction: India (Consumer Protection Act 2019) &bull; Global customers: see Section 6
          </p>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36, lineHeight: 1.8, fontSize: 15, color: 'var(--text-mid, #525252)' }}>

          <section style={section}>
            <h2 style={h2style}>
              <Clock style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              1. Cancellation Window
            </h2>
            <p>
              Orders booked through the LogisticsEdge platform may be cancelled <strong style={{ color: 'var(--text-high, #141414)' }}>free of charge within 2 hours</strong> of booking confirmation, provided the assigned vehicle has not yet been dispatched from the origin facility.
            </p>
            <div style={{
              background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)',
              borderRadius: 14, padding: '16px 20px', marginTop: 8,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-high, #141414)' }}>
                <strong style={{ color: '#b45309' }}>Post-dispatch cancellations:</strong> If the vehicle has already been dispatched, a <strong>cancellation fee of 15% of the confirmed freight value</strong> applies to cover fuel, driver compensation, and cross-dock slot costs already incurred.
              </p>
            </div>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <FileText style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              2. Refund Eligibility
            </h2>
            <p>Refunds are issued under the following circumstances:</p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>Service failure:</strong> LogisticsEdge failed to deliver within the confirmed delivery window and no force majeure event applies — 100% freight refund.</li>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>Cargo damage in transit:</strong> Verified damage attributable to carrier handling — refund up to declared cargo value subject to our liability limit of ₹10,00,000 per consignment (or as declared in the manifest).</li>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>Duplicate payment:</strong> Duplicate charge identified on our payment gateway — 100% refund within 5–7 business days.</li>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>Pre-dispatch cancellation:</strong> Cancelled within the 2-hour window — 100% refund of any prepaid freight charges.</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <XCircle style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              3. Non-Refundable Situations
            </h2>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>Cancellation requested after the 2-hour window and post-dispatch (partial refund applies per Section 1).</li>
              <li>Delay caused by incorrect or incomplete delivery address provided by the customer.</li>
              <li>Delay or loss due to force majeure events: natural disasters, strikes, government embargo, or road closures.</li>
              <li>Cargo misdeclared by the shipper (hazardous goods, restricted items).</li>
              <li>Perishables beyond contractual cold-chain tolerance due to customer-side loading delays.</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <RefreshCw style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              4. Refund Processing Timeline
            </h2>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 8,
            }}>
              {[
                { method: 'UPI / Net Banking', timeline: '2–3 business days' },
                { method: 'Credit / Debit Card', timeline: '5–7 business days' },
                { method: 'NEFT / RTGS', timeline: '3–5 business days' },
                { method: 'Platform Wallet Credit', timeline: 'Instant' },
              ].map(r => (
                <div key={r.method} style={{
                  background: 'var(--surface-2, #F3F2EF)', border: '1px solid var(--border, #E6E4DF)',
                  borderRadius: 12, padding: '14px 18px',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high, #141414)', margin: '0 0 4px' }}>{r.method}</p>
                  <p style={{ fontSize: 12, color: 'var(--brand, #0057FF)', fontWeight: 600, margin: 0 }}>{r.timeline}</p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-low, #909090)' }}>
              Refunds are processed to the original payment method. Bank processing times are outside our control.
            </p>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <FileText style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              5. Dispute Resolution — Consumer Protection Act 2019 (India)
            </h2>
            <p>
              Under the <strong style={{ color: 'var(--text-high, #141414)' }}>Consumer Protection Act, 2019 (CPA 2019)</strong> and the Consumer Protection (E-Commerce) Rules, 2020, customers are entitled to:
            </p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>Raise a complaint within <strong style={{ color: 'var(--text-high, #141414)' }}>30 days</strong> of the delivery date or the contracted delivery date, whichever is later.</li>
              <li>Receive acknowledgement of the complaint within <strong style={{ color: 'var(--text-high, #141414)' }}>48 hours</strong> of submission.</li>
              <li>Receive resolution or an escalation path within <strong style={{ color: 'var(--text-high, #141414)' }}>15 business days</strong> of complaint registration.</li>
              <li>Escalate unresolved disputes to the National Consumer Disputes Redressal Commission (NCDRC) or relevant State Consumer Commission.</li>
            </ul>
            <div style={{
              background: 'var(--surface-2, #F3F2EF)', border: '1px solid var(--border, #E6E4DF)',
              borderRadius: 14, padding: '20px 24px', marginTop: 12, fontFamily: 'var(--font-mono, monospace)', fontSize: 13,
            }}>
              <strong style={{ color: 'var(--brand, #0057FF)', display: 'block', marginBottom: 8 }}>Nodal / Grievance Officer (CPA 2019):</strong>
              Grievance Redressal Officer<br />
              LogisticsEdge Technologies Pvt. Ltd.<br />
              Plot No. 12, Vibhuti Khand, Gomti Nagar, Lucknow — 226010, Uttar Pradesh, India<br />
              Email: <a href="mailto:grievance@logisticsedge.io" style={{ color: 'var(--brand, #0057FF)' }}>grievance@logisticsedge.io</a><br />
              Phone: +91 522 400 1200 &bull; Available Mon–Fri, 9 AM – 6 PM IST
            </div>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <Phone style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              6. Global Customers (EU &amp; US)
            </h2>
            <p>
              For customers in the <strong style={{ color: 'var(--text-high, #141414)' }}>European Union</strong>, disputes may also be submitted via the EU Online Dispute Resolution platform at <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand, #0057FF)' }}>ec.europa.eu/consumers/odr</a>.
            </p>
            <p>
              For <strong style={{ color: 'var(--text-high, #141414)' }}>United States</strong> customers, disputes are governed by commercial arbitration rules under applicable bilateral trade frameworks.
            </p>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <Mail style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              7. How to Raise a Refund Request
            </h2>
            <p>Contact us through any of the following channels, quoting your Order ID and invoice number:</p>
            <div style={{
              background: 'var(--surface-2, #F3F2EF)', border: '1px solid var(--border, #E6E4DF)',
              borderRadius: 14, padding: '20px 24px', fontFamily: 'var(--font-mono, monospace)', fontSize: 13,
            }}>
              Email: <a href="mailto:billing@logisticsedge.io" style={{ color: 'var(--brand, #0057FF)' }}>billing@logisticsedge.io</a><br />
              Support Portal: Dashboard → Help &amp; Support → Raise Ticket<br />
              Phone: 1800-PRE-LMS (Toll Free) &bull; Mon–Fri, 9 AM – 6 PM IST<br />
              Response SLA: 48 hours on business days
            </div>
          </section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--border, #E6E4DF)', fontSize: 13, color: 'var(--text-mid, #525252)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
            <p style={{ margin: 0 }}>&copy; 2026 LogisticsEdge Technologies Pvt. Ltd. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/privacy" style={{ color: 'var(--brand, #0057FF)', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="/terms" style={{ color: 'var(--brand, #0057FF)', textDecoration: 'none' }}>Terms of Service</Link>
              <Link href="/cookies" style={{ color: 'var(--brand, #0057FF)', textDecoration: 'none' }}>Cookie Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
