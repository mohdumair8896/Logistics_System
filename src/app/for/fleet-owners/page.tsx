// ─── Built for fleet owners ───────────────────────────────────────────────────
import type { Metadata } from 'next';
import { BuiltForPage } from '@/components/marketing/BuiltForPage';

export const metadata: Metadata = {
  title: 'For fleet owners',
  description: 'For owners running their own trucks in India: keep trucks loaded, know where they are without calling, catch expiring licences early and bill straight from the delivered trip.',
  alternates: { canonical: '/for/fleet-owners' },
};

export default function ForFleetOwners() {
  return (
    <BuiltForPage
      data={{
        kicker: 'Built for fleet owners',
        image: '/media/modules/corridor-tracking.webp',
        title: <>Keep your own trucks <mark className="mk-mark">earning</mark>.</>,
        lede: 'You own the trucks, so an empty day or a stopped truck costs you directly. LogisticsEdge shows what is waiting, what is moving and what needs a look, on one screen.',
        problems: [
          { title: 'Trucks standing idle', text: 'A booking comes in on the phone after the free truck has already left empty.' },
          { title: 'Calling drivers all day', text: 'The only way to know where a truck is: call the driver, who is on the highway.' },
          { title: 'Papers that lapse', text: 'A licence runs out and nobody notices until the truck is stopped.' },
        ],
        screens: [
          { name: 'Today', text: 'Loads waiting for a truck, trips on the road and drivers who need attention.' },
          { name: 'Allocation', text: 'Waiting loads next to the trucks and drivers that are free right now.' },
          { name: 'Drivers', text: 'Licences expiring within 30 days and unverified documents, listed before they stop a truck.' },
          { name: 'Corridor Tracking', text: 'The last position from the driver’s phone on each trip. No device to fit.' },
          { name: 'Invoices & Billing', text: 'The GST invoice raised from the delivered trip, as a PDF you can mark paid.' },
        ],
        closing: { title: 'Run a week of trips through it', text: 'Add your trucks and drivers, take your next bookings in LogisticsEdge and see the difference on Today.' },
      }}
    />
  );
}
