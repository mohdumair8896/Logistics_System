// ─── Composable Logistics OS: Scoring & Configuration Engine ───────────────────
// Calculates Logistics Complexity Score (0–50), maps archetype to recommended modules,
// determines plan tier (FLEX, GROWTH, SCALE, ENTERPRISE), and computes automation ROI.

export type ArchetypeCode =
  | 'FLEET_OWNER'
  | '3PL_PROVIDER'
  | 'FREIGHT_BROKER'
  | 'FREIGHT_FORWARDER'
  | 'COURIER_LAST_MILE'
  | 'DISTRIBUTION_WHOLESALE'
  | 'WAREHOUSE_TRANSPORT'
  | 'MANUFACTURER_LOGISTICS'
  | 'COLD_CHAIN'
  | 'BULK_HAUL';

export type GeographyScope = 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';

export type TransportMode = 'ROAD' | 'RAIL' | 'OCEAN' | 'AIR' | 'MULTIMODAL';

export type FleetBracket = '0' | '1-5' | '6-25' | '26-100' | '101-500' | '500+';
export type ShipmentBracket = '<100' | '100-500' | '500-2500' | '2500-10000' | '10000+';
export type BranchBracket = '1' | '2-5' | '6-20' | '20+';
export type DriverBracket = '1-10' | '11-50' | '51-250' | '250+';

export type CurrentSystem =
  | 'EXCEL'
  | 'WHATSAPP'
  | 'TMS'
  | 'SAP'
  | 'TALLY'
  | 'GPS_VENDOR'
  | 'EWAY_PORTAL';

export type OrderIntakeChannel = 'EMAIL' | 'WHATSAPP' | 'API_PORTAL' | 'PHONE_MANUAL';
export type DriverCommChannel = 'WHATSAPP' | 'PHONE' | 'DRIVER_APP' | 'NONE';

export type PainPoint =
  | 'TRACKING_BLINDSPOTS'
  | 'LATE_DELIVERIES'
  | 'DRIVER_COORDINATION'
  | 'POD_COLLECTION'
  | 'FREIGHT_LEAKAGE'
  | 'BILLING_RECONCILIATION'
  | 'COLLECTIONS_DUNNING'
  | 'WAREHOUSE_CONGESTION'
  | 'DISPERSED_DATA';

export type AiAgentId =
  | 'EXCEPTION_AGENT'
  | 'DRIVER_AGENT'
  | 'CUSTOMER_AGENT'
  | 'DOCS_AGENT'
  | 'BILLING_AGENT'
  | 'COLLECTIONS_AGENT'
  | 'PROCUREMENT_AGENT'
  | 'MANAGEMENT_AGENT';

export type AutonomyScope = 1 | 2 | 3 | 4;

export type PlanTier = 'FLEX' | 'GROWTH' | 'SCALE' | 'ENTERPRISE';

export interface OnboardingState {
  companyName: string;
  archetype: ArchetypeCode;
  geography: GeographyScope;
  modes: TransportMode[];
  fleetSize: FleetBracket;
  monthlyShipments: ShipmentBracket;
  branches: BranchBracket;
  drivers: DriverBracket;
  currentSystems: CurrentSystem[];
  orderChannel: OrderIntakeChannel;
  driverChannel: DriverCommChannel;
  topPainPoints: PainPoint[];
  desiredAgents: AiAgentId[];
  autonomyLevel: AutonomyScope;
  integrations: string[];
}

export interface ArchetypeDefinition {
  code: ArchetypeCode;
  title: string;
  badge: string;
  description: string;
  recommendedModules: string[];
  defaultExcluded: string[];
  sampleCompany: string;
}

