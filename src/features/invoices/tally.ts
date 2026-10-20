// ─── Invoices Feature — "Send to Tally" export ───────────────────────────────
// Builds a TallyPrime XML import (file import, or POST to Tally's XML server on port 9000) for
// selected invoices. Export only: nothing is read back from Tally.
//
//   - One party ledger per customer under Sundry Debtors, keyed by GSTIN (customers sharing a GSTIN
//     share a ledger), with state and registration type.
//   - One sales ledger per GST treatment, flagged reverse charge where it applies: Tally classifies
//     reverse-charge supplies by the sales ledger, so RCM invoices land in GSTR-1 as reverse charge.
//   - One Sales voucher per invoice, exactly as issued: freight + handling credited, any damage
//     deduction debited to a deduction ledger of the same treatment (it was agreed before the invoice,
//     so GST is on the net amount and no credit note is raised), and output CGST/SGST/IGST under
//     forward charge only.
// Tally matches ledgers by name, so the names below must match (or be renamed to) the company's own.
// Test-import into a sample company before relying on it; the tag set follows Tally's XML format
// but has not been checked against every TallyPrime release.

import { GST_STATES, gstinStateCode, invoiceGst, type InvoiceGst, type StoredInvoiceGst } from './gst';

export const TALLY_LEDGERS = {
  debtorsGroup: 'Sundry Debtors',
  salesGroup: 'Sales Accounts',
  taxGroup: 'Duties & Taxes',
  CGST: 'Output CGST',
  SGST: 'Output SGST',
  IGST: 'Output IGST',
} as const;

/** SAC for goods transport agency services */
export const GTA_SAC = '996791';

export interface TallyInvoice extends StoredInvoiceGst {
  id: string;
  orderId: string | null;
  createdAt: Date | string | null;
  freight: number;
  loading: number;
  unloading: number;
  damageDeduction: number;
  total: number;
  origin?: string | null;
  destination?: string | null;
  customer: { id: string; name: string; gstin: string | null; address: string | null };
  /** The workspace's GSTIN for the invoice's financial year, if recorded */
  supplierGstin?: string | null;
}

const TAX_HEADS = { CGST: 'Central Tax', SGST: 'State Tax', IGST: 'Integrated Tax' } as const;

/** XML text: escapes markup and drops characters XML 1.0 can't carry */
export function xmlText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const toPaise = (rupees: number) => Math.round(rupees * 100);
const amount = (paise: number) => (paise / 100).toFixed(2);

/** Tally date (YYYYMMDD) of a moment, in IST */
export function tallyDate(at: Date | string | null): string {
  const d = at ? new Date(at) : new Date();
  const ist = new Date(d.getTime() + 330 * 60_000);
  return `${ist.getUTCFullYear()}${String(ist.getUTCMonth() + 1).padStart(2, '0')}${String(ist.getUTCDate()).padStart(2, '0')}`;
}

/** Sales or deduction ledger for a GST treatment, e.g. "Freight Income - GTA RCM 5%" */
export function treatmentLedger(kind: 'income' | 'deduction', tax: Pick<InvoiceGst, 'reverseCharge' | 'rate'>): string {
  return `${kind === 'income' ? 'Freight Income' : 'Damage Deductions'} - GTA ${tax.reverseCharge ? 'RCM' : 'FCM'} ${tax.rate}%`;
}

interface Party { name: string; gstin: string | null; stateName: string | null; address: string | null }

/** One ledger per GSTIN (or per customer without one); a name shared by two parties gets its key appended */
function partyLedgers(invoices: TallyInvoice[]): Map<string, Party> {
  const byKey = new Map<string, Party & { key: string }>();
  for (const { customer } of invoices) {
    const gstin = gstinStateCode(customer.gstin) ? customer.gstin!.trim().toUpperCase() : null;
    const key = gstin ?? `customer:${customer.id}`;
    if (!byKey.has(key)) {
      const code = gstin?.slice(0, 2);
      byKey.set(key, { key, name: customer.name.trim() || customer.id, gstin, stateName: code ? GST_STATES[code] : null, address: customer.address });
    }
  }
  const nameCount = new Map<string, number>();
  for (const p of byKey.values()) nameCount.set(p.name, (nameCount.get(p.name) ?? 0) + 1);
  const result = new Map<string, Party>();
  for (const p of byKey.values()) {
    const name = (nameCount.get(p.name) ?? 0) > 1 ? `${p.name} (${p.gstin ?? p.key.slice('customer:'.length)})` : p.name;
    result.set(p.key, { name, gstin: p.gstin, stateName: p.stateName, address: p.address });
  }
  return result;
}

const partyKey = (c: TallyInvoice['customer']) =>
  gstinStateCode(c.gstin) ? c.gstin!.trim().toUpperCase() : `customer:${c.id}`;

