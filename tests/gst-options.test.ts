// GTA GST options (Annexure V) per financial year: who may set them, workspace isolation, and how
// new invoices pick them up while earlier invoices keep what they charged. Real routes on PGlite.

import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', async () => {
  const { getTestDb } = await import('./helpers/testDb');
  return { db: (await getTestDb()).db };
});

import { getTestDb } from './helpers/testDb';
import { sessionFor, request, params } from './helpers/http';
import { financialYear } from '@/features/invoices/gst';
import * as gstOptionsRoute from '@/app/api/billing/gst-options/route';
import * as invoicesRoute from '@/app/api/invoices/route';
import * as invoiceRoute from '@/app/api/invoices/[id]/route';
import * as tallyRoute from '@/app/api/invoices/tally-export/route';

const A = 'ten_gst_alpha';
const B = 'ten_gst_bravo';
const FY = financialYear();
let director = '';
let dispatcher = '';
let otherTenant = '';

const json = async (res: Response) => ({ status: res.status, body: await res.json() });
const putOption = (cookie: string, body: unknown) =>
  gstOptionsRoute.PUT(request('/api/billing/gst-options', { method: 'PUT', cookie, body }));
const raised: string[] = [];
const raiseInvoice = async (orderId: string) => {
  const res = await json(await invoicesRoute.POST(request('/api/invoices', { method: 'POST', cookie: director, body: { orderId } })));
  if (res.status === 201) raised.push(res.body.id);
  return res;
};
const exportToTally = (cookie: string, ids: string[]) =>
  tallyRoute.POST(request('/api/invoices/tally-export', { method: 'POST', cookie, body: { ids } }));

beforeAll(async () => {
  const { client } = await getTestDb();
  // Each order: 1,000 kg × ₹2 × 100 km / 100 = ₹2,000 freight + ₹3,500 handling = ₹5,500 taxable
  await client.exec(`
    insert into tenants (id, name, slug, archetype, is_configured) values
      ('${A}', 'GST Alpha', 'gst-alpha', 'FLEET_OWNER', true),
      ('${B}', 'GST Bravo', 'gst-bravo', 'FLEET_OWNER', true);
    insert into customers (id, tenant_id, name, gstin) values
      ('C701', '${A}', 'Delhi Buyer', '07AAACD1234E1Z2'),
      ('C702', '${A}', 'Lucknow Buyer', '09SUNAB3456J4K8');
    insert into orders (id, tenant_id, customer_id, origin, destination, total_weight_kg, status, distance_km, freight_rate) values
      ('ORD-7101', '${A}', 'C701', 'Lucknow', 'Delhi', 1000, 'Delivered', 100, 2.0),
      ('ORD-7102', '${A}', 'C702', 'Lucknow', 'Kanpur', 1000, 'Delivered', 100, 2.0),
      ('ORD-7103', '${A}', 'C701', 'Lucknow', 'Delhi', 1000, 'Delivered', 100, 2.0);
  `);
  director = await sessionFor(A);
  dispatcher = await sessionFor(A, 'Fleet Dispatcher');
  otherTenant = await sessionFor(B);
});

describe('GST options API', () => {
  it('defaults to reverse charge with nothing recorded', async () => {
    const res = await json(await gstOptionsRoute.GET(request('/api/billing/gst-options', { cookie: director })));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ currentFinancialYear: FY, defaultScheme: 'RCM_5', options: [] });
    expect(res.body.schemes.map((s: { id: string }) => s.id)).toEqual(['RCM_5', 'FCM_5', 'FCM_18']);
  });

  it('lets only a Director or Finance Manager record an option', async () => {
    expect((await putOption(dispatcher, { financialYear: FY, scheme: 'FCM_18' })).status).toBe(403);
  });

  it('rejects a malformed financial year, scheme or GSTIN', async () => {
    expect((await putOption(director, { financialYear: '2026-28', scheme: 'FCM_18' })).status).toBe(400);
    expect((await putOption(director, { financialYear: FY, scheme: 'FCM_12' })).status).toBe(400);
    expect((await putOption(director, { financialYear: FY, scheme: 'FCM_18', supplierGstin: '09ABC' })).status).toBe(400);
  });

  it('records an option for this workspace only', async () => {
    const saved = await json(await putOption(director, { financialYear: FY, scheme: 'FCM_18', supplierGstin: '09aaaca1234a1z5' }));
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ financialYear: FY, scheme: 'FCM_18', supplierGstin: '09AAACA1234A1Z5' });

    const mine = await json(await gstOptionsRoute.GET(request('/api/billing/gst-options', { cookie: director })));
    expect(mine.body.options).toMatchObject([{ financialYear: FY, scheme: 'FCM_18' }]);
    const theirs = await json(await gstOptionsRoute.GET(request('/api/billing/gst-options', { cookie: otherTenant })));
    expect(theirs.body.options).toEqual([]);
  });
});

