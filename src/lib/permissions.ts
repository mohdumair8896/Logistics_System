// ─── Role-based access control (shared by server routes and UI) ──────────────
// Every write route calls requirePermission(session, '<permission>'). All staff roles can read
// their own workspace; these permissions decide who may change what.

import { NextResponse } from 'next/server';

export const STAFF_ROLES = [
  'Operations Director',
  'Fleet Dispatcher',
  'Warehouse Supervisor',
  'Compliance Officer',
  'Finance Manager',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

const DIRECTOR = 'Operations Director';
const DISPATCHER = 'Fleet Dispatcher';
const WAREHOUSE = 'Warehouse Supervisor';
const COMPLIANCE = 'Compliance Officer';
const FINANCE = 'Finance Manager';

/** permission → roles allowed. Operations Director (workspace admin) can do everything. */
export const PERMISSIONS = {
  'order.create': [DIRECTOR, DISPATCHER],
  'order.update': [DIRECTOR, DISPATCHER],
  'order.allocate': [DIRECTOR, DISPATCHER],
  'order.allocate.override': [DIRECTOR],
  'warehouse.load': [DIRECTOR, DISPATCHER, WAREHOUSE],
  'trip.dispatch': [DIRECTOR, DISPATCHER, WAREHOUSE],
  'trip.update': [DIRECTOR, DISPATCHER],
  'trip.complete': [DIRECTOR, DISPATCHER],
  'pod.export': [DIRECTOR, DISPATCHER, COMPLIANCE, FINANCE],
  'invoice.create': [DIRECTOR, DISPATCHER, FINANCE],
  'invoice.update': [DIRECTOR, FINANCE],
  'customer.manage': [DIRECTOR, DISPATCHER, FINANCE],
  'fleet.manage': [DIRECTOR, DISPATCHER, COMPLIANCE],
  'fleet.delete': [DIRECTOR],
  'driver.verify': [DIRECTOR, COMPLIANCE],
  'lead.manage': [DIRECTOR, DISPATCHER],
  'kb.manage': [DIRECTOR, DISPATCHER],
  'alert.manage': [DIRECTOR, DISPATCHER, COMPLIANCE],
  'message.send': [DIRECTOR, DISPATCHER],
  'incident.manage': [DIRECTOR, DISPATCHER, COMPLIANCE],
  'compliance.run': [DIRECTOR, COMPLIANCE],
  'agent.run': [DIRECTOR, DISPATCHER],
  'proposal.approve': [DIRECTOR, DISPATCHER, FINANCE],
  'autonomy.configure': [DIRECTOR],
  'tenant.configure': [DIRECTOR],
  'team.manage': [DIRECTOR],
} as const satisfies Record<string, readonly StaffRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

/** True if `role` may perform `permission`. Unknown roles may do nothing. */
export function can(role: string | undefined | null, permission: Permission): boolean {
  return !!role && (PERMISSIONS[permission] as readonly string[]).includes(role);
}

/** Returns a 403 response when the session's role lacks `permission`, otherwise null. */
export function requirePermission(session: { role: string }, permission: Permission): NextResponse | null {
  if (can(session.role, permission)) return null;
  return NextResponse.json(
    { success: false, error: `Your role (${session.role}) can't do this. Ask an Operations Director.` },
    { status: 403 },
  );
}