function partyLedgerXml(p: Party): string {
  return [
    `<LEDGER NAME="${xmlText(p.name)}" ACTION="Create">`,
    `<NAME.LIST TYPE="String"><NAME>${xmlText(p.name)}</NAME></NAME.LIST>`,
    `<PARENT>${xmlText(TALLY_LEDGERS.debtorsGroup)}</PARENT>`,
    '<ISBILLWISEON>Yes</ISBILLWISEON>',
    p.address ? `<ADDRESS.LIST TYPE="String"><ADDRESS>${xmlText(p.address)}</ADDRESS></ADDRESS.LIST>` : '',
    '<COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>',
    p.stateName ? `<LEDSTATENAME>${xmlText(p.stateName)}</LEDSTATENAME>` : '',
    `<GSTREGISTRATIONTYPE>${p.gstin ? 'Regular' : 'Unregistered/Consumer'}</GSTREGISTRATIONTYPE>`,
    p.gstin ? `<PARTYGSTIN>${p.gstin}</PARTYGSTIN>` : '',
    '</LEDGER>',
  ].filter(Boolean).join('');
}

/** Sales Accounts ledger carrying the GST classification of one treatment */
function treatmentLedgerXml(name: string, tax: Pick<InvoiceGst, 'reverseCharge' | 'rate'>): string {
  const rates = ([['Integrated Tax', tax.rate], ['Central Tax', tax.rate / 2], ['State Tax', tax.rate / 2]] as const)
    .map(([head, rate]) => `<RATEDETAILS.LIST><GSTRATEDUTYHEAD>${head}</GSTRATEDUTYHEAD><GSTRATEVALUATIONTYPE>Based on Value</GSTRATEVALUATIONTYPE><GSTRATE>${rate}</GSTRATE></RATEDETAILS.LIST>`)
    .join('');
  return [
    `<LEDGER NAME="${xmlText(name)}" ACTION="Create">`,
    `<NAME.LIST TYPE="String"><NAME>${xmlText(name)}</NAME></NAME.LIST>`,
    `<PARENT>${xmlText(TALLY_LEDGERS.salesGroup)}</PARENT>`,
    '<GSTAPPLICABLE>&#4; Applicable</GSTAPPLICABLE>',
    '<GSTTYPEOFSUPPLY>Services</GSTTYPEOFSUPPLY>',
    '<GSTDETAILS.LIST>',
    '<APPLICABLEFROM>20250922</APPLICABLEFROM>',
    `<HSNCODE>${GTA_SAC}</HSNCODE>`,
    '<HSN>Goods transport agency services</HSN>',
    '<TAXABILITY>Taxable</TAXABILITY>',
    `<ISREVERSECHARGEAPPLICABLE>${tax.reverseCharge ? 'Yes' : 'No'}</ISREVERSECHARGEAPPLICABLE>`,
    `<STATEWISEDETAILS.LIST><STATENAME>&#4; Any</STATENAME>${rates}</STATEWISEDETAILS.LIST>`,
    '</GSTDETAILS.LIST>',
    '</LEDGER>',
  ].join('');
}

function taxLedgerXml(head: keyof typeof TAX_HEADS): string {
  const name = TALLY_LEDGERS[head];
  return [
    `<LEDGER NAME="${xmlText(name)}" ACTION="Create">`,
    `<NAME.LIST TYPE="String"><NAME>${xmlText(name)}</NAME></NAME.LIST>`,
    `<PARENT>${xmlText(TALLY_LEDGERS.taxGroup)}</PARENT>`,
    '<TAXTYPE>GST</TAXTYPE>',
    `<GSTDUTYHEAD>${TAX_HEADS[head]}</GSTDUTYHEAD>`,
    '</LEDGER>',
  ].join('');
}

/**
 * A ledger line: debits are negative with ISDEEMEDPOSITIVE Yes, credits positive with No (Tally's
 * convention). The party line also opens a bill under the invoice number for receivables tracking.
 */
function entry(ledger: string, paise: number, billRef?: string): string {
  const debit = paise < 0;
  return [
    '<ALLLEDGERENTRIES.LIST>',
    `<LEDGERNAME>${xmlText(ledger)}</LEDGERNAME>`,
    `<ISDEEMEDPOSITIVE>${debit ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>`,
    billRef ? '<ISPARTYLEDGER>Yes</ISPARTYLEDGER>' : '',
    `<AMOUNT>${amount(paise)}</AMOUNT>`,
    billRef ? `<BILLALLOCATIONS.LIST><NAME>${xmlText(billRef)}</NAME><BILLTYPE>New Ref</BILLTYPE><AMOUNT>${amount(paise)}</AMOUNT></BILLALLOCATIONS.LIST>` : '',
    '</ALLLEDGERENTRIES.LIST>',
  ].join('');
}

