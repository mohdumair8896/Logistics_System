-- ============================================================
-- LOGISTICSEDGE PLATFORM (LMS)
-- Database Architecture & Schema Specification
-- Engine: PostgreSQL 15+ / Supabase / Neon / PlanetScale
-- Designed by: Agency Database Optimizer
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ORGANIZATIONS & TENANTS (Multi-Tenant Architecture)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    tax_id VARCHAR(50) NOT NULL, -- GSTIN / VAT
    currency VARCHAR(3) DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. CUSTOMERS & SHIPPERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    billing_address TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    gstin VARCHAR(15),
    sla_hours INTEGER NOT NULL DEFAULT 48,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_org ON customers(org_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_company_search ON customers USING gin(to_tsvector('english', company));

-- ============================================================
-- 3. PRODUCTS & CATALOG
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_weight_kg DECIMAL(10, 3) NOT NULL CHECK (unit_weight_kg > 0),
    handling_requirements VARCHAR(100) DEFAULT 'Ambient', -- Ambient, Cold-chain, Hazmat
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);

-- ============================================================
-- 4. WAREHOUSES & INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    capacity_pallets INTEGER NOT NULL DEFAULT 5000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse_bays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    bay_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Available', -- Available, Occupied, Loading, Maintenance
    current_order_id UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_kg DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (quantity_kg >= 0),
    batch_lot_no VARCHAR(100),
    last_counted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_warehouse_product UNIQUE (warehouse_id, product_id)
);

CREATE INDEX idx_inventory_warehouse_product ON inventory(warehouse_id, product_id);

-- ============================================================
-- 5. FLEET VEHICLES & DRIVERS
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    license_no VARCHAR(100) UNIQUE NOT NULL,
    license_type VARCHAR(100) NOT NULL DEFAULT 'Commercial Heavy (HGV)',
    license_expiry DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Available', -- Available, On Trip, Off Duty, Rest Period
    safety_score DECIMAL(4, 2) NOT NULL DEFAULT 98.50 CHECK (safety_score BETWEEN 0 AND 100),
    hazmat_certified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_phone ON drivers(phone);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_no VARCHAR(50) UNIQUE NOT NULL, -- Registration Plate
    vin VARCHAR(100) UNIQUE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL, -- Heavy Trailer 32ft, Medium Freight 24ft, Light EV Van
    capacity_kg INTEGER NOT NULL CHECK (capacity_kg > 0),
    current_load_kg INTEGER NOT NULL DEFAULT 0 CHECK (current_load_kg <= capacity_kg),
    fuel_capacity_liters INTEGER NOT NULL DEFAULT 350,
    current_fuel_percent INTEGER NOT NULL DEFAULT 100 CHECK (current_fuel_percent BETWEEN 0 AND 100),
    odometer_km INTEGER NOT NULL DEFAULT 0,
    has_cold_chain BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'Available', -- Available, Allocated, In Transit, Maintenance
    current_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    last_service_date DATE,
    next_service_odometer_km INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_capacity ON vehicles(capacity_kg);
-- GIN Index for fast vehicle plate & model search
CREATE INDEX idx_vehicles_search ON vehicles USING gin(to_tsvector('english', vehicle_no || ' ' || make || ' ' || model));

-- ============================================================
-- 6. ORDERS & SHIPMENT MANIFESTS
-- ============================================================
CREATE TYPE order_status AS ENUM (
    'Pending',
    'Allocated',
    'Staged',
    'In Transit',
    'Delivered',
    'Cancelled'
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. ORD-1001
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    origin_city VARCHAR(100) NOT NULL,
    origin_hub VARCHAR(150) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_address TEXT NOT NULL,
    total_weight_kg DECIMAL(10, 2) NOT NULL CHECK (total_weight_kg > 0),
    total_volume_cbm DECIMAL(8, 2),
    handling_category VARCHAR(100) DEFAULT 'Standard Freight',
    status order_status NOT NULL DEFAULT 'Pending',
    scheduled_date DATE NOT NULL,
    deadline_at TIMESTAMPTZ NOT NULL,
    allocated_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    allocated_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    loading_bay VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compound index for status filtering + sorting by deadline
CREATE INDEX idx_orders_status_deadline ON orders(status, deadline_at ASC);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_kg > 0),
    pallet_barcode VARCHAR(100),
    is_scanned BOOLEAN NOT NULL DEFAULT false,
    scanned_at TIMESTAMPTZ
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_barcode ON order_items(pallet_barcode);

