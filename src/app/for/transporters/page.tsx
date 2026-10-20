// ─── Built for transporters ───────────────────────────────────────────────────
import type { Metadata } from 'next';
import { BuiltForPage } from '@/components/marketing/BuiltForPage';

export const metadata: Metadata = {
  title: 'For transporters',
  description: 'For transporters moving loads on their own and hired trucks: one list of bookings, tracking on any truck through the driver’s phone, a tracking page for customers and GST invoices from the trip.',
  alternates: { canonical: '/for/transporters' },
};

export default function ForTransporters() {
  return (
    <BuiltForPage
      data={{
        kicker: 'Built for transporters',
        image: '/media/modules/allocation.webp',
        title: <>Own trucks and hired trucks, <mark className="mk-mark">one list</mark>.</>,
        lede: 'You move loads for many customers on a mix of your own and hired trucks. LogisticsEdge keeps every booking, truck and trip in one place, with tracking that works on any truck.',
        problems: [
          { title: 'Bookings everywhere', text: 'Loads arrive on calls and WhatsApp and live in a register, a spreadsheet and three people’s heads.' },
          { title: 'Hired trucks you can’t see', text: 'You can’t fit a device in a market truck, so you call the driver for every update.' },
          { title: 'Customers chasing you', text: 'Every customer wants to know where their load is, and asks you instead of checking.' },
        ],
        screens: [
          { name: 'Orders', text: 'Every booking in one list: customer, pickup, drop, weight and deadline.' },
          { name: 'Driver trip link', text: 'Works on hired trucks too: the driver opens it on their phone and their position comes in.' },
          { name: 'Customer Tracking', text: 'A page your customer opens with the order or trip number, without a login.' },
          { name: 'Delivery & POD', text: 'Close the trip at handover with the receiver’s name and any damage deduction.' },
          { name: 'Leads CRM', text: 'Rate requests arrive as leads with the route and the estimate, ready for a call back.' },
        ],
        closing: { title: 'Start with your busiest corridor', text: 'Create a workspace, add a few trucks and send your next driver a trip link.' },
      }}
    />
  );
}
