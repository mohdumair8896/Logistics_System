/**
 * TEMPORARY: Mock Data Layer
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * This file is the interim data source for all dashboard pages and
 * API routes while a real backend database is not yet connected.
 *
 * TODO: Replace each export with real API/database calls when
 * a backend (PostgreSQL schema in docs/schema.sql) is integrated.
 *
 * DO NOT add business logic here. Keep it as pure data fixtures.
 */

// Mock Data for Precision Logistics Management System (LMS)

export interface ActivityLogItem {
  id: string;
  title: string;
  timestamp: string;
  type: 'maintenance' | 'delivery' | 'inspection';
}

export interface Vehicle {
  id: string;
  vehicleNo: string;
  type: string;
  capacity: number;
  currentLoad: number;
  status: 'Available' | 'In Transit' | 'Maintenance';
  driverId: string | null;
  location: string;
  lastService: string;
  odometerKm?: number;
  fuelLevel?: number;
  activityLog?: ActivityLogItem[];
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  licenseExpiry: string;
  vehicleId: string | null;
  status: 'Available' | 'On Trip' | 'Off Duty';
  trips: number;
  rating: number;
  documentVerified: boolean;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  gstin: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  category: string;
  pricePerKg: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  batchCode?: string;
  scanned?: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  destination: string;
  origin: string;
  items: OrderItem[];
  totalWeight: number;
  status: 'Pending' | 'Allocated' | 'In Transit' | 'Delivered' | 'Cancelled';
  createdAt: string;
  deadline?: string;
  vehicleId: string | null;
  driverId: string | null;
  distance: number;
  freightRate: number;
  loadingBay?: string;
}

export interface Waypoint {
  name: string;
  passed: boolean;
  time?: string;
  location: string;
}

export interface Trip {
  id: string;
  orderId: string;
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  distance: number;
  load: number;
  status: 'In Transit' | 'Delivered' | 'Cancelled';
  progress: number;
  startedAt: string;
  eta: string | null;
  completedAt: string | null;
  speedKmH?: number;
  fuelPercent?: number;
  cargoTemp?: string;
  geofenceStatus?: 'Inside Corridor' | 'Deviated' | 'Arrived';
  checkpoints?: Waypoint[];
}

export interface Invoice {
  id: string;
  orderId: string;
  customerId: string;
  tripId: string | null;
  freight: number;
  loading: number;
  unloading: number;
  damageDeduction?: number;
  subtotal: number;
  gst: number;
  total: number;
  status: 'Paid' | 'Pending';
  createdAt: string;
  podSigned?: boolean;
  podImageUrl?: string;
  receiverName?: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'info' | 'critical';
  timestamp: string;
  category: 'Weather' | 'Fleet' | 'Driver' | 'Route' | 'Warehouse' | 'Cold-Chain' | 'Geofence';
}

export interface HubNode {
  id: string;
  name: string;
  region: 'North' | 'Central' | 'West' | 'East' | 'Europe';
  x: number;
  y: number;
  vehiclesCount: number;
  hasDelay?: boolean;
}

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

export const initialDrivers: Driver[] = [
  { id: 'D001', name: 'Ahmed Khan', phone: '+91 98765 43210', licenseNo: 'DL-982-XYZ', licenseExpiry: '2028-06-15', vehicleId: 'V001', status: 'Available', trips: 142, rating: 4.8, documentVerified: true },
  { id: 'D002', name: 'Ravi Kumar', phone: '+91 97654 32109', licenseNo: 'DL-834-ABC', licenseExpiry: '2027-03-22', vehicleId: 'V002', status: 'On Trip', trips: 98, rating: 4.6, documentVerified: true },
  { id: 'D003', name: 'Imran Ali', phone: '+91 96543 21098', licenseNo: 'DL-441-PQR', licenseExpiry: '2029-01-10', vehicleId: 'V003', status: 'Available', trips: 215, rating: 4.9, documentVerified: true },
  { id: 'D004', name: 'Suresh Yadav', phone: '+91 95432 10987', licenseNo: 'DL-672-LMN', licenseExpiry: '2026-11-30', vehicleId: 'V005', status: 'On Trip', trips: 67, rating: 4.5, documentVerified: true },
  { id: 'D005', name: 'Mohan Singh', phone: '+91 94321 09876', licenseNo: 'DL-319-DEF', licenseExpiry: '2027-08-14', vehicleId: null, status: 'Available', trips: 189, rating: 4.7, documentVerified: true },
  { id: 'D006', name: 'Deepak Verma', phone: '+91 93210 98765', licenseNo: 'DL-155-GHI', licenseExpiry: '2028-04-20', vehicleId: null, status: 'Off Duty', trips: 55, rating: 4.3, documentVerified: false },
];

