// ─── Marketing footer (home and pricing) ──────────────────────────────────────
// Links only. No newsletter: there is nothing behind one yet. A giant wordmark runs off the bottom edge.

import Link from 'next/link';
import { BrandMark } from '@/components/ui/BrandMark';
import { WhatsAppFab } from './WhatsAppFab';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/#how', label: 'How it works' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/#quote', label: 'Get a rate' },
      { href: '/track', label: 'Track a shipment' },
      { href: '/compare/excel-and-whatsapp', label: 'vs Excel and WhatsApp' },
      { href: '/compare/gps-devices', label: 'Phone links vs GPS devices' },
    ],
  },
  {
    title: 'Built for',
    links: [
      { href: '/for/fleet-owners', label: 'Fleet owners' },
      { href: '/for/transporters', label: 'Transporters' },
      { href: '/for/3pl', label: '3PLs' },
    ],
  },
  {
    title: 'Your workspace',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/pricing', label: 'Start a workspace' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { href: '/trust', label: 'Trust and security' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/refund', label: 'Refunds' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-wrap">
        <div className="mk-footer-grid">
          <div>
            <Link href="/" className="mk-footer-brand">
              <BrandMark size={28} />
              LogisticsEdge
            </Link>
            <p className="mk-footer-about">
              Software for running road freight in India: bookings, trucks, drivers, tracking, delivery and GST invoices.
            </p>
          </div>
          {COLUMNS.map(col => (
            <nav key={col.title} aria-label={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map(l => (
                  <li key={l.label}><Link href={l.href}>{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mk-footer-base">
          <p>© {new Date().getFullYear()} LogisticsEdge Technologies Pvt. Ltd.</p>
          <p className="mk-footer-tag">Built for road freight in India</p>
        </div>
      </div>
      <p className="mk-footer-wordmark" aria-hidden="true">LogisticsEdge</p>
      <WhatsAppFab />
    </footer>
  );
}
