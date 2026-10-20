// Driver trip link and e-POD, through the real route handlers on PGlite with the RLS role:
// queued GPS batches, tracking that stops when the trip closes, and hashed, append-only POD records.

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', async () => {
  const { getTestDb } = await import('./helpers/testDb');
  return { db: (await getTestDb()).db };
});

import { getTestDb } from './helpers/testDb';
import { sessionFor, driverAuthFor, request, params } from './helpers/http';
import { resetRateLimits } from '@/lib/rateLimit';
import { deliveryOtp } from '@/lib/auth';
import { sha256Hex, pngDataUrlBytes, type PodRecord } from '@/features/delivery/pod';
import * as gpsRoute from '@/app/api/gps/ping/route';
import * as podRoute from '@/app/api/trips/[id]/pod/route';
import * as otpRoute from '@/app/api/trips/[id]/pod/otp/route';
import * as podListRoute from '@/app/api/pod/route';
import * as exportRoute from '@/app/api/pod/export/route';

const A = 'ten_podalpha';
const B = 'ten_podbravo';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
let directorA = '';
let dispatcherA = '';
let warehouseA = '';
let complianceA = '';
let directorB = '';

beforeAll(async () => {
  const { client } = await getTestDb();
  await client.exec(`
    insert into tenants (id, name, slug, archetype, is_configured) values
      ('${A}', 'Alpha Roadways', 'podalpha', 'FLEET_OWNER', true),
      ('${B}', 'Bravo Carriers', 'podbravo', 'FLEET_OWNER', true);
    insert into customers (id, tenant_id, name, phone) values ('C901', '${A}', 'Alpha Consignee', '98765 43210'), ('C902', '${B}', 'Bravo Consignee', null);
    insert into drivers (id, tenant_id, name, phone, license_no, license_expiry, vehicle_id, status, document_verified) values
      ('D901', '${A}', 'Ravi', '+919000000901', 'MH1220190012345', '2031-01-01', 'V901', 'On Trip', true),
      ('D902', '${B}', 'Bala', '+919000000902', 'KA0120190054321', '2031-01-01', 'V902', 'On Trip', true);
    insert into vehicles (id, tenant_id, vehicle_no, type, capacity_kg, status, driver_id) values
      ('V901', '${A}', 'MH12PD0901', '19 ft truck', 10000, 'In Transit', 'D901'),
      ('V902', '${B}', 'KA01PD0902', '19 ft truck', 10000, 'In Transit', 'D902');
    insert into orders (id, tenant_id, customer_id, origin, destination, total_weight_kg, status) values
      ('ORD-9001', '${A}', 'C901', 'Pune', 'Mumbai', 3000, 'In Transit'),
      ('ORD-9002', '${A}', 'C901', 'Pune', 'Nashik', 2000, 'In Transit'),
      ('ORD-9003', '${A}', 'C901', 'Pune', 'Surat', 1000, 'In Transit'),
      ('ORD-9101', '${B}', 'C902', 'Bengaluru', 'Chennai', 3000, 'In Transit');
    insert into trips (id, tenant_id, order_id, vehicle_id, driver_id, origin, destination, distance_km, load_kg, status) values
      ('TRP-9001', '${A}', 'ORD-9001', 'V901', 'D901', 'Pune', 'Mumbai', 150, 3000, 'In Transit'),
      ('TRP-9002', '${A}', 'ORD-9002', 'V901', 'D901', 'Pune', 'Nashik', 210, 2000, 'Delivered'),
      ('TRP-9003', '${A}', 'ORD-9003', 'V901', 'D901', 'Pune', 'Surat', 420, 1000, 'In Transit'),
      ('TRP-9101', '${B}', 'ORD-9101', 'V902', 'D902', 'Bengaluru', 'Chennai', 350, 3000, 'In Transit');
  `);
  directorA = await sessionFor(A, 'Operations Director');
  dispatcherA = await sessionFor(A, 'Fleet Dispatcher');
  warehouseA = await sessionFor(A, 'Warehouse Supervisor');
  complianceA = await sessionFor(A, 'Compliance Officer');
  directorB = await sessionFor(B, 'Operations Director');
});

beforeEach(() => resetRateLimits());