export const initialCustomers: Customer[] = [
  { id: 'C001', name: 'ABC Traders', contact: 'Rajesh Kumar', phone: '+91 99887 76655', address: 'Civil Lines Industrial Area, Kanpur', gstin: '09ABCDE1234F1Z5' },
  { id: 'C002', name: 'Xin Logistics India', contact: 'Priya Sharma', phone: '+91 99776 65544', address: 'Agra Highway Corridor, Agra', gstin: '09XYZAB5678G2H6' },
  { id: 'C003', name: 'Global Exports Corp', contact: 'Amit Gupta', phone: '+91 99665 54433', address: 'Okhla Phase III, Delhi NCR', gstin: '09DEFCD9012H3I7' },
  { id: 'C004', name: 'Sunrise Agro Mills', contact: 'Sanjay Patel', phone: '+91 99554 43322', address: 'Naini Logistics Park, Prayagraj', gstin: '09SUNAB3456J4K8' },
  { id: 'C005', name: 'GHI Industrial Commodities', contact: 'Nisha Jain', phone: '+91 99443 32211', address: 'Ramnagar Industrial Area, Varanasi', gstin: '09GHICD7890L5M9' },
];

export const initialProducts: Product[] = [
  { id: 'P001', name: 'Industrial Grade Steel Rods', unit: 'kg', category: 'Metals & Construction', pricePerKg: 65 },
  { id: 'P002', name: 'Raw Material Fasteners & Coils', unit: 'kg', category: 'Heavy Hardware', pricePerKg: 85 },
  { id: 'P003', name: 'Packaged Food Grain (Rice)', unit: 'kg', category: 'Agri Commodities', pricePerKg: 38 },
  { id: 'P004', name: 'Processed Sugar Bulk Bags', unit: 'kg', category: 'Food Wholesale', pricePerKg: 44 },
  { id: 'P005', name: 'Refined Edible Oil Drums', unit: 'ltr', category: 'Liquid Bulk', pricePerKg: 125 },
  { id: 'P006', name: 'Heavy Electrical Cables', unit: 'kg', category: 'Electrical Equipment', pricePerKg: 140 },
];

export const initialInventory = [
  { productId: 'P001', warehouseId: 'W001', quantity: 35000, bay: 'Bay A-12' },
  { productId: 'P002', warehouseId: 'W001', quantity: 22000, bay: 'Bay A-14' },
  { productId: 'P003', warehouseId: 'W001', quantity: 45000, bay: 'Bay B-04' },
  { productId: 'P004', warehouseId: 'W001', quantity: 18000, bay: 'Bay B-08' },
  { productId: 'P005', warehouseId: 'W001', quantity: 12000, bay: 'Bay C-02' },
  { productId: 'P006', warehouseId: 'W001', quantity: 9500, bay: 'Bay C-06' },
];

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
    cargoTemp: '21.5Â°C Ambient',
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
    cargoTemp: '22.0Â°C Ambient',
    geofenceStatus: 'Arrived',
    checkpoints: [
      { name: 'Lucknow Dispatch Terminal', location: 'Lucknow Hub', passed: true, time: '07:00 AM' },
      { name: 'Raebareli Highway Toll', location: 'NH-30 KM 80', passed: true, time: '09:10 AM' },
      { name: 'Prayagraj City Ingate', location: 'Naini Park', passed: true, time: '13:30 PM' }
    ]
  },
];

