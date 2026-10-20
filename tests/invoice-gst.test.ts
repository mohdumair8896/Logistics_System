// GST on freight invoices: the GTA's option (reverse charge 5%, forward charge 5% or 18%),
// split by the state in the customer's GSTIN, and how stored and older invoices are read back.

import { describe, expect, it } from 'vitest';
import {
  computeGst, financialYear, followingFinancialYear, gstinStateCode, invoiceGst, isFinancialYear,
} from '@/features/invoices/gst';

const UP_GSTIN = '09SUNAB3456J4K8';    // Uttar Pradesh, same state as the default supplier state
const DELHI_GSTIN = '07AAACD1234E1Z2'; // another state
const UP = { code: '09', name: 'Uttar Pradesh', assumed: false };
const DELHI = { code: '07', name: 'Delhi', assumed: false };

describe('gstinStateCode', () => {
  it('reads the state code from a GSTIN', () => {
    expect(gstinStateCode(UP_GSTIN)).toBe('09');
    expect(gstinStateCode(' 27aaacm1234a1z5 ')).toBe('27');
  });

  it('returns null for a missing, malformed or unknown GSTIN', () => {
    expect(gstinStateCode(null)).toBeNull();
    expect(gstinStateCode(undefined)).toBeNull();
    expect(gstinStateCode('')).toBeNull();
    expect(gstinStateCode('09SUNAB3456J4K')).toBeNull();  // 14 characters
    expect(gstinStateCode('X9SUNAB3456J4K8')).toBeNull();
    expect(gstinStateCode('00SUNAB3456J4K8')).toBeNull(); // no such state
  });
});

describe('financial years', () => {
  it('turns over on 1 April in India, not in UTC', () => {
    expect(financialYear(new Date('2026-03-31T18:29:00Z'))).toBe('2025-26'); // 23:59 IST on 31 March
    expect(financialYear(new Date('2026-03-31T18:31:00Z'))).toBe('2026-27'); // 00:01 IST on 1 April
    expect(financialYear(new Date('2027-01-15T06:00:00Z'))).toBe('2026-27');
    expect(financialYear(new Date('2099-06-01T00:00:00Z'))).toBe('2099-00');
  });

  it('validates and steps financial year labels', () => {
    expect(isFinancialYear('2026-27')).toBe(true);
    expect(isFinancialYear('2099-00')).toBe(true);
    expect(isFinancialYear('2026-28')).toBe(false);
    expect(isFinancialYear('26-27')).toBe(false);
    expect(followingFinancialYear('2026-27')).toBe('2027-28');
    expect(followingFinancialYear('2099-00')).toBe('2100-01');
  });
});

describe('computeGst for a new invoice', () => {
  it('reverse charge 5%: charges nothing and lists the CGST + SGST the customer pays', () => {
    expect(computeGst('RCM_5', 17300, UP_GSTIN)).toEqual({
      scheme: 'RCM_5',
      reverseCharge: true,
      rate: 5,
      placeOfSupply: UP,
      lines: [
        { label: 'CGST', rate: 2.5, amount: 432.5 },
        { label: 'SGST', rate: 2.5, amount: 432.5 },
      ],
      charged: 0,
    });
  });

  it('forward charge 5%: charges IGST for a customer in another state', () => {
    expect(computeGst('FCM_5', 17300, DELHI_GSTIN)).toEqual({
      scheme: 'FCM_5',
      reverseCharge: false,
      rate: 5,
      placeOfSupply: DELHI,
      lines: [{ label: 'IGST', rate: 5, amount: 865 }],
      charged: 865,
    });
  });

  it('forward charge 18%: charges 9% CGST + 9% SGST in the same state', () => {
    const tax = computeGst('FCM_18', 17300, UP_GSTIN);
    expect(tax.lines).toEqual([
      { label: 'CGST', rate: 9, amount: 1557 },
      { label: 'SGST', rate: 9, amount: 1557 },
    ]);
    expect(tax.charged).toBe(3114);
  });

  it('rounds each component to the paisa', () => {
    expect(computeGst('FCM_5', 1001, UP_GSTIN).lines.map(l => l.amount)).toEqual([25.03, 25.03]);
    expect(computeGst('FCM_5', 1001, UP_GSTIN).charged).toBe(50.06);
    expect(computeGst('FCM_5', 1001, DELHI_GSTIN).charged).toBe(50.05);
  });

  it('uses the GTA’s own state, marked as assumed, when the customer has no valid GSTIN', () => {
    const tax = computeGst('FCM_18', 1000, '');
    expect(tax.placeOfSupply).toEqual({ ...UP, assumed: true });
    expect(tax.lines.map(l => l.label)).toEqual(['CGST', 'SGST']);
  });

  it('compares against the supplier state from the workspace’s GSTIN', () => {
    // Supplier registered in Delhi, customer in UP: inter-state
    expect(computeGst('FCM_18', 1000, UP_GSTIN, '07').lines).toEqual([{ label: 'IGST', rate: 18, amount: 180 }]);
    expect(computeGst('FCM_18', 1000, DELHI_GSTIN, '07').lines.map(l => l.label)).toEqual(['CGST', 'SGST']);
  });

  it('handles a zero-value invoice', () => {
    expect(computeGst('FCM_18', 0, UP_GSTIN).charged).toBe(0);
  });
});

