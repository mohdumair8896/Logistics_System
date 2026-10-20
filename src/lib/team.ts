// ─── Team invitations and password reset links (server-only) ──────────────────
// A Director creates an invite; the raw token is shown once (inside the invite link) and only
// its SHA-256 hash is stored, so a database leak doesn't expose usable invite links.

import { createHash, randomBytes } from 'node:crypto';

export const INVITE_TTL_DAYS = 7;

export function newInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function invitePath(token: string): string {
  return `/invite/${token}`;
}

// Password reset links work the same way (no email provider): a Director creates one for a member,
// it's shown once, works once and expires after RESET_TTL_HOURS. Only the hash is stored.
// The password rule itself is in src/lib/passwords.ts.
export const RESET_TTL_HOURS = 24;

export const newResetToken = newInviteToken;
export const hashResetToken = hashInviteToken;

export function resetPath(token: string): string {
  return `/reset/${token}`;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
}