function voucherXml(inv: TallyInvoice, tax: InvoiceGst, party: Party): string {
  const grossPaise = toPaise(inv.freight) + toPaise(inv.loading) + toPaise(inv.unloading);
  const deductionPaise = toPaise(inv.damageDeduction);
  const totalPaise = toPaise(inv.total);
  const taxText = tax.lines.map(l => `${l.label} ${l.rate}% INR ${l.amount.toFixed(2)}`).join(' + ');
  const route = inv.origin && inv.destination ? `: ${inv.origin} to ${inv.destination}` : '';
  const narration = [
    `Freight${inv.orderId ? ` for ${inv.orderId}` : ''}${route}.`,
    `Freight INR ${inv.freight.toFixed(2)}, loading and unloading INR ${(inv.loading + inv.unloading).toFixed(2)}`
      + (deductionPaise > 0 ? `, less damage deduction INR ${inv.damageDeduction.toFixed(2)}.` : '.'),
    tax.reverseCharge
      ? `Tax payable on reverse charge: Yes. GST payable by the recipient: ${taxText}.`
      : `GST charged: ${taxText}.`,
  ].join(' ');

  const lines = [
    entry(party.name, -totalPaise, inv.id),
    entry(treatmentLedger('income', tax), grossPaise),
    deductionPaise > 0 ? entry(treatmentLedger('deduction', tax), -deductionPaise) : '',
    ...(tax.reverseCharge ? [] : tax.lines.map(l => entry(TALLY_LEDGERS[l.label], toPaise(l.amount)))),
  ];

  const date = tallyDate(inv.createdAt);
  const placeName = GST_STATES[tax.placeOfSupply.code] ?? tax.placeOfSupply.name;
  return [
    '<VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">',
    `<DATE>${date}</DATE>`,
    `<EFFECTIVEDATE>${date}</EFFECTIVEDATE>`,
    '<VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>',
    `<VOUCHERNUMBER>${xmlText(inv.id)}</VOUCHERNUMBER>`,
    inv.orderId ? `<REFERENCE>${xmlText(inv.orderId)}</REFERENCE>` : '',
    `<PARTYLEDGERNAME>${xmlText(party.name)}</PARTYLEDGERNAME>`,
    `<PARTYNAME>${xmlText(party.name)}</PARTYNAME>`,
    party.gstin ? `<PARTYGSTIN>${party.gstin}</PARTYGSTIN>` : '',
    `<GSTREGISTRATIONTYPE>${party.gstin ? 'Regular' : 'Unregistered/Consumer'}</GSTREGISTRATIONTYPE>`,
    '<COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>',
    `<STATENAME>${xmlText(party.stateName ?? placeName)}</STATENAME>`,
    `<PLACEOFSUPPLY>${xmlText(placeName)}</PLACEOFSUPPLY>`,
    inv.supplierGstin ? `<CMPGSTIN>${xmlText(inv.supplierGstin)}</CMPGSTIN>` : '',
    `<NARRATION>${xmlText(narration)}</NARRATION>`,
    '<ISINVOICE>No</ISINVOICE>',
    '<PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>',
    ...lines,
    '</VOUCHER>',
  ].filter(Boolean).join('');
}

/** The Tally import XML for `invoices`: ledgers first (so the vouchers can find them), then one voucher each */
export function buildTallyXml(invoices: TallyInvoice[]): string {
  const parties = partyLedgers(invoices);
  const taxes = invoices.map(inv => invoiceGst(inv, inv.customer.gstin));

  const treatments = new Map<string, Pick<InvoiceGst, 'reverseCharge' | 'rate'>>();
  const taxHeads = new Set<keyof typeof TAX_HEADS>();
  invoices.forEach((inv, i) => {
    const tax = taxes[i];
    treatments.set(treatmentLedger('income', tax), tax);
    if (toPaise(inv.damageDeduction) > 0) treatments.set(treatmentLedger('deduction', tax), tax);
    if (!tax.reverseCharge) tax.lines.forEach(l => taxHeads.add(l.label));
  });

  const masters = [
    ...[...parties.values()].map(partyLedgerXml),
    ...[...treatments.entries()].map(([name, tax]) => treatmentLedgerXml(name, tax)),
    ...(['CGST', 'SGST', 'IGST'] as const).filter(h => taxHeads.has(h)).map(taxLedgerXml),
  ];
  const vouchers = invoices.map((inv, i) => voucherXml(inv, taxes[i], parties.get(partyKey(inv.customer))!));

  const message = (body: string) => `<TALLYMESSAGE xmlns:UDF="TallyUDF">${body}</TALLYMESSAGE>`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<ENVELOPE>',
    '<HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>',
    '<BODY><IMPORTDATA>',
    '<REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>',
    '<REQUESTDATA>',
    ...masters.map(message),
    ...vouchers.map(message),
    '</REQUESTDATA>',
    '</IMPORTDATA></BODY>',
    '</ENVELOPE>',
    '',
  ].join('\n');
}