export const initialInvoices: Invoice[] = [
  {
    id: 'INV-1004',
    orderId: 'ORD-0992',
    customerId: 'C004',
    tripId: 'TRP-1002',
    freight: 13800,
    loading: 2000,
    unloading: 1500,
    damageDeduction: 0,
    subtotal: 17300,
    gst: 3114,
    total: 20414,
    status: 'Paid',
    createdAt: '2026-08-25',
    podSigned: true,
    receiverName: 'Sanjay Patel'
  },
  {
    id: 'INV-1005',
    orderId: 'ORD-0988',
    customerId: 'C005',
    tripId: null,
    freight: 14322,
    loading: 2000,
    unloading: 1500,
    damageDeduction: 0,
    subtotal: 17822,
    gst: 3208,
    total: 21030,
    status: 'Pending',
    createdAt: '2026-08-22',
    podSigned: true,
    receiverName: 'Nisha Jain'
  },
];

export const initialAlerts: SystemAlert[] = [
  {
    id: 'ALT-1',
    title: 'Weather Warning: Fog Alert on Lucknow-Agra Corridor',
    description: 'Reduced visibility on NH-19 corridor. Speed limit restricted to 50 km/h recommended for heavy vehicles.',
    severity: 'warning',
    timestamp: '15 mins ago',
    category: 'Weather'
  },
  {
    id: 'ALT-2',
    title: 'Fleet Scheduled Maintenance: UP32 KL 2345 in Workshop',
    description: 'Vehicle V006 is undergoing mandatory 180,000km gearbox inspection. Expected turnaround: 24 hours.',
    severity: 'info',
    timestamp: '1 hour ago',
    category: 'Fleet'
  },
  {
    id: 'ALT-3',
    title: 'Driver Credential: D006 (Deepak Verma) License Renewal Due',
    description: 'Commercial license expires in under 60 days. Verification upload pending in driver portal.',
    severity: 'critical',
    timestamp: '3 hours ago',
    category: 'Driver'
  }
];

export const initialHubNodes: HubNode[] = [
  { id: 'HUB-LKO', name: 'Central Distribution Hub', region: 'North', x: 48, y: 44, vehiclesCount: 18 },
  { id: 'HUB-KNP', name: 'Kanpur Logistics Depot', region: 'North', x: 44, y: 52, vehiclesCount: 12 },
  { id: 'HUB-DEL', name: 'East Distribution Center', region: 'North', x: 30, y: 32, vehiclesCount: 24, hasDelay: true },
  { id: 'HUB-AGR', name: 'Agra Transit Terminal', region: 'North', x: 38, y: 42, vehiclesCount: 8 },
  { id: 'HUB-VNS', name: 'Varanasi Industrial Hub', region: 'East', x: 62, y: 56, vehiclesCount: 14 },
  { id: 'HUB-BOM', name: 'Mumbai Seaport Logistics', region: 'West', x: 26, y: 72, vehiclesCount: 35 },
  { id: 'HUB-MUN', name: 'Munich Gateway Hub', region: 'Europe', x: 75, y: 28, vehiclesCount: 16 },
  { id: 'HUB-PAR', name: 'Paris Central Logistics', region: 'Europe', x: 68, y: 24, vehiclesCount: 22 },
  { id: 'HUB-BER', name: 'Berlin Express Terminal', region: 'Europe', x: 80, y: 20, vehiclesCount: 19, hasDelay: true },
];

export const mockDriverMessages: Record<string, { sender: 'driver' | 'dispatcher'; text: string; time: string }[]> = {
  'D001': [
    { sender: 'driver', text: 'Vehicle UP32 AB 1234 is fueled up and ready at Bay 4.', time: '08:15 AM' },
    { sender: 'dispatcher', text: 'Great Ahmed, we are allocating ORD-1001 for Kanpur delivery today.', time: '08:18 AM' },
    { sender: 'driver', text: 'Understood. Awaiting warehouse loading confirmation.', time: '08:20 AM' }
  ],
  'D002': [
    { sender: 'driver', text: 'Passed Etawah toll. Traffic is smooth, ETA Delhi on schedule.', time: '10:50 AM' },
    { sender: 'dispatcher', text: 'Copy that Ravi, keep speed under 70 km/h due to fog advisory.', time: '10:52 AM' }
  ],
  'D003': [
    { sender: 'driver', text: 'Proof of delivery signed by Mr. Sanjay Patel for ORD-0992.', time: '01:40 PM' },
    { sender: 'dispatcher', text: 'Verified! Returning to Kanpur depot approved.', time: '01:42 PM' }
  ]
};


