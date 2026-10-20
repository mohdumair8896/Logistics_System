// ─── Invoices Feature — GST ───────────────────────────────────────────────────
// Freight is billed as a goods transport agency (GTA) service. Each financial year the GTA either
// stays on reverse charge (RCM: the invoice adds no GST and the customer pays 5% to the government)
// or declares forward charge in Annexure V (FCM: the invoice charges 5% without input tax credit,
// or 18% with it). The option is stored per financial year in gst_options.
// The place of supply is the customer's location (IGST Act s.12(8)), read from their GSTIN:
// same state as the GTA → CGST + SGST at half the rate each, any other state → IGST.
// GTA rates changed on 22 Sep 2025 (18% with credit replaced 12%) and one published table still
// shows 12%: have a CA confirm the rates below before release.

export const GST_SCHEMES = {
  RCM_5: { rate: 5, reverseCharge: true, label: 'Reverse charge, 5% (customer pays)' },
  FCM_5: { rate: 5, reverseCharge: false, label: 'Forward charge, 5% (no input tax credit)' },
  FCM_18: { rate: 18, reverseCharge: false, label: 'Forward charge, 18% (with input tax credit)' },
} as const;

export type GstScheme = keyof typeof GST_SCHEMES;
export const GST_SCHEME_IDS = Object.keys(GST_SCHEMES) as GstScheme[];

/** With no Annexure V declaration for the year, GTA services fall under reverse charge */
export const DEFAULT_GST_SCHEME: GstScheme = 'RCM_5';

/** Our GST state when the workspace has no GSTIN on file: Uttar Pradesh (Lucknow office) */
export const SUPPLIER_STATE_CODE = '09';

/** GST state codes (first two digits of a GSTIN) */
export const GST_STATES: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra',
  '28': 'Andhra Pradesh (before division)', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh', '97': 'Other Territory', '99': 'Centre Jurisdiction',
};

export interface GstLine {
  label: 'CGST' | 'SGST' | 'IGST';
  rate: number;   // %
  amount: number; // ₹, to the paisa
}

export interface InvoiceGst {
  /** null on invoices raised before GST options existed */
  scheme: GstScheme | null;
  /** Tax payable on reverse charge: the customer pays `lines` to the government; the invoice charges none */
  reverseCharge: boolean;
  rate: number; // total GST rate, %
  /** `assumed` when the customer has no valid GSTIN: the GTA's own state is used */
  placeOfSupply: { code: string; name: string; assumed: boolean };
  lines: GstLine[];
  /** GST added to the invoice total */
  charged: number;
}

/** GST fields as stored on an invoice row (amounts already parsed to numbers) */
export interface StoredInvoiceGst {
  subtotal: number;
  gst: number;
  gstScheme?: string | null;
  placeOfSupply?: string | null;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
}

export function isGstScheme(value: unknown): value is GstScheme {
  return typeof value === 'string' && value in GST_SCHEMES;
}

/** State code from a 15-character GSTIN, or null if it is missing or not a GSTIN */
export function gstinStateCode(gstin: string | null | undefined): string | null {
  const value = (gstin ?? '').trim().toUpperCase();
  if (!/^\d{2}[0-9A-Z]{13}$/.test(value)) return null;
  const code = value.slice(0, 2);
  return code in GST_STATES ? code : null;
}

/** Indian financial year (April to March) of a moment, in IST: '2026-27' */
export function financialYear(at: Date = new Date()): string {
  const ist = new Date(at.getTime() + 330 * 60_000);
  const start = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/** The financial year after `fy`: '2026-27' → '2027-28' */
export function followingFinancialYear(fy: string): string {
  const start = Number(fy.slice(0, 4)) + 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/** True for a well-formed financial year label such as '2026-27' */
export function isFinancialYear(value: string): boolean {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  return !!m && (Number(m[1]) + 1) % 100 === Number(m[2]);
}

const toPaise = (rupees: number) => Math.round(rupees * 100);

function placeOfSupplyFor(customerGstin: string | null | undefined, supplierStateCode: string) {
  const code = gstinStateCode(customerGstin);
  const used = code ?? supplierStateCode;
  return { code: used, name: GST_STATES[used] ?? used, assumed: !code };
}

/** The tax lines at `rate`%: IGST across states, otherwise CGST + SGST at half the rate each */
function split(rate: number, interState: boolean, cgstPaise: number, sgstPaise: number, igstPaise: number): GstLine[] {
  return interState
    ? [{ label: 'IGST', rate, amount: igstPaise / 100 }]
    : [
        { label: 'CGST', rate: rate / 2, amount: cgstPaise / 100 },
        { label: 'SGST', rate: rate / 2, amount: sgstPaise / 100 },
      ];
}

/** The GST for a new invoice under `scheme`. Each tax component is rounded to the paisa. */
export function computeGst(
  scheme: GstScheme,
  taxableValue: number,
  customerGstin: string | null | undefined,
  supplierStateCode: string = SUPPLIER_STATE_CODE,
): InvoiceGst {
  const { rate, reverseCharge } = GST_SCHEMES[scheme];
  const placeOfSupply = placeOfSupplyFor(customerGstin, supplierStateCode);
  const interState = placeOfSupply.code !== supplierStateCode;
  const taxablePaise = toPaise(taxableValue);
  const half = Math.round((taxablePaise * rate) / 200);
  const lines = split(rate, interState, half, half, Math.round((taxablePaise * rate) / 100));
  const taxPaise = lines.reduce((sum, l) => sum + toPaise(l.amount), 0);
  return { scheme, reverseCharge, rate, placeOfSupply, lines, charged: reverseCharge ? 0 : taxPaise / 100 };
}

/**
 * The GST on an invoice as it was raised. Invoices with a stored scheme show their stored split.
 * Older ones are read from their amounts: 0 GST charged means reverse charge at 5%; anything else was
 * the flat 18% forward charge, split by the customer's GSTIN.
 */
export function invoiceGst(inv: StoredInvoiceGst, customerGstin?: string | null): InvoiceGst {
  const fromGstin = placeOfSupplyFor(customerGstin, SUPPLIER_STATE_CODE);

  if (isGstScheme(inv.gstScheme)) {
    const { rate, reverseCharge } = GST_SCHEMES[inv.gstScheme];
    const code = inv.placeOfSupply ?? fromGstin.code;
    const placeOfSupply = { code, name: GST_STATES[code] ?? code, assumed: fromGstin.assumed };
    const lines = split(rate, inv.igst != null, toPaise(inv.cgst ?? 0), toPaise(inv.sgst ?? 0), toPaise(inv.igst ?? 0));
    return { scheme: inv.gstScheme, reverseCharge, rate, placeOfSupply, lines, charged: inv.gst };
  }

  const chargedPaise = toPaise(inv.gst);
  if (chargedPaise === 0) return { ...computeGst('RCM_5', inv.subtotal, customerGstin), scheme: null };

  const taxablePaise = toPaise(inv.subtotal);
  const rate = taxablePaise > 0 ? Math.round((chargedPaise / taxablePaise) * 100) : 18;
  const interState = fromGstin.code !== SUPPLIER_STATE_CODE;
  // A charged amount splits so the halves still add up to it
  const cgst = Math.floor(chargedPaise / 2);
  const lines = split(rate, interState, cgst, chargedPaise - cgst, chargedPaise);
  return { scheme: null, reverseCharge: false, rate, placeOfSupply: fromGstin, lines, charged: inv.gst };
}