export const ARCHETYPES: Record<ArchetypeCode, ArchetypeDefinition> = {
  FLEET_OWNER: {
    code: 'FLEET_OWNER',
    title: 'Fleet Owner & Transporter',
    badge: 'Asset-Heavy',
    description: 'Direct vehicle ownership, driver settlements, GPS corridors, fuel tracking, and e-way bills.',
    recommendedModules: ['FLEET', 'TMS', 'TRIPS', 'CORRIDOR_TRACKING', 'DELIVERY_POD', 'INVOICING', 'DRIVER_AGENT'],
    defaultExcluded: ['CUSTOMS', 'OCEAN_BL', 'TENDERING'],
    sampleCompany: 'ABC National Transport',
  },
  '3PL_PROVIDER': {
    code: '3PL_PROVIDER',
    title: '3PL Logistics Provider',
    badge: 'Multi-Carrier',
    description: 'Contract logistics, carrier procurement, shipper portals, exception control tower, and freight billing.',
    recommendedModules: ['TMS', 'CORRIDOR_TRACKING', 'CUSTOMER_PORTAL', 'INVOICING', 'FREIGHT_AUDIT', 'EXCEPTION_AGENT', 'LEADS_CRM'],
    defaultExcluded: ['MECHANIC_LOGS', 'FUEL_SLIPS'],
    sampleCompany: 'Apex Global 3PL',
  },
  FREIGHT_BROKER: {
    code: 'FREIGHT_BROKER',
    title: 'Freight Broker & Intermediary',
    badge: 'Asset-Light',
    description: 'Spot loads, carrier tendering, margin optimization, rate negotiation, and shipper billing.',
    recommendedModules: ['TMS', 'LEADS_CRM', 'FREIGHT_AUDIT', 'INVOICING', 'DOCS_AGENT', 'CUSTOMER_AGENT'],
    defaultExcluded: ['WAREHOUSE_BAYS', 'VEHICLE_SERVICE'],
    sampleCompany: 'Vanguard Freight Brokers',
  },
  FREIGHT_FORWARDER: {
    code: 'FREIGHT_FORWARDER',
    title: 'International Freight Forwarder',
    badge: 'Global Modes',
    description: 'Air and ocean bookings, container tracking, customs clearance, bill of lading, and port demurrage.',
    recommendedModules: ['TMS', 'DOCS_AGENT', 'FREIGHT_AUDIT', 'CUSTOMER_PORTAL', 'EXCEPTION_AGENT'],
    defaultExcluded: ['LOCAL_BAY_ALLOCATION', 'FUEL_SLIPS'],
    sampleCompany: 'Pacific Ocean & Air Cargo',
  },
  COURIER_LAST_MILE: {
    code: 'COURIER_LAST_MILE',
    title: 'Courier & Last-Mile Express',
    badge: 'High-Volume',
    description: 'Dense delivery drops, multi-stop route dispatch, driver smartphone PWA, and OTP-based e-POD.',
    recommendedModules: ['TMS', 'DRIVER_APP', 'DELIVERY_POD', 'CUSTOMER_PORTAL', 'DRIVER_AGENT'],
    defaultExcluded: ['COMPLEX_GST_AUDIT', 'HEAVY_AXLE_WEIGHT'],
    sampleCompany: 'SwiftCity Express',
  },
  DISTRIBUTION_WHOLESALE: {
    code: 'DISTRIBUTION_WHOLESALE',
    title: 'Distribution & Wholesale Logistics',
    badge: 'B2B Regional',
    description: 'Hub-to-distributor linehaul, scheduled delivery appointments, inventory reconciliation, and e-POD.',
    recommendedModules: ['TMS', 'WAREHOUSE', 'ALLOCATION', 'TRIPS', 'DELIVERY_POD', 'INVOICING'],
    defaultExcluded: ['PORT_CUSTOMS', 'OCEAN_BL'],
    sampleCompany: 'Metro FMCG Distribution',
  },
  WAREHOUSE_TRANSPORT: {
    code: 'WAREHOUSE_TRANSPORT',
    title: 'Warehouse & Fleet Operator',
    badge: 'Integrated Facility',
    description: 'Loading bay scheduling, ASN cross-docking, dock detention mitigation, and integrated linehaul.',
    recommendedModules: ['WAREHOUSE', 'ALLOCATION', 'TMS', 'TRIPS', 'FLEET', 'INVOICING'],
    defaultExcluded: ['SPOT_TENDERING'],
    sampleCompany: 'HubCentral Warehousing',
  },
  MANUFACTURER_LOGISTICS: {
    code: 'MANUFACTURER_LOGISTICS',
    title: 'Manufacturer In-House Logistics',
    badge: 'Industrial Dispatch',
    description: 'Plant outbound planning, transporter management, dock detention auditing, and SAP sync.',
    recommendedModules: ['ALLOCATION', 'TRIPS', 'CORRIDOR_TRACKING', 'FREIGHT_AUDIT', 'EXCEPTION_AGENT'],
    defaultExcluded: ['QUOTE_REQUEST', 'DRIVER_RECRUITMENT'],
    sampleCompany: 'Tata & Sons Outbound Logistics',
  },
  COLD_CHAIN: {
    code: 'COLD_CHAIN',
    title: 'Cold-Chain & Pharma Logistics',
    badge: 'Temp-Controlled',
    description: 'Reefer telematics, temperature excursion alarms, chain-of-custody compliance, and time-critical SLA.',
    recommendedModules: ['FLEET', 'TRIPS', 'CORRIDOR_TRACKING', 'EXCEPTION_AGENT', 'DOCS_AGENT'],
    defaultExcluded: ['OPEN_TRAILER_DISPATCH'],
    sampleCompany: 'CryoShield Pharma Transport',
  },
  BULK_HAUL: {
    code: 'BULK_HAUL',
    title: 'Bulk, Tanker & Heavy Haul',
    badge: 'Specialized Assets',
    description: 'Permit verification, gross axle weight compliance, corridor risk routing, and tanker safety checks.',
    recommendedModules: ['FLEET', 'TMS', 'TRIPS', 'CORRIDOR_TRACKING', 'DOCS_AGENT'],
    defaultExcluded: ['PARCEL_ROUTING', 'OTP_EPOD'],
    sampleCompany: 'Atlas Heavy & Bulk Logistics',
  },
};

