/**
 * Shared Formatting & UI Utilities
 * ─────────────────────────────────────────────────────────────────
 * Consolidated helper functions to ensure DRY formatting across
 * all dashboard operational modules.
 */

/** Formats a numeric amount into Indian Rupee notation (e.g. ₹28,800) */
export function formatINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '₹0';
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

/**
 * Formats a time as IST (e.g. "02:45 pm"). Server code runs in UTC on Vercel, so the
 * time zone must be explicit or users see times 5½ hours off.
 */
export function formatIstTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}
