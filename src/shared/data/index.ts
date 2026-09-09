// ─── Shared Data — Common Mock Data ──────────────────────────────────────────
// Seed data for types shared across multiple features (Customers, Products, etc.)
// TODO: Replace with real API calls when backend is ready.

import type { Customer, Product, SystemAlert, InventoryItem } from '../types/common';

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

export const initialInventory: InventoryItem[] = [
  { productId: 'P001', warehouseId: 'W001', quantity: 35000, bay: 'Bay A-12' },
  { productId: 'P002', warehouseId: 'W001', quantity: 22000, bay: 'Bay A-14' },
  { productId: 'P003', warehouseId: 'W001', quantity: 45000, bay: 'Bay B-04' },
  { productId: 'P004', warehouseId: 'W001', quantity: 18000, bay: 'Bay B-08' },
  { productId: 'P005', warehouseId: 'W001', quantity: 12000, bay: 'Bay C-02' },
  { productId: 'P006', warehouseId: 'W001', quantity: 9500, bay: 'Bay C-06' },
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
