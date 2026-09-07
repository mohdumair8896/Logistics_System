import React from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, XCircle, Clock, Phone, Mail, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | LogiFlow Logistics',
  description: 'LogiFlow freight cancellation terms, refund eligibility, and dispute resolution process under the Consumer Protection Act 2019.',
  alternates: { canonical: '/refund' },
};

const section = { display: 'flex', flexDirection: 'column' as const, gap: 12 };
const h2style = {
  fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12,
  display: 'flex', alignItems: 'center', gap: 10,
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://logiflow.io" },
    { "@type": "ListItem", "position": 2, "name": "Refund Policy", "item": "https://logiflow.io/refund" },
  ]
};

export default function RefundPolicyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div style={{ background: '#020617', color: '#e2e8f0', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>

        {/* Back link */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, color: '#94a3b8', textDecoration: 'none',
            padding: '8px 16px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 32, marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RefreshCw style={{ width: 20, height: 20, color: '#fbbf24' }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#fbbf24', fontWeight: 700 }}>
              Legal &amp; Compliance
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 900, letterSpacing: -1, color: '#fff', margin: '0 0 12px' }}>
            Refund &amp; Cancellation Policy
          </h1>
          <p style={{ fontSize: 14, color: '#a8b8c8', margin: 0 }}>
            Effective Date: September 1, 2026 &bull; Jurisdiction: India (Consumer Protection Act 2019) &bull; Global customers: see Section 6
          </p>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, lineHeight: 1.85, fontSize: 15, color: '#cbd5e1' }}>

          <section style={section}>
            <h2 style={h2style}>
              <Clock style={{ width: 18, height: 18, color: '#38bdf8' }} />
              1. Cancellation Window
            </h2>
            <p>
              Orders booked through the LogiFlow platform may be cancelled <strong style={{ color: '#fff' }}>free of charge within 2 hours</strong> of booking confirmation, provided the assigned vehicle has not yet been dispatched from the origin facility.
            </p>
            <div style={{
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 14, padding: '16px 20px', marginTop: 8,
            }}>
              <p style={{ margin: 0, fontSize: 13 }}>
                <strong style={{ color: '#fbbf24' }}>Post-dispatch cancellations:</strong> If the vehicle has already been dispatched, a <strong>cancellation fee of 15% of the confirmed freight value</strong> applies to cover fuel, driver compensation, and cross-dock slot costs already incurred.
              </p>
            </div>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <FileText style={{ width: 18, height: 18, color: '#38bdf8' }} />
              2. Refund Eligibility
            </h2>
            <p>Refunds are issued under the following circumstances:</p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong>Service failure:</strong> LogiFlow failed to deliver within the confirmed delivery window and no force majeure event applies — 100% freight refund.</li>
              <li><strong>Cargo damage in transit:</strong> Verified damage attributable to carrier handling — refund up to declared cargo value subject to our liability limit of ₹10,00,000 per consignment (or as declared in the manifest).</li>
              <li><strong>Duplicate payment:</strong> Duplicate charge identified on our payment gateway — 100% refund within 5–7 business days.</li>
              <li><strong>Pre-dispatch cancellation:</strong> Cancelled within the 2-hour window — 100% refund of any prepaid freight charges.</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <XCircle style={{ width: 18, height: 18, color: '#38bdf8' }} />
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
              <RefreshCw style={{ width: 18, height: 18, color: '#38bdf8' }} />
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
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '14px 18px',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{r.method}</p>
                  <p style={{ fontSize: 12, color: '#a8b8c8', margin: 0 }}>{r.timeline}</p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: '#a8b8c8' }}>
              Refunds are processed to the original payment method. Bank processing times are outside our control.
            </p>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <FileText style={{ width: 18, height: 18, color: '#38bdf8' }} />
              5. Dispute Resolution — Consumer Protection Act 2019 (India)
            </h2>
            <p>
              Under the <strong style={{ color: '#fff' }}>Consumer Protection Act, 2019 (CPA 2019)</strong> and the Consumer Protection (E-Commerce) Rules, 2020, customers are entitled to:
            </p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>Raise a complaint within <strong>30 days</strong> of the delivery date or the contracted delivery date, whichever is later.</li>
              <li>Receive acknowledgement of the complaint within <strong>48 hours</strong> of submission.</li>
              <li>Receive resolution or an escalation path within <strong>15 business days</strong> of complaint registration.</li>
              <li>Escalate unresolved disputes to the National Consumer Disputes Redressal Commission (NCDRC) or relevant State Consumer Commission.</li>
            </ul>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '20px 24px', marginTop: 12, fontFamily: 'monospace', fontSize: 13,
            }}>
              <strong style={{ color: '#fbbf24', display: 'block', marginBottom: 8 }}>Nodal / Grievance Officer (CPA 2019):</strong>
              {/* TODO: Add your Grievance Officer name */}Grievance Officer<br />
              Precision Logistics Technologies Pvt. Ltd.<br />
              {/* TODO: Replace with actual registered address */}
              Plot No. 12, Vibhuti Khand, Gomti Nagar, Lucknow — 226010, Uttar Pradesh, India<br />
              Email: <a href="mailto:grievance@logiflow.io" style={{ color: '#38bdf8' }}>grievance@logiflow.io</a><br />
              {/* TODO: Add actual phone number */}
              Phone: Contact via email &bull; Available Mon–Fri, 9 AM – 6 PM IST
            </div>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <Phone style={{ width: 18, height: 18, color: '#38bdf8' }} />
              6. Global Customers (EU &amp; US)
            </h2>
            <p>
              For customers in the <strong style={{ color: '#fff' }}>European Union</strong>, disputes may also be submitted via the EU Online Dispute Resolution platform at <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>ec.europa.eu/consumers/odr</a>.
            </p>
            <p>
              For <strong style={{ color: '#fff' }}>United States</strong> customers, disputes are governed by the laws of the State of [Your State], and may be resolved through binding arbitration under the AAA Commercial Arbitration Rules.
            </p>
          </section>

          <section style={section}>
            <h2 style={h2style}>
              <Mail style={{ width: 18, height: 18, color: '#38bdf8' }} />
              7. How to Raise a Refund Request
            </h2>
            <p>Contact us through any of the following channels, quoting your Order ID and invoice number:</p>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '20px 24px', fontFamily: 'monospace', fontSize: 13,
            }}>
              Email: <a href="mailto:billing@logiflow.io" style={{ color: '#38bdf8' }}>billing@logiflow.io</a><br />
              Support Portal: Dashboard → Help &amp; Support → Raise Ticket<br />
              {/* TODO: Add actual phone number */}
              Phone: Contact via email or support portal<br />
              Response SLA: 48 hours on business days
            </div>
          </section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: '#a8b8c8' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
            <p style={{ margin: 0 }}>&copy; 2026 Precision Logistics Technologies Pvt. Ltd. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/privacy" style={{ color: '#a8b8c8', textDecoration: 'underline' }}>Privacy Policy</Link>
              <Link href="/terms" style={{ color: '#a8b8c8', textDecoration: 'underline' }}>Terms of Service</Link>
              <Link href="/cookies" style={{ color: '#a8b8c8', textDecoration: 'underline' }}>Cookie Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
