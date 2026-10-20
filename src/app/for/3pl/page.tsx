// ─── Built for 3PLs ───────────────────────────────────────────────────────────
import type { Metadata } from 'next';
import { BuiltForPage } from '@/components/marketing/BuiltForPage';

export const metadata: Metadata = {
  title: 'For 3PLs',
  description: 'For third-party logistics providers moving road freight for several shippers: orders by customer, a tracking page to share, proof of delivery on record and GST invoices per trip.',
  alternates: { canonical: '/for/3pl' },
};

export default function For3pl() {
  return (
    <BuiltForPage
      data={{
        kicker: 'Built for 3PLs',
        image: '/media/modules/delivery-pod.webp',
        title: <>Every shipper’s loads, <mark className="mk-mark">on record</mark>.</>,
        lede: 'You run road freight for several shippers, and each one wants updates, proof and correct invoices. LogisticsEdge keeps the trip, the proof and the invoice together for every load.',
        problems: [
          { title: 'Proof that goes missing', text: 'A shipper disputes a damage deduction and the delivery photo is lost in someone’s chat.' },
          { title: 'Status calls from shippers', text: 'Your team spends the day answering “where is it?” for every customer.' },
          { title: 'Invoices that don’t match', text: 'Trip details are retyped into the invoice and the numbers drift from what happened.' },
        ],
        screens: [
          { name: 'Orders', text: 'Bookings by customer, with pickup, drop, weight and deadline.' },
          { name: 'Customer Tracking', text: 'A tracking page your shipper opens with the order or trip number, no login.' },
          { name: 'Delivery & POD', text: 'The receiver’s name and any damage deduction recorded when the trip closes.' },
          { name: 'Invoices & Billing', text: 'The GST invoice built from the delivered trip, less any deduction, as a PDF.' },
        ],
        closing: { title: 'Bring one shipper on first', text: 'Run one customer’s loads through LogisticsEdge and share the tracking page with them.' },
      }}
    />
  );
}
