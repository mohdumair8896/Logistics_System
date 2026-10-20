// ─── Comparison: LogisticsEdge vs Excel and WhatsApp groups ───────────────────
// Against the status quo, not a competitor (research: reports/LogisticsEdge growth roadmap India.md, item 23).
// Every LogisticsEdge statement describes what the app does today.

import type { Metadata } from 'next';
import { MarketingShell, PageHero, Band, CompareTable, CardGrid, ClosingCta } from '@/components/marketing/Page';

export const metadata: Metadata = {
  title: 'LogisticsEdge vs Excel and WhatsApp groups',
  description: 'Where a register, Excel and WhatsApp groups work for running trucks, where they break, and what changes with one shared list of bookings, trucks, trips and invoices.',
  alternates: { canonical: '/compare/excel-and-whatsapp' },
};

const ROWS = [
  { label: 'Taking a booking', a: 'A line in the register or a new Excel row, often typed again later', b: 'One order with customer, pickup, drop, weight and deadline, used all the way to the invoice' },
  { label: 'Finding a free truck', a: 'Ask in the group or call around', b: 'Loads waiting for a truck listed next to the trucks and drivers that are free' },
  { label: '“Where is the truck?”', a: 'Call the driver, who may be driving', b: 'The last position sent from the driver’s phone, on the trip' },
  { label: 'Updating your customer', a: 'Forward screenshots and voice notes', b: 'A tracking page your customer opens with the order or trip number, no login' },
  { label: 'Licence expiry', a: 'Someone has to remember', b: 'Licences expiring within 30 days, and unverified documents, listed on Today' },
  { label: 'Proof of delivery', a: 'A photo somewhere in a chat', b: 'The trip closed with the receiver’s name and any damage deduction' },
  { label: 'GST invoice', a: 'Typed into Excel or Tally from the trip details', b: 'Raised from the delivered trip as a PDF, with the reverse-charge GST worked out' },
  { label: 'Cost', a: 'Free, and everyone already knows it', b: 'A monthly or yearly plan per workspace' },
];

export default function CompareExcelWhatsApp() {
  return (
    <MarketingShell>
      <PageHero
        kicker="Compare"
        title={<>LogisticsEdge vs <mark className="mk-mark">Excel and WhatsApp</mark></>}
        lede="Most transporters run on a register, a spreadsheet and a few WhatsApp groups. It works until the day gets busy. Here is what changes, and when you don’t need to change."
      />
      <Band id="side-by-side" kicker="Side by side" title="The same day, two ways">
        <CompareTable caption="Excel and WhatsApp compared with LogisticsEdge" a="Excel + WhatsApp" b="LogisticsEdge" rows={ROWS} />
      </Band>
      <Band id="when" kicker="Be honest" title="When Excel and WhatsApp are enough" sand>
        <CardGrid items={[
          { title: 'One person, a few trucks', text: 'If one person takes every booking and knows where every truck is, a spreadsheet costs less and works.' },
          { title: 'Where it starts to break', text: 'More dispatchers, hired trucks, customers asking for updates, and invoices raised days after delivery. Details get typed twice and lost in chats.' },
          { title: 'What stays the same', text: 'Drivers keep their phones and WhatsApp. The trip link opens in the phone’s browser, with no app to install.' },
        ]} />
      </Band>
      <ClosingCta title="Try it on one corridor first" text="Set up a workspace, add a few trucks and run your next loads through it. No card needed to create the workspace." />
    </MarketingShell>
  );
}