export interface PlanPricing {
  tier: PlanTier;
  name: string;
  basePriceInr: number;
  basePriceUsd: number;
  includedVehicles: number;
  includedShipments: number;
  includedBranches: number;
  includedAiActions: number;
  includedUsers: number;
  description: string;
}

export const PLAN_PRICING: Record<PlanTier, PlanPricing> = {
  FLEX: {
    tier: 'FLEX',
    name: 'Flex Operations',
    basePriceInr: 4999,
    basePriceUsd: 69,
    includedVehicles: 20,
    includedShipments: 400,
    includedBranches: 1,
    includedAiActions: 1000,
    includedUsers: 5,
    description: 'Ideal for small local transporters and courier teams seeking digital tracking and e-POD.',
  },
  GROWTH: {
    tier: 'GROWTH',
    name: 'Growth Operations',
    basePriceInr: 19999,
    basePriceUsd: 269,
    includedVehicles: 100,
    includedShipments: 2500,
    includedBranches: 5,
    includedAiActions: 7500,
    includedUsers: 20,
    description: 'Comprehensive OS for regional & national transporters needing AI Control Tower & WhatsApp dispatch.',
  },
  SCALE: {
    tier: 'SCALE',
    name: 'Scale Operations',
    basePriceInr: 49999,
    basePriceUsd: 649,
    includedVehicles: 350,
    includedShipments: 10000,
    includedBranches: 20,
    includedAiActions: 30000,
    includedUsers: 60,
    description: 'Full-scale AI workforce, automated freight leakage audit, collections agent, and ERP connectivity.',
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise Logistics OS',
    basePriceInr: 149999,
    basePriceUsd: 1999,
    includedVehicles: 2000,
    includedShipments: 50000,
    includedBranches: 100,
    includedAiActions: 150000,
    includedUsers: 250,
    description: 'Multi-country, custom integrations, dedicated infrastructure, 99.95% SLA, and custom AI policies.',
  },
};

export interface ModuleOption {
  code: string;
  name: string;
  category: 'OPERATIONS' | 'FINANCE' | 'AI_WORKFORCE' | 'NETWORK';
  priceInr: number;
  priceUsd: number;
  description: string;
  isCore?: boolean;
}

