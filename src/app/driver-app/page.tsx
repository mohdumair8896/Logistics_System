// Driver GPS App — /driver-app
// Opened by drivers on their phones from the trip link the dispatcher shares
// (GET /api/trips/[id]/driver-link): /driver-app?v=<vehicle>&t=<trip>&k=<signed token>.
// Shows a Hindi + English location notice first, then sends GPS to /api/gps/ping every 5 seconds,
// queueing points on the phone while there is no network. Tracking stops when the trip is closed.

import DriverGpsAppClient from './DriverGpsAppClient';

export const metadata = {
  title: 'Driver trip link',
  description: 'Share your location with the transporter for this trip. ड्राइवर ट्रिप लिंक: इस ट्रिप के लिए लोकेशन शेयर करें।',
  robots: { index: false, follow: false },
};

export default function DriverAppPage() {
  return <DriverGpsAppClient />;
}
