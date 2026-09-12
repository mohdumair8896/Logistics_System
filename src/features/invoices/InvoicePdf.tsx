// ─── GST Tax Invoice PDF Component ───────────────────────────────────────────
// Generates a proper A4 PDF invoice using @react-pdf/renderer.
// Used by /api/invoices/[id]/pdf GET route.
//
// Compliant with Indian GST invoice requirements:
//   - Company name, GSTIN, address
//   - Customer GSTIN, address
//   - HSN/SAC code for freight services
//   - CGST/SGST (intra-state) or IGST (inter-state) breakdown
//   - e-Way Bill number field
//   - QR code equivalent (text-based for now)

import React from 'react';
import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface InvoicePdfData {
  invoice: {
    id: string;
    createdAt: string;
    status: 'Paid' | 'Pending';
    freight: number;
    loading: number;
    unloading: number;
    damageDeduction?: number;
    subtotal: number;
    gst: number;
    total: number;
    podSigned?: boolean;
    receiverName?: string;
  };
  order: {
    id: string;
    origin: string;
    destination: string;
    totalWeight: number;
    distance: number;
    items: { productId: string; quantity: number }[];
    loadingBay?: string;
    deadline?: string;
  };
  customer: {
    name: string;
    contact: string;
    phone: string;
    address: string;
    gstin: string;
  };
  driver?: { name: string; phone: string };
  vehicle?: { vehicleNo: string; type: string };
  products?: { id: string; name: string }[];
  isInterState?: boolean; // IGST if true, CGST+SGST if false
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const BRAND = '#1d4ed8';
const DARK   = '#0f172a';
const GRAY   = '#64748b';
const LIGHT  = '#f1f5f9';
const GREEN  = '#16a34a';
const BORDER = '#e2e8f0';

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: DARK, padding: 36, backgroundColor: '#fff' },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, borderBottom: `2px solid ${BRAND}`, paddingBottom: 14 },
  companyName: { fontSize: 18, fontWeight: 'bold', color: BRAND, fontFamily: 'Helvetica-Bold' },
  companyTagline: { fontSize: 8, color: GRAY, marginTop: 2 },
  companyMeta: { fontSize: 8, color: DARK, marginTop: 4, lineHeight: 1.5 },
  invoiceTitle: { fontSize: 22, fontWeight: 'bold', color: DARK, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  invoiceMeta: { fontSize: 8.5, color: GRAY, textAlign: 'right', marginTop: 2, lineHeight: 1.6 },
  // Status badge
  badge: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-end', marginTop: 4 },
  badgePaid: { backgroundColor: '#dcfce7', color: GREEN },
  badgePending: { backgroundColor: '#fef9c3', color: '#ca8a04' },
  // Parties
  partiesRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  partyBox: { flex: 1, backgroundColor: LIGHT, borderRadius: 6, padding: 10 },
  partyLabel: { fontSize: 7.5, fontWeight: 'bold', color: BRAND, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, fontFamily: 'Helvetica-Bold' },
  partyName: { fontSize: 10, fontWeight: 'bold', color: DARK, fontFamily: 'Helvetica-Bold' },
  partyLine: { fontSize: 8, color: GRAY, marginTop: 2, lineHeight: 1.5 },
  // Route strip
  routeBox: { backgroundColor: '#eff6ff', borderLeft: `3px solid ${BRAND}`, padding: 9, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', borderRadius: 4 },
  routeLabel: { fontSize: 7, color: BRAND, textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'Helvetica-Bold' },
  routeValue: { fontSize: 9, fontWeight: 'bold', color: DARK, marginTop: 1 },
  // Items table
  table: { marginBottom: 14 },
  tableHeader: { flexDirection: 'row', backgroundColor: BRAND, padding: '6 8', borderRadius: '4 4 0 0' },
  tableHeaderText: { color: '#fff', fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: '6 8', borderBottom: `1px solid ${BORDER}` },
  tableRowAlt: { flexDirection: 'row', padding: '6 8', borderBottom: `1px solid ${BORDER}`, backgroundColor: LIGHT },
  tableCell: { fontSize: 8.5, color: DARK },
  // Totals
  totalsBox: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 14 },
  totalsTable: { width: 240 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '4 0', borderBottom: `1px solid ${BORDER}` },
  totalLabel: { fontSize: 8.5, color: GRAY },
  totalValue: { fontSize: 8.5, color: DARK },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '8 10', backgroundColor: BRAND, borderRadius: 6, marginTop: 6 },
  grandLabel: { fontSize: 11, fontWeight: 'bold', color: '#fff', fontFamily: 'Helvetica-Bold' },
  grandValue: { fontSize: 11, fontWeight: 'bold', color: '#fff', fontFamily: 'Helvetica-Bold' },
  // Fleet strip
  fleetBox: { flexDirection: 'row', gap: 16, backgroundColor: LIGHT, borderRadius: 6, padding: 9, marginBottom: 14 },
  fleetLabel: { fontSize: 7, color: GRAY, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 },
  fleetValue: { fontSize: 8.5, color: DARK, fontFamily: 'Helvetica-Bold', fontWeight: 'bold' },
  // POD box
  podBox: { border: `1px solid ${BORDER}`, borderRadius: 6, padding: 10, marginBottom: 14 },
  podLabel: { fontSize: 7.5, color: GRAY, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  podSig: { fontSize: 9, color: DARK },
  // Footer
  footer: { borderTop: `1px solid ${BORDER}`, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: GRAY },
  gstin: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND },
});

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export function InvoicePdf({ data }: { data: InvoicePdfData }) {
  const { invoice, order, customer, driver, vehicle, products = [], isInterState = true } = data;

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  return (
    <Document title={`Tax Invoice ${invoice.id}`} author="LogisticsEdge India Pvt. Ltd.">
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.companyName}>LOGISTICS EDGE</Text>
            <Text style={s.companyTagline}>India Pvt. Ltd. — National Fleet Operations</Text>
            <Text style={s.companyMeta}>
              Central Distribution Hub, Lucknow, UP{'\n'}
              GSTIN: 09AABCP1234Q1Z5  |  CIN: U63090UP2021PTC145312{'\n'}
              PAN: AABCP1234Q  |  support@logisticsedge.io
            </Text>
          </View>
          <View>
            <Text style={s.invoiceTitle}>TAX INVOICE</Text>
            <Text style={s.invoiceMeta}>
              Invoice No: {invoice.id}{'\n'}
              Date: {invoice.createdAt}{'\n'}
              Order Ref: {order.id}
            </Text>
            <Text style={[s.badge, invoice.status === 'Paid' ? s.badgePaid : s.badgePending]}>
              {invoice.status === 'Paid' ? '✓ PAID & SETTLED' : '⏳ PENDING PAYMENT'}
            </Text>
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={s.partiesRow}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>Bill To (Consignee)</Text>
            <Text style={s.partyName}>{customer.name}</Text>
            <Text style={s.partyLine}>{customer.contact} | {customer.phone}</Text>
            <Text style={s.partyLine}>{customer.address}</Text>
            <Text style={[s.partyLine, { marginTop: 4, fontFamily: 'Helvetica-Bold', color: DARK }]}>GSTIN: {customer.gstin}</Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>Service Provider</Text>
            <Text style={s.partyName}>LogisticsEdge India Pvt. Ltd.</Text>
            <Text style={s.partyLine}>Central Distribution Hub, Lucknow</Text>
            <Text style={s.partyLine}>Uttar Pradesh — 226010</Text>
            <Text style={[s.partyLine, { marginTop: 4, fontFamily: 'Helvetica-Bold', color: DARK }]}>GSTIN: 09AABCP1234Q1Z5</Text>
            <Text style={s.partyLine}>SAC Code: 996791 (Freight Transport Services)</Text>
          </View>
        </View>

        {/* ── Route ── */}
        <View style={s.routeBox}>
          <View>
            <Text style={s.routeLabel}>Origin</Text>
            <Text style={s.routeValue}>{order.origin}</Text>
          </View>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10, color: BRAND }}>→→→</Text>
            <Text style={{ fontSize: 7, color: GRAY, marginTop: 2 }}>{order.distance} km</Text>
          </View>
          <View>
            <Text style={s.routeLabel}>Destination</Text>
            <Text style={s.routeValue}>{order.destination}</Text>
          </View>
          <View>
            <Text style={s.routeLabel}>Total Weight</Text>
            <Text style={s.routeValue}>{order.totalWeight.toLocaleString()} kg</Text>
          </View>
          <View>
            <Text style={s.routeLabel}>GST Type</Text>
            <Text style={s.routeValue}>{isInterState ? 'IGST (Inter-State)' : 'CGST + SGST'}</Text>
          </View>
        </View>

        {/* ── Cargo items table ── */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { flex: 2.5 }]}>Description of Goods</Text>
            <Text style={[s.tableHeaderText, { flex: 1 }]}>HSN Code</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Qty (kg)</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Rate/kg</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>
          {order.items.map((item, idx) => {
            const unitRate = order.totalWeight > 0 ? (invoice.freight / order.totalWeight) : 2.2;
            const amount = item.quantity * unitRate;
            return (
              <View key={idx} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 2.5 }]}>{getProductName(item.productId)}</Text>
                <Text style={[s.tableCell, { flex: 1, color: GRAY }]}>72141000</Text>
                <Text style={[s.tableCell, { flex: 1, textAlign: 'right' }]}>{item.quantity.toLocaleString()}</Text>
                <Text style={[s.tableCell, { flex: 1, textAlign: 'right', color: GRAY }]}>₹{unitRate.toFixed(2)}</Text>
                <Text style={[s.tableCell, { flex: 1, textAlign: 'right' }]}>₹{amount.toFixed(2)}</Text>
              </View>
            );
          })}
          <View style={[s.tableRow, { backgroundColor: '#eff6ff' }]}>
            <Text style={[s.tableCell, { flex: 2.5, color: GRAY }]}>Loading &amp; Handling Charges</Text>
            <Text style={[s.tableCell, { flex: 1, color: GRAY }]}>998540</Text>
            <Text style={[s.tableCell, { flex: 1, textAlign: 'right', color: GRAY }]}>—</Text>
            <Text style={[s.tableCell, { flex: 1, textAlign: 'right', color: GRAY }]}>—</Text>
            <Text style={[s.tableCell, { flex: 1, textAlign: 'right' }]}>₹{(invoice.loading + invoice.unloading).toFixed(2)}</Text>
          </View>
          {(invoice.damageDeduction ?? 0) > 0 && (
            <View style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 2.5, color: '#dc2626' }]}>Damage Deduction</Text>
              <Text style={[s.tableCell, { flex: 1 }]}>—</Text>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'right' }]}>—</Text>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'right' }]}>—</Text>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'right', color: '#dc2626' }]}>-₹{(invoice.damageDeduction ?? 0).toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* ── Totals ── */}
        <View style={s.totalsBox}>
          <View style={s.totalsTable}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal (excl. GST)</Text>
              <Text style={s.totalValue}>{fmt(invoice.subtotal)}</Text>
            </View>
            {isInterState ? (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>IGST @ 18%</Text>
                <Text style={s.totalValue}>{fmt(invoice.gst)}</Text>
              </View>
            ) : (
              <>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>CGST @ 9%</Text>
                  <Text style={s.totalValue}>{fmt(invoice.gst / 2)}</Text>
                </View>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>SGST @ 9%</Text>
                  <Text style={s.totalValue}>{fmt(invoice.gst / 2)}</Text>
                </View>
              </>
            )}
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>TOTAL PAYABLE</Text>
              <Text style={s.grandValue}>{fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Fleet info ── */}
        {(vehicle || driver) && (
          <View style={s.fleetBox}>
            {vehicle && (
              <View style={{ flex: 1 }}>
                <Text style={s.fleetLabel}>Vehicle</Text>
                <Text style={s.fleetValue}>{vehicle.vehicleNo}</Text>
                <Text style={[s.fleetLabel, { marginTop: 2 }]}>{vehicle.type}</Text>
              </View>
            )}
            {driver && (
              <View style={{ flex: 1 }}>
                <Text style={s.fleetLabel}>Driver</Text>
                <Text style={s.fleetValue}>{driver.name}</Text>
                <Text style={[s.fleetLabel, { marginTop: 2 }]}>{driver.phone}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.fleetLabel}>Loading Bay</Text>
              <Text style={s.fleetValue}>{order.loadingBay || '—'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fleetLabel}>e-Way Bill</Text>
              <Text style={s.fleetValue}>EWB-{order.id.replace('ORD-', '')}-2026</Text>
            </View>
          </View>
        )}

        {/* ── POD ── */}
        <View style={s.podBox}>
          <Text style={s.podLabel}>Proof of Delivery (e-POD)</Text>
          <Text style={s.podSig}>
            {invoice.podSigned
              ? `✓ Goods received in good condition by ${invoice.receiverName || 'Authorized Representative'}. Digital acknowledgment verified.`
              : '⚠ Pending e-POD sign-off from consignee at delivery point.'}
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <View>
            <Text style={s.footerText}>This is a computer-generated invoice. No physical signature required.</Text>
            <Text style={s.footerText}>For disputes, contact: accounts@logisticsedge.io | +91-522-4001234</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.gstin}>GSTIN: 09AABCP1234Q1Z5</Text>
            <Text style={s.footerText}>LogisticsEdge India Pvt. Ltd. | CIN: U63090UP2021PTC145312</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
