'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  initialVehicles, initialDrivers, initialCustomers, initialProducts,
  initialInventory, initialOrders, initialTrips, initialInvoices, initialAlerts,
  mockDriverMessages, Vehicle, Driver, Customer, Product, Order, Trip, Invoice, SystemAlert
} from './mockData';

export type { Vehicle, Driver, Customer, Product, Order, Trip, Invoice, SystemAlert };

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Operations Director' | 'Fleet Dispatcher' | 'Compliance Officer';
  avatar: string;
  facility: string;
}

export interface ShipperLead {
  id: string;
  shipperName: string;
  companyName: string;
  phone: string;
  email: string;
  originHub: string;
  destinationHub: string;
  cargoType: 'Standard Freight' | 'Cold-Chain Reefer' | 'Heavy Industrial' | 'Express Urgent';
  estimatedWeightKg: number;
  freightQuote: number;
  targetDeliveryDate: string;
  isUrgent: boolean;
  status: 'New' | 'Allocated' | 'Contacted' | 'Archived';
  createdAt: string;
  transcriptSnippet?: string;
  associatedOrderId?: string;
}

export interface KnowledgeBaseItem {
  id: string;
  category: 'Hours & Operations' | 'Lane Rates' | 'Safety & HAZMAT' | 'GST & Invoicing' | 'Cold-Chain SLA';
  title: string;
  content: string;
  keywords: string[];
  lastUpdated: string;
}

export interface AppState {
  vehicles: Vehicle[];
  drivers: Driver[];
  customers: Customer[];
  products: Product[];
  inventory: typeof initialInventory;
  orders: Order[];
  trips: Trip[];
  invoices: Invoice[];
  alerts: SystemAlert[];
  messages: Record<string, { sender: 'driver' | 'dispatcher'; text: string; time: string }[]>;
  leads: ShipperLead[];
  knowledgeBase: KnowledgeBaseItem[];
  isLoggedIn: boolean;
  currentUser: UserProfile;

  login: (credentials?: { email?: string; role?: string; name?: string; facility?: string }) => void;
  logout: () => void;
  resetSystemData: () => void;

  addShipperLead: (lead: Omit<ShipperLead, 'id' | 'createdAt' | 'status'>) => string;
  updateLeadStatus: (id: string, status: ShipperLead['status']) => void;
  convertLeadToOrder: (leadId: string) => string;

  addKnowledgeBaseItem: (item: Omit<KnowledgeBaseItem, 'id' | 'lastUpdated'>) => string;
  updateKnowledgeBaseItem: (id: string, updates: Partial<KnowledgeBaseItem>) => void;
  deleteKnowledgeBaseItem: (id: string) => void;

