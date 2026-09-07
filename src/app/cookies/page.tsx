import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Cookie, ShieldCheck, BarChart2, Settings, Globe } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | LogiFlow Logistics',
  description: 'How LogiFlow uses cookies and similar tracking technologies — what we set, why, and how to control them.',
};

const sectionStyle = { display: 'flex', flexDirection: 'column' as const, gap: 12 };
const h2style = {
  fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12,
  display: 'flex', alignItems: 'center', gap: 10,
};

type CookieRow = { name: string; type: string; purpose: string; duration: string };

function CookieTable({ cookies }: { cookies: CookieRow[] }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {['Name', 'Type', 'Purpose', 'Duration'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#fbbf24', fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cookies.map((c, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#38bdf8' }}>{c.name}</td>
              <td style={{ padding: '10px 12px', color: '#a8b8c8' }}>{c.type}</td>
              <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{c.purpose}</td>
              <td style={{ padding: '10px 12px', color: '#a8b8c8', whiteSpace: 'nowrap' }}>{c.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiePolicyPage() {
  const essentialCookies: CookieRow[] = [
    { name: 'lf_session', type: 'Essential', purpose: 'Secures your authenticated dispatch session using HMAC-SHA256 signing. Required for all dashboard functionality.', duration: '24 hours' },
    { name: 'logiflow_cookie_consent_v1', type: 'Essential', purpose: 'Stores your cookie preferences so the banner does not reappear on every page load.', duration: '365 days' },
  ];

  const analyticsCookies: CookieRow[] = [
    { name: '_plausible (if enabled)', type: 'Analytics', purpose: 'Privacy-first, cookieless page view analytics. No personal data is stored. Requires your explicit consent.', duration: 'Session only' },
  ];

  return (
    <div style={{ background: '#020617', color: '#e2e8f0', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>

        {/* Back */}
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
              <Cookie style={{ width: 20, height: 20, color: '#fbbf24' }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#fbbf24', fontWeight: 700 }}>
              Legal &amp; Compliance
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 900, letterSpacing: -1, color: '#fff', margin: '0 0 12px' }}>
            Cookie Policy
          </h1>
          <p style={{ fontSize: 14, color: '#a8b8c8', margin: 0 }}>
            Effective: September 1, 2026 &bull; Applies to all LogiFlow web properties &bull; GDPR Article 13 &bull; DPDP Act 2023
          </p>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, lineHeight: 1.85, fontSize: 15, color: '#cbd5e1' }}>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Cookie style={{ width: 18, height: 18, color: '#38bdf8' }} />
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files placed on your device by websites you visit. They are widely used to make sites function, work more efficiently, and to provide analytics information to site owners. This policy explains every cookie and similar technology we use, why we use it, and how you can control it.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <ShieldCheck style={{ width: 18, height: 18, color: '#38bdf8' }} />
              2. Strictly Necessary Cookies
            </h2>
            <p>
              These cookies are required for the platform to operate. They cannot be disabled. They do not track browsing activity across other websites.
            </p>
            <CookieTable cookies={essentialCookies} />
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <BarChart2 style={{ width: 18, height: 18, color: '#38bdf8' }} />
              3. Analytics Cookies (Consent Required)
            </h2>
            <p>
              We use <strong style={{ color: '#fff' }}>privacy-first, cookieless analytics</strong> (Plausible Analytics, if enabled). No personal data or cross-site tracking occurs. These are only activated after you give explicit consent via our cookie banner. You can withdraw consent at any time.
            </p>
            <CookieTable cookies={analyticsCookies} />
            <div style={{
              background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 12, padding: '14px 18px', marginTop: 8, fontSize: 13,
            }}>
              We do <strong>not</strong> use advertising cookies, retargeting pixels, social media tracking pixels, or sell your data to third parties.
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Settings style={{ width: 18, height: 18, color: '#38bdf8' }} />
              4. How to Manage &amp; Withdraw Consent
            </h2>
            <p>You have full control over non-essential cookies:</p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong>Cookie Banner:</strong> Use the &ldquo;Customize&rdquo; option in our cookie banner at the bottom of the page to accept or reject analytics cookies.</li>
              <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies. See your browser&apos;s help documentation for instructions.</li>
              <li><strong>Clear localStorage:</strong> Open browser DevTools → Application → Local Storage → delete <code style={{ fontFamily: 'monospace', color: '#38bdf8' }}>logiflow_cookie_consent_v1</code> to reset your preferences.</li>
              <li><strong>Opt-Out Links:</strong> Plausible Analytics operates cookieless and does not require a separate opt-out link.</li>
            </ul>
            <p style={{ marginTop: 8, fontSize: 13, color: '#a8b8c8' }}>
              Withdrawing consent for analytics cookies will not affect your ability to use the platform. Withdrawing consent for strictly necessary cookies is not possible as they are essential for security and authentication.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Globe style={{ width: 18, height: 18, color: '#38bdf8' }} />
              5. Jurisdiction &amp; Legal Basis
            </h2>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong>India (DPDP Act 2023):</strong> Consent is our lawful basis for analytics processing. Strictly necessary cookies are processed under &ldquo;legitimate interest&rdquo; for platform security.</li>
              <li><strong>European Union (GDPR Article 6):</strong> Strictly necessary cookies → legitimate interest. Analytics → explicit consent (opt-in). Analytics are not activated until you click &ldquo;Accept All.&rdquo;</li>
              <li><strong>United States (California CCPA):</strong> We do not sell or share personal information. Cookies we set do not constitute &ldquo;selling&rdquo; under CCPA. California residents may submit a data access/deletion request to <a href="mailto:privacy@logiflow.io" style={{ color: '#38bdf8' }}>privacy@logiflow.io</a>.</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2style}>
              <Cookie style={{ width: 18, height: 18, color: '#38bdf8' }} />
              6. Changes to This Policy
            </h2>
            <p>
              We will notify you of material changes by updating the &ldquo;Effective Date&rdquo; above and, where required by law, displaying a notice on the platform. Continued use of the platform after changes constitutes acceptance of the revised policy.
            </p>
            <p>
              For cookie-related questions or to exercise your data rights, contact: <a href="mailto:privacy@logiflow.io" style={{ color: '#38bdf8' }}>privacy@logiflow.io</a>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: '#a8b8c8' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
            <p style={{ margin: 0 }}>&copy; 2026 [Your Company Legal Name]. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/privacy" style={{ color: '#a8b8c8', textDecoration: 'underline' }}>Privacy Policy</Link>
              <Link href="/terms" style={{ color: '#a8b8c8', textDecoration: 'underline' }}>Terms of Service</Link>
              <Link href="/refund" style={{ color: '#a8b8c8', textDecoration: 'underline' }}>Refund Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