export const AVAILABLE_MODULES: ModuleOption[] = [
  { code: 'FLEET', name: 'Fleet & Telematics', category: 'OPERATIONS', priceInr: 2999, priceUsd: 39, description: 'Vehicle health, odometer, service logs, and maintenance alerts.' },
  { code: 'TMS', name: 'Order & Dispatch TMS', category: 'OPERATIONS', priceInr: 3499, priceUsd: 45, description: 'Order intake, cargo volume specs, batch codes, and assignment.' },
  { code: 'ALLOCATION', name: 'Vehicle & Bay Allocation', category: 'OPERATIONS', priceInr: 2499, priceUsd: 32, description: 'Optimize loading dock bays and driver match.' },
  { code: 'WAREHOUSE', name: 'Warehouse & Bay Mgmt', category: 'OPERATIONS', priceInr: 3999, priceUsd: 49, description: 'Dock appointment scheduling and bay congestion tracking.' },
  { code: 'TRIPS', name: 'Trip Telemetry', category: 'OPERATIONS', priceInr: 2999, priceUsd: 39, description: 'Active journeys, corridor progress, and checkpoint logs.' },
  { code: 'CORRIDOR_TRACKING', name: 'P44 Corridor Map', category: 'OPERATIONS', priceInr: 3999, priceUsd: 49, description: 'Live Leaflet geofence map with anomaly alerts.' },
  { code: 'DELIVERY_POD', name: 'Electronic POD & OTP', category: 'OPERATIONS', priceInr: 2999, priceUsd: 39, description: 'Digital sign-on-glass, camera upload, and receiver OTP.' },
  { code: 'INVOICING', name: 'Automated GST Billing', category: 'FINANCE', priceInr: 3499, priceUsd: 45, description: 'Automated freight calculation and PDF invoice generation.' },
  { code: 'FREIGHT_AUDIT', name: 'Freight Leakage Audit', category: 'FINANCE', priceInr: 6999, priceUsd: 89, description: 'AI cross-audit of carrier rate cards and detention charges.' },
  { code: 'COLLECTIONS_AGENT', name: 'Autonomous Collections', category: 'FINANCE', priceInr: 4999, priceUsd: 65, description: 'Automated payment chasing and dunning reminders.' },
  { code: 'LEADS_CRM', name: 'Shipper CRM & Quoting', category: 'NETWORK', priceInr: 2999, priceUsd: 39, description: 'Capture shipper inquiries and dispatch quotes.' },
  { code: 'CUSTOMER_PORTAL', name: 'Customer Self-Track', category: 'NETWORK', priceInr: 2999, priceUsd: 39, description: 'Branded public portal for shipment tracking.' },
  { code: 'EXCEPTION_AGENT', name: 'AI Control Tower Agent', category: 'AI_WORKFORCE', priceInr: 4999, priceUsd: 65, description: 'Auto-detect halts, calculate delay impact, and alert.' },
  { code: 'DRIVER_AGENT', name: 'WhatsApp Driver Agent', category: 'AI_WORKFORCE', priceInr: 3999, priceUsd: 49, description: 'Two-way dispatch and voice notes in Hindi and English.' },
  { code: 'DOCS_AGENT', name: 'AI OCR Document Agent', category: 'AI_WORKFORCE', priceInr: 3999, priceUsd: 49, description: 'Instant extraction of LR, invoice, and POD scans.' },
];

export interface ComplexityResult {
  totalScore: number; // 0 - 50
  breakdown: {
    fleet: number;
    volume: number;
    network: number;
    mode: number;
    systems: number;
    autonomy: number;
  };
  recommendedPlan: PlanTier;
  recommendedModules: string[];
  estimatedMonthlyTasks: number;
  automatedTasksEliminated: number;
  hoursSavedMonthly: number;
  estimatedMonthlySavingsInr: number;
  estimatedMonthlyPriceInr: number;
}