  addVehicle: (v: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;

  addDriver: (d: Omit<Driver, 'id'>) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  reassignDriverVehicle: (driverId: string, newVehicleId: string | null) => void;

  addOrder: (o: Omit<Order, 'id' | 'createdAt'>) => string;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  scanOrderItem: (orderId: string, productId: string) => void;

  allocateVehicle: (orderId: string, vehicleId: string, driverId: string, overrideReason?: string) => void;
  confirmLoading: (orderId: string, bay?: string) => void;

  addTrip: (orderId: string) => string;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  completeDelivery: (tripId: string, deliveredQty: number, damagedQty?: number, receiverName?: string, podSigned?: boolean) => void;

  generateInvoice: (orderId: string, damageDeduction?: number, receiverName?: string) => string;
  updateInventory: (productId: string, delta: number) => void;

  dismissAlert: (alertId: string) => void;
  sendDriverMessage: (driverId: string, text: string) => void;
}

export const initialLeads: ShipperLead[] = [
  {
    id: 'LEAD-101',
    shipperName: 'Ramesh Gupta',
    companyName: 'Tata Consumer Products Ltd',
    phone: '+91 98210 44321',
    email: 'r.gupta@tataconsumer.com',
    originHub: 'Lucknow Central Hub',
    destinationHub: 'Delhi NCR Hub',
    cargoType: 'Standard Freight',
    estimatedWeightKg: 12000,
    freightQuote: 28800,
    targetDeliveryDate: '2026-09-05',
    isUrgent: false,
    status: 'New',
    createdAt: '2026-09-03',
    transcriptSnippet: 'Need 12T dry container freight from Lucknow to Delhi. Can we schedule pickup Friday morning?'
  },
  {
    id: 'LEAD-102',
    shipperName: 'Priya Nair',
    companyName: 'Amul Fresh Dairy Logistics',
    phone: '+91 94501 88712',
    email: 'p.nair@amul.coop',
    originHub: 'Kanpur Regional Facility',
    destinationHub: 'Agra Corridor',
    cargoType: 'Cold-Chain Reefer',
    estimatedWeightKg: 6500,
    freightQuote: 16900,
    targetDeliveryDate: '2026-09-04',
    isUrgent: true,
    status: 'New',
    createdAt: '2026-09-03',
    transcriptSnippet: 'Inquiring regarding reefer container with +4°C setpoint for pasteurized dairy pallets.'
  },
  {
    id: 'LEAD-103',
    shipperName: 'Anil Mathur',
    companyName: 'L&T Heavy Engineering',
    phone: '+91 97112 55901',
    email: 'a.mathur@lnt.com',
    originHub: 'Lucknow Central Hub',
    destinationHub: 'Varanasi Industrial Hub',
    cargoType: 'Heavy Industrial',
    estimatedWeightKg: 9000,
    freightQuote: 20700,
    targetDeliveryDate: '2026-09-06',
    isUrgent: false,
    status: 'Allocated',
    createdAt: '2026-09-02',
    associatedOrderId: 'ORD-0988',
    transcriptSnippet: 'Machinery components shipment approved. Dispatched under invoice INV-1004.'
  }
];

export const initialKnowledgeBase: KnowledgeBaseItem[] = [
  {
    id: 'KB-001',
    category: 'Hours & Operations',
    title: 'Central Hub Dispatch Dock Hours & Staging Protocols',
    content: 'Lucknow Central Hub operates dispatch bays 1 through 6 continuously from 06:00 to 23:00 daily. Inbound freight staging requires 45 minutes prior check-in. Axle scale calibration occurs at 05:30 daily.',
    keywords: ['hours', 'dock', 'bays', 'staging', 'operating hours', 'open', 'timing'],
    lastUpdated: '2026-09-01'
  },
  {
    id: 'KB-002',
    category: 'Lane Rates',
    title: 'Standard Freight Corridor Pricing Card (Per KG)',
    content: 'Base corridor tariffs: Lucknow ➔ Kanpur (82 km): ₹2.4/kg; Lucknow ➔ Agra (340 km): ₹2.2/kg; Lucknow ➔ Delhi NCR (512 km): ₹2.0/kg; Lucknow ➔ Varanasi (322 km): ₹2.1/kg. Minimum billing weight: 1,000 kg.',
    keywords: ['rate', 'pricing', 'quote', 'cost', 'per kg', 'price', 'tariff', 'freight charges'],
    lastUpdated: '2026-09-02'
  },
  {
    id: 'KB-003',
    category: 'Cold-Chain SLA',
    title: 'Reefer Cold-Chain Temperature Compliance & Thresholds',
    content: 'Perishable goods require calibrated reefer containers maintaining +2°C to +6°C for dairy/produce and -18°C for frozen cargo. Telematics gateway triggers an audible alarm and SMS alert if temp deviates by >2.5°C for over 15 minutes.',
    keywords: ['cold chain', 'reefer', 'temperature', 'frozen', 'perishable', 'pharma', 'dairy'],
    lastUpdated: '2026-08-28'
  },
  {
    id: 'KB-004',
    category: 'Safety & HAZMAT',
    title: 'Highway Breakdown, Spillage & Emergency Response SOP',
    content: 'In case of tire blowout, mechanical failure, or road incident, drivers must activate hazard lights, place reflective triangles 50m behind vehicle, and call our 24/7 Operations Hotline at 1800-PRE-LMS (ext 9). Recovery dispatch deployed within 40 mins.',
    keywords: ['emergency', 'breakdown', 'accident', 'spill', 'tire', 'puncture', 'police', 'urgent', 'hotline'],
    lastUpdated: '2026-08-30'
  },
  {
    id: 'KB-005',
    category: 'GST & Invoicing',
    title: 'GST Tax Invoicing & e-Way Bill Reconciliation Rules',
    content: 'All inter-state dispatches are levied with 18% IGST; intra-state shipments are billed with 9% CGST + 9% SGST. Official GST tax invoices require signed electronic Proof of Delivery (e-POD) and valid e-Way bill numbers.',
    keywords: ['gst', 'tax', 'invoice', 'eway bill', 'billing', 'rates', 'cgst', 'sgst', 'igst'],
    lastUpdated: '2026-08-25'
  }
];

let vehicleCounter = initialVehicles.length + 1;
let driverCounter = initialDrivers.length + 1;
let orderCounter = 1002;
let tripCounter = 1003;
let invoiceCounter = 1006;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      vehicles: [...initialVehicles],
      drivers: [...initialDrivers],
      customers: [...initialCustomers],
      products: [...initialProducts],
      inventory: [...initialInventory],
      orders: [...initialOrders],
      trips: [...initialTrips],
      invoices: [...initialInvoices],
      alerts: [...initialAlerts],
      messages: { ...mockDriverMessages },
      leads: [...initialLeads],
      knowledgeBase: [...initialKnowledgeBase],
      isLoggedIn: false,
      currentUser: {
        id: 'USR-001',
        name: 'Rajesh Varma',
        email: 'admin@precisionlogistics.com',
        role: 'Operations Director',
        avatar: 'RV',
        facility: 'Lucknow Central Hub'
      },

