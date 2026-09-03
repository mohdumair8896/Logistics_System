export interface GSTCalculation {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  damageDeduction: number;
  netPayable: number;
}

/**
 * Billing Service - Freight settlement, Indian GST calculation & damage reconciliation
 * Designed by Agency Backend Architect
 */
export class BillingService {
  /**
   * Calculates GST and net settlement
   * If interstate (isInterstate = true): 18% IGST
   * If intrastate (isInterstate = false): 9% CGST + 9% SGST
   */
  static calculateSettlement(
    subtotal: number,
    damageDeduction: number = 0,
    isInterstate: boolean = false
  ): GSTCalculation {
    const taxRate = 0.18;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterstate) {
      igst = Math.round(subtotal * taxRate);
    } else {
      cgst = Math.round(subtotal * 0.09);
      sgst = Math.round(subtotal * 0.09);
    }

    const totalTax = cgst + sgst + igst;
    const netPayable = Math.max(0, subtotal + totalTax - damageDeduction);

    return {
      subtotal,
      cgst,
      sgst,
      igst,
      totalTax,
      damageDeduction,
      netPayable
    };
  }
}