const json = async (res: Response) => ({ status: res.status, body: await res.json() });
const ping = async (tripId: string, vehicleId: string, body: Record<string, unknown>, tenant = A) =>
  gpsRoute.POST(request('/api/gps/ping', {
    method: 'POST', headers: { authorization: await driverAuthFor(tenant, vehicleId, tripId) },
    body: { vehicleId, tripId, ...body },
  }));
const capture = (tripId: string, body: Record<string, unknown>, cookie = dispatcherA) =>
  podRoute.POST(request(`/api/trips/${tripId}/pod`, { method: 'POST', cookie, body }), params({ id: tripId }));
const podBody = (overrides: Record<string, unknown> = {}) => ({
  receiverName: 'Sunita Rao',
  confirmation: 'name_only',
  deliveredKg: 3000,
  damagedKg: 10,
  remarks: 'Two cartons crushed',
  checks: { sealIntact: true, countVerified: false, tempVerified: false },
  ...overrides,
});

describe('driver trip link', () => {
  it('names the transporter for the notice and says the trip is tracked', async () => {
    const res = await json(await gpsRoute.GET(request('/api/gps/ping', {
      headers: { authorization: await driverAuthFor(A, 'V901', 'TRP-9001') },
    })));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ transporter: 'Alpha Roadways', vehicleNo: 'MH12PD0901', tracking: true, status: 'In Transit' });
  });

  it('stores a queued batch in the order the phone took the points, with their times', async () => {
    const res = await json(await ping('TRP-9001', 'V901', {
      pings: [
        { lat: 18.52, lng: 73.85, speedKmH: 0, recordedAt: '2026-10-19T06:00:00.000Z' },
        { lat: 18.6, lng: 73.7, speedKmH: 45.5, accuracy: 8, recordedAt: '2026-10-19T06:00:05.000Z' },
        { lat: 18.9, lng: 73.3, speedKmH: 52, accuracy: 6, recordedAt: '2026-10-19T06:00:10.000Z' },
      ],
    }));
    expect(res).toEqual({ status: 200, body: { success: true, accepted: 3 } });

    const { client } = await getTestDb();
    const { rows } = await client.query<{ lat: string; recorded_at: Date }>(
      `select lat, recorded_at from gps_pings where trip_id = 'TRP-9001' order by recorded_at`);
    expect(rows.map(r => Number(r.lat))).toEqual([18.52, 18.6, 18.9]);
    const { rows: [trip] } = await client.query<{ lat: string; speed_kmh: number }>(`select lat, speed_kmh from trips where id = 'TRP-9001'`);
    expect(Number(trip.lat)).toBe(18.9); // live position is the newest point
    expect(trip.speed_kmh).toBe(52);
  });

  it('keeps only the receive time for a point stamped in the future', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect((await ping('TRP-9003', 'V901', { lat: 21.1, lng: 72.8, recordedAt: future })).status).toBe(200);
    const { client } = await getTestDb();
    const { rows } = await client.query(`select recorded_at from gps_pings where trip_id = 'TRP-9003'`);
    expect(rows).toEqual([{ recorded_at: null }]);
  });

  it('rejects oversized batches', async () => {
    const pings = Array.from({ length: 101 }, () => ({ lat: 18.5, lng: 73.8 }));
    expect((await ping('TRP-9001', 'V901', { pings })).status).toBe(400);
  });

  it('refuses pings for a trip that is already delivered', async () => {
    expect((await ping('TRP-9002', 'V901', { lat: 19.9, lng: 73.7 })).status).toBe(409);
  });
});

