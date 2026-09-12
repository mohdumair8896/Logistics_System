// Driver GPS App — /driver-app
// This page is opened by drivers on their smartphones.
// It uses browser Geolocation API to send live GPS pings to /api/gps/ping every 5 seconds.
// No authentication required — driver identifies by vehicleId + tripId from URL params.
//
// Usage: Share this URL with driver: https://yourapp.com/driver-app?v=V001&t=TRP-1001
// The dispatcher can copy this link from the Trips page.

import DriverGpsAppClient from './DriverGpsAppClient';

export const metadata = {
  title: 'Driver GPS App | LogisticsEdge',
  description: 'Live GPS tracking for LogisticsEdge drivers. Open this on your smartphone to share your location with dispatch.',
};

export default function DriverAppPage() {
  return <DriverGpsAppClient />;
}
