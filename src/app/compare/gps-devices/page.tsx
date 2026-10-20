// ─── Comparison: phone trip links vs GPS devices ──────────────────────────────
// Honest trade-offs: the phone link reports only while the trip page is open and the phone has signal; devices
// don't depend on the driver. LogisticsEdge does not connect GPS hardware today.

import type { Metadata } from 'next';
import { MarketingShell, PageHero, Band, CompareTable, CardGrid, ClosingCta } from '@/components/marketing/Page';

export const metadata: Metadata = {
  title: 'Phone trip links vs GPS devices for truck tracking',
  description: 'Tracking trucks with a trip link on the driver’s phone compared with fitted GPS devices: cost, installation, hired trucks, reliability and what each is good for.',
  alternates: { canonical: '/compare/gps-devices' },
};

const ROWS = [
  { label: 'To start', a: 'Buy a device for each truck, then get it fitted', b: 'Send the driver a trip link; it opens in the phone’s browser' },
  { label: 'Hired or market trucks', a: 'Usually not fitted, and you don’t own them', b: 'Works the same as your own trucks' },
  { label: 'Running cost', a: 'Device, installation and a recharge or subscription per truck', b: 'Included in the workspace plan' },
  { label: 'When it reports', a: 'Whenever the truck has power, without the driver doing anything', b: 'While the trip page is open and the phone has battery and signal' },
  { label: 'Extras', a: 'Ignition and, with sensors, fuel level', b: 'Position only' },
  { label: 'Ends with the trip', a: 'No, it tracks the truck all the time', b: 'Yes, the link is for one vehicle and one trip and expires' },
];

export default function CompareGpsDevices() {
  return (
    <MarketingShell>
      <PageHero
        kicker="Compare"
        title={<>Phone trip links vs <mark className="mk-mark">GPS devices</mark></>}
        lede="Both tell you where a truck is. They differ in what you pay up front, which trucks they cover and how much they depend on the driver."
      />
      <Band id="side-by-side" kicker="Side by side" title="What each one takes">
        <CompareTable caption="GPS devices compared with phone trip links" a="Fitted GPS device" b="Phone trip link" rows={ROWS} />
      </Band>
      <Band id="which" kicker="Which one" title="What each is good for" sand>
        <CardGrid items={[
          { title: 'Phone links fit', text: 'Mixed fleets with hired trucks, quick starts, and paying per trip rather than per device. Nothing to install or recharge.' },
          { title: 'Devices fit', text: 'Your own trucks on long contracts where you need fuel or ignition data, or drivers who won’t keep a page open.' },
          { title: 'Where we stand', text: 'LogisticsEdge uses the phone trip link today. It does not connect fitted GPS devices yet.' },
        ]} />
      </Band>
      <ClosingCta title="Track your next trip without fitting anything" text="Create a workspace, add the truck and send the driver a trip link." />
    </MarketingShell>
  );
}