      addShipperLead: (lead) => {
        const id = `LEAD-${Math.floor(100 + Math.random() * 900)}`;
        const newLead: ShipperLead = {
          ...lead,
          id,
          status: 'New',
          createdAt: new Date().toISOString().split('T')[0]
        };
        set(s => ({ leads: [newLead, ...s.leads] }));
        return id;
      },

      updateLeadStatus: (id, status) => {
        set(s => ({
          leads: s.leads.map(l => l.id === id ? { ...l, status } : l)
        }));
      },

      convertLeadToOrder: (leadId) => {
        const state = get();
        const lead = state.leads.find(l => l.id === leadId);
        if (!lead) return '';

        const orderId = state.addOrder({
          customerId: 'C001',
          origin: lead.originHub,
          destination: lead.destinationHub,
          items: [
            { productId: 'P001', quantity: lead.estimatedWeightKg }
          ],
          totalWeight: lead.estimatedWeightKg,
          status: 'Pending',
          distance: 350,
          freightRate: 2.2,
          loadingBay: 'Bay 3',
          vehicleId: null,
          driverId: null
        });

        set(s => ({
          leads: s.leads.map(l => l.id === leadId ? { ...l, status: 'Allocated' as const, associatedOrderId: orderId } : l)
        }));

        return orderId;
      },

