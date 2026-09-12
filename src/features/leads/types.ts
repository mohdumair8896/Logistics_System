// ─── Leads Feature — Types ───────────────────────────────────────────────────

export type LeadStatus = 'New' | 'Allocated' | 'Contacted' | 'Archived';
export type CargoType = 'Standard Freight' | 'Cold-Chain Reefer' | 'Heavy Industrial' | 'Express Urgent';

export interface ShipperLead {
  id: string;
  shipperName: string;
  companyName: string;
  phone: string;
  email: string;
  originHub: string;
  destinationHub: string;
  cargoType: CargoType;
  estimatedWeightKg: number;
  freightQuote: number;
  targetDeliveryDate: string;
  isUrgent: boolean;
  status: LeadStatus;
  transcriptSnippet?: string;
  associatedOrderId?: string;
  createdAt: string;
}
