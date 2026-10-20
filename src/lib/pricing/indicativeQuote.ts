// ─── Indicative FTL quote (shared by the website widget and the leads API) ─────
// A transparent *estimate*, not a binding rate: straight-line distance between
// city centres × a road-detour factor, priced with a ₹/km band per truck type.
// Replace RATE_CARD with your own contracted rates; swap the distance for a
// routing API (Mappls / Ola Maps / OSRM) when one is connected (docs/TECH_STACK.md).

export interface City {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

/** Major Indian freight origins/destinations (city-centre coordinates). */
export const CITIES: readonly City[] = [
  { name: 'Agra', state: 'UP', lat: 27.18, lng: 78.01 },
  { name: 'Ahmedabad', state: 'GJ', lat: 23.02, lng: 72.57 },
  { name: 'Amritsar', state: 'PB', lat: 31.63, lng: 74.87 },
  { name: 'Aurangabad', state: 'MH', lat: 19.88, lng: 75.34 },
  { name: 'Bengaluru', state: 'KA', lat: 12.97, lng: 77.59 },
  { name: 'Bhiwandi', state: 'MH', lat: 19.30, lng: 73.06 },
  { name: 'Bhopal', state: 'MP', lat: 23.26, lng: 77.41 },
  { name: 'Bhubaneswar', state: 'OD', lat: 20.30, lng: 85.82 },
  { name: 'Chandigarh', state: 'CH', lat: 30.73, lng: 76.78 },
  { name: 'Chennai', state: 'TN', lat: 13.08, lng: 80.27 },
  { name: 'Coimbatore', state: 'TN', lat: 11.02, lng: 76.96 },
  { name: 'Dehradun', state: 'UK', lat: 30.32, lng: 78.03 },
  { name: 'Delhi', state: 'DL', lat: 28.61, lng: 77.21 },
  { name: 'Ghaziabad', state: 'UP', lat: 28.67, lng: 77.45 },
  { name: 'Goa (Panaji)', state: 'GA', lat: 15.49, lng: 73.83 },
  { name: 'Gurugram', state: 'HR', lat: 28.46, lng: 77.03 },
  { name: 'Guwahati', state: 'AS', lat: 26.14, lng: 91.74 },
  { name: 'Hosur', state: 'TN', lat: 12.74, lng: 77.83 },
  { name: 'Hyderabad', state: 'TS', lat: 17.39, lng: 78.49 },
  { name: 'Indore', state: 'MP', lat: 22.72, lng: 75.86 },
  { name: 'Jaipur', state: 'RJ', lat: 26.91, lng: 75.79 },
  { name: 'Jammu', state: 'JK', lat: 32.73, lng: 74.86 },
  { name: 'Jodhpur', state: 'RJ', lat: 26.24, lng: 73.02 },
  { name: 'Kanpur', state: 'UP', lat: 26.45, lng: 80.33 },
  { name: 'Kochi', state: 'KL', lat: 9.93, lng: 76.27 },
  { name: 'Kolkata', state: 'WB', lat: 22.57, lng: 88.36 },
  { name: 'Lucknow', state: 'UP', lat: 26.85, lng: 80.95 },
  { name: 'Ludhiana', state: 'PB', lat: 30.90, lng: 75.86 },
  { name: 'Madurai', state: 'TN', lat: 9.93, lng: 78.12 },
  { name: 'Mangaluru', state: 'KA', lat: 12.91, lng: 74.86 },
  { name: 'Mumbai', state: 'MH', lat: 19.08, lng: 72.88 },
  { name: 'Mysuru', state: 'KA', lat: 12.30, lng: 76.64 },
  { name: 'Nagpur', state: 'MH', lat: 21.15, lng: 79.09 },
  { name: 'Nashik', state: 'MH', lat: 20.00, lng: 73.79 },
  { name: 'Noida', state: 'UP', lat: 28.54, lng: 77.39 },
  { name: 'Patna', state: 'BR', lat: 25.59, lng: 85.14 },
  { name: 'Pune', state: 'MH', lat: 18.52, lng: 73.86 },
  { name: 'Raipur', state: 'CG', lat: 21.25, lng: 81.63 },
  { name: 'Rajkot', state: 'GJ', lat: 22.30, lng: 70.80 },
  { name: 'Ranchi', state: 'JH', lat: 23.34, lng: 85.31 },
  { name: 'Siliguri', state: 'WB', lat: 26.73, lng: 88.40 },
  { name: 'Surat', state: 'GJ', lat: 21.17, lng: 72.83 },
  { name: 'Thiruvananthapuram', state: 'KL', lat: 8.52, lng: 76.94 },
  { name: 'Udaipur', state: 'RJ', lat: 24.59, lng: 73.71 },
  { name: 'Vadodara', state: 'GJ', lat: 22.31, lng: 73.18 },
  { name: 'Varanasi', state: 'UP', lat: 25.32, lng: 82.97 },
  { name: 'Vijayawada', state: 'AP', lat: 16.51, lng: 80.65 },
  { name: 'Visakhapatnam', state: 'AP', lat: 17.69, lng: 83.22 },
];

export interface VehicleRate {
  code: string;
  label: string;
  maxKg: number;
  /** Indicative full-truck-load band, ₹ per km (one way). */
  ratePerKm: readonly [number, number];
  /** Minimum charge per trip, ₹. */
  minimumCharge: number;
}

/** Indicative market bands. Replace with the tenant's own rate card. */
export const RATE_CARD: readonly VehicleRate[] = [
  { code: 'LCV_1T', label: 'Mini truck (up to 1 t)', maxKg: 1000, ratePerKm: [18, 24], minimumCharge: 2500 },
  { code: 'TRUCK_14FT', label: '14 ft truck (up to 4 t)', maxKg: 4000, ratePerKm: [24, 30], minimumCharge: 5000 },
  { code: 'TRUCK_19FT', label: '19 ft truck (up to 7 t)', maxKg: 7000, ratePerKm: [32, 40], minimumCharge: 8000 },
  { code: 'CONTAINER_32FT_SXL', label: '32 ft container, single axle (up to 9 t)', maxKg: 9000, ratePerKm: [42, 52], minimumCharge: 12000 },
  { code: 'CONTAINER_32FT_MXL', label: '32 ft container, multi axle (up to 16 t)', maxKg: 16000, ratePerKm: [50, 64], minimumCharge: 15000 },
  { code: 'TRAILER_40FT', label: '40 ft trailer (up to 30 t)', maxKg: 30000, ratePerKm: [78, 95], minimumCharge: 25000 },
];

export const CARGO_TYPES = [
  { code: 'GENERAL', label: 'General goods', surcharge: 0 },
  { code: 'FRAGILE', label: 'Fragile / high value', surcharge: 0.1 },
  { code: 'COLD_CHAIN', label: 'Cold chain (reefer)', surcharge: 0.3 },
] as const;
export type CargoCode = (typeof CARGO_TYPES)[number]['code'];

/** Roads in India run ~25% longer than the straight line between city centres. */
const ROAD_FACTOR = 1.25;
/** Typical full-truck-load progress per day, including halts. */
const KM_PER_DAY = 400;

export function findCity(name: string): City | undefined {
  const q = name.trim().toLowerCase();
  return CITIES.find(c => c.name.toLowerCase() === q);
}

function haversineKm(a: City, b: City): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Approximate road distance between two known cities ("Pune" or "Pune, MH").
 * Returns null when either city is not in the list.
 */
export function roadDistanceKm(originLabel: string, destinationLabel: string): number | null {
  const a = findCity(originLabel.split(',')[0]);
  const b = findCity(destinationLabel.split(',')[0]);
  if (!a || !b) return null;
  return Math.round(haversineKm(a, b) * ROAD_FACTOR);
}

export interface QuoteInput {
  origin: string;
  destination: string;
  vehicleCode: string;
  cargoCode: CargoCode;
  weightKg: number;
}

export interface QuoteEstimate {
  origin: City;
  destination: City;
  vehicle: VehicleRate;
  roadKm: number;
  priceLow: number;
  priceHigh: number;
  transitDays: number;
}

export type QuoteResult = { ok: true; estimate: QuoteEstimate } | { ok: false; field: keyof QuoteInput; message: string };

export function estimateQuote(input: QuoteInput): QuoteResult {
  const origin = findCity(input.origin);
  if (!origin) return { ok: false, field: 'origin', message: 'Pick a pickup city from the list' };
  const destination = findCity(input.destination);
  if (!destination) return { ok: false, field: 'destination', message: 'Pick a delivery city from the list' };
  if (origin.name === destination.name) {
    return { ok: false, field: 'destination', message: 'Delivery city must be different from the pickup city' };
  }
  const vehicle = RATE_CARD.find(v => v.code === input.vehicleCode);
  if (!vehicle) return { ok: false, field: 'vehicleCode', message: 'Choose a truck type' };
  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0) {
    return { ok: false, field: 'weightKg', message: 'Enter the load weight in kg' };
  }
  if (input.weightKg > vehicle.maxKg) {
    return { ok: false, field: 'weightKg', message: `${vehicle.label} carries up to ${vehicle.maxKg.toLocaleString('en-IN')} kg; pick a bigger truck` };
  }
  const cargo = CARGO_TYPES.find(c => c.code === input.cargoCode) ?? CARGO_TYPES[0];

  const roadKm = Math.round(haversineKm(origin, destination) * ROAD_FACTOR);
  const factor = 1 + cargo.surcharge;
  const round100 = (n: number) => Math.round(n / 100) * 100;
  const priceLow = round100(Math.max(vehicle.minimumCharge, roadKm * vehicle.ratePerKm[0]) * factor);
  const priceHigh = round100(Math.max(vehicle.minimumCharge, roadKm * vehicle.ratePerKm[1]) * factor);
  const transitDays = Math.max(1, Math.ceil(roadKm / KM_PER_DAY));

  return { ok: true, estimate: { origin, destination, vehicle, roadKm, priceLow, priceHigh, transitDays } };
}