describe('e-POD capture', () => {
  it('only lets roles that can complete trips record a POD', async () => {
    expect((await capture('TRP-9001', podBody(), warehouseA)).status).toBe(403);
  });

  it('closes the trip, stores the record with its SHA-256 and the truck’s last GPS point', async () => {
    const res = await json(await capture('TRP-9001', podBody()));
    expect(res.status).toBe(201);
    expect(res.body.damageDeduction).toBe(200);
    expect(res.body.recordHash).toBe(await sha256Hex(res.body.record));

    const record = JSON.parse(res.body.record) as PodRecord;
    expect(record).toMatchObject({
      version: 'pod-v1',
      tenantId: A,
      tripId: 'TRP-9001',
      orderId: 'ORD-9001',
      vehicleNo: 'MH12PD0901',
      tripStatusBefore: 'In Transit',
      receiver: { name: 'Sunita Rao', confirmation: 'name_only', otpMatched: false },
      quantities: { deliveredKg: 3000, damagedKg: 10 },
      deduction: { amountInr: '200.00', ratePerKgInr: 20 },
      checks: { sealIntact: true, countVerified: false, tempVerified: false },
      signatureSha256: null,
      photoRef: null,
    });
    expect(record.location).toEqual({
      source: 'driver_phone_gps', lat: 18.9, lng: 73.3, accuracyM: 6, recordedAt: '2026-10-19T06:00:10.000Z',
    });

    const { client } = await getTestDb();
    const { rows: [trip] } = await client.query<{ status: string }>(`select status from trips where id = 'TRP-9001'`);
    const { rows: [order] } = await client.query<{ status: string }>(`select status from orders where id = 'ORD-9001'`);
    const { rows: [vehicle] } = await client.query<{ status: string }>(`select status from vehicles where id = 'V901'`);
    expect([trip.status, order.status, vehicle.status]).toEqual(['Delivered', 'Delivered', 'Available']);
  });

  it('stops the driver link once the trip is closed', async () => {
    expect((await ping('TRP-9001', 'V901', { lat: 19.07, lng: 72.88 })).status).toBe(409);
    const res = await json(await gpsRoute.GET(request('/api/gps/ping', {
      headers: { authorization: await driverAuthFor(A, 'V901', 'TRP-9001') },
    })));
    expect(res.body).toMatchObject({ tracking: false, status: 'Delivered' });
  });

  it('records a POD only once per trip', async () => {
    const res = await json(await capture('TRP-9001', podBody({ receiverName: 'Someone Else' })));
    expect(res.status).toBe(409);
    expect(res.body.recordHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('records a POD for a trip that was closed earlier, saying so', async () => {
    const res = await json(await capture('TRP-9002', podBody({ deliveredKg: 2000, damagedKg: 0 })));
    expect(res.status).toBe(201);
    expect(JSON.parse(res.body.record)).toMatchObject({ tripStatusBefore: 'Delivered', location: null });
  });

  it('checks the consignee OTP, and limits guesses', async () => {
    const otp = await deliveryOtp(A, 'TRP-9003');
    const wrong = otp === '111111' ? '222222' : '111111';
    const bad = await json(await capture('TRP-9003', podBody({ confirmation: 'otp', otp: wrong })));
    expect(bad.status).toBe(400);
    expect(bad.body.error).toMatch(/OTP does not match/);
    expect((await capture('TRP-9003', podBody({ confirmation: 'otp' }))).status).toBe(400); // missing code

    for (let i = 0; i < 4; i++) await capture('TRP-9003', podBody({ confirmation: 'otp', otp: wrong }));
    expect((await capture('TRP-9003', podBody({ confirmation: 'otp', otp }))).status).toBe(429);

    resetRateLimits();
    const good = await json(await capture('TRP-9003', podBody({ confirmation: 'otp', otp, signaturePng: PNG })));
    expect(good.status).toBe(201);
    const record = JSON.parse(good.body.record) as PodRecord;
    expect(record.receiver).toEqual({ name: 'Sunita Rao', confirmation: 'otp', otpMatched: true });
    expect(record.signatureSha256).toBe(await sha256Hex(pngDataUrlBytes(PNG)!));
  });

  it('needs a signature when the receiver confirmed by signing', async () => {
    const { client } = await getTestDb();
    await client.exec(`insert into trips (id, tenant_id, vehicle_id, origin, destination, distance_km, status)
      values ('TRP-9004', '${A}', 'V901', 'Pune', 'Goa', 450, 'In Transit')`);
    expect((await capture('TRP-9004', podBody({ confirmation: 'signature' }))).status).toBe(400);
    expect((await capture('TRP-9004', podBody({ confirmation: 'signature', signaturePng: 'data:image/jpeg;base64,AAAA' }))).status).toBe(400);
  });

  it('gives dispatching roles the consignee code with a WhatsApp link', async () => {
    const res = await json(await otpRoute.GET(request('/api/trips/TRP-9003/pod/otp', { cookie: dispatcherA }), params({ id: 'TRP-9003' })));
    expect(res.status).toBe(200);
    expect(res.body.otp).toBe(await deliveryOtp(A, 'TRP-9003'));
    expect(res.body.whatsappUrl).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    expect(res.body.message).toContain('Alpha Roadways');
    const denied = await otpRoute.GET(request('/api/trips/TRP-9003/pod/otp', { cookie: complianceA }), params({ id: 'TRP-9003' }));
    expect(denied.status).toBe(403);
  });
});

describe('POD records are tenant-scoped and append-only', () => {
  it('hides another workspace’s PODs', async () => {
    expect((await podRoute.GET(request('/api/trips/TRP-9001/pod', { cookie: directorB }), params({ id: 'TRP-9001' }))).status).toBe(404);
    expect((await json(await podListRoute.GET(request('/api/pod', { cookie: directorB })))).body).toEqual([]);
    expect((await exportRoute.GET(request('/api/pod/export?tripId=TRP-9001', { cookie: directorB }))).status).toBe(404);
    expect((await capture('TRP-9101', podBody(), directorA)).status).toBe(404);

    const { client } = await getTestDb();
    await client.exec('begin');
    try {
      await client.exec('set local role app_rls');
      await client.query(`select set_config('app.tenant_id', $1, true)`, [B]);
      expect((await client.query(`select id from pod_records`)).rows).toEqual([]);
    } finally {
      await client.exec('rollback');
    }
  });

  it('lists the workspace’s PODs and re-checks a stored one', async () => {
    const list = await json(await podListRoute.GET(request('/api/pod', { cookie: directorA })));
    expect(list.body.map((p: { tripId: string }) => p.tripId).sort()).toEqual(['TRP-9001', 'TRP-9002', 'TRP-9003']);
    const one = await json(await podRoute.GET(request('/api/trips/TRP-9001/pod', { cookie: directorA }), params({ id: 'TRP-9001' })));
    expect(one.body).toMatchObject({ tripId: 'TRP-9001', receiverName: 'Sunita Rao', hashMatches: true });
  });

  it('rejects updates and deletes, even for the database owner', async () => {
    const { client } = await getTestDb();
    await expect(client.query(`update pod_records set receiver_name = 'Changed' where trip_id = 'TRP-9001'`)).rejects.toThrow(/append-only/);
    await expect(client.query(`delete from pod_records where trip_id = 'TRP-9001'`)).rejects.toThrow(/append-only/);
  });
});

describe('POD audit export', () => {
  it('is for Directors, Dispatchers, Compliance and Finance only', async () => {
    expect((await exportRoute.GET(request('/api/pod/export?tripId=TRP-9001', { cookie: warehouseA }))).status).toBe(403);
  });

  it('downloads one trip’s record with its checks', async () => {
    const res = await exportRoute.GET(request('/api/pod/export?tripId=TRP-9003', { cookie: complianceA }));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="pod-audit-TRP-9003.json"');
    const file = await res.json();
    expect(file.workspace).toEqual({ id: A, name: 'Alpha Roadways' });
    expect(file.generatedBy.role).toBe('Compliance Officer');
    expect(file.records).toHaveLength(1);
    expect(file.records[0]).toMatchObject({ tripId: 'TRP-9003', hashCheck: 'matches', signatureCheck: 'matches', signaturePng: PNG });
    expect(file.records[0].recordHash).toBe(await sha256Hex(file.records[0].record));
  });

  it('exports a date range in India time and validates it', async () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const res = await json(await exportRoute.GET(request(`/api/pod/export?from=${today}&to=${today}`, { cookie: directorA })));
    expect(res.status).toBe(200);
    expect(res.body.records.map((r: { tripId: string }) => r.tripId).sort()).toEqual(['TRP-9001', 'TRP-9002', 'TRP-9003']);
    expect((await exportRoute.GET(request('/api/pod/export?from=2026-10-10&to=2026-10-01', { cookie: directorA }))).status).toBe(400);
    expect((await exportRoute.GET(request('/api/pod/export?from=2025-01-01&to=2026-10-01', { cookie: directorA }))).status).toBe(400);
    expect((await exportRoute.GET(request('/api/pod/export', { cookie: directorA }))).status).toBe(400);
  });
});
