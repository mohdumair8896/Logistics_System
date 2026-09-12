import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Cookie, ShieldCheck, BarChart2, Settings, Globe } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | LogisticsEdge Logistics',
  description: 'How LogisticsEdge uses cookies and similar tracking technologies — what we set, why, and how to control them.',
  alternates: { canonical: '/cookies' },
};

const sectionStyle = { display: 'flex', flexDirection: 'column' as const, gap: 12 };
const h2style = {
  fontSize: 20, fontWeight: 700, color: 'var(--text-high, #141414)', marginBottom: 12,
  display: 'flex', alignItems: 'center', gap: 10,
};

type CookieRow = { name: string; type: string; purpose: string; duration: string };

function CookieTable({ cookies }: { cookies: CookieRow[] }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 12, border: '1px solid var(--border, #E6E4DF)', borderRadius: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border, #E6E4DF)', background: 'var(--surface-2, #F3F2EF)' }}>
            {['Name', 'Type', 'Purpose', 'Duration'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: 'var(--text-high, #141414)', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cookies.map((c, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border, #E6E4DF)', background: i % 2 === 0 ? 'var(--surface, #F8F7F4)' : 'var(--surface-1, #FFFFFF)' }}>
              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--brand, #0057FF)', fontWeight: 600 }}>{c.name}</td>
              <td style={{ padding: '12px 14px', color: 'var(--text-mid, #525252)' }}>{c.type}</td>
              <td style={{ padding: '12px 14px', color: 'var(--text-high, #141414)' }}>{c.purpose}</td>
              <td style={{ padding: '12px 14px', color: 'var(--text-low, #909090)', whiteSpace: 'nowrap' }}>{c.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://logisticsedge.io" },
    { "@type": "ListItem", "position": 2, "name": "Cookie Policy", "item": "https://logisticsedge.io/cookies" },
  ]
};

export default function CookiePolicyPage() {
  const essentialCookies: CookieRow[] = [
    { name: 'lms_session', type: 'Essential', purpose: 'Secures your authenticated dispatch session using HMAC-SHA256 signing. Required for all dashboard functionality.', duration: '8 hours' },
    { name: 'logisticsedge_cookie_consent_v1', type: 'Essential', purpose: 'Stores your cookie preferences so the banner does not reappear on every page load.', duration: '365 days' },
  ];

  const analyticsCookies: CookieRow[] = [
    { name: '_plausible (if enabled)', type: 'Analytics', purpose: 'Privacy-first, cookieless page view analytics. No personal data is stored. Requires your explicit consent.', duration: 'Session only' },
  ];

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
              <Cookie style={{ width: 20, height: 20, color: 'var(--brand, #0057FF)' }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--brand, #0057FF)', fontWeight: 700 }}>
              Legal &amp; Compliance
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 900, letterSpacing: -1, color: 'var(--text-high, #141414)', margin: '0 0 12px' }}>
            Cookie Policy
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-mid, #525252)', margin: 0 }}>
            Effective: September 1, 2026 &bull; Applies to all LogisticsEdge web properties &bull; GDPR Article 13 &bull; DPDP Act 2023
          </p>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36, lineHeight: 1.8, fontSize: 15, color: 'var(--text-mid, #525252)' }}>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Cookie style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files placed on your device by websites you visit. They are widely used to make sites function, work more efficiently, and to provide analytics information to site owners. This policy explains every cookie and similar technology we use, why we use it, and how you can control it.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <ShieldCheck style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              2. Strictly Necessary Cookies
            </h2>
            <p>
              These cookies are required for the platform to operate. They cannot be disabled. They do not track browsing activity across other websites.
            </p>
            <CookieTable cookies={essentialCookies} />
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <BarChart2 style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              3. Analytics Cookies (Consent Required)
            </h2>
            <p>
              We use <strong style={{ color: 'var(--text-high, #141414)' }}>privacy-first, cookieless analytics</strong> (Plausible Analytics, if enabled). No personal data or cross-site tracking occurs. These are only activated after you give explicit consent via our cookie banner. You can withdraw consent at any time.
            </p>
            <CookieTable cookies={analyticsCookies} />
            <div style={{
              background: 'rgba(0, 87, 255, 0.06)', border: '1px solid rgba(0, 87, 255, 0.2)',
              borderRadius: 12, padding: '14px 18px', marginTop: 8, fontSize: 13, color: 'var(--text-high, #141414)'
            }}>
              We do <strong>not</strong> use advertising cookies, retargeting pixels, social media tracking pixels, or sell your data to third parties.
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Settings style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              4. How to Manage &amp; Withdraw Consent
            </h2>
            <p>You have full control over non-essential cookies:</p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>Cookie Banner:</strong> Use the &ldquo;Customize&rdquo; option in our cookie banner at the bottom of the page to accept or reject analytics cookies.</li>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>Browser Settings:</strong> Most browsers allow you to block or delete cookies. See your browser&apos;s help documentation for instructions.</li>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>Clear localStorage:</strong> Open browser DevTools → Application → Local Storage → delete <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--brand, #0057FF)', background: 'var(--surface-2, #F3F2EF)', padding: '2px 6px', borderRadius: 4 }}>logisticsedge_cookie_consent_v1</code> to reset your preferences.</li>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>Opt-Out Links:</strong> Plausible Analytics operates cookieless and does not require a separate opt-out link.</li>
            </ul>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-low, #909090)' }}>
              Withdrawing consent for analytics cookies will not affect your ability to use the platform. Withdrawing consent for strictly necessary cookies is not possible as they are essential for security and authentication.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Globe style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              5. Jurisdiction &amp; Legal Basis
            </h2>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>India (DPDP Act 2023):</strong> Consent is our lawful basis for analytics processing. Strictly necessary cookies are processed under &ldquo;legitimate interest&rdquo; for platform security.</li>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>European Union (GDPR Article 6):</strong> Strictly necessary cookies → legitimate interest. Analytics → explicit consent (opt-in). Analytics are not activated until you click &ldquo;Accept All.&rdquo;</li>
              <li><strong style={{ color: 'var(--text-high, #141414)' }}>United States (California CCPA):</strong> We do not sell or share personal information. Cookies we set do not constitute &ldquo;selling&rdquo; under CCPA. California residents may submit a data access/deletion request to <a href="mailto:privacy@logisticsedge.io" style={{ color: 'var(--brand, #0057FF)' }}>privacy@logisticsedge.io</a>.</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Cookie style={{ width: 18, height: 18, color: 'var(--brand, #0057FF)' }} />
              6. Changes to This Policy
            </h2>
            <p>
              We will notify you of material changes by updating the &ldquo;Effective Date&rdquo; above and, where required by law, displaying a notice on the platform. Continued use of the platform after changes constitutes acceptance of the revised policy.
            </p>
            <p>
              For cookie-related questions or to exercise your data rights, contact: <a href="mailto:privacy@logisticsedge.io" style={{ color: 'var(--brand, #0057FF)' }}>privacy@logisticsedge.io</a>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--border, #E6E4DF)', fontSize: 13, color: 'var(--text-mid, #525252)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
            <p style={{ margin: 0 }}>&copy; 2026 Precision Logistics Technologies Pvt. Ltd. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/privacy" style={{ color: 'var(--brand, #0057FF)', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="/terms" style={{ color: 'var(--brand, #0057FF)', textDecoration: 'none' }}>Terms of Service</Link>
              <Link href="/refund" style={{ color: 'var(--brand, #0057FF)', textDecoration: 'none' }}>Refund Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
