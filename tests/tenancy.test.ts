// Cross-tenant isolation tests: real route handlers + real migrations on PGlite,
// with tenant requests running under the restricted RLS role (DB_RLS_ROLE=app_rls).

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';

vi.mock('@/lib/db', async () => {
  const { getTestDb } = await import('./helpers/testDb');
  return { db: (await getTestDb()).db };
});

import { getTestDb } from './helpers/testDb';
import { sessionFor, driverAuthFor, request, params } from './helpers/http';
import { withTenant } from '@/lib/tenancy';
import { nextId } from '@/lib/ids';
import * as ordersRoute from '@/app/api/orders/route';
import * as orderRoute from '@/app/api/orders/[id]/route';
import * as tripsRoute from '@/app/api/trips/route';
import * as tripRoute from '@/app/api/trips/[id]/route';
import * as invoicesRoute from '@/app/api/invoices/route';
import * as invoicePdfRoute from '@/app/api/invoices/[id]/pdf/route';
import * as vehiclesRoute from '@/app/api/vehicles/route';
import * as vehicleRoute from '@/app/api/vehicles/[id]/route';
import * as driversRoute from '@/app/api/drivers/route';
import * as customersRoute from '@/app/api/customers/route';
import * as navCountsRoute from '@/app/api/nav-counts/route';
import * as trackRoute from '@/app/api/track/[id]/route';
import * as gpsRoute from '@/app/api/gps/ping/route';
import * as queueRoute from '@/app/api/agent/queue/route';
import * as configureRoute from '@/app/api/tenants/configure/route';
import * as entitlementsRoute from '@/app/api/tenant/entitlements/route';

const A = 'ten_alpha';
const B = 'ten_bravo';
let cookieA = '';
let cookieB = '';

beforeAll(async () => {
  const { client } = await getTestDb();
  // Fixtures are written by the owner role (bypasses RLS), like the system jobs do.
  await client.exec(`
    insert into tenants (id, name, slug, archetype, is_configured) values
      ('${A}', 'Alpha Logistics', 'alpha', 'FLEET_OWNER', true),
      ('${B}', 'Bravo Freight', 'bravo', 'FLEET_OWNER', true);
    insert into customers (id, tenant_id, name) values ('C101', '${A}', 'Alpha Customer'), ('C201', '${B}', 'Bravo Customer');
    insert into drivers (id, tenant_id, name, phone, license_no, license_expiry, vehicle_id, status, document_verified) values
      ('D101', '${A}', 'Asha Driver', '+919000000101', 'LIC-A-1', '2031-01-01', 'V101', 'Available', true),
      ('D201', '${B}', 'Bala Driver', '+919000000201', 'LIC-B-1', '2031-01-01', 'V201', 'Available', true);
    insert into vehicles (id, tenant_id, vehicle_no, type, capacity_kg, status, driver_id) values
      ('V101', '${A}', 'MH12AA0101', '19 ft truck', 10000, 'Available', 'D101'),
      ('V201', '${B}', 'KA01BB0201', '19 ft truck', 10000, 'Available', 'D201');
    insert into orders (id, tenant_id, customer_id, origin, destination, total_weight_kg, status, distance_km, freight_rate) values
      ('ORD-5001', '${A}', 'C101', 'Pune', 'Mumbai', 3000, 'Pending', 150, 2.0),
      ('ORD-6001', '${B}', 'C201', 'Bengaluru', 'Chennai', 3000, 'Pending', 350, 2.0);
    insert into trips (id, tenant_id, order_id, vehicle_id, driver_id, origin, destination, distance_km, status) values
      ('TRP-6001', '${B}', 'ORD-6001', 'V201', 'D201', 'Bengaluru', 'Chennai', 350, 'In Transit');
    insert into invoices (id, tenant_id, order_id, customer_id, total, status) values
      ('INV-6001', '${B}', 'ORD-6001', 'C201', '1000', 'Pending');
  `);
  cookieA = await sessionFor(A);
  cookieB = await sessionFor(B);
});

const json = async (res: Response) => ({ status: res.status, body: await res.json() });