describe('invoices raised under the recorded option', () => {
  let firstInvoiceId = '';

  it('charges 18% IGST to a customer in another state', async () => {
    const inv = await raiseInvoice('ORD-7101');
    expect(inv.status).toBe(201);
    firstInvoiceId = inv.body.id;
    expect(inv.body).toMatchObject({ gstScheme: 'FCM_18', placeOfSupply: '07', cgst: null, sgst: null });
    expect(Number(inv.body.subtotal)).toBe(5500);
    expect(Number(inv.body.igst)).toBe(990);
    expect(Number(inv.body.gst)).toBe(990);
    expect(Number(inv.body.total)).toBe(6490);
  });

  it('switches to 5% forward charge after the option changes, split CGST + SGST in the same state', async () => {
    expect((await putOption(director, { financialYear: FY, scheme: 'FCM_5', supplierGstin: '09AAACA1234A1Z5' })).status).toBe(200);
    const inv = await raiseInvoice('ORD-7102');
    expect(inv.body).toMatchObject({ gstScheme: 'FCM_5', placeOfSupply: '09', igst: null });
    expect([Number(inv.body.cgst), Number(inv.body.sgst), Number(inv.body.gst), Number(inv.body.total)]).toEqual([137.5, 137.5, 275, 5775]);
  });

  it('adds no GST under reverse charge but stores what the customer pays', async () => {
    expect((await putOption(director, { financialYear: FY, scheme: 'RCM_5', supplierGstin: '09AAACA1234A1Z5' })).status).toBe(200);
    const inv = await raiseInvoice('ORD-7103');
    expect(inv.body).toMatchObject({ gstScheme: 'RCM_5', placeOfSupply: '07', cgst: null, sgst: null });
    expect([Number(inv.body.igst), Number(inv.body.gst), Number(inv.body.total)]).toEqual([275, 0, 5500]);
  });

  it('leaves invoices already raised as they were', async () => {
    const first = await json(await invoiceRoute.GET(request(`/api/invoices/${firstInvoiceId}`, { cookie: director }), params({ id: firstInvoiceId })));
    expect(first.body).toMatchObject({ gstScheme: 'FCM_18' });
    expect(Number(first.body.gst)).toBe(990);
  });
});

describe('Send to Tally export', () => {
  it('returns one XML file with a voucher per invoice, classified by the option it was raised under', async () => {
    const res = await exportToTally(director, raised);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/xml');
    expect(res.headers.get('content-disposition')).toMatch(/^attachment; filename="Tally-Invoices-\d{8}\.xml"$/);
    const xml = await res.text();
    expect(xml.match(/<VOUCHER /g)).toHaveLength(3);
    for (const id of raised) expect(xml).toContain(`<VOUCHERNUMBER>${id}</VOUCHERNUMBER>`);
    for (const ledger of ['Freight Income - GTA FCM 18%', 'Freight Income - GTA FCM 5%', 'Freight Income - GTA RCM 5%', 'Output IGST', 'Output CGST', 'Output SGST']) {
      expect(xml).toContain(`<LEDGER NAME="${ledger}"`);
    }
    // Two customers, two GSTINs: two party ledgers, and the workspace's GSTIN on each voucher
    expect(xml).toContain('<PARTYGSTIN>07AAACD1234E1Z2</PARTYGSTIN>');
    expect(xml).toContain('<PARTYGSTIN>09SUNAB3456J4K8</PARTYGSTIN>');
    expect(xml.match(/<CMPGSTIN>09AAACA1234A1Z5<\/CMPGSTIN>/g)).toHaveLength(3);
  });

  it('refuses invoices from another workspace or that do not exist', async () => {
    expect((await exportToTally(otherTenant, [raised[0]])).status).toBe(404);
    expect((await exportToTally(director, [raised[0], 'INV-0000'])).status).toBe(404);
    expect((await exportToTally(director, [])).status).toBe(400);
  });
});
