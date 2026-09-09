// ─── Orders Feature — Mock Data ───────────────────────────────────────────────
// Edit order seed/mock data ONLY in this file.
// TODO: Replace with real API calls when backend is ready.

import type { Order } from './types';

export const initialOrders: Order[] = [
  {
    id: 'ORD-1001',
    customerId: 'C001',
    origin: 'Central Distribution Hub',
    destination: 'Kanpur Facility',
    items: [
      { productId: 'P001', quantity: 5000, batchCode: 'ST-2026-88', scanned: false },
      { productId: 'P002', quantity: 2500, batchCode: 'FS-2026-42', scanned: false },
    ],
    totalWeight: 7500,
    status: 'Pending',
    createdAt: '2026-08-31',
    deadline: 'Today 18:00',
    vehicleId: null,
    driverId: null,
    distance: 82,
    freightRate: 2.4,
    loadingBay: 'Bay 4'
  },
  {
    id: 'ORD-0998',
    customerId: 'C002',
    origin: 'Central Distribution Hub',
    destination: 'Agra Corridor',
    items: [
      { productId: 'P004', quantity: 4000, batchCode: 'SG-2026-11', scanned: true },
    ],
    totalWeight: 4000,
    status: 'Allocated',
    createdAt: '2026-08-30',
    deadline: 'Tomorrow 10:00',
    vehicleId: 'V001',
    driverId: 'D001',
    distance: 340,
    freightRate: 2.2,
    loadingBay: 'Bay 2'
  },
  {
    id: 'ORD-0995',
    customerId: 'C003',
    origin: 'Central Distribution Hub',
    destination: 'East Distribution Center',
    items: [
      { productId: 'P001', quantity: 5000, batchCode: 'ST-2026-77', scanned: true },
      { productId: 'P005', quantity: 4000, batchCode: 'OL-2026-30', scanned: true },
    ],
    totalWeight: 9000,
    status: 'In Transit',
    createdAt: '2026-08-29',
    deadline: 'Today 22:00',
    vehicleId: 'V002',
    driverId: 'D002',
    distance: 512,
    freightRate: 2.0,
    loadingBay: 'Bay 1'
  },
  {
    id: 'ORD-0992',
    customerId: 'C004',
    origin: 'Central Distribution Hub',
    destination: 'Prayagraj Logistics Depot',
    items: [{ productId: 'P003', quantity: 6000, batchCode: 'RC-2026-09', scanned: true }],
    totalWeight: 6000,
    status: 'Delivered',
    createdAt: '2026-08-25',
    deadline: 'Completed',
    vehicleId: 'V003',
    driverId: 'D003',
    distance: 200,
    freightRate: 2.3,
    loadingBay: 'Bay 3'
  },
  {
    id: 'ORD-0988',
    customerId: 'C005',
    origin: 'Central Distribution Hub',
    destination: 'Varanasi Industrial Hub',
    items: [{ productId: 'P006', quantity: 3000, batchCode: 'CB-2026-55', scanned: true }],
    totalWeight: 3000,
    status: 'Delivered',
    createdAt: '2026-08-22',
    deadline: 'Completed',
    vehicleId: 'V003',
    driverId: 'D003',
    distance: 322,
    freightRate: 2.1,
    loadingBay: 'Bay 5'
  },
];