describe('row-level security (raw SQL as the restricted role)', () => {
  const asRole = async (tenant: string | null, query: string) => {
    const { client } = await getTestDb();
    await client.exec('begin');
    try {
      await client.exec('set local role app_rls');
      if (tenant) await client.query(`select set_config('app.tenant_id', $1, true)`, [tenant]);
      return (await client.query(query)).rows;
    } finally {
      await client.exec('rollback');
    }
  };

  it('shows each tenant only its own rows', async () => {
    expect(await asRole(A, 'select id from orders order by id')).toEqual([{ id: 'ORD-5001' }]);
    expect(await asRole(B, 'select id from orders order by id')).toEqual([{ id: 'ORD-6001' }]);
  });

  it('shows nothing when no tenant is set', async () => {
    expect(await asRole(null, 'select id from orders')).toEqual([]);
  });

  it('rejects writing a row into another tenant', async () => {
    await expect(asRole(A, `insert into customers (id, tenant_id, name) values ('C999', '${B}', 'x')`))
      .rejects.toThrow(/row-level security/);
  });

  it('cannot update or delete another tenant’s rows', async () => {
    expect(await asRole(A, `with u as (update orders set status = 'Cancelled' where id = 'ORD-6001' returning id) select count(*)::int as n from u`))
      .toEqual([{ n: 0 }]);
    expect(await asRole(A, `with d as (delete from invoices where id = 'INV-6001' returning id) select count(*)::int as n from d`))
      .toEqual([{ n: 0 }]);
  });

  it('denies the login table entirely', async () => {
    await expect(asRole(A, 'select id from users')).rejects.toThrow(/permission denied/);
  });
});

describe('withTenant()', () => {
  it('runs as the restricted role with the tenant set', async () => {
    const { rows } = await withTenant(A, tx => tx.execute(sql`select current_user as role, current_setting('app.tenant_id') as tenant`));
    expect(rows[0]).toEqual({ role: 'app_rls', tenant: A });
  });

  it('still isolates a query that forgot its tenant filter (RLS backstop)', async () => {
    const { orders } = await import('@/lib/schema');
    const rows = await withTenant(A, tx => tx.select({ id: orders.id, tenantId: orders.tenantId }).from(orders));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.tenantId === A)).toBe(true);
  });
});

