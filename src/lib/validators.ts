/**
 * Input Validators
 * ─────────────────────────────────────────────────────────────────
 * All POST body validation lives here.
 * We explicitly whitelist acceptable fields and reject everything else
 * to prevent mass assignment, prototype pollution, and unexpected data.
 */

export interface ValidatedOrderBody {
  customerId: string;
  origin: string;
  destination: string;
  totalWeight: number;
  items?: Array<{ productId: string; quantity: number }>;
  distance?: number;
  freightRate?: number;
  loadingBay?: string;
}

/** Fields that are accepted in a POST /api/orders body */
const ORDER_FIELD_ALLOWLIST = new Set<string>([
  'customerId',
  'origin',
  'destination',
  'totalWeight',
  'items',
  'distance',
  'freightRate',
  'loadingBay',
]);

/** Blocked keys used in prototype pollution attacks */
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function hasDangerousKey(obj: object): boolean {
  return Object.keys(obj).some(k => DANGEROUS_KEYS.has(k));
}

/**
 * Validates and sanitises a POST /api/orders request body.
 * Only allowlisted fields are passed through — everything else is stripped.
 */
export function validateOrderPost(raw: unknown): {
  valid: boolean;
  errors: string[];
  data?: ValidatedOrderBody;
} {
  const errors: string[] = [];

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const body = raw as Record<string, unknown>;

  // Prototype pollution guard
  if (hasDangerousKey(body)) {
    return { valid: false, errors: ['Malformed request body'] };
  }

  // Strip non-allowlisted fields (mass-assignment protection)
  const clean: Record<string, unknown> = {};
  for (const key of ORDER_FIELD_ALLOWLIST) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      clean[key] = body[key];
    }
  }

  // --- Required field validation ---
  if (!clean.customerId || typeof clean.customerId !== 'string' || clean.customerId.trim().length === 0) {
    errors.push('customerId is required and must be a non-empty string');
  } else if (!/^[A-Za-z0-9_-]{1,50}$/.test(clean.customerId as string)) {
    errors.push('customerId contains invalid characters');
  }

  if (!clean.origin || typeof clean.origin !== 'string' || (clean.origin as string).trim().length === 0) {
    errors.push('origin is required');
  } else if ((clean.origin as string).length > 200) {
    errors.push('origin must be 200 characters or fewer');
  }

  if (!clean.destination || typeof clean.destination !== 'string' || (clean.destination as string).trim().length === 0) {
    errors.push('destination is required');
  } else if ((clean.destination as string).length > 200) {
    errors.push('destination must be 200 characters or fewer');
  }

  if (typeof clean.totalWeight !== 'number' || !isFinite(clean.totalWeight)) {
    errors.push('totalWeight must be a finite number');
  } else if (clean.totalWeight <= 0 || clean.totalWeight > 50000) {
    errors.push('totalWeight must be between 1 and 50,000 kg');
  }

  // --- Optional field validation ---
  if (clean.distance !== undefined) {
    if (typeof clean.distance !== 'number' || clean.distance <= 0 || clean.distance > 10000) {
      errors.push('distance must be a positive number up to 10,000 km');
    }
  }

  if (clean.freightRate !== undefined) {
    if (typeof clean.freightRate !== 'number' || clean.freightRate < 0 || clean.freightRate > 1000) {
      errors.push('freightRate must be a non-negative number up to 1,000');
    }
  }

  if (clean.loadingBay !== undefined) {
    if (typeof clean.loadingBay !== 'string' || (clean.loadingBay as string).length > 50) {
      errors.push('loadingBay must be a string of 50 characters or fewer');
    }
  }

  if (clean.items !== undefined) {
    if (!Array.isArray(clean.items)) {
      errors.push('items must be an array');
    } else if (clean.items.length > 100) {
      errors.push('items array may not exceed 100 entries');
    } else {
      for (let i = 0; i < (clean.items as unknown[]).length; i++) {
        const item = (clean.items as unknown[])[i];
        if (typeof item !== 'object' || item === null) {
          errors.push(`items[${i}] must be an object`);
        }
      }
    }
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, errors: [], data: clean as unknown as ValidatedOrderBody };
}
