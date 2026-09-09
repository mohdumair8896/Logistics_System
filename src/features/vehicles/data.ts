// ─── Vehicles Feature — Mock Data ────────────────────────────────────────────
// Edit vehicle seed/mock data ONLY in this file.
// TODO: Replace with real API calls when backend is ready.

import type { Vehicle } from './types';

export const initialVehicles: Vehicle[] = [
  {
    id: 'V001',
    vehicleNo: 'UP32 AB 1234',
    type: 'Heavy Duty Truck',
    capacity: 10000,
    currentLoad: 0,
    status: 'Available',
    driverId: 'D001',
    location: 'Central Distribution Hub',
    lastService: '2026-08-15',
    odometerKm: 48250,
    fuelLevel: 88,
    activityLog: [
      { id: 'ACT-1', title: 'Maintenance Completed (Full Inspection)', timestamp: 'Aug 24, 09:00 AM', type: 'maintenance' },
      { id: 'ACT-2', title: 'Delivery Logged: ORD-992 (Kanpur)', timestamp: 'Aug 22, 14:30 PM', type: 'delivery' },
      { id: 'ACT-3', title: 'Tire Pressure & Brake Check Passed', timestamp: 'Aug 15, 11:15 AM', type: 'inspection' },
    ]
  },
  {
    id: 'V002',
    vehicleNo: 'UP32 CD 5678',
    type: 'Medium Truck',
    capacity: 7000,
    currentLoad: 6200,
    status: 'In Transit',
    driverId: 'D002',
    location: 'Lucknow-Agra Expressway',
    lastService: '2026-07-01',
    odometerKm: 62100,
    fuelLevel: 64,
    activityLog: [
      { id: 'ACT-4', title: 'Dispatched on Trip TRP-1002', timestamp: 'Aug 31, 06:00 AM', type: 'delivery' },
      { id: 'ACT-5', title: 'Oil & Filter Replacement', timestamp: 'Jul 01, 10:00 AM', type: 'maintenance' },
    ]
  },
  {
    id: 'V003',
    vehicleNo: 'UP32 EF 9012',
    type: 'Multi-Axle Trailer',
    capacity: 20000,
    currentLoad: 0,
    status: 'Available',
    driverId: 'D003',
    location: 'Kanpur Logistics Depot',
    lastService: '2026-08-05',
    odometerKm: 114500,
    fuelLevel: 92,
    activityLog: [
      { id: 'ACT-6', title: 'Returned to Kanpur Yard', timestamp: 'Aug 25, 15:00 PM', type: 'delivery' },
      { id: 'ACT-7', title: 'Hydraulic System Tested', timestamp: 'Aug 05, 16:30 PM', type: 'maintenance' },
    ]
  },
  {
    id: 'V004',
    vehicleNo: 'UP32 GH 3456',
    type: 'Heavy Duty Truck',
    capacity: 15000,
    currentLoad: 0,
    status: 'Available',
    driverId: null,
    location: 'Central Distribution Hub',
    lastService: '2026-08-10',
    odometerKm: 34100,
    fuelLevel: 75,
    activityLog: [
      { id: 'ACT-8', title: 'Scheduled 30,000km Service Done', timestamp: 'Aug 10, 08:30 AM', type: 'maintenance' },
    ]
  },
  {
    id: 'V005',
    vehicleNo: 'UP32 IJ 7890',
    type: 'Light Commercial Vehicle',
    capacity: 5000,
    currentLoad: 4800,
    status: 'In Transit',
    driverId: 'D004',
    location: 'NH-27 En Route',
    lastService: '2026-07-22',
    odometerKm: 28400,
    fuelLevel: 45,
    activityLog: [
      { id: 'ACT-9', title: 'Loaded at Warehouse Bay 2', timestamp: 'Aug 31, 07:30 AM', type: 'delivery' },
    ]
  },
  {
    id: 'V006',
    vehicleNo: 'UP32 KL 2345',
    type: 'Multi-Axle Trailer',
    capacity: 25000,
    currentLoad: 0,
    status: 'Maintenance',
    driverId: null,
    location: 'Central Distribution Hub Workshop',
    lastService: '2026-08-28',
    odometerKm: 185000,
    fuelLevel: 30,
    activityLog: [
      { id: 'ACT-10', title: 'Engine Diagnostic & Gearbox Overhaul', timestamp: 'Aug 28, 14:00 PM', type: 'maintenance' },
    ]
  },
];
