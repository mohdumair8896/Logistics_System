'use client';
import { create } from 'zustand';
import {
  initialVehicles, initialDrivers, initialCustomers, initialProducts,
  initialInventory, initialOrders, initialTrips, initialInvoices, initialAlerts,
  mockDriverMessages, Vehicle, Driver, Customer, Product, Order, Trip, Invoice, SystemAlert
} from './mockData';

export type { Vehicle, Driver, Customer, Product, Order, Trip, Invoice, SystemAlert };

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
  isLoggedIn: boolean;

  login: () => void;
  logout: () => void;
  resetDemoData: () => void;

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

let vehicleCounter = initialVehicles.length + 1;
let driverCounter = initialDrivers.length + 1;
let orderCounter = 1002;
let tripCounter = 1003;
let invoiceCounter = 1006;

export const useStore = create<AppState>((set, get) => ({
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
  isLoggedIn: true,

  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),

  resetDemoData: () => {
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
}));