export function calculateComplexityScore(state: OnboardingState): ComplexityResult {
  // 1. Fleet Score (0-10)
  let fleet = 0;
  if (state.fleetSize === '1-5') fleet = 2;
  else if (state.fleetSize === '6-25') fleet = 4;
  else if (state.fleetSize === '26-100') fleet = 6;
  else if (state.fleetSize === '101-500') fleet = 8;
  else if (state.fleetSize === '500+') fleet = 10;

  // 2. Volume Score (0-10)
  let volume = 1;
  if (state.monthlyShipments === '100-500') volume = 3;
  else if (state.monthlyShipments === '500-2500') volume = 5;
  else if (state.monthlyShipments === '2500-10000') volume = 8;
  else if (state.monthlyShipments === '10000+') volume = 10;

  // 3. Network Complexity (0-10)
  let network = 1;
  if (state.branches === '2-5') network = 4;
  else if (state.branches === '6-20') network = 7;
  else if (state.branches === '20+') network = 10;

  // 4. Mode & Geography (0-10)
  let mode = 2;
  if (state.geography === 'REGIONAL') mode += 2;
  if (state.geography === 'NATIONAL') mode += 4;
  if (state.geography === 'INTERNATIONAL') mode += 7;
  if (state.modes.length > 1) mode += 2;
  mode = Math.min(10, mode);

  // 5. Systems & Integration Depth (0-10)
  let systems = 2;
  if (state.currentSystems.includes('WHATSAPP')) systems += 1;
  if (state.currentSystems.includes('TMS')) systems += 2;
  if (state.currentSystems.includes('SAP')) systems += 4;
  if (state.currentSystems.includes('GPS_VENDOR')) systems += 2;
  systems = Math.min(10, systems);

  // 6. Autonomy Level (0-10)
  const autonomy = state.autonomyLevel === 1 ? 2 : state.autonomyLevel === 2 ? 4 : state.autonomyLevel === 3 ? 7 : 10;

  // Total Score (Normalized to 0 - 50)
  const rawTotal = fleet + volume + network + mode + systems + autonomy;
  const totalScore = Math.min(50, Math.max(8, Math.round((rawTotal / 60) * 50)));

  // Plan Tier
  let recommendedPlan: PlanTier = 'FLEX';
  if (totalScore >= 43) recommendedPlan = 'ENTERPRISE';
  else if (totalScore >= 33) recommendedPlan = 'SCALE';
  else if (totalScore >= 19) recommendedPlan = 'GROWTH';

  // Base modules for the archetype
  const archetypeDef = ARCHETYPES[state.archetype] || ARCHETYPES.FLEET_OWNER;
  const recommendedModules = Array.from(new Set([...archetypeDef.recommendedModules, ...state.desiredAgents]));

  // ROI Calculations
  const approxShipments =
    state.monthlyShipments === '<100' ? 60 :
    state.monthlyShipments === '100-500' ? 300 :
    state.monthlyShipments === '500-2500' ? 1400 :
    state.monthlyShipments === '2500-10000' ? 5500 : 15000;

  const approxVehicles =
    state.fleetSize === '0' ? 0 :
    state.fleetSize === '1-5' ? 3 :
    state.fleetSize === '6-25' ? 15 :
    state.fleetSize === '26-100' ? 60 :
    state.fleetSize === '101-500' ? 250 : 800;

  const approxDrivers =
    state.drivers === '1-10' ? 5 :
    state.drivers === '11-50' ? 30 :
    state.drivers === '51-250' ? 120 : 400;

  const estimatedMonthlyTasks = Math.round((approxShipments * 1.5) + (approxVehicles * 8) + (approxDrivers * 10));
  const autoFactor = 0.38 + (state.autonomyLevel * 0.12);
  const automatedTasksEliminated = Math.round(estimatedMonthlyTasks * autoFactor);
  const hoursSavedMonthly = Math.round(automatedTasksEliminated / 12);
  const estimatedMonthlySavingsInr = Math.round(hoursSavedMonthly * 275);

  const planBase = PLAN_PRICING[recommendedPlan].basePriceInr;

  return {
    totalScore,
    breakdown: { fleet, volume, network, mode, systems, autonomy },
    recommendedPlan,
    recommendedModules,
    estimatedMonthlyTasks,
    automatedTasksEliminated,
    hoursSavedMonthly,
    estimatedMonthlySavingsInr,
    estimatedMonthlyPriceInr: planBase,
  };
}

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  companyName: 'ABC National Transport',
  archetype: 'FLEET_OWNER',
  geography: 'NATIONAL',
  modes: ['ROAD'],
  fleetSize: '26-100',
  monthlyShipments: '500-2500',
  branches: '2-5',
  drivers: '11-50',
  currentSystems: ['EXCEL', 'WHATSAPP', 'GPS_VENDOR'],
  orderChannel: 'WHATSAPP',
  driverChannel: 'WHATSAPP',
  topPainPoints: ['TRACKING_BLINDSPOTS', 'POD_COLLECTION', 'DRIVER_COORDINATION'],
  desiredAgents: ['EXCEPTION_AGENT', 'DRIVER_AGENT', 'DOCS_AGENT'],
  autonomyLevel: 3,
  integrations: ['FASTag Tolls', 'Vahan / Sarathi Registry', 'WhatsApp Cloud API'],
};
