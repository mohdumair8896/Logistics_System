#!/usr/bin/env tsx
// ─── Database Seed Script ─────────────────────────────────────────────────────
// Run once to populate your Neon DB with initial data.
// Command: npx tsx scripts/seed.ts
//
// This seeds:
//   - 3 staff users (with bcrypt hashed passwords)
//   - 5 customers
//   - 6 products
//   - 6 inventory entries
//   - 6 vehicles
//   - 6 drivers
//   - 5 orders
//   - 2 trips
//   - 2 invoices
//   - 3 system alerts
//   - 5 knowledge base entries
//   - 3 shipper leads

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ─── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Seeding users...');
  const passwordHash = await bcrypt.hash('Logistics2026!', 12);
  await db.insert(schema.users).values([
    { id: 'USR-001', email: 'admin@precisionlogistics.com',      passwordHash, name: 'Alex Morgan',    role: 'Operations Director', facility: 'Central Distribution Hub',  avatar: 'AM', isActive: true },
    { id: 'USR-002', email: 'dispatch@precisionlogistics.com',   passwordHash, name: 'Sam Rivera',     role: 'Fleet Dispatcher',    facility: 'North Corridor Terminal',    avatar: 'SR', isActive: true },
    { id: 'USR-003', email: 'compliance@precisionlogistics.com', passwordHash, name: 'Jordan Patel',   role: 'Compliance Officer',  facility: 'West Regional Terminal',     avatar: 'JP', isActive: true },
  ]).onConflictDoNothing();

  // ─── Customers ──────────────────────────────────────────────────────────────
  console.log('🏢 Seeding customers...');
  await db.insert(schema.customers).values([
    { id: 'C001', name: 'ABC Traders',                 contact: 'Rajesh Kumar',  phone: '+91 99887 76655', address: 'Civil Lines Industrial Area, Kanpur',      gstin: '09ABCDE1234F1Z5' },
    { id: 'C002', name: 'Xin Logistics India',         contact: 'Priya Sharma',  phone: '+91 99776 65544', address: 'Agra Highway Corridor, Agra',             gstin: '09XYZAB5678G2H6' },
    { id: 'C003', name: 'Global Exports Corp',         contact: 'Amit Gupta',    phone: '+91 99665 54433', address: 'Okhla Phase III, Delhi NCR',              gstin: '09DEFCD9012H3I7' },
    { id: 'C004', name: 'Sunrise Agro Mills',          contact: 'Sanjay Patel',  phone: '+91 99554 43322', address: 'Naini Logistics Park, Prayagraj',         gstin: '09SUNAB3456J4K8' },
    { id: 'C005', name: 'GHI Industrial Commodities',  contact: 'Nisha Jain',    phone: '+91 99443 32211', address: 'Ramnagar Industrial Area, Varanasi',      gstin: '09GHICD7890L5M9' },
  ]).onConflictDoNothing();

  // ─── Products ───────────────────────────────────────────────────────────────
  console.log('📦 Seeding products...');
  await db.insert(schema.products).values([
    { id: 'P001', name: 'Industrial Grade Steel Rods',          unit: 'kg',  category: 'Metals & Construction', pricePerKg: '65' },
    { id: 'P002', name: 'Raw Material Fasteners & Coils',       unit: 'kg',  category: 'Heavy Hardware',        pricePerKg: '85' },
    { id: 'P003', name: 'Packaged Food Grain (Rice)',           unit: 'kg',  category: 'Agri Commodities',      pricePerKg: '38' },
    { id: 'P004', name: 'Processed Sugar Bulk Bags',            unit: 'kg',  category: 'Food Wholesale',        pricePerKg: '44' },
    { id: 'P005', name: 'Refined Edible Oil Drums',             unit: 'ltr', category: 'Liquid Bulk',           pricePerKg: '125' },
    { id: 'P006', name: 'Heavy Electrical Cables',              unit: 'kg',  category: 'Electrical Equipment',  pricePerKg: '140' },
  ]).onConflictDoNothing();

  // ─── Inventory ──────────────────────────────────────────────────────────────
  console.log('🏭 Seeding inventory...');
  await db.insert(schema.inventory).values([
    { productId: 'P001', warehouseId: 'W001', quantity: 35000, bay: 'Bay A-12' },
    { productId: 'P002', warehouseId: 'W001', quantity: 22000, bay: 'Bay A-14' },
    { productId: 'P003', warehouseId: 'W001', quantity: 45000, bay: 'Bay B-04' },
    { productId: 'P004', warehouseId: 'W001', quantity: 18000, bay: 'Bay B-08' },
    { productId: 'P005', warehouseId: 'W001', quantity: 12000, bay: 'Bay C-02' },
    { productId: 'P006', warehouseId: 'W001', quantity: 9500,  bay: 'Bay C-06' },
  ]).onConflictDoNothing();

  // ─── Vehicles ───────────────────────────────────────────────────────────────
  console.log('🚚 Seeding vehicles...');
  await db.insert(schema.vehicles).values([
    { id: 'V001', vehicleNo: 'UP32 AB 1234', type: 'Heavy Duty Truck',       capacity: 10000, currentLoad: 0,    status: 'Available',   driverId: 'D001', location: 'Central Distribution Hub',        lastService: '2026-08-15', odometerKm: 48250,  fuelLevel: 88, activityLog: [{ id: 'ACT-1', title: 'Maintenance Completed (Full Inspection)', timestamp: 'Aug 24, 09:00 AM', type: 'maintenance' }, { id: 'ACT-2', title: 'Delivery Logged: ORD-992 (Kanpur)', timestamp: 'Aug 22, 14:30 PM', type: 'delivery' }] },
    { id: 'V002', vehicleNo: 'UP32 CD 5678', type: 'Medium Truck',            capacity: 7000,  currentLoad: 6200, status: 'In Transit',  driverId: 'D002', location: 'Lucknow-Agra Expressway',        lastService: '2026-07-01', odometerKm: 62100,  fuelLevel: 64, activityLog: [{ id: 'ACT-4', title: 'Dispatched on Trip TRP-1002', timestamp: 'Aug 31, 06:00 AM', type: 'delivery' }] },
    { id: 'V003', vehicleNo: 'UP32 EF 9012', type: 'Multi-Axle Trailer',      capacity: 20000, currentLoad: 0,    status: 'Available',   driverId: 'D003', location: 'Kanpur Logistics Depot',         lastService: '2026-08-05', odometerKm: 114500, fuelLevel: 92, activityLog: [{ id: 'ACT-6', title: 'Returned to Kanpur Yard', timestamp: 'Aug 25, 15:00 PM', type: 'delivery' }] },
    { id: 'V004', vehicleNo: 'UP32 GH 3456', type: 'Heavy Duty Truck',        capacity: 15000, currentLoad: 0,    status: 'Available',   driverId: null,   location: 'Central Distribution Hub',        lastService: '2026-08-10', odometerKm: 34100,  fuelLevel: 75, activityLog: [{ id: 'ACT-8', title: 'Scheduled 30,000km Service Done', timestamp: 'Aug 10, 08:30 AM', type: 'maintenance' }] },
    { id: 'V005', vehicleNo: 'UP32 IJ 7890', type: 'Light Commercial Vehicle', capacity: 5000,  currentLoad: 4800, status: 'In Transit',  driverId: 'D004', location: 'NH-27 En Route',                 lastService: '2026-07-22', odometerKm: 28400,  fuelLevel: 45, activityLog: [{ id: 'ACT-9', title: 'Loaded at Warehouse Bay 2', timestamp: 'Aug 31, 07:30 AM', type: 'delivery' }] },
    { id: 'V006', vehicleNo: 'UP32 KL 2345', type: 'Multi-Axle Trailer',      capacity: 25000, currentLoad: 0,    status: 'Maintenance', driverId: null,   location: 'Central Distribution Hub Workshop', lastService: '2026-08-28', odometerKm: 185000, fuelLevel: 30, activityLog: [{ id: 'ACT-10', title: 'Engine Diagnostic & Gearbox Overhaul', timestamp: 'Aug 28, 14:00 PM', type: 'maintenance' }] },
  ]).onConflictDoNothing();

  // ─── Drivers ────────────────────────────────────────────────────────────────
  console.log('👨‍✈️ Seeding drivers...');
  await db.insert(schema.drivers).values([
    { id: 'D001', name: 'Ahmed Khan',    phone: '+91 98765 43210', licenseNo: 'DL-982-XYZ', licenseExpiry: '2028-06-15', vehicleId: 'V001', status: 'Available', trips: 142, rating: '4.8', documentVerified: true },
    { id: 'D002', name: 'Ravi Kumar',    phone: '+91 97654 32109', licenseNo: 'DL-834-ABC', licenseExpiry: '2027-03-22', vehicleId: 'V002', status: 'On Trip',   trips: 98,  rating: '4.6', documentVerified: true },
    { id: 'D003', name: 'Imran Ali',     phone: '+91 96543 21098', licenseNo: 'DL-441-PQR', licenseExpiry: '2029-01-10', vehicleId: 'V003', status: 'Available', trips: 215, rating: '4.9', documentVerified: true },
    { id: 'D004', name: 'Suresh Yadav',  phone: '+91 95432 10987', licenseNo: 'DL-672-LMN', licenseExpiry: '2026-11-30', vehicleId: 'V005', status: 'On Trip',   trips: 67,  rating: '4.5', documentVerified: true },
    { id: 'D005', name: 'Mohan Singh',   phone: '+91 94321 09876', licenseNo: 'DL-319-DEF', licenseExpiry: '2027-08-14', vehicleId: null,   status: 'Available', trips: 189, rating: '4.7', documentVerified: true },
    { id: 'D006', name: 'Deepak Verma',  phone: '+91 93210 98765', licenseNo: 'DL-155-GHI', licenseExpiry: '2028-04-20', vehicleId: null,   status: 'Off Duty',  trips: 55,  rating: '4.3', documentVerified: false },
  ]).onConflictDoNothing();

  // ─── Orders ─────────────────────────────────────────────────────────────────
  console.log('📋 Seeding orders...');
  await db.insert(schema.orders).values([
    { id: 'ORD-1001', customerId: 'C001', origin: 'Central Distribution Hub', destination: 'Kanpur Facility',          items: [{ productId: 'P001', quantity: 5000, batchCode: 'ST-2026-88', scanned: false }, { productId: 'P002', quantity: 2500, batchCode: 'FS-2026-42', scanned: false }], totalWeight: 7500, status: 'Pending',    vehicleId: null,   driverId: null,   distance: 82,  freightRate: '2.4', loadingBay: 'Bay 4', deadline: 'Today 18:00' },
    { id: 'ORD-0998', customerId: 'C002', origin: 'Central Distribution Hub', destination: 'Agra Corridor',            items: [{ productId: 'P004', quantity: 4000, batchCode: 'SG-2026-11', scanned: true }],                                                                            totalWeight: 4000, status: 'Allocated',  vehicleId: 'V001', driverId: 'D001', distance: 340, freightRate: '2.2', loadingBay: 'Bay 2', deadline: 'Tomorrow 10:00' },
    { id: 'ORD-0995', customerId: 'C003', origin: 'Central Distribution Hub', destination: 'East Distribution Center', items: [{ productId: 'P001', quantity: 5000, batchCode: 'ST-2026-77', scanned: true }, { productId: 'P005', quantity: 4000, batchCode: 'OL-2026-30', scanned: true }],  totalWeight: 9000, status: 'In Transit', vehicleId: 'V002', driverId: 'D002', distance: 512, freightRate: '2.0', loadingBay: 'Bay 1', deadline: 'Today 22:00' },
    { id: 'ORD-0992', customerId: 'C004', origin: 'Central Distribution Hub', destination: 'Prayagraj Logistics Depot', items: [{ productId: 'P003', quantity: 6000, batchCode: 'RC-2026-09', scanned: true }],                                                                             totalWeight: 6000, status: 'Delivered',  vehicleId: 'V003', driverId: 'D003', distance: 200, freightRate: '2.3', loadingBay: 'Bay 3', deadline: 'Completed' },
    { id: 'ORD-0988', customerId: 'C005', origin: 'Central Distribution Hub', destination: 'Varanasi Industrial Hub',  items: [{ productId: 'P006', quantity: 3000, batchCode: 'CB-2026-55', scanned: true }],                                                                             totalWeight: 3000, status: 'Delivered',  vehicleId: 'V003', driverId: 'D003', distance: 322, freightRate: '2.1', loadingBay: 'Bay 5', deadline: 'Completed' },
  ]).onConflictDoNothing();

  // ─── Trips ──────────────────────────────────────────────────────────────────
  console.log('🗺️ Seeding trips...');
  await db.insert(schema.trips).values([
    {
      id: 'TRP-1001', orderId: 'ORD-0995', vehicleId: 'V002', driverId: 'D002',
      origin: 'Central Distribution Hub', destination: 'East Distribution Center',
      distance: 512, load: 9000, status: 'In Transit', progress: 58,
      startedAt: '2026-08-31 06:00', eta: '3h 15min', completedAt: null,
      speedKmH: 68, fuelPercent: 64, cargoTemp: '21.5°C Ambient', geofenceStatus: 'Inside Corridor',
      checkpoints: [
        { name: 'Lucknow Dispatch Terminal', location: 'Lucknow Hub', passed: true, time: '06:00 AM' },
        { name: 'Unnao Expressway Interchange', location: 'NH-27 KM 34', passed: true, time: '07:15 AM' },
        { name: 'Etawah Toll Plaza Waypoint', location: 'NH-19 KM 210', passed: true, time: '10:45 AM' },
        { name: 'Mathura Corridor Checkpoint', location: 'Yamuna Expy KM 380', passed: false },
        { name: 'Delhi NCR Logistics Hub', location: 'Okhla Terminal', passed: false },
      ],
    },
    {
      id: 'TRP-1002', orderId: 'ORD-0992', vehicleId: 'V003', driverId: 'D003',
      origin: 'Central Distribution Hub', destination: 'Prayagraj Logistics Depot',
      distance: 200, load: 6000, status: 'Delivered', progress: 100,
      startedAt: '2026-08-25 07:00', eta: 'Completed', completedAt: '2026-08-25 13:45',
      speedKmH: 0, fuelPercent: 92, cargoTemp: '22.0°C Ambient', geofenceStatus: 'Arrived',
      checkpoints: [
        { name: 'Lucknow Dispatch Terminal', location: 'Lucknow Hub', passed: true, time: '07:00 AM' },
        { name: 'Raebareli Highway Toll', location: 'NH-30 KM 80', passed: true, time: '09:10 AM' },
        { name: 'Prayagraj City Ingate', location: 'Naini Park', passed: true, time: '13:30 PM' },
      ],
    },
  ]).onConflictDoNothing();

  // ─── Invoices ───────────────────────────────────────────────────────────────
  console.log('🧾 Seeding invoices...');
  await db.insert(schema.invoices).values([
    { id: 'INV-1004', orderId: 'ORD-0992', customerId: 'C004', tripId: 'TRP-1002', freight: '13800', loading: '2000', unloading: '1500', damageDeduction: '0', subtotal: '17300', gst: '3114', total: '20414', status: 'Paid',    podSigned: true,  receiverName: 'Sanjay Patel' },
    { id: 'INV-1005', orderId: 'ORD-0988', customerId: 'C005', tripId: null,       freight: '14322', loading: '2000', unloading: '1500', damageDeduction: '0', subtotal: '17822', gst: '3208', total: '21030', status: 'Pending', podSigned: true,  receiverName: 'Nisha Jain' },
  ]).onConflictDoNothing();

  // ─── Driver Messages ────────────────────────────────────────────────────────
  console.log('💬 Seeding driver messages...');
  await db.insert(schema.driverMessages).values([
    { driverId: 'D001', sender: 'driver',      text: 'Vehicle UP32 AB 1234 is fueled up and ready at Bay 4.' },
    { driverId: 'D001', sender: 'dispatcher',  text: 'Great Ahmed, we are allocating ORD-1001 for Kanpur delivery today.' },
    { driverId: 'D001', sender: 'driver',      text: 'Understood. Awaiting warehouse loading confirmation.' },
    { driverId: 'D002', sender: 'driver',      text: 'Passed Etawah toll. Traffic is smooth, ETA Delhi on schedule.' },
    { driverId: 'D002', sender: 'dispatcher',  text: 'Copy that Ravi, keep speed under 70 km/h due to fog advisory.' },
    { driverId: 'D003', sender: 'driver',      text: 'Proof of delivery signed by Mr. Sanjay Patel for ORD-0992.' },
    { driverId: 'D003', sender: 'dispatcher',  text: 'Verified! Returning to Kanpur depot approved.' },
  ]);

  // ─── System Alerts ──────────────────────────────────────────────────────────
  console.log('🔔 Seeding system alerts...');
  await db.insert(schema.systemAlerts).values([
    { title: 'Weather Warning: Fog Alert on Lucknow-Agra Corridor', description: 'Reduced visibility on NH-19 corridor. Speed limit restricted to 50 km/h recommended for heavy vehicles.', severity: 'warning',  category: 'Weather' },
    { title: 'Fleet Scheduled Maintenance: UP32 KL 2345 in Workshop',    description: 'Vehicle V006 is undergoing mandatory 180,000km gearbox inspection. Expected turnaround: 24 hours.',             severity: 'info',     category: 'Fleet' },
    { title: 'Driver Credential: D006 (Deepak Verma) License Renewal Due', description: 'Commercial license expires in under 60 days. Verification upload pending in driver portal.',                    severity: 'critical', category: 'Driver' },
  ]);

  // ─── Knowledge Base ─────────────────────────────────────────────────────────
  console.log('📚 Seeding knowledge base...');
  await db.insert(schema.knowledgeBase).values([
    { id: 'KB-001', category: 'Hours & Operations', title: 'Central Hub Dispatch Dock Hours & Staging Protocols',     content: 'Lucknow Central Hub operates dispatch bays 1 through 6 continuously from 06:00 to 23:00 daily. Inbound freight staging requires 45 minutes prior check-in. Axle scale calibration occurs at 05:30 daily.', keywords: ['hours', 'dock', 'bays', 'staging', 'operating hours', 'open', 'timing'], lastUpdated: '2026-09-01' },
    { id: 'KB-002', category: 'Lane Rates',         title: 'Standard Freight Corridor Pricing Card (Per KG)',           content: 'Base corridor tariffs: Lucknow ➔ Kanpur (82 km): ₹2.4/kg; Lucknow ➔ Agra (340 km): ₹2.2/kg; Lucknow ➔ Delhi NCR (512 km): ₹2.0/kg; Lucknow ➔ Varanasi (322 km): ₹2.1/kg. Minimum billing weight: 1,000 kg.',   keywords: ['rate', 'pricing', 'quote', 'cost', 'per kg', 'price', 'tariff', 'freight charges'], lastUpdated: '2026-09-02' },
    { id: 'KB-003', category: 'Cold-Chain SLA',     title: 'Reefer Cold-Chain Temperature Compliance & Thresholds',     content: 'Perishable goods require calibrated reefer containers maintaining +2°C to +6°C for dairy/produce and -18°C for frozen cargo. Telematics gateway triggers an audible alarm and SMS alert if temp deviates by >2.5°C for over 15 minutes.', keywords: ['cold chain', 'reefer', 'temperature', 'frozen', 'perishable', 'pharma', 'dairy'], lastUpdated: '2026-08-28' },
    { id: 'KB-004', category: 'Safety & HAZMAT',    title: 'Highway Breakdown, Spillage & Emergency Response SOP',      content: 'In case of tire blowout, mechanical failure, or road incident, drivers must activate hazard lights, place reflective triangles 50m behind vehicle, and call our 24/7 Operations Hotline at 1800-PRE-LMS (ext 9). Recovery dispatch deployed within 40 mins.', keywords: ['emergency', 'breakdown', 'accident', 'spill', 'tire', 'puncture', 'police', 'urgent', 'hotline'], lastUpdated: '2026-08-30' },
    { id: 'KB-005', category: 'GST & Invoicing',    title: 'GST Tax Invoicing & e-Way Bill Reconciliation Rules',        content: 'All inter-state dispatches are levied with 18% IGST; intra-state shipments are billed with 9% CGST + 9% SGST. Official GST tax invoices require signed electronic Proof of Delivery (e-POD) and valid e-Way bill numbers.', keywords: ['gst', 'tax', 'invoice', 'eway bill', 'billing', 'rates', 'cgst', 'sgst', 'igst'], lastUpdated: '2026-08-25' },
  ]).onConflictDoNothing();

  // ─── Shipper Leads ──────────────────────────────────────────────────────────
  console.log('🎯 Seeding shipper leads...');
  await db.insert(schema.shipperLeads).values([
    { id: 'LEAD-101', shipperName: 'Ramesh Gupta', companyName: 'Tata Consumer Products Ltd', phone: '+91 98210 44321', email: 'r.gupta@tataconsumer.com', originHub: 'Lucknow Central Hub', destinationHub: 'Delhi NCR Hub',     cargoType: 'Standard Freight', estimatedWeightKg: 12000, freightQuote: '28800', targetDeliveryDate: '2026-09-05', isUrgent: false, status: 'New',       transcriptSnippet: 'Need 12T dry container freight from Lucknow to Delhi. Can we schedule pickup Friday morning?' },
    { id: 'LEAD-102', shipperName: 'Priya Nair',   companyName: 'Amul Fresh Dairy Logistics',  phone: '+91 94501 88712', email: 'p.nair@amul.coop',           originHub: 'Kanpur Regional Facility', destinationHub: 'Agra Corridor', cargoType: 'Cold-Chain Reefer', estimatedWeightKg: 6500,  freightQuote: '16900', targetDeliveryDate: '2026-09-04', isUrgent: true,  status: 'New',       transcriptSnippet: 'Inquiring regarding reefer container with +4°C setpoint for pasteurized dairy pallets.' },
    { id: 'LEAD-103', shipperName: 'Anil Mathur',  companyName: 'L&T Heavy Engineering',       phone: '+91 97112 55901', email: 'a.mathur@lnt.com',           originHub: 'Lucknow Central Hub',     destinationHub: 'Varanasi Industrial Hub', cargoType: 'Heavy Industrial', estimatedWeightKg: 9000, freightQuote: '20700', targetDeliveryDate: '2026-09-06', isUrgent: false, status: 'Allocated', transcriptSnippet: 'Machinery components shipment approved. Dispatched under invoice INV-1004.', associatedOrderId: 'ORD-0988' },
  ]).onConflictDoNothing();

  console.log('\n✅ Seed complete! Database populated with real initial data.\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