describe('API isolation between tenants', () => {
  it('lists only the caller’s orders, vehicles, drivers and customers', async () => {
    const orders = await json(await ordersRoute.GET(request('/api/orders', { cookie: cookieA })));
    expect(orders.status).toBe(200);
    expect(orders.body.map((o: { id: string }) => o.id)).toEqual(['ORD-5001']);

    const vehicles = await json(await vehiclesRoute.GET(request('/api/vehicles', { cookie: cookieA })));
    expect(vehicles.body.map((v: { id: string }) => v.id)).toEqual(['V101']);
    const drivers = await json(await driversRoute.GET(request('/api/drivers', { cookie: cookieA })));
    expect(drivers.body.map((d: { id: string }) => d.id)).toEqual(['D101']);
    const customers = await json(await customersRoute.GET(request('/api/customers', { cookie: cookieB })));
    expect(customers.body.map((c: { id: string }) => c.id)).toEqual(['C201']);
  });

  it('returns 404 for another tenant’s order, invoice PDF and vehicle', async () => {
    expect((await orderRoute.GET(request('/api/orders/ORD-6001', { cookie: cookieA }), params({ id: 'ORD-6001' }))).status).toBe(404);
    expect((await invoicePdfRoute.GET(request('/api/invoices/INV-6001/pdf', { cookie: cookieA }), params({ id: 'INV-6001' }))).status).toBe(404);
    expect((await vehicleRoute.GET(request('/api/vehicles/V201', { cookie: cookieA }), params({ id: 'V201' }))).status).toBe(404);
  });

  it('cannot cancel, edit or delete another tenant’s records', async () => {
    const cancel = await orderRoute.PATCH(
      request('/api/orders/ORD-6001', { method: 'PATCH', cookie: cookieA, body: { status: 'Cancelled' } }),
      params({ id: 'ORD-6001' }),
    );
    expect(cancel.status).toBe(404);
    const edit = await vehicleRoute.PATCH(
      request('/api/vehicles/V201', { method: 'PATCH', cookie: cookieA, body: { status: 'Maintenance' } }),
      params({ id: 'V201' }),
    );
    expect(edit.status).toBe(404);
    const del = await vehicleRoute.DELETE(request('/api/vehicles/V201', { method: 'DELETE', cookie: cookieA }), params({ id: 'V201' }));
    expect(del.status).toBe(404);

    const { client } = await getTestDb();
    const { rows } = await client.query<{ status: string }>(`select status from orders where id = 'ORD-6001'`);
    expect(rows[0].status).toBe('Pending');
    const v = await client.query<{ status: string }>(`select status from vehicles where id = 'V201'`);
    expect(v.rows[0].status).toBe('Available');
  });

  it('cannot allocate its order to another tenant’s vehicle or driver', async () => {
    const res = await json(await orderRoute.PATCH(
      request('/api/orders/ORD-5001', { method: 'PATCH', cookie: cookieA, body: { _action: 'allocate', vehicleId: 'V201', driverId: 'D201' } }),
      params({ id: 'ORD-5001' }),
    ));
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Vehicle not found');
  });

  it('cannot reference another tenant’s customer or dispatch another tenant’s order', async () => {
    const order = await ordersRoute.POST(request('/api/orders', {
      method: 'POST', cookie: cookieA,
      body: { customerId: 'C201', origin: 'Pune', destination: 'Nashik', totalWeight: 1000 },
    }));
    expect(order.status).toBe(404);
    const trip = await tripsRoute.POST(request('/api/trips', { method: 'POST', cookie: cookieA, body: { orderId: 'ORD-6001' } }));
    expect(trip.status).toBe(404);
    const invoice = await invoicesRoute.POST(request('/api/invoices', { method: 'POST', cookie: cookieA, body: { orderId: 'ORD-6001' } }));
    expect(invoice.status).toBe(404);
  });

  it('counts only the caller’s records in the sidebar badges', async () => {
    const a = await json(await navCountsRoute.GET(request('/api/nav-counts', { cookie: cookieA })));
    const b = await json(await navCountsRoute.GET(request('/api/nav-counts', { cookie: cookieB })));
    expect(a.body.activeTrips).toBe(0);
    expect(b.body.activeTrips).toBe(1);
  });

  it('rejects sessions issued before workspaces existed', async () => {
    const legacy = await sessionFor(undefined);
    expect((await ordersRoute.GET(request('/api/orders', { cookie: legacy }))).status).toBe(401);
  });

  it('rejects a GPS ping for another tenant’s trip even with a valid driver link', async () => {
    const auth = await driverAuthFor(A, 'V201', 'TRP-6001');
    const res = await gpsRoute.POST(request('/api/gps/ping', {
      method: 'POST', headers: { authorization: auth },
      body: { vehicleId: 'V201', tripId: 'TRP-6001', lat: 12.97, lng: 77.59 },
    }));
    expect(res.status).toBe(404);
  });

  it('accepts a GPS ping for the tenant’s own live trip', async () => {
    const auth = await driverAuthFor(B, 'V201', 'TRP-6001');
    const res = await gpsRoute.POST(request('/api/gps/ping', {
      method: 'POST', headers: { authorization: auth },
      body: { vehicleId: 'V201', tripId: 'TRP-6001', lat: 12.97, lng: 77.59, speedKmH: 40 },
    }));
    expect(res.status).toBe(200);
    const { client } = await getTestDb();
    const { rows } = await client.query<{ tenant_id: string }>(`select tenant_id from gps_pings where trip_id = 'TRP-6001'`);
    expect(rows).toEqual([{ tenant_id: B }]);
  });

  it('public tracking resolves the shipment inside its own workspace, without phone numbers', async () => {
    const res = await json(await trackRoute.GET(request('/api/track/ORD-6001'), params({ id: 'ORD-6001' })));
    expect(res.status).toBe(200);
    expect(res.body.customerName).toBe('Bravo Customer');
    expect(res.body.driver).toEqual({ name: 'Bala' });
    expect(JSON.stringify(res.body)).not.toMatch(/\+91/);
  });

  it('keeps the AI autonomy level per workspace', async () => {
    const set = await queueRoute.POST(request('/api/agent/queue', { method: 'POST', cookie: cookieA, body: { newAutonomyLevel: 5 } }));
    expect(set.status).toBe(200);
    const a = await json(await queueRoute.GET(request('/api/agent/queue', { cookie: cookieA })));
    const b = await json(await queueRoute.GET(request('/api/agent/queue', { cookie: cookieB })));
    expect(a.body.data.autonomyLevel).toBe(5);
    expect(b.body.data.autonomyLevel).toBe(2);
  });

  it('stores module entitlements per workspace', async () => {
    const configured = await configureRoute.POST(request('/api/tenants/configure', {
      method: 'POST', cookie: cookieA, body: { archetype: 'FLEET_OWNER', complexityScore: 30, enabledModules: ['FLEET', 'TMS'] },
    }));
    expect(configured.status).toBe(200);
    const a = await json(await entitlementsRoute.GET(request('/api/tenant/entitlements', { cookie: cookieA })));
    const b = await json(await entitlementsRoute.GET(request('/api/tenant/entitlements', { cookie: cookieB })));
    expect(a.body.enabledModules.sort()).toEqual(['FLEET', 'TMS']);
    expect(b.body.enabledModules).toContain('INVOICING'); // defaults
  });
});

