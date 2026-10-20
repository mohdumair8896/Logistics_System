// ─── Trust and security ───────────────────────────────────────────────────────
// Every statement here is checked against the code or configuration (cited inline). No certification is claimed
// that the company does not hold. Process commitments follow docs/INCIDENT_RESPONSE.md.
// Research: reports/LogisticsEdge growth roadmap India.md (trust and DPDP section).

import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell, PageHero, Band, CardGrid } from '@/components/marketing/Page';

export const metadata: Metadata = {
  title: 'Trust and security',
  description: 'Where LogisticsEdge stores your data, how it is protected, who else handles it, our role under India’s DPDP Act, and what happens if something goes wrong.',
  alternates: { canonical: '/trust' },
};

const PROTECTIONS = [
  // proxy.ts: HTTPS redirect, HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy
  { title: 'Encrypted in transit', text: 'The site only answers over HTTPS, and browsers are told to keep using HTTPS (HSTS). Security headers block framing, content sniffing and scripts from unknown sources.' },
  // auth/login: bcrypt; session-token.ts: signed, httpOnly cookie, 8-hour expiry
  { title: 'Passwords and sessions', text: 'Passwords are stored as bcrypt hashes, never as text. Sign-in sessions are signed, httpOnly cookies that expire after 8 hours.' },
  // tenancy.ts + drizzle/0004_tenancy_rls.sql
  { title: 'One workspace, one company', text: 'Every query is scoped to one workspace, and the database carries row-level security policies for the same rule, so one company’s data is not visible to another.' },
  // session-token.ts: driver link tokens
  { title: 'Driver links that expire', text: 'A driver’s trip link is signed, works for one vehicle and one trip only, and expires after 3 days. It cannot be used to sign in.' },
  // proxy.ts: Permissions-Policy
  { title: 'Location only where needed', text: 'Browsers are told that only the driver trip page may ask for location. Every other page is blocked from it.' },
  // api/public/leads: rate limit + honeypot
  { title: 'Public forms are limited', text: 'The rate calculator accepts a few requests per address in a short window and silently discards automated submissions.' },
];

const SUBPROCESSORS = [
  { name: 'Neon', role: 'Database hosting', where: 'AWS Singapore (ap-southeast-1)' },
  { name: 'Vercel', role: 'Application hosting', where: 'Singapore region (sin1)' },
  { name: 'Ably', role: 'Real-time updates between the driver link and your screens', where: 'Ably’s global network' },
  { name: 'OpenStreetMap tile servers', role: 'Map images on tracking screens; they receive the viewer’s IP address', where: 'OpenStreetMap Foundation' },
  { name: 'Google Analytics, Microsoft Clarity, PostHog', role: 'Website analytics, only if switched on and only after a visitor accepts analytics', where: 'Each provider’s own infrastructure' },
];

export default function TrustPage() {
  return (
    <MarketingShell>
      <PageHero
        kicker="Trust and security"
        title={<>What happens to <mark className="mk-mark">your data</mark>.</>}
        lede="Where it is stored, how it is protected, who else handles it and what we do if something goes wrong. Plain answers, and only what we actually do."
      />

      <Band id="storage" kicker="Storage" title="Where your data lives">
        <div className="mk-prose">
          <p>
            Your workspace data is stored in a managed PostgreSQL database run by <b>Neon</b> on AWS in <b>Singapore</b>{' '}
            (ap-southeast-1). The application runs on <b>Vercel</b> in its Singapore region, next to the database.
            Your data is not stored in India today. If you need it to be, tell us; it shapes our roadmap.
          </p>
        </div>
      </Band>

      <Band id="protection" kicker="Protection" title="How it is protected" sand>
        <CardGrid items={PROTECTIONS} />
      </Band>

      <Band id="subprocessors" kicker="Sub-processors" title="Who else handles data for us">
        <div className="mk-compare-wrap">
          <table className="mk-compare mk-compare-3">
            <caption className="mk-sr">Sub-processors</caption>
            <thead>
              <tr><th scope="col">Provider</th><th scope="col">What for</th><th scope="col">Where</th></tr>
            </thead>
            <tbody>
              {SUBPROCESSORS.map(s => (
                <tr key={s.name}><th scope="row">{s.name}</th><td>{s.role}</td><td>{s.where}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mk-fine">We update this list before adding a provider that handles your workspace data.</p>
      </Band>

      <Band id="dpdp" kicker="India’s DPDP Act" title="Our role under the DPDP Act" sand>
        <div className="mk-prose">
          <p>
            <b>For the data you put into your workspace</b> (drivers, vehicles, trips, locations, consignees and your
            customers), your company decides why it is collected, so you are the <i>Data Fiduciary</i> and we act as your
            <i> Data Processor</i>. We process it only to run the service for you, under our terms and a data processing
            agreement you can ask for.
          </p>
          <p>
            <b>For our own records</b> (people who use this website’s rate calculator, our customers’ account and billing
            contacts), we are the Data Fiduciary. The <Link href="/privacy">privacy policy</Link> explains those uses.
          </p>
          <p>
            The DPDP Rules were notified in November 2025. Most duties on notice, consent, security, breach reporting and
            erasure start in May 2027, and we are building towards them now: retention settings, a breach process, and
            notices on the driver trip link.
          </p>
        </div>
      </Band>

      <Band id="incidents" kicker="Incidents" title="If something goes wrong">
        <div className="mk-prose">
          <p>
            We report reportable cyber incidents to CERT-In within six hours of noticing them, as its directions require,
            and we tell affected customers without delay, with what happened, what data was involved and what we are doing.
            The DPDP breach rules add a detailed report within 72 hours once they apply.
          </p>
          <p>
            Found a vulnerability? Write to <a href="mailto:security@logisticsedge.io">security@logisticsedge.io</a>.
            Our <a href="/.well-known/security.txt">security.txt</a> has the details.
          </p>
        </div>
      </Band>

      <Band id="certifications" kicker="Certifications" title="What we do not claim" sand>
        <div className="mk-prose">
          <p>
            We do not hold ISO 27001 or a SOC 2 report yet, and there is no such thing as a &ldquo;DPDP certificate&rdquo;.
            When we complete an audit we will publish it here. Until then we will not show badges we have not earned.
          </p>
          <p>
            On request we send a data processing agreement, this sub-processor list and answers to your security
            questionnaire: <a href="mailto:security@logisticsedge.io">security@logisticsedge.io</a>.
          </p>
        </div>
      </Band>
    </MarketingShell>
  );
}