-- ============================================================
-- 7. DISPATCHED TRIPS & LIVE CORRIDOR TELEMATICS
-- ============================================================
CREATE TYPE trip_status AS ENUM (
    'Dispatched',
    'In Transit',
    'Approaching',
    'Delivered',
    'Delayed',
    'Aborted'
);

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. TRP-101
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    corridor_name VARCHAR(150) NOT NULL, -- e.g. National Highway 19 (Delhi-Lucknow)
    total_distance_km INTEGER NOT NULL CHECK (total_distance_km > 0),
    traveled_distance_km INTEGER NOT NULL DEFAULT 0,
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    status trip_status NOT NULL DEFAULT 'In Transit',
    current_speed_kmh INTEGER NOT NULL DEFAULT 0,
    current_fuel_percent INTEGER NOT NULL DEFAULT 100,
    cargo_temp_celsius DECIMAL(4, 1),
    geofence_status VARCHAR(100) NOT NULL DEFAULT 'Inside Corridor',
    eta_timestamp TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Partial index for high-frequency queries on active trips
CREATE INDEX idx_trips_active ON trips(id, vehicle_id, current_speed_kmh) 
WHERE status = 'In Transit';

CREATE INDEX idx_trips_order ON trips(order_id);

-- Telematics high-frequency GPS ping table
CREATE TABLE IF NOT EXISTS telematics_logs (
    id BIGSERIAL PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    speed_kmh INTEGER NOT NULL,
    fuel_percent INTEGER NOT NULL,
    temp_celsius DECIMAL(4, 1),
    engine_rpm INTEGER,
    battery_voltage DECIMAL(4, 2),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partitioned / Time-series index for fast telemetry range queries
CREATE INDEX idx_telematics_trip_time ON telematics_logs(trip_id, timestamp DESC);

-- ============================================================
-- 8. ELECTRONIC PROOF OF DELIVERY (e-POD) & GST INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS proofs_of_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID UNIQUE NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    receiver_name VARCHAR(255) NOT NULL,
    delivered_qty_kg DECIMAL(10, 2) NOT NULL,
    damaged_qty_kg DECIMAL(10, 2) DEFAULT 0,
    signature_data_uri TEXT NOT NULL,
    docking_photo_url TEXT,
    gps_lat DECIMAL(9, 6) NOT NULL,
    gps_lng DECIMAL(9, 6) NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. INV-1006
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    subtotal_inr DECIMAL(12, 2) NOT NULL CHECK (subtotal_inr >= 0),
    cgst_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sgst_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
    igst_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_tax_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
    damage_deduction_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
    net_payable_inr DECIMAL(12, 2) NOT NULL CHECK (net_payable_inr >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Generated', -- Generated, Paid, Disputed
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ============================================================
-- 9. SYSTEM ALERTS & EVENT AUDITING
-- ============================================================
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL, -- info, warning, critical
    category VARCHAR(100) NOT NULL, -- geofence, temperature, maintenance, delay
    entity_type VARCHAR(50), -- vehicle, trip, order
    entity_id UUID,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_active ON system_alerts(org_id, severity, created_at DESC) 
WHERE is_dismissed = false;

-- ============================================================
-- ANTI-N+1 QUERY OPTIMIZATION PATTERNS
-- Documented for Application Engineers
-- ============================================================
-- Single aggregated query to load orders with customer and item details
-- Eliminates N+1 rounds:
--
-- EXPLAIN ANALYZE
-- SELECT 
--     o.id, o.order_number, o.status, o.total_weight_kg, o.deadline_at,
--     json_build_object('name', c.name, 'company', c.company, 'phone', c.phone) AS customer,
--     COALESCE(
--         json_agg(
--             json_build_object('product_name', p.name, 'quantity_kg', oi.quantity_kg, 'is_scanned', oi.is_scanned)
--         ) FILTER (WHERE oi.id IS NOT NULL), '[]'
--     ) AS items
-- FROM orders o
-- JOIN customers c ON c.id = o.customer_id
-- LEFT JOIN order_items oi ON oi.order_id = o.id
-- LEFT JOIN products p ON p.id = oi.product_id
-- WHERE o.status = 'Pending'
-- GROUP BY o.id, c.id
-- ORDER BY o.deadline_at ASC;
