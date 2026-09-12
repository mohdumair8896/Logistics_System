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

/** Common status badge class mapping across all logistics entities (internal) */
const STATUS_BADGE_CLASSES: Record<string, string> = {
  // Order & Trip statuses
  'Pending': 'badge-yellow',
  'Allocated': 'badge-blue',
  'Staged': 'badge-purple',
  'In Transit': 'badge-blue',
  'Delivered': 'badge-green',
  'Cancelled': 'badge-gray',
  'Delayed': 'badge-red',

  // Vehicle statuses
  'Available': 'badge-green',
  'Maintenance': 'badge-yellow',

  // Driver statuses
  'On Trip': 'badge-blue',
  'Off Duty': 'badge-gray',

  // Lead statuses
  'New': 'badge-yellow',
  'Contacted': 'badge-blue',
  'Archived': 'badge-gray',

  // Invoice statuses
  'Paid': 'badge-green',
  'Overdue': 'badge-red',
  'Draft': 'badge-gray',
  'Sent': 'badge-blue',
};

/** Returns the badge CSS class for a given status string */
export function getStatusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status] || 'badge-gray';
}
