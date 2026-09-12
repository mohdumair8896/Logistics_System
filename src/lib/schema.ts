// ─── Drizzle ORM Schema — Full Production Schema ─────────────────────────────
// Mirrors all TypeScript types exactly.
// Run: npx drizzle-kit push  → to push to Neon DB
// Run: npx drizzle-kit studio → to browse data visually

import {
  pgTable, varchar, text, integer, decimal, boolean,
  timestamp, date, uuid, json, index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// USERS (Enterprise user authentication and roles)
// ─────────────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),  // 'Operations Director' | 'Fleet Dispatcher' | 'Compliance Officer'
  facility: varchar('facility', { length: 100 }),
  avatar: varchar('avatar', { length: 10 }),
  tenantId: varchar('tenant_id', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS (replaces initialCustomers from shared/data/index.ts)
// ─────────────────────────────────────────────────────────────────────────────
export const customers = pgTable('customers', {
  id: varchar('id', { length: 20 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  contact: varchar('contact', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  gstin: varchar('gstin', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS (replaces initialProducts)
// ─────────────────────────────────────────────────────────────────────────────
export const products = pgTable('products', {
  id: varchar('id', { length: 20 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  category: varchar('category', { length: 100 }),
  pricePerKg: decimal('price_per_kg', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY (replaces initialInventory)
// ─────────────────────────────────────────────────────────────────────────────
export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar('product_id', { length: 20 }).references(() => products.id),
  warehouseId: varchar('warehouse_id', { length: 20 }).notNull(),
  quantity: integer('quantity').default(0),
  bay: varchar('bay', { length: 20 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// DRIVERS (replaces initialDrivers from features/drivers/data.ts)
// ─────────────────────────────────────────────────────────────────────────────
export const drivers = pgTable('drivers', {
  id: varchar('id', { length: 20 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  licenseNo: varchar('license_no', { length: 30 }).unique().notNull(),
  licenseExpiry: date('license_expiry').notNull(),
  vehicleId: varchar('vehicle_id', { length: 20 }),
  status: varchar('status', { length: 20 }).default('Available'), // 'Available' | 'On Trip' | 'Off Duty'
  trips: integer('trips_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 1 }).default('5.0'),
  documentVerified: boolean('document_verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLES (replaces initialVehicles from features/vehicles/data.ts)
// ─────────────────────────────────────────────────────────────────────────────
export const vehicles = pgTable('vehicles', {
  id: varchar('id', { length: 20 }).primaryKey(),
  vehicleNo: varchar('vehicle_no', { length: 20 }).unique().notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  capacity: integer('capacity_kg').notNull(),
  currentLoad: integer('current_load_kg').default(0),
  status: varchar('status', { length: 20 }).default('Available'), // 'Available' | 'In Transit' | 'Maintenance'
  driverId: varchar('driver_id', { length: 20 }),
  location: text('location'),
  lastService: date('last_service'),
  odometerKm: integer('odometer_km').default(0),
  fuelLevel: integer('fuel_level').default(100),
  traccarDeviceId: integer('traccar_device_id'),  // future GPS hardware integration
  lat: decimal('lat', { precision: 10, scale: 7 }),  // live GPS latitude
  lng: decimal('lng', { precision: 10, scale: 7 }),  // live GPS longitude
  activityLog: json('activity_log').$type<{ id: string; title: string; timestamp: string; type: 'maintenance' | 'delivery' | 'inspection' }[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS (replaces initialOrders from features/orders/data.ts)
// ─────────────────────────────────────────────────────────────────────────────
export const orders = pgTable('orders', {
  id: varchar('id', { length: 20 }).primaryKey(),
  customerId: varchar('customer_id', { length: 20 }).references(() => customers.id),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  items: json('items').$type<{ productId: string; quantity: number; batchCode?: string; scanned?: boolean }[]>().default([]),
  totalWeight: integer('total_weight_kg').notNull(),
  status: varchar('status', { length: 20 }).default('Pending'), // 'Pending' | 'Allocated' | 'In Transit' | 'Delivered' | 'Cancelled'
  vehicleId: varchar('vehicle_id', { length: 20 }),
  driverId: varchar('driver_id', { length: 20 }),
  distance: integer('distance_km'),
  freightRate: decimal('freight_rate', { precision: 5, scale: 2 }),
  loadingBay: varchar('loading_bay', { length: 20 }),
  deadline: text('deadline'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// TRIPS (replaces initialTrips from features/trips/data.ts)
// ─────────────────────────────────────────────────────────────────────────────
export const trips = pgTable('trips', {
  id: varchar('id', { length: 20 }).primaryKey(),
  orderId: varchar('order_id', { length: 20 }).references(() => orders.id),
  vehicleId: varchar('vehicle_id', { length: 20 }).references(() => vehicles.id),
  driverId: varchar('driver_id', { length: 20 }).references(() => drivers.id),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  distance: integer('distance_km').notNull(),
  load: integer('load_kg'),
  status: varchar('status', { length: 20 }).default('In Transit'), // 'In Transit' | 'Delivered' | 'Cancelled'
  progress: integer('progress').default(0),
  startedAt: text('started_at'),
  eta: text('eta'),
  completedAt: text('completed_at'),
  speedKmH: integer('speed_kmh'),
  fuelPercent: integer('fuel_percent'),
  cargoTemp: text('cargo_temp'),
  geofenceStatus: varchar('geofence_status', { length: 30 }),  // 'Inside Corridor' | 'Deviated' | 'Arrived'
  checkpoints: json('checkpoints').$type<{ name: string; location: string; passed: boolean; time?: string }[]>().default([]),
  lat: decimal('lat', { precision: 10, scale: 7 }),  // live GPS from driver phone
  lng: decimal('lng', { precision: 10, scale: 7 }),  // live GPS from driver phone
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// INVOICES (replaces initialInvoices from features/invoices/data.ts)
// ─────────────────────────────────────────────────────────────────────────────
export const invoices = pgTable('invoices', {
  id: varchar('id', { length: 20 }).primaryKey(),
  orderId: varchar('order_id', { length: 20 }).references(() => orders.id),
  customerId: varchar('customer_id', { length: 20 }).references(() => customers.id),
  tripId: varchar('trip_id', { length: 20 }),
  freight: decimal('freight', { precision: 12, scale: 2 }),
  loading: decimal('loading_charge', { precision: 10, scale: 2 }),
  unloading: decimal('unloading_charge', { precision: 10, scale: 2 }),
  damageDeduction: decimal('damage_deduction', { precision: 10, scale: 2 }).default('0'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }),
  gst: decimal('gst', { precision: 10, scale: 2 }),
  total: decimal('total', { precision: 12, scale: 2 }),
  status: varchar('status', { length: 20 }).default('Pending'),  // 'Pending' | 'Paid'
  podSigned: boolean('pod_signed').default(false),
  podImageUrl: text('pod_image_url'),   // real uploaded URL from R2/S3
  pdfUrl: text('pdf_url'),              // generated GST invoice PDF URL
  receiverName: varchar('receiver_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER MESSAGES (replaces mockDriverMessages — real two-way chat)
// ─────────────────────────────────────────────────────────────────────────────
export const driverMessages = pgTable('driver_messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar('driver_id', { length: 20 }).references(() => drivers.id),
  sender: varchar('sender', { length: 20 }).notNull(), // 'driver' | 'dispatcher'
  text: text('text').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM ALERTS (replaces initialAlerts — real DB-persisted alerts)
// ─────────────────────────────────────────────────────────────────────────────
export const systemAlerts = pgTable('system_alerts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),  // 'warning' | 'info' | 'critical'
  category: varchar('category', { length: 30 }).notNull(),  // 'Weather' | 'Fleet' | 'Driver' | 'Route' | 'Warehouse' | 'Cold-Chain' | 'Geofence'
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// SHIPPER LEADS (from the dispatch assistant / CRM pipeline)
// ─────────────────────────────────────────────────────────────────────────────
export const shipperLeads = pgTable('shipper_leads', {
  id: varchar('id', { length: 20 }).primaryKey(),
  shipperName: varchar('shipper_name', { length: 100 }).notNull(),
  companyName: varchar('company_name', { length: 200 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  originHub: text('origin_hub'),
  destinationHub: text('destination_hub'),
  cargoType: varchar('cargo_type', { length: 50 }),
  estimatedWeightKg: integer('estimated_weight_kg'),
  freightQuote: decimal('freight_quote', { precision: 12, scale: 2 }),
  targetDeliveryDate: date('target_delivery_date'),
  isUrgent: boolean('is_urgent').default(false),
  status: varchar('status', { length: 20 }).default('New'),  // 'New' | 'Allocated' | 'Contacted' | 'Archived'
  transcriptSnippet: text('transcript_snippet'),
  associatedOrderId: varchar('associated_order_id', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────────────────────
export const knowledgeBase = pgTable('knowledge_base', {
  id: varchar('id', { length: 20 }).primaryKey(),
  category: varchar('category', { length: 50 }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  keywords: json('keywords').$type<string[]>().default([]),
  lastUpdated: date('last_updated').default(sql`CURRENT_DATE`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// GPS PINGS (driver smartphone GPS — stored for trip replay)
// ─────────────────────────────────────────────────────────────────────────────
export const gpsPings = pgTable('gps_pings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar('vehicle_id', { length: 20 }).references(() => vehicles.id),
  tripId: varchar('trip_id', { length: 20 }),
  lat: decimal('lat', { precision: 10, scale: 7 }).notNull(),
  lng: decimal('lng', { precision: 10, scale: 7 }).notNull(),
  speedKmH: decimal('speed_kmh', { precision: 6, scale: 2 }),
  accuracy: decimal('accuracy', { precision: 8, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// INCIDENTS (Exceptions, breakdowns, delays, detention detected by Exception Agent)
// ─────────────────────────────────────────────────────────────────────────────
export const incidents = pgTable('incidents', {
  id: varchar('id', { length: 30 }).primaryKey(),
  tripId: varchar('trip_id', { length: 20 }),
  orderId: varchar('order_id', { length: 20 }),
  vehicleId: varchar('vehicle_id', { length: 20 }),
  driverId: varchar('driver_id', { length: 20 }),
  type: varchar('type', { length: 50 }).notNull(), // 'DELAY' | 'BREAKDOWN' | 'ROUTE_DEVIATION' | 'DETENTION' | 'DOC_MISMATCH' | 'FREIGHT_LEAKAGE'
  severity: varchar('severity', { length: 20 }).notNull(), // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 30 }).default('OPEN'), // 'OPEN' | 'INVESTIGATING' | 'AUTO_RESOLVED' | 'RESOLVED' | 'ESCALATED'
  automatedActionTaken: text('automated_action_taken'),
  rootCause: text('root_cause'),
  financialImpact: decimal('financial_impact', { precision: 10, scale: 2 }).default('0'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT WORKFLOWS (Multi-step autonomous execution runs)
// ─────────────────────────────────────────────────────────────────────────────
export const agentWorkflows = pgTable('agent_workflows', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar('agent_id', { length: 50 }).notNull(), // e.g. 'exception-agent', 'driver-agent'
  triggerEvent: varchar('trigger_event', { length: 50 }).notNull(),
  status: varchar('status', { length: 30 }).notNull(), // 'RUNNING' | 'COMPLETED' | 'FAILED'
  reasoningSteps: json('reasoning_steps').$type<{ step: number; title: string; action: string; result?: string; timestamp: string }[]>().default([]),
  outcomeSummary: text('outcome_summary'),
  durationMs: integer('duration_ms').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT AUDIT LOGS (Decoupled event trail)
// ─────────────────────────────────────────────────────────────────────────────
export const agentAuditLogs = pgTable('agent_audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar('agent_id', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 50 }),
  message: text('message').notNull(),
  payload: json('payload').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONAL EVENTS (Canonical Logistics Event Graph Timeline)
// ─────────────────────────────────────────────────────────────────────────────
export const operationalEvents = pgTable('operational_events', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar('shipment_id', { length: 20 }),
  tripId: varchar('trip_id', { length: 20 }),
  vehicleId: varchar('vehicle_id', { length: 20 }),
  driverId: varchar('driver_id', { length: 20 }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  actor: varchar('actor', { length: 50 }).notNull(), // 'SYSTEM' | 'DRIVER' | 'CUSTOMER' | 'CONTROL_TOWER' | 'BILLING' | 'COLLECTIONS'
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location'),
  lat: decimal('lat', { precision: 10, scale: 7 }),
  lng: decimal('lng', { precision: 10, scale: 7 }),
  payload: json('payload').$type<Record<string, unknown>>().default({}),
  evidence: json('evidence').$type<{
    telemetry?: { speedKmH?: number; haltDurationMin?: number; lastPing?: string };
    driverMessage?: string;
    contractRule?: string;
    slaTarget?: string;
    confidenceScore?: number;
  }>().default({}),
  policyId: varchar('policy_id', { length: 50 }),
  autonomyLevel: integer('autonomy_level').default(3), // 0 to 5
  approvalRequired: boolean('approval_required').default(false),
  approvalStatus: varchar('approval_status', { length: 30 }).default('AUTO_APPROVED'), // 'AUTO_APPROVED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  actionDraft: text('action_draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
}, (table) => [
  index('idx_op_events_shipment_created').on(table.shipmentId, table.createdAt),
  index('idx_op_events_approval_status').on(table.approvalStatus, table.createdAt),
  index('idx_op_events_event_type').on(table.eventType),
]);

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-TENANT CONTROL PLANE (Composable Logistics OS)
// ─────────────────────────────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g. 'ten_abc_transport'
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 80 }).unique().notNull(),
  archetype: varchar('archetype', { length: 40 }).notNull(), // 'FLEET_OWNER' | '3PL_PROVIDER' | 'COURIER_LAST_MILE' etc.
  country: varchar('country', { length: 10 }).default('IN'),
  currency: varchar('currency', { length: 5 }).default('INR'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Kolkata'),
  complexityScore: integer('complexity_score').default(25),
  isConfigured: boolean('is_configured').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

export const tenantSubscriptions = pgTable('tenant_subscriptions', {
  id: varchar('id', { length: 60 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 60 }).references(() => tenants.id).notNull(),
  plan: varchar('plan', { length: 30 }).notNull(), // 'FLEX' | 'GROWTH' | 'SCALE' | 'ENTERPRISE'
  status: varchar('status', { length: 20 }).default('ACTIVE'), // 'ACTIVE' | 'TRIAL' | 'PAST_DUE'
  maxVehicles: integer('max_vehicles').default(100),
  maxMonthlyShipments: integer('max_monthly_shipments').default(2500),
  maxAiActions: integer('max_ai_actions').default(7500),
  renewsAt: timestamp('renews_at', { withTimezone: true }),
  spendingLimitCap: decimal('spending_limit_cap', { precision: 12, scale: 2 }).default('50000'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

export const tenantModules = pgTable('tenant_modules', {
  id: varchar('id', { length: 60 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 60 }).references(() => tenants.id).notNull(),
  moduleCode: varchar('module_code', { length: 50 }).notNull(), // 'FLEET', 'WAREHOUSE', 'TMS', etc.
  isEnabled: boolean('is_enabled').default(true),
  enabledAt: timestamp('enabled_at', { withTimezone: true }).default(sql`now()`),
}, (table) => [
  index('idx_tenant_modules_lookup').on(table.tenantId, table.moduleCode),
]);

export const tenantConfigs = pgTable('tenant_configs', {
  tenantId: varchar('tenant_id', { length: 60 }).primaryKey().references(() => tenants.id),
  autonomyLevel: integer('autonomy_level').default(2), // 0 to 5
  autoApproveLimitAmount: decimal('auto_approve_limit_amount', { precision: 10, scale: 2 }).default('5000'),
  detentionGraceHours: integer('detention_grace_hours').default(2),
  slaGraceMinutes: integer('sla_grace_minutes').default(60),
  driverCommChannel: varchar('driver_comm_channel', { length: 30 }).default('WHATSAPP'),
  customFields: json('custom_fields').$type<Record<string, unknown>>().default({}),
  activeIntegrations: json('active_integrations').$type<string[]>().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

export const usageCounters = pgTable('usage_counters', {
  id: varchar('id', { length: 60 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar('tenant_id', { length: 60 }).references(() => tenants.id).notNull(),
  metricPeriod: varchar('metric_period', { length: 7 }).notNull(), // '2026-09'
  shipmentsCount: integer('shipments_count').default(0),
  aiActionsCount: integer('ai_actions_count').default(0),
  whatsappMessagesCount: integer('whatsapp_messages_count').default(0),
  ocrDocumentsCount: integer('ocr_documents_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
}, (table) => [
  index('idx_usage_tenant_period').on(table.tenantId, table.metricPeriod),
]);