      addKnowledgeBaseItem: (item) => {
        const id = `KB-${String(Math.floor(10 + Math.random() * 90)).padStart(3, '0')}`;
        const newItem: KnowledgeBaseItem = {
          ...item,
          id,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        set(s => ({ knowledgeBase: [newItem, ...s.knowledgeBase] }));
        return id;
      },

      updateKnowledgeBaseItem: (id, updates) => {
        set(s => ({
          knowledgeBase: s.knowledgeBase.map(k => k.id === id ? { ...k, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : k)
        }));
      },

      deleteKnowledgeBaseItem: (id) => {
        set(s => ({
          knowledgeBase: s.knowledgeBase.filter(k => k.id !== id)
        }));
      },

      login: (credentials) => {
        if (credentials?.email) {
          const email = credentials.email;
          let name = 'Rajesh Varma';
          let role: UserProfile['role'] = 'Operations Director';
          let avatar = 'RV';
          let facility = 'Lucknow Central Hub';

          if (email.includes('dispatch')) {
            name = 'Ananya Singh';
            role = 'Fleet Dispatcher';
            avatar = 'AS';
            facility = 'Delhi NCR Logistics Hub';
          } else if (email.includes('compliance') || email.includes('safety')) {
            name = 'Vikram Rathore';
            role = 'Compliance Officer';
            avatar = 'VR';
            facility = 'Kanpur Regional Terminal';
          } else if (credentials.name) {
            name = credentials.name;
            avatar = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          }

          set({
            isLoggedIn: true,
            currentUser: {
              id: 'USR-' + Math.floor(100 + Math.random() * 900),
              name,
              email,
              role,
              avatar,
              facility
            }
          });
        } else {
          set({ isLoggedIn: true });
        }
      },

      logout: () => {
        // Clear Zustand state
        set({ isLoggedIn: false });
        // Clear the HttpOnly session cookie server-side
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {/* best-effort */});
      },

      resetSystemData: () => {
        set({
          vehicles: JSON.parse(JSON.stringify(initialVehicles)),
          drivers: JSON.parse(JSON.stringify(initialDrivers)),
          customers: JSON.parse(JSON.stringify(initialCustomers)),
          products: JSON.parse(JSON.stringify(initialProducts)),
          inventory: JSON.parse(JSON.stringify(initialInventory)),
          orders: JSON.parse(JSON.stringify(initialOrders)),
          trips: JSON.parse(JSON.stringify(initialTrips)),
          invoices: JSON.parse(JSON.stringify(initialInvoices)),
          alerts: JSON.parse(JSON.stringify(initialAlerts)),
          messages: JSON.parse(JSON.stringify(mockDriverMessages)),
        });
      },

      addVehicle: (v) => {
    const id = `V${String(vehicleCounter++).padStart(3, '0')}`;
    const newVehicle: Vehicle = {
      ...v,
      id,
      activityLog: [
        { id: `ACT-${Date.now()}`, title: 'Vehicle Registered & Onboarded into Fleet', timestamp: 'Just now', type: 'inspection' }
      ]
    };
    set(s => ({ vehicles: [...s.vehicles, newVehicle] }));
  },

  updateVehicle: (id, updates) => {
    set(s => ({ vehicles: s.vehicles.map(v => v.id === id ? { ...v, ...updates } : v) }));
  },

  addDriver: (d) => {
    const id = `D${String(driverCounter++).padStart(3, '0')}`;
    set(s => ({ drivers: [...s.drivers, { ...d, id }] }));
  },

  updateDriver: (id, updates) => {
    set(s => ({ drivers: s.drivers.map(d => d.id === id ? { ...d, ...updates } : d) }));
  },

  reassignDriverVehicle: (driverId, newVehicleId) => {
    const { updateDriver, updateVehicle } = get();
    const driver = get().drivers.find(d => d.id === driverId);
    if (!driver) return;

    if (driver.vehicleId) {
      updateVehicle(driver.vehicleId, { driverId: null });
    }

    updateDriver(driverId, { vehicleId: newVehicleId });
    if (newVehicleId) {
      updateVehicle(newVehicleId, { driverId });
    }
  },

  addOrder: (o) => {
    const id = `ORD-${orderCounter++}`;
    const order: Order = {
      ...o,
      id,
      createdAt: new Date().toISOString().split('T')[0],
      deadline: 'Today 18:00',
      loadingBay: 'Bay 4'
    };
    set(s => ({ orders: [...s.orders, order] }));
    return id;
  },

  updateOrder: (id, updates) => {
    set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, ...updates } : o) }));
  },

  scanOrderItem: (orderId, productId) => {
    set(s => ({
      orders: s.orders.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map(item => item.productId === productId ? { ...item, scanned: true } : item)
        };
      })
    }));
  },

  allocateVehicle: (orderId, vehicleId, driverId, overrideReason) => {
    const { updateOrder, updateVehicle, updateDriver } = get();
    updateOrder(orderId, { status: 'Allocated', vehicleId, driverId });
    updateVehicle(vehicleId, { status: 'In Transit' });
    if (driverId) updateDriver(driverId, { status: 'On Trip' });
  },

  confirmLoading: (orderId, bay = 'Bay 4') => {
    const state = get();
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    order.items.forEach(item => {
      state.updateInventory(item.productId, -item.quantity);
    });

    if (order.vehicleId) {
      state.updateVehicle(order.vehicleId, { currentLoad: order.totalWeight });
    }
    state.updateOrder(orderId, { status: 'In Transit', loadingBay: bay });
  },

  addTrip: (orderId) => {
    const state = get();
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return '';
    const id = `TRP-${tripCounter++}`;
    const trip: Trip = {
      id,
      orderId,
      vehicleId: order.vehicleId || 'V001',
      driverId: order.driverId || 'D001',
      origin: order.origin,
      destination: order.destination,
      distance: order.distance,
      load: order.totalWeight,
      status: 'In Transit' as const,
      progress: 0,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      eta: `${Math.round((order.distance / 60) * 60)} min`,
      completedAt: null,
      speedKmH: 62,
      fuelPercent: 88,
      cargoTemp: '20.8°C Ambient',
      geofenceStatus: 'Inside Corridor' as const,
      checkpoints: [
        { name: `${order.origin} Dispatch Gate`, location: order.origin, passed: true, time: 'Just now' },
        { name: 'Midway Highway Corridor Toll', location: 'NH Expressway', passed: false },
        { name: `${order.destination} Ingate Checkpoint`, location: order.destination, passed: false }
      ]
    };
    set(s => ({ trips: [...s.trips, trip] }));
    return id;
  },

  updateTrip: (id, updates) => {
    set(s => ({ trips: s.trips.map(t => t.id === id ? { ...t, ...updates } : t) }));
  },

  completeDelivery: (tripId, deliveredQty, damagedQty = 0, receiverName = 'Verified Receiver', podSigned = true) => {
    const state = get();
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;

    state.updateTrip(tripId, {
      status: 'Delivered' as const,
      progress: 100,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      geofenceStatus: 'Arrived' as const,
      speedKmH: 0
    });

    state.updateOrder(trip.orderId, { status: 'Delivered' as const });

    if (trip.vehicleId) {
      state.updateVehicle(trip.vehicleId, { status: 'Available' as const, currentLoad: 0 });
    }
    if (trip.driverId) {
      state.updateDriver(trip.driverId, { status: 'Available' as const });
    }
  },

  generateInvoice: (orderId, damageDeduction = 0, receiverName = 'Authorized Receiver') => {
    const state = get();
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return '';
    const id = `INV-${invoiceCounter++}`;
    const freight = Math.round(order.totalWeight * order.freightRate * order.distance / 100);
    const loading = 2000;
    const unloading = 1500;
    const gross = freight + loading + unloading;
    const subtotal = Math.max(0, gross - damageDeduction);
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;

    const invoice: Invoice = {
      id,
      orderId,
      customerId: order.customerId,
      tripId: state.trips.find(t => t.orderId === orderId)?.id || null,
      freight,
      loading,
      unloading,
      damageDeduction,
      subtotal,
      gst,
      total,
      status: 'Pending' as const,
      createdAt: new Date().toISOString().split('T')[0],
      podSigned: true,
      receiverName
    };
    set(s => ({ invoices: [...s.invoices, invoice] }));
    state.updateOrder(orderId, { status: 'Delivered' as const });
    return id;
  },

  updateInventory: (productId, delta) => {
    set(s => ({
      inventory: s.inventory.map(i =>
        i.productId === productId
          ? { ...i, quantity: Math.max(0, i.quantity + delta) }
          : i
      )
    }));
  },

  dismissAlert: (alertId) => {
    set(s => ({ alerts: s.alerts.filter(a => a.id !== alertId) }));
  },

  sendDriverMessage: (driverId, text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    set(s => ({
      messages: {
        ...s.messages,
        [driverId]: [
          ...(s.messages[driverId] || []),
          { sender: 'dispatcher' as const, text, time }
        ]
      }
    }));
  }
}),
{
  name: 'precision-lms-enterprise-storage',
  storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  })),
  partialize: (state) => ({
    isLoggedIn: state.isLoggedIn,
    currentUser: state.currentUser,
    orders: state.orders,
    vehicles: state.vehicles,
    drivers: state.drivers,
    trips: state.trips,
    invoices: state.invoices,
    inventory: state.inventory,
    alerts: state.alerts,
    messages: state.messages,
    leads: state.leads,
    knowledgeBase: state.knowledgeBase
  })
}
)
);
