// Default module entitlements for a workspace that hasn't finished /setup yet.
// Kept free of UI imports so server routes can use it.

export const DEFAULT_ENABLED_MODULES: readonly string[] = [
  'FLEET', 'TMS', 'TRIPS', 'CORRIDOR_TRACKING',
  'DELIVERY_POD', 'INVOICING', 'ALLOCATION', 'WAREHOUSE',
  'DRIVER_AGENT', 'EXCEPTION_AGENT', 'CUSTOMER_PORTAL', 'LEADS_CRM',
];