describe('invoiceGst for an invoice with a stored scheme', () => {
  it('shows the stored IGST under forward charge', () => {
    const tax = invoiceGst({ subtotal: 17300, gst: 3114, gstScheme: 'FCM_18', placeOfSupply: '07', cgst: null, sgst: null, igst: 3114 }, DELHI_GSTIN);
    expect(tax).toMatchObject({ scheme: 'FCM_18', reverseCharge: false, rate: 18, placeOfSupply: DELHI, charged: 3114 });
    expect(tax.lines).toEqual([{ label: 'IGST', rate: 18, amount: 3114 }]);
  });

  it('shows the stored CGST + SGST the customer pays under reverse charge', () => {
    const tax = invoiceGst({ subtotal: 17300, gst: 0, gstScheme: 'RCM_5', placeOfSupply: '09', cgst: 432.5, sgst: 432.5, igst: null }, UP_GSTIN);
    expect(tax).toMatchObject({ scheme: 'RCM_5', reverseCharge: true, rate: 5, charged: 0 });
    expect(tax.lines.map(l => [l.label, l.amount])).toEqual([['CGST', 432.5], ['SGST', 432.5]]);
  });

  it('keeps the stored place of supply if the customer’s GSTIN changes later', () => {
    const tax = invoiceGst({ subtotal: 1000, gst: 50, gstScheme: 'FCM_5', placeOfSupply: '09', cgst: 25, sgst: 25, igst: null }, DELHI_GSTIN);
    expect(tax.placeOfSupply.code).toBe('09');
    expect(tax.lines.map(l => l.label)).toEqual(['CGST', 'SGST']);
  });
});

describe('invoiceGst for invoices raised before GST options existed', () => {
  it('reads 0 GST as reverse charge at 5%', () => {
    expect(invoiceGst({ subtotal: 17300, gst: 0 }, DELHI_GSTIN)).toMatchObject({
      scheme: null, reverseCharge: true, rate: 5, lines: [{ label: 'IGST', rate: 5, amount: 865 }], charged: 0,
    });
  });

  it('splits the old 18% into CGST + SGST at 9% each in the same state', () => {
    const tax = invoiceGst({ subtotal: 17300, gst: 3114 }, UP_GSTIN);
    expect(tax).toMatchObject({ scheme: null, reverseCharge: false, rate: 18, charged: 3114 });
    expect(tax.lines).toEqual([
      { label: 'CGST', rate: 9, amount: 1557 },
      { label: 'SGST', rate: 9, amount: 1557 },
    ]);
  });

  it('shows the old 18% as IGST for another state', () => {
    expect(invoiceGst({ subtotal: 17822, gst: 3208 }, DELHI_GSTIN).lines).toEqual([{ label: 'IGST', rate: 18, amount: 3208 }]);
  });

  it('splits an odd paisa so the halves still add up to the amount charged', () => {
    const [cgst, sgst] = invoiceGst({ subtotal: 17822, gst: 3207.99 }, UP_GSTIN).lines;
    expect([cgst.amount, sgst.amount]).toEqual([1603.99, 1604]);
  });
});