describe('order-to-cash inside one tenant (under the RLS role)', () => {
  it('books, allocates, dispatches, delivers and invoices an order', async () => {
    const created = await json(await ordersRoute.POST(request('/api/orders', {
      method: 'POST', cookie: cookieA,
      body: { customerId: 'C101', origin: 'Pune', destination: 'Bengaluru', totalWeight: 4000, distance: 900, freightRate: 2 },
    })));
    expect(created.status).toBe(201);
    expect(created.body.tenantId).toBe(A);
    const orderId: string = created.body.id;

    const allocated = await orderRoute.PATCH(
      request(`/api/orders/${orderId}`, { method: 'PATCH', cookie: cookieA, body: { _action: 'allocate', vehicleId: 'V101', driverId: 'D101' } }),
      params({ id: orderId }),
    );
    expect(allocated.status).toBe(200);

    const loaded = await orderRoute.PATCH(
      request(`/api/orders/${orderId}`, { method: 'PATCH', cookie: cookieA, body: { status: 'In Transit', loadingBay: 'Bay 2' } }),
      params({ id: orderId }),
    );
    expect(loaded.status).toBe(200);

    const trip = await json(await tripsRoute.POST(request('/api/trips', { method: 'POST', cookie: cookieA, body: { orderId } })));
    expect(trip.status).toBe(201);
    expect(trip.body.tenantId).toBe(A);

    const done = await tripRoute.PATCH(
      request(`/api/trips/${trip.body.id}`, { method: 'PATCH', cookie: cookieA, body: { _action: 'complete' } }),
      params({ id: trip.body.id }),
    );
    expect(done.status).toBe(200);

    const invoice = await json(await invoicesRoute.POST(request('/api/invoices', { method: 'POST', cookie: cookieA, body: { orderId } })));
    expect(invoice.status).toBe(201);
    expect(invoice.body.tenantId).toBe(A);
    // No GST option recorded, so reverse charge: 4,000 kg × ₹2 × 900 km / 100 + ₹3,500 handling,
    // no GST added, and the customer (no GSTIN) is assumed to be in the supplier's state
    expect(Number(invoice.body.subtotal)).toBe(75500);
    expect(Number(invoice.body.gst)).toBe(0);
    expect(Number(invoice.body.total)).toBe(75500);
    expect(invoice.body).toMatchObject({ gstScheme: 'RCM_5', placeOfSupply: '09', igst: null });
    expect([Number(invoice.body.cgst), Number(invoice.body.sgst)]).toEqual([1887.5, 1887.5]);

    const { client } = await getTestDb();
    const v = await client.query<{ status: string; current_load_kg: number }>(`select status, current_load_kg from vehicles where id = 'V101'`);
    expect(v.rows[0]).toEqual({ status: 'Available', current_load_kg: 0 });
    // Tenant B never sees any of it
    const bOrders = await json(await ordersRoute.GET(request('/api/orders', { cookie: cookieB })));
    expect(bOrders.body.map((o: { id: string }) => o.id)).not.toContain(orderId);
  });
});

describe('ID counters', () => {
  it('hands out unique, increasing IDs', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) ids.push(await withTenant(A, tx => nextId(tx, 'KB')));
    expect(new Set(ids).size).toBe(5);
    const nums = ids.map(id => Number(id.replace(/\D/g, '')));
    expect(nums).toEqual([...nums].sort((x, y) => x - y));
  });

  it('formats padded kinds', async () => {
    const { db } = await getTestDb();
    await db.execute(sql`delete from id_counters where kind = 'VEH'`);
    expect(await withTenant(A, tx => nextId(tx, 'VEH'))).toBe('V001');
    expect(await withTenant(A, tx => nextId(tx, 'VEH'))).toBe('V002');
  });
});
