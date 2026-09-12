import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Database, Server, Globe, Scale } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | LogisticsEdge Logistics',
  description: 'LogisticsEdge data processing and privacy practices — GDPR, DPDP Act 2023, CCPA, and India Consumer Protection Act compliance.',
  alternates: { canonical: '/privacy' },
};

const sectionStyle = { display: 'flex', flexDirection: 'column' as const, gap: 12 };
const h2style = {
  fontSize: 20, fontWeight: 700, color: 'var(--text-high, #141414)', marginBottom: 12,
  display: 'flex', alignItems: 'center', gap: 10,
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://logisticsedge.io" },
    { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://logisticsedge.io/privacy" },
  ]
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div style={{ background: 'var(--surface, #F8F7F4)', color: 'var(--text-high, #141414)', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', background: 'var(--surface-1, #FFFFFF)', border: '1px solid var(--border, #E6E4DF)', borderRadius: 20, padding: '40px 48px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

        {/* Back */}
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
              <ShieldCheck style={{ width: 20, height: 20, color: 'var(--brand, #0057FF)' }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--brand, #0057FF)', fontWeight: 700 }}>
              Legal &amp; Compliance
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 900, letterSpacing: -1, color: 'var(--text-high, #141414)', margin: '0 0 12px' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-mid, #525252)', margin: 0 }}>
            Effective Date: September 1, 2026 &bull; Last Revised: September 2026<br />
            Covers: India (DPDP Act 2023) &bull; EU/UK (GDPR) &bull; California (CCPA)
          </p>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36, lineHeight: 1.8, fontSize: 15, color: 'var(--text-mid, #525252)' }}>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Lock style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              1. Data Controller &amp; Contact Details
            </h2>
            <div style={{
              background: 'var(--surface-2, #F3F2EF)', border: '1px solid var(--border, #E6E4DF)',
              borderRadius: 14, padding: '20px 24px', fontFamily: 'var(--font-mono, monospace)', fontSize: 13,
            }}>
              <strong style={{ color: 'var(--brand, #0057FF)' }}>Precision Logistics Technologies Pvt. Ltd.</strong><br />
              CIN / Registration: U72900UP2024PTC000000 &bull; GSTIN: 09AAACP0000A1Z5<br />
              Registered Address: Plot No. 12, Vibhuti Khand, Gomti Nagar, Lucknow — 226010, Uttar Pradesh, India<br />
              Email: <a href="mailto:privacy@logisticsedge.io" style={{ color: 'var(--brand, #0057FF)' }}>privacy@logisticsedge.io</a> &bull;{' '}
              <a href="mailto:security@logisticsedge.io" style={{ color: 'var(--brand, #0057FF)' }}>security@logisticsedge.io</a><br />
              Grievance Officer (CPA 2019): Grievance Redressal Desk &bull; <a href="mailto:grievance@logisticsedge.io" style={{ color: 'var(--brand, #0057FF)' }}>grievance@logisticsedge.io</a><br />
              DPO (GDPR): Data Protection Operations Desk &bull; <a href="mailto:dpo@logisticsedge.io" style={{ color: 'var(--brand, #0057FF)' }}>dpo@logisticsedge.io</a>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Database style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              2. Data We Collect
            </h2>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>
                <strong>Operational Telematics:</strong> Real-time vehicle GPS coordinates, velocity, fuel levels, ambient trailer temperature, and acceleration data for dispatch optimisation.
              </li>
              <li>
                <strong>Freight &amp; Manifest Information:</strong> Waybill identifiers, bill of lading (BOL), cargo classifications, origin/destination addresses, and proof-of-delivery (POD) timestamps.
              </li>
              <li>
                <strong>Account &amp; Contact Data:</strong> Business name, authorised contact names, business email addresses, and GSTIN for invoicing purposes.
              </li>
              <li>
                <strong>Technical Diagnostics:</strong> IP addresses, browser type, session tokens, and page performance metrics. IP addresses are pseudonymised within 24 hours.
              </li>
              <li>
                <strong>Newsletter Subscriptions:</strong> Work email address — only with your explicit consent (opt-in).
              </li>
            </ul>
            <div style={{
              background: 'rgba(0, 87, 255, 0.05)', border: '1px solid rgba(0, 87, 255, 0.15)',
              borderRadius: 12, padding: '14px 18px', marginTop: 8, fontSize: 13, color: 'var(--text-high, #141414)'
            }}>
              We apply <strong>data minimisation</strong>: we collect only what is necessary for the stated purpose and retain it only as long as required.
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Server style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              3. Legal Basis for Processing
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 4 }}>
              {[
                { label: 'Contractual Necessity', desc: 'Telematics and freight data processed to fulfil your logistics contract.' },
                { label: 'Consent', desc: 'Analytics cookies and newsletter emails — only with your explicit opt-in.' },
                { label: 'Legal Obligation', desc: 'GST invoice records retained for 8 years per Income Tax Act 1961.' },
                { label: 'Legitimate Interest', desc: 'Security monitoring and fraud prevention on platform sessions.' },
              ].map(b => (
                <div key={b.label} style={{
                  background: 'var(--surface-2, #F3F2EF)', border: '1px solid var(--border, #E6E4DF)',
                  borderRadius: 12, padding: '14px 18px',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand, #0057FF)', margin: '0 0 6px' }}>{b.label}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-mid, #525252)', margin: 0 }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Eye style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              4. Cookies &amp; Tracking Technologies
            </h2>
            <p>
              We use strictly necessary session cookies to maintain secure dispatch sessions and store your cookie preferences. Analytics cookies are <strong style={{ color: 'var(--text-high, #141414)' }}>only activated after your explicit consent</strong> via our Cookie Preferences banner — they are off by default.
            </p>
            <p>
              We do <strong>not</strong> use advertising cookies, retargeting pixels, or social media tracking. We do not sell your data to third-party advertisers.
            </p>
            <p>
              See our full <Link href="/cookies" style={{ color: 'var(--brand, #0057FF)', textDecoration: 'underline' }}>Cookie Policy</Link> for a complete list of cookies set, their purpose, and how to manage them.
            </p>
          </section>

          <section style={sectionStyle} id="india">
            <h2 style={h2style}>
              <Scale style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              5. India — DPDP Act 2023
            </h2>
            <p>
              Under the <strong style={{ color: 'var(--text-high, #141414)' }}>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>:
            </p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>You have the right to access your personal data we hold.</li>
              <li>You have the right to correct inaccurate personal data.</li>
              <li>You have the right to erasure (&ldquo;right to be forgotten&rdquo;) where processing was consent-based.</li>
              <li>You have the right to nominate another individual to exercise data rights on your behalf.</li>
              <li>You have the right to withdraw consent at any time without affecting prior lawful processing.</li>
              <li>You have the right to file a complaint with the <strong>Data Protection Board of India</strong> (once constituted).</li>
            </ul>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-mid, #525252)' }}>
              We do not transfer personal data outside India unless adequate protection is ensured as prescribed by the Central Government under Section 16 of the DPDP Act.
            </p>
          </section>

          <section style={sectionStyle} id="gdpr">
            <h2 style={h2style}>
              <Globe style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              6. EU/UK Residents — GDPR &amp; UK DPA 2018
            </h2>
            <p>EU and UK residents have additional rights under the General Data Protection Regulation:</p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong>Right of Access</strong> (Art. 15): Obtain a copy of your personal data within 30 days.</li>
              <li><strong>Right to Rectification</strong> (Art. 16): Correct inaccurate data.</li>
              <li><strong>Right to Erasure</strong> (Art. 17): Delete data where lawful basis no longer applies.</li>
              <li><strong>Right to Restriction</strong> (Art. 18): Restrict processing during disputes.</li>
              <li><strong>Right to Data Portability</strong> (Art. 20): Receive your data in machine-readable format.</li>
              <li><strong>Right to Object</strong> (Art. 21): Object to legitimate-interest processing.</li>
              <li><strong>Right to Lodge a Complaint:</strong> With your local supervisory authority (e.g. ICO in the UK, or relevant EU DPA).</li>
            </ul>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-mid, #525252)' }}>
              For cross-border data transfers, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission.
            </p>
          </section>

          <section style={sectionStyle} id="ccpa">
            <h2 style={h2style}>
              <Globe style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              7. California Residents — CCPA / CPRA
            </h2>
            <p>California residents have rights under the California Consumer Privacy Act (CCPA) as amended by CPRA:</p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong>Right to Know:</strong> Categories and specific pieces of personal information we collect.</li>
              <li><strong>Right to Delete:</strong> Request deletion of personal information (subject to legal retention obligations).</li>
              <li><strong>Right to Opt-Out of Sale/Sharing:</strong> We do <strong>not</strong> sell or share personal information — this right is not applicable but we honour it proactively.</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate for exercising your privacy rights.</li>
              <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information.</li>
            </ul>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-mid, #525252)' }}>
              Submit requests to <a href="mailto:privacy@logisticsedge.io" style={{ color: 'var(--brand, #0057FF)' }}>privacy@logisticsedge.io</a>. We respond within 45 days. We may request verification of identity before processing requests.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <FileText style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              8. Data Retention
            </h2>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>Active account data: Retained for the duration of your contract + 30 days for export.</li>
              <li>GST invoices and freight manifests: 8 years (Income Tax Act 1961 / GST Act 2017).</li>
              <li>Security logs (IP addresses, session tokens): 90 days.</li>
              <li>Analytics data: Aggregated only; no individual retention beyond session.</li>
              <li>Newsletter emails: Until you unsubscribe or withdraw consent.</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <ShieldCheck style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              9. Security Measures
            </h2>
            <p>
              We implement industry-standard technical and organisational measures including: HMAC-SHA256 session signing, HttpOnly / SameSite=Lax cookies, Content Security Policy headers, HSTS with 2-year max-age, and Row-Level Security on our data layer. We conduct periodic security assessments and maintain an incident response process. In the event of a personal data breach, we will notify affected individuals and relevant authorities within the legally mandated timeframe (72 hours under GDPR).
            </p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--border, #E6E4DF)', fontSize: 13, color: 'var(--text-low, #909090)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
            <p style={{ margin: 0 }}>&copy; 2026 Precision Logistics Technologies Pvt. Ltd. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/terms" style={{ color: 'var(--text-mid, #525252)', textDecoration: 'underline' }}>Terms of Service</Link>
              <Link href="/cookies" style={{ color: 'var(--text-mid, #525252)', textDecoration: 'underline' }}>Cookie Policy</Link>
              <Link href="/refund" style={{ color: 'var(--text-mid, #525252)', textDecoration: 'underline' }}>Refund Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
