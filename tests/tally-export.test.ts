// "Send to Tally" XML: party ledgers keyed by GSTIN, sales ledgers classified by GST treatment
// (reverse charge or forward charge), and one balanced Sales voucher per invoice as issued.

import { describe, expect, it } from 'vitest';
import { buildTallyXml, tallyDate, xmlText, type TallyInvoice } from '@/features/invoices/tally';

const UP_GSTIN = '09SUNAB3456J4K8';
const DELHI_GSTIN = '07AAACD1234E1Z2';

const invoice = (over: Partial<TallyInvoice> = {}): TallyInvoice => ({
  id: 'INV-2001',
  orderId: 'ORD-2001',
  createdAt: '2026-10-18T06:30:00Z',
  freight: 13800,
  loading: 2000,
  unloading: 1500,
  damageDeduction: 0,
  subtotal: 17300,
  gst: 0,
  gstScheme: 'RCM_5',
  placeOfSupply: '09',
  cgst: 432.5,
  sgst: 432.5,
  igst: null,
  total: 17300,
  origin: 'Lucknow',
  destination: 'Prayagraj',
  customer: { id: 'C004', name: 'Sunrise Agro Mills', gstin: UP_GSTIN, address: 'Naini, Prayagraj' },
  ...over,
});

const vouchers = (xml: string) => xml.match(/<VOUCHER [\s\S]*?<\/VOUCHER>/g) ?? [];
const ledgers = (xml: string) => (xml.match(/<LEDGER NAME="[^"]*"/g) ?? []).map(m => m.slice('<LEDGER NAME="'.length, -1));
/** Each ledger line of a voucher as [ledger, amount] (the line's own AMOUNT, not its bill allocation) */
const entries = (voucher: string) => (voucher.match(/<ALLLEDGERENTRIES\.LIST>[\s\S]*?<\/ALLLEDGERENTRIES\.LIST>/g) ?? [])
  .map(e => [e.match(/<LEDGERNAME>(.*?)<\/LEDGERNAME>/)![1], Number(e.match(/<AMOUNT>(-?[\d.]+)<\/AMOUNT>/)![1])] as const);
const balance = (voucher: string) => Math.round(entries(voucher).reduce((sum, [, a]) => sum + a * 100, 0));

describe('buildTallyXml', () => {
  it('wraps everything in one Tally import envelope, ledgers before vouchers', () => {
    const xml = buildTallyXml([invoice()]);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<ENVELOPE>/);
    expect(xml).toContain('<TALLYREQUEST>Import Data</TALLYREQUEST>');
    expect(xml.indexOf('<LEDGER ')).toBeLessThan(xml.indexOf('<VOUCHER '));
  });

  it('exports a reverse-charge invoice with no tax lines, classified by a reverse-charge sales ledger', () => {
    const xml = buildTallyXml([invoice()]);
    expect(ledgers(xml)).toEqual(['Sunrise Agro Mills', 'Freight Income - GTA RCM 5%']);
    expect(xml).toContain('<ISREVERSECHARGEAPPLICABLE>Yes</ISREVERSECHARGEAPPLICABLE>');
    expect(xml).not.toContain('Output CGST');

    const v = vouchers(xml)[0]!;
    expect(entries(v)).toEqual([['Sunrise Agro Mills', -17300], ['Freight Income - GTA RCM 5%', 17300]]);
    expect(v).toContain('<VOUCHERNUMBER>INV-2001</VOUCHERNUMBER>');
    expect(v).toContain('<DATE>20261018</DATE>');
    expect(v).toContain('<PARTYGSTIN>09SUNAB3456J4K8</PARTYGSTIN>');
    expect(v).toContain('<PLACEOFSUPPLY>Uttar Pradesh</PLACEOFSUPPLY>');
    expect(v).toContain('Tax payable on reverse charge: Yes. GST payable by the recipient: CGST 2.5% INR 432.50 + SGST 2.5% INR 432.50.');
    expect(v).toContain('<BILLALLOCATIONS.LIST><NAME>INV-2001</NAME><BILLTYPE>New Ref</BILLTYPE><AMOUNT>-17300.00</AMOUNT>');
  });

  it('exports forward charge with output tax and the damage deduction inside the voucher, balanced', () => {
    // Gross 17,300 less 300 damage = 17,000 taxable; 18% IGST = 3,060
    const xml = buildTallyXml([invoice({
      damageDeduction: 300, subtotal: 17000, gst: 3060, gstScheme: 'FCM_18', placeOfSupply: '07',
      cgst: null, sgst: null, igst: 3060, total: 20060,
      customer: { id: 'C003', name: 'Delhi Buyer', gstin: DELHI_GSTIN, address: null },
    })]);
    expect(ledgers(xml)).toEqual(['Delhi Buyer', 'Freight Income - GTA FCM 18%', 'Damage Deductions - GTA FCM 18%', 'Output IGST']);
    expect(xml).toContain('<ISREVERSECHARGEAPPLICABLE>No</ISREVERSECHARGEAPPLICABLE>');
    expect(xml).toContain('<GSTDUTYHEAD>Integrated Tax</GSTDUTYHEAD>');
    expect(xml).toContain('<PARENT>Duties &amp; Taxes</PARENT>');
    // Every & is an entity (Tally's own &#4; marker included), so the file stays well-formed
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#4;)/);
    expect(xml).not.toContain('VCHTYPE="Credit Note"');

    const v = vouchers(xml)[0]!;
    expect(entries(v)).toEqual([
      ['Delhi Buyer', -20060],
      ['Freight Income - GTA FCM 18%', 17300],
      ['Damage Deductions - GTA FCM 18%', -300],
      ['Output IGST', 3060],
    ]);
    expect(balance(v)).toBe(0);
    expect(v).toContain('less damage deduction INR 300.00');
    expect(v).toContain('<PLACEOFSUPPLY>Delhi</PLACEOFSUPPLY>');
  });

  it('reads older invoices (no stored scheme) as they were charged', () => {
    const xml = buildTallyXml([invoice({ gst: 3114, total: 20414, gstScheme: null, placeOfSupply: null, cgst: null, sgst: null })]);
    const v = vouchers(xml)[0]!;
    expect(entries(v)).toEqual([
      ['Sunrise Agro Mills', -20414],
      ['Freight Income - GTA FCM 18%', 17300],
      ['Output CGST', 1557],
      ['Output SGST', 1557],
    ]);
    expect(balance(v)).toBe(0);
  });

  it('keys party ledgers on GSTIN: one ledger per GSTIN, distinct names when names clash', () => {
    const xml = buildTallyXml([
      invoice({ id: 'INV-1', customer: { id: 'C1', name: 'Sunrise Agro Mills', gstin: UP_GSTIN, address: null } }),
      invoice({ id: 'INV-2', customer: { id: 'C9', name: 'Sunrise Agro (Kanpur)', gstin: UP_GSTIN, address: null } }),
      invoice({ id: 'INV-3', customer: { id: 'C2', name: 'Sunrise Agro Mills', gstin: '07SUNAB3456J4K8', address: null } }),
    ]);
    const parties = ledgers(xml).filter(n => !n.startsWith('Freight'));
    expect(parties).toEqual(['Sunrise Agro Mills (09SUNAB3456J4K8)', 'Sunrise Agro Mills (07SUNAB3456J4K8)']);
    const [v1, v2] = vouchers(xml) as [string, string];
    expect(v1).toContain('<PARTYLEDGERNAME>Sunrise Agro Mills (09SUNAB3456J4K8)</PARTYLEDGERNAME>');
    expect(v2).toContain('<PARTYLEDGERNAME>Sunrise Agro Mills (09SUNAB3456J4K8)</PARTYLEDGERNAME>');
  });

  it('marks a customer without a GSTIN as unregistered', () => {
    const xml = buildTallyXml([invoice({ customer: { id: 'C5', name: 'Walk-in', gstin: null, address: null } })]);
    expect(xml).toContain('<GSTREGISTRATIONTYPE>Unregistered/Consumer</GSTREGISTRATIONTYPE>');
    expect(xml).not.toContain('<PARTYGSTIN>');
  });

  it('escapes names and text', () => {
    const xml = buildTallyXml([invoice({ customer: { id: 'C6', name: 'A & B <Traders> "Ltd"', gstin: UP_GSTIN, address: null } })]);
    expect(xml).toContain('<LEDGER NAME="A &amp; B &lt;Traders&gt; &quot;Ltd&quot;"');
    expect(xml).not.toContain('<Traders>');
  });
});

describe('helpers', () => {
  it('dates vouchers in IST', () => {
    expect(tallyDate('2026-03-31T18:29:00Z')).toBe('20260331');
    expect(tallyDate('2026-03-31T18:31:00Z')).toBe('20260401');
  });

  it('drops control characters XML cannot carry', () => {
    expect(xmlText('a\u0001b\tc')).toBe('ab\tc');
  });
});
