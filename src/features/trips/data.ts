// ─── Trips Feature — Mock Data ────────────────────────────────────────────────
// Edit trip seed/mock data ONLY in this file.

import type { Trip } from './types';

export const initialTrips: Trip[] = [
  {
    id: 'TRP-1001',
    orderId: 'ORD-0995',
    vehicleId: 'V002',
    driverId: 'D002',
    origin: 'Central Distribution Hub',
    destination: 'East Distribution Center',
    distance: 512,
    load: 9000,
    status: 'In Transit',
    progress: 58,
    startedAt: '2026-08-31 06:00',
    eta: '3h 15min',
    completedAt: null,
    speedKmH: 68,
    fuelPercent: 64,
    cargoTemp: '21.5°C Ambient',
    geofenceStatus: 'Inside Corridor',
    checkpoints: [
      { name: 'Lucknow Dispatch Terminal', location: 'Lucknow Hub', passed: true, time: '06:00 AM' },
      { name: 'Unnao Expressway Interchange', location: 'NH-27 KM 34', passed: true, time: '07:15 AM' },
      { name: 'Etawah Toll Plaza Waypoint', location: 'NH-19 KM 210', passed: true, time: '10:45 AM' },
      { name: 'Mathura Corridor Checkpoint', location: 'Yamuna Expy KM 380', passed: false },
      { name: 'Delhi NCR Logistics Hub', location: 'Okhla Terminal', passed: false }
    ]
  },
  {
    id: 'TRP-1002',
    orderId: 'ORD-0992',
    vehicleId: 'V003',
    driverId: 'D003',
    origin: 'Central Distribution Hub',
    destination: 'Prayagraj Logistics Depot',
    distance: 200,
    load: 6000,
    status: 'Delivered',
    progress: 100,
    startedAt: '2026-08-25 07:00',
    eta: 'Completed',
    completedAt: '2026-08-25 13:45',
    speedKmH: 0,
    fuelPercent: 92,
    cargoTemp: '22.0°C Ambient',
    geofenceStatus: 'Arrived',
    checkpoints: [
      { name: 'Lucknow Dispatch Terminal', location: 'Lucknow Hub', passed: true, time: '07:00 AM' },
      { name: 'Raebareli Highway Toll', location: 'NH-30 KM 80', passed: true, time: '09:10 AM' },
      { name: 'Prayagraj City Ingate', location: 'Naini Park', passed: true, time: '13:30 PM' }
    ]
  },
];
