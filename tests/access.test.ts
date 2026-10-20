// Team & access control: the role permission matrix on real routes, server-side sessions
// (sign-out and role changes end them), invitations, password reset links, changing your own
// password, refusing common and leaked passwords, the last-Director guard and rate limits.

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

vi.mock('@/lib/db', async () => {
  const { getTestDb } = await import('./helpers/testDb');
  return { db: (await getTestDb()).db };
});

import { getTestDb } from './helpers/testDb';
import { signIn, cookieFrom, request, params } from './helpers/http';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';
import { can, PERMISSIONS, STAFF_ROLES, type Permission } from '@/lib/permissions';
import { verifyPassword } from '@/lib/passwords';
import { isRateLimited, resetRateLimits } from '@/lib/rateLimit';
import { createSession } from '@/lib/sessions';
import * as ordersRoute from '@/app/api/orders/route';
import * as orderRoute from '@/app/api/orders/[id]/route';
import * as invoiceRoute from '@/app/api/invoices/[id]/route';
import * as loginRoute from '@/app/api/auth/login/route';
import * as logoutRoute from '@/app/api/auth/logout/route';
import * as membersRoute from '@/app/api/tenant/members/route';
import * as memberRoute from '@/app/api/tenant/members/[userId]/route';
import * as invitationsRoute from '@/app/api/tenant/invitations/route';
import * as invitationRoute from '@/app/api/tenant/invitations/[id]/route';
import * as acceptRoute from '@/app/api/invitations/[token]/route';
import * as issueResetRoute from '@/app/api/tenant/members/[userId]/password-reset/route';
import * as resetRoute from '@/app/api/password-resets/[token]/route';
import * as accountPasswordRoute from '@/app/api/account/password/route';
import * as signUpRoute from '@/app/api/auth/register-subscription/route';

const T = 'ten_access';
const OTHER = 'ten_elsewhere';
const SOLO = 'ten_solo';

const json = async (res: Response) => ({ status: res.status, body: await res.json() });
const rows = async <R>(q: string, args: unknown[] = []) => (await (await getTestDb()).client.query<R>(q, args)).rows;
const tokenOf = (path: string) => path.replace('/invite/', '');

const getOrders = (cookie: string) => ordersRoute.GET(request('/api/orders', { cookie }));
const invite = async (cookie: string, email: string, role: string) =>
  json(await invitationsRoute.POST(request('/api/tenant/invitations', { method: 'POST', cookie, body: { email, role } })));
const viewInvite = async (token: string) =>
  json(await acceptRoute.GET(request(`/api/invitations/${token}`), params({ token })));
const accept = (token: string, body: unknown) =>
  acceptRoute.POST(request(`/api/invitations/${token}`, { method: 'POST', body }), params({ token }));
const changePassword = (cookie: string, body: unknown) =>
  accountPasswordRoute.POST(request('/api/account/password', { method: 'POST', cookie, body }));

let director = '';

beforeAll(async () => {
  const { client } = await getTestDb();
  await client.exec(`
    insert into tenants (id, name, slug, archetype, is_configured) values
      ('${T}', 'Access Movers', 'access-movers', 'FLEET_OWNER', true),
      ('${OTHER}', 'Elsewhere Cargo', 'elsewhere-cargo', 'FLEET_OWNER', true),
      ('${SOLO}', 'Solo Haulage', 'solo-haulage', 'FLEET_OWNER', true);
    insert into customers (id, tenant_id, name) values ('C701', '${T}', 'Access Customer');
    insert into orders (id, tenant_id, customer_id, origin, destination, total_weight_kg, status, distance_km, freight_rate) values
      ('ORD-7001', '${T}', 'C701', 'Nagpur', 'Raipur', 2000, 'Pending', 290, 2.0);
    insert into invoices (id, tenant_id, order_id, customer_id, total, status) values
      ('INV-7001', '${T}', 'ORD-7001', 'C701', '5000', 'Pending'),
      ('INV-7002', '${T}', 'ORD-7001', 'C701', '5000', 'Pending');
  `);
  director = (await signIn(T, 'Operations Director')).cookie;
});

beforeEach(() => resetRateLimits());

// Have I Been Pwned, faked so tests never leave the process: it lists PWNED_ONLY and padding.
// `pwnedApi` makes it fail ('down') or never answer ('hanging'); `pwnedAsked` holds the URLs requested.
const PWNED_ONLY = 'only-the-breach-api-knows-this';
const sha1 = (text: string) => createHash('sha1').update(text, 'utf8').digest('hex').toUpperCase();
let pwnedApi: 'up' | 'down' | 'hanging' = 'up';
const pwnedAsked: string[] = [];
const realFetch = globalThis.fetch;

async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = input instanceof Request ? input.url : String(input);
  if (!url.startsWith('https://api.pwnedpasswords.com/')) return realFetch(input, init);
  pwnedAsked.push(url);
  if (pwnedApi === 'down') throw new TypeError('fetch failed');
  const signal = init?.signal;
  if (pwnedApi === 'hanging') return new Promise<Response>((_, reject) => signal?.addEventListener('abort', () => reject(signal.reason)));
  const listed = sha1(PWNED_ONLY);
  const padding = '0018A45C4D1DEF81644B54AB7F969B88D65:0\r\n';
  return new Response(url.endsWith(`/range/${listed.slice(0, 5)}`) ? `${padding}${listed.slice(5)}:12\r\n` : padding);
}

beforeEach(() => {
  pwnedApi = 'up';
  pwnedAsked.length = 0;
  vi.stubGlobal('fetch', fakeFetch);
});

describe('permission matrix', () => {
  it('lets an Operations Director do everything', () => {
    for (const permission of Object.keys(PERMISSIONS) as Permission[]) {
      expect(can('Operations Director', permission), permission).toBe(true);
    }
  });

  it('keeps each role to its own work', () => {
    expect(can('Fleet Dispatcher', 'order.allocate')).toBe(true);
    expect(can('Fleet Dispatcher', 'invoice.update')).toBe(false);
    expect(can('Fleet Dispatcher', 'team.manage')).toBe(false);
    expect(can('Finance Manager', 'invoice.update')).toBe(true);
    expect(can('Finance Manager', 'order.allocate')).toBe(false);
    expect(can('Warehouse Supervisor', 'warehouse.load')).toBe(true);
    expect(can('Warehouse Supervisor', 'order.create')).toBe(false);
    expect(can('Compliance Officer', 'driver.verify')).toBe(true);
    expect(can('Compliance Officer', 'proposal.approve')).toBe(false);
  });

  it('denies unknown or missing roles', () => {
    expect(can('Super Admin', 'order.create')).toBe(false);
    expect(can(undefined, 'order.create')).toBe(false);
  });

  it('only names real staff roles', () => {
    for (const allowed of Object.values(PERMISSIONS)) {
      for (const role of allowed) expect(STAFF_ROLES).toContain(role);
    }
  });
});

describe('role checks on API routes', () => {
  it('stops a Fleet Dispatcher from marking an invoice paid, but not a Finance Manager', async () => {
    const dispatcher = (await signIn(T, 'Fleet Dispatcher')).cookie;
    const denied = await json(await invoiceRoute.PATCH(
      request('/api/invoices/INV-7001', { method: 'PATCH', cookie: dispatcher, body: { status: 'Paid' } }), params({ id: 'INV-7001' })));
    expect(denied.status).toBe(403);
    expect(denied.body.error).toMatch(/Fleet Dispatcher/);

    const finance = (await signIn(T, 'Finance Manager')).cookie;
    const paid = await invoiceRoute.PATCH(
      request('/api/invoices/INV-7001', { method: 'PATCH', cookie: finance, body: { status: 'Paid' } }), params({ id: 'INV-7001' }));
    expect(paid.status).toBe(200);
    expect(await rows(`select status from invoices where id = 'INV-7001'`)).toEqual([{ status: 'Paid' }]);
  });

  it('stops a Warehouse Supervisor from booking or cancelling orders', async () => {
    const warehouse = (await signIn(T, 'Warehouse Supervisor')).cookie;
    const create = await ordersRoute.POST(request('/api/orders', { method: 'POST', cookie: warehouse, body: {} }));
    expect(create.status).toBe(403);
    const cancel = await orderRoute.PATCH(
      request('/api/orders/ORD-7001', { method: 'PATCH', cookie: warehouse, body: { status: 'Cancelled' } }), params({ id: 'ORD-7001' }));
    expect(cancel.status).toBe(403);
    expect(await rows(`select status from orders where id = 'ORD-7001'`)).toEqual([{ status: 'Pending' }]);
  });

  it('needs a Director for allocation overrides', async () => {
    const dispatcher = (await signIn(T, 'Fleet Dispatcher')).cookie;
    const res = await orderRoute.PATCH(request('/api/orders/ORD-7001', {
      method: 'PATCH', cookie: dispatcher,
      body: { _action: 'allocate', vehicleId: 'V999', driverId: 'D999', overrideReason: 'Urgent load' },
    }), params({ id: 'ORD-7001' }));
    expect(res.status).toBe(403);
  });

  it('lets every role read the workspace', async () => {
    for (const role of STAFF_ROLES) {
      const { cookie } = await signIn(T, role);
      expect((await getOrders(cookie)).status, role).toBe(200);
    }
  });

  it('keeps the team page to Operations Directors', async () => {
    const dispatcher = (await signIn(T, 'Fleet Dispatcher')).cookie;
    expect((await membersRoute.GET(request('/api/tenant/members', { cookie: dispatcher }))).status).toBe(403);
    expect((await invite(dispatcher, 'someone@new.test', 'Fleet Dispatcher')).status).toBe(403);
  });
});

describe('server-side sessions', () => {
  it('signs in, and signing out ends the session even for a copied cookie', async () => {
    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_login', email: 'login@access.test', password: 'login-password-123' });
    const login = await loginRoute.POST(request('/api/auth/login', {
      method: 'POST', body: { email: 'login@access.test', password: 'login-password-123' },
    }));
    expect(login.status).toBe(200);
    expect((await login.json()).user.role).toBe('Fleet Dispatcher');
    const cookie = cookieFrom(login)!;
    expect((await getOrders(cookie)).status).toBe(200);

    expect((await logoutRoute.POST(request('/api/auth/logout', { method: 'POST', cookie }))).status).toBe(200);
    const after = await json(await getOrders(cookie));
    expect(after.status).toBe(401);
    expect(after.body.message).toMatch(/session has ended/);
  });

  it('rejects a correctly signed token that has no server-side session', async () => {
    const token = await createSessionToken({
      userId: `usr_${T}_operations_director`, email: 'x@access.test', role: 'Operations Director',
      name: 'Forged', facility: '', avatar: 'FO', tenantId: T, isConfigured: true,
    });
    expect((await getOrders(`${SESSION_COOKIE}=${token}`)).status).toBe(401);
  });

  it('rejects a session presented by another user', async () => {
    const { sid } = await signIn(T, 'Fleet Dispatcher');
    const token = await createSessionToken({
      sid, userId: `usr_${T}_operations_director`, email: 'x@access.test', role: 'Operations Director',
      name: 'Borrowed', facility: '', avatar: 'BO', tenantId: T, isConfigured: true,
    });
    expect((await getOrders(`${SESSION_COOKIE}=${token}`)).status).toBe(401);
  });

  it('slows down password guessing for an account', async () => {
    await signIn(T, 'Compliance Officer', { userId: 'usr_guess', email: 'guess@access.test', password: 'the-real-password' });
    const attempt = () => loginRoute.POST(request('/api/auth/login', {
      method: 'POST', body: { email: 'guess@access.test', password: 'wrong-password' },
    }));
    for (let i = 0; i < 8; i++) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });
});

describe('password hashing', () => {
  const login = (email: string, password: string) =>
    loginRoute.POST(request('/api/auth/login', { method: 'POST', body: { email, password } }));
  const storedHash = async (userId: string) =>
    (await rows<{ password_hash: string }>(`select password_hash from users where id = $1`, [userId]))[0].password_hash;
  const setLegacyHash = async (userId: string, password: string) =>
    rows(`update users set password_hash = $1 where id = $2`, [await bcrypt.hash(password, 4), userId]);

  it('tells apart passwords that share their first 72 bytes', async () => {
    // 72 ASCII characters, and 28 Devanagari ones (84 bytes): bcrypt alone stops reading before the end
    const prefixes = ['p'.repeat(72), 'पासवर्ड'.repeat(4)];
    for (const [i, shared] of prefixes.entries()) {
      expect(await bcrypt.compare(`${shared}-two`, await bcrypt.hash(`${shared}-one`, 4))).toBe(true);

      const email = `long${i}@access.test`;
      await signIn(T, 'Fleet Dispatcher', { userId: `usr_long${i}`, email, password: `${shared}-one` });
      expect((await login(email, `${shared}-two`)).status).toBe(401);
      expect((await login(email, `${shared}-one`)).status).toBe(200);
    }
  });

  it('still signs in with a legacy bcrypt hash, and upgrades it', async () => {
    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_legacy', email: 'legacy@access.test' });
    await setLegacyHash('usr_legacy', 'legacy-password-123');

    expect((await login('legacy@access.test', 'wrong-password-123')).status).toBe(401);
    expect(await storedHash('usr_legacy')).toMatch(/^\$2[ab]\$/);

    expect((await login('legacy@access.test', 'legacy-password-123')).status).toBe(200);
    const upgraded = await storedHash('usr_legacy');
    expect(upgraded).toMatch(/^v2\$\$2[ab]\$/);
    expect(await verifyPassword('legacy-password-123', upgraded)).toBe(true);

    expect((await login('legacy@access.test', 'legacy-password-123')).status).toBe(200);
    expect(await storedHash('usr_legacy')).toBe(upgraded);
    expect((await login('legacy@access.test', 'wrong-password-123')).status).toBe(401);
  });

  it('keeps a legacy hash of a password longer than 72 bytes, so a typo past them can’t replace it', async () => {
    const password = `${'q'.repeat(72)}-tail`;
    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_legacy_long', email: 'legacy.long@access.test' });
    await setLegacyHash('usr_legacy_long', password);
    const legacy = await storedHash('usr_legacy_long');

    // The old hash can't see past byte 72, so both sign in, as they did before — and neither is stored
    expect((await login('legacy.long@access.test', `${'q'.repeat(72)}-typo`)).status).toBe(200);
    expect((await login('legacy.long@access.test', password)).status).toBe(200);
    expect(await storedHash('usr_legacy_long')).toBe(legacy);
  });
});

describe('invitations', () => {
  it('invites a new teammate, who sets a password and lands in the workspace with that role', async () => {
    const created = await invite(director, 'New.Hire@Access.test', 'Fleet Dispatcher');
    expect(created.status).toBe(201);
    expect(created.body.email).toBe('new.hire@access.test');
    expect(created.body.path).toMatch(/^\/invite\/[A-Za-z0-9_-]{40,}$/);
    const token = tokenOf(created.body.path);

    // Only the hash is stored
    expect(await rows(`select count(*)::int as n from invitations where token_hash = $1`, [token])).toEqual([{ n: 0 }]);

    const listed = await json(await membersRoute.GET(request('/api/tenant/members', { cookie: director })));
    expect(listed.body.invitations.map((i: { email: string }) => i.email)).toContain('new.hire@access.test');

    const view = await viewInvite(token);
    expect(view.body).toMatchObject({ companyName: 'Access Movers', role: 'Fleet Dispatcher', accountExists: false });

    expect((await accept(token, { name: 'New Hire', password: 'short' })).status).toBe(400);
    const accepted = await accept(token, { name: 'New Hire', password: 'a-long-enough-password' });
    expect(accepted.status).toBe(200);
    const cookie = cookieFrom(accepted)!;
    expect((await getOrders(cookie)).status).toBe(200);
    expect(await rows(`select m.role, u.tenant_id from memberships m join users u on u.id = m.user_id where u.email = 'new.hire@access.test'`))
      .toEqual([{ role: 'Fleet Dispatcher', tenant_id: T }]);

    // The link works once
    expect((await accept(token, { name: 'Someone Else', password: 'another-long-password' })).status).toBe(410);
    expect((await viewInvite(token)).status).toBe(410);
  });

  it('refuses to invite someone who is already a member', async () => {
    expect((await invite(director, 'new.hire@access.test', 'Finance Manager')).status).toBe(409);
  });

  it('keeps only the newest link for an email', async () => {
    const first = await invite(director, 'twice@access.test', 'Finance Manager');
    const second = await invite(director, 'twice@access.test', 'Compliance Officer');
    expect((await viewInvite(tokenOf(first.body.path))).status).toBe(410);
    expect((await viewInvite(tokenOf(second.body.path))).body.role).toBe('Compliance Officer');
  });

  it('refuses expired and withdrawn links, and unknown tokens', async () => {
    const expired = await invite(director, 'late@access.test', 'Fleet Dispatcher');
    await rows(`update invitations set expires_at = now() - interval '1 minute' where id = $1`, [expired.body.id]);
    expect((await viewInvite(tokenOf(expired.body.path))).status).toBe(410);
    expect((await accept(tokenOf(expired.body.path), { name: 'Late', password: 'a-long-enough-password' })).status).toBe(410);

    const withdrawn = await invite(director, 'withdrawn@access.test', 'Fleet Dispatcher');
    const revoke = await invitationRoute.DELETE(
      request(`/api/tenant/invitations/${withdrawn.body.id}`, { method: 'DELETE', cookie: director }), params({ id: withdrawn.body.id }));
    expect(revoke.status).toBe(200);
    expect((await viewInvite(tokenOf(withdrawn.body.path))).status).toBe(410);

    expect((await viewInvite('not-a-real-token')).status).toBe(404);
  });

  it('adds a workspace to an existing account only with its password', async () => {
    await signIn(OTHER, 'Fleet Dispatcher', { userId: 'usr_shared', email: 'shared@elsewhere.test', password: 'shared-account-password' });
    const created = await invite(director, 'shared@elsewhere.test', 'Warehouse Supervisor');
    const token = tokenOf(created.body.path);
    expect((await viewInvite(token)).body.accountExists).toBe(true);

    expect((await accept(token, { password: 'not-the-password' })).status).toBe(401);
    const accepted = await accept(token, { password: 'shared-account-password' });
    expect(accepted.status).toBe(200);
    expect(await rows(`select tenant_id, role from memberships where user_id = 'usr_shared' order by tenant_id`)).toEqual([
      { tenant_id: T, role: 'Warehouse Supervisor' },
      { tenant_id: OTHER, role: 'Fleet Dispatcher' },
    ]);
    // Their default workspace stays where it was
    expect(await rows(`select tenant_id from users where id = 'usr_shared'`)).toEqual([{ tenant_id: OTHER }]);
  });

  it('ends the session of whoever was signed in on that browser', async () => {
    const someone = await signIn(T, 'Compliance Officer', { userId: 'usr_shared_pc', email: 'shared.pc@access.test' });
    const created = await invite(director, 'colleague@access.test', 'Fleet Dispatcher');
    const token = tokenOf(created.body.path);
    const res = await acceptRoute.POST(request(`/api/invitations/${token}`, {
      method: 'POST', cookie: someone.cookie, body: { name: 'Colleague', password: 'a-long-enough-password' },
    }), params({ token }));
    expect(res.status).toBe(200);
    expect((await getOrders(someone.cookie)).status).toBe(401);
    expect((await getOrders(cookieFrom(res)!)).status).toBe(200);
  });

  it('cannot withdraw another workspace’s invitation', async () => {
    const created = await invite(director, 'mine@access.test', 'Fleet Dispatcher');
    const outsider = (await signIn(OTHER, 'Operations Director')).cookie;
    const res = await invitationRoute.DELETE(
      request(`/api/tenant/invitations/${created.body.id}`, { method: 'DELETE', cookie: outsider }), params({ id: created.body.id }));
    expect(res.status).toBe(404);
    expect((await viewInvite(tokenOf(created.body.path))).status).toBe(200);
  });
});

describe('changing and removing members', () => {
  const patchRole = (cookie: string, userId: string, role: string) =>
    memberRoute.PATCH(request(`/api/tenant/members/${userId}`, { method: 'PATCH', cookie, body: { role } }), params({ userId }));
  const remove = (cookie: string, userId: string) =>
    memberRoute.DELETE(request(`/api/tenant/members/${userId}`, { method: 'DELETE', cookie }), params({ userId }));

  it('a role change ends the member’s sessions so the new role applies at once', async () => {
    const member = await signIn(T, 'Fleet Dispatcher', { userId: 'usr_promote', email: 'promote@access.test' });
    expect((await getOrders(member.cookie)).status).toBe(200);

    const res = await json(await patchRole(director, member.userId, 'Finance Manager'));
    expect(res.status).toBe(200);
    expect(res.body.sessionsEnded).toBeGreaterThanOrEqual(1);
    expect((await getOrders(member.cookie)).status).toBe(401);
    expect(await rows(`select role from memberships where user_id = 'usr_promote' and tenant_id = '${T}'`))
      .toEqual([{ role: 'Finance Manager' }]);
  });

  it('removing a member ends their access and clears their default workspace', async () => {
    const member = await signIn(T, 'Compliance Officer', { userId: 'usr_leaver', email: 'leaver@access.test' });
    expect((await remove(director, member.userId)).status).toBe(200);
    expect((await getOrders(member.cookie)).status).toBe(401);
    expect(await rows(`select count(*)::int as n from memberships where user_id = 'usr_leaver'`)).toEqual([{ n: 0 }]);
    expect(await rows(`select tenant_id from users where id = 'usr_leaver'`)).toEqual([{ tenant_id: null }]);
  });

  it('refuses to change or remove yourself', async () => {
    const me = `usr_${T}_operations_director`;
    expect((await patchRole(director, me, 'Fleet Dispatcher')).status).toBe(409);
    expect((await remove(director, me)).status).toBe(409);
  });

  it('cannot touch members of another workspace', async () => {
    const outsider = (await signIn(OTHER, 'Operations Director')).cookie;
    expect((await patchRole(outsider, 'usr_promote', 'Operations Director')).status).toBe(404);
    expect((await remove(outsider, 'usr_promote')).status).toBe(404);
  });

  it('always keeps one Operations Director', async () => {
    await signIn(SOLO, 'Operations Director', { userId: 'usr_solo_owner', email: 'owner@solo.test' });
    // A Director token whose membership was demoted moments ago (revocation not yet seen here)
    const stale = await signIn(SOLO, 'Operations Director', { userId: 'usr_solo_stale', email: 'stale@solo.test' });
    await rows(`update memberships set role = 'Fleet Dispatcher' where user_id = 'usr_solo_stale'`);

    const demote = await json(await patchRole(stale.cookie, 'usr_solo_owner', 'Fleet Dispatcher'));
    expect(demote.status).toBe(409);
    expect(demote.body.error).toMatch(/at least one Operations Director/);
    expect((await remove(stale.cookie, 'usr_solo_owner')).status).toBe(409);
    expect(await rows(`select role from memberships where user_id = 'usr_solo_owner'`)).toEqual([{ role: 'Operations Director' }]);
  });
});

describe('password reset links', () => {
  const issue = async (cookie: string, userId: string) => json(await issueResetRoute.POST(
    request(`/api/tenant/members/${userId}/password-reset`, { method: 'POST', cookie }), params({ userId })));
  const viewReset = async (token: string) =>
    json(await resetRoute.GET(request(`/api/password-resets/${token}`), params({ token })));
  const useReset = (token: string, password: string, cookie?: string) =>
    resetRoute.POST(request(`/api/password-resets/${token}`, { method: 'POST', cookie, body: { password } }), params({ token }));
  const resetToken = (path: string) => path.replace('/reset/', '');
  const login = (email: string, password: string) =>
    loginRoute.POST(request('/api/auth/login', { method: 'POST', body: { email, password } }));
  const withdraw = (cookie: string, userId: string) => issueResetRoute.DELETE(
    request(`/api/tenant/members/${userId}/password-reset`, { method: 'DELETE', cookie }), params({ userId }));
  const listedReset = async (userId: string) => {
    const listed = await json(await membersRoute.GET(request('/api/tenant/members', { cookie: director })));
    return listed.body.members.find((m: { userId: string }) => m.userId === userId).resetLinkExpiresAt as string | null;
  };

  it('a Director creates a link and the member chooses a new password with it', async () => {
    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_forgot', email: 'forgot@access.test', password: 'the-old-password' });
    const created = await issue(director, 'usr_forgot');
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ userId: 'usr_forgot', email: 'forgot@access.test' });
    expect(created.body.path).toMatch(/^\/reset\/[A-Za-z0-9_-]{40,}$/);
    const hoursLeft = (new Date(created.body.expiresAt).getTime() - Date.now()) / 3_600_000;
    expect(hoursLeft).toBeGreaterThan(23.9);
    expect(hoursLeft).toBeLessThanOrEqual(24);
    const token = resetToken(created.body.path);

    // Only the hash is stored
    expect(await rows(`select count(*)::int as n from password_resets where token_hash = $1`, [token])).toEqual([{ n: 0 }]);
    expect(await rows(`select tenant_id from password_resets where user_id = 'usr_forgot'`)).toEqual([{ tenant_id: T }]);

    expect((await viewReset(token)).body).toMatchObject({ email: 'forgot@access.test', companyName: 'Access Movers' });

    // 10–128 characters, counted as characters (9 emoji are 18 UTF-16 units), no other rules
    expect((await useReset(token, 'too short')).status).toBe(400);
    expect((await useReset(token, '🚚'.repeat(9))).status).toBe(400);
    expect((await useReset(token, 'x'.repeat(129))).status).toBe(400);
    const used = await useReset(token, 'correct horse battery');
    expect(used.status).toBe(200);
    expect((await getOrders(cookieFrom(used)!)).status).toBe(200);

    expect((await login('forgot@access.test', 'the-old-password')).status).toBe(401);
    expect((await login('forgot@access.test', 'correct horse battery')).status).toBe(200);
  });

  it('counts characters the same way when a password is set and when it is used', async () => {
    // 100 emoji are 100 characters but 200 UTF-16 units: allowed, and usable to sign in afterwards
    const emoji = '🚚'.repeat(100);
    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_emoji', email: 'emoji@access.test' });
    const token = resetToken((await issue(director, 'usr_emoji')).body.path);
    expect((await useReset(token, emoji)).status).toBe(200);
    expect((await login('emoji@access.test', emoji)).status).toBe(200);
    expect((await login('emoji@access.test', '🚚'.repeat(129))).status).toBe(401);

    // Invite acceptance follows the same rule: 10 emoji are enough, 9 are not
    const invited = await invite(director, 'emoji.invite@access.test', 'Fleet Dispatcher');
    const inviteToken = tokenOf(invited.body.path);
    expect((await accept(inviteToken, { name: 'Emoji Invite', password: '🚚'.repeat(9) })).status).toBe(400);
    expect((await accept(inviteToken, { name: 'Emoji Invite', password: '🚚'.repeat(10) })).status).toBe(200);
    expect((await login('emoji.invite@access.test', '🚚'.repeat(10))).status).toBe(200);
  });

  it('ends every session of the account, in every workspace, and the link works once', async () => {
    const phone = await signIn(T, 'Finance Manager', { userId: 'usr_stolen', email: 'stolen@access.test' });
    const laptop = await signIn(T, 'Finance Manager', { userId: 'usr_stolen', email: 'stolen@access.test' });
    await createSession('usr_stolen', OTHER); // a session from a workspace they belonged to before
    await createSession('usr_stolen', null);  // and one from before workspaces existed
    expect((await getOrders(phone.cookie)).status).toBe(200);
    const bystander = await signIn(T, 'Warehouse Supervisor', { userId: 'usr_bystander', email: 'bystander@access.test' });

    const token = resetToken((await issue(director, 'usr_stolen')).body.path);
    // Opened on a shared PC where a colleague is still signed in
    const used = await useReset(token, 'a brand new passphrase', bystander.cookie);
    expect(used.status).toBe(200);

    expect((await getOrders(phone.cookie)).status).toBe(401);
    expect((await getOrders(laptop.cookie)).status).toBe(401);
    expect((await getOrders(bystander.cookie)).status).toBe(401);
    expect(await rows(`select tenant_id from sessions where user_id = 'usr_stolen' and revoked_at is null`)).toEqual([{ tenant_id: T }]);
    expect((await getOrders(cookieFrom(used)!)).status).toBe(200);

    expect((await useReset(token, 'another new passphrase')).status).toBe(410);
    expect((await viewReset(token)).status).toBe(410);
  });

  it('refuses superseded and expired links, and unknown tokens', async () => {
    await signIn(T, 'Compliance Officer', { userId: 'usr_slow', email: 'slow@access.test' });
    const first = await issue(director, 'usr_slow');
    const second = await issue(director, 'usr_slow');
    expect((await viewReset(resetToken(first.body.path))).status).toBe(410);
    expect((await useReset(resetToken(first.body.path), 'a-long-enough-password')).status).toBe(410);
    expect((await viewReset(resetToken(second.body.path))).status).toBe(200);

    await rows(`update password_resets set expires_at = now() - interval '1 minute' where id = $1`, [second.body.id]);
    expect((await viewReset(resetToken(second.body.path))).status).toBe(410);
    expect((await useReset(resetToken(second.body.path), 'a-long-enough-password')).status).toBe(410);

    expect((await viewReset('not-a-real-token')).status).toBe(404);
    expect((await useReset('not-a-real-token', 'a-long-enough-password')).status).toBe(404);
  });

  it('only an Operations Director creates links, and not for themselves', async () => {
    const dispatcher = (await signIn(T, 'Fleet Dispatcher')).cookie;
    expect((await issue(dispatcher, 'usr_forgot')).status).toBe(403);
    expect((await issue(director, `usr_${T}_operations_director`)).status).toBe(409);
  });

  it('cannot reset a member of another workspace, or an account shared with one', async () => {
    const outsider = (await signIn(OTHER, 'Operations Director')).cookie;
    expect((await issue(outsider, 'usr_forgot')).status).toBe(404);
    expect(await rows(`select count(*)::int as n from password_resets where tenant_id = '${OTHER}'`)).toEqual([{ n: 0 }]);

    // The password also unlocks the other workspace, so neither Director may reset it
    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_two_jobs', email: 'two.jobs@access.test' });
    await signIn(OTHER, 'Fleet Dispatcher', { userId: 'usr_two_jobs', email: 'two.jobs@access.test' });
    expect((await issue(director, 'usr_two_jobs')).status).toBe(409);
    expect((await issue(outsider, 'usr_two_jobs')).status).toBe(409);
  });

  it('a link stops working when the member leaves, or joins another workspace', async () => {
    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_mover', email: 'mover@access.test' });
    const mover = resetToken((await issue(director, 'usr_mover')).body.path);
    await signIn(OTHER, 'Fleet Dispatcher', { userId: 'usr_mover', email: 'mover@access.test' });
    expect((await useReset(mover, 'a-long-enough-password')).status).toBe(410);

    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_quitter', email: 'quitter@access.test' });
    const quitter = resetToken((await issue(director, 'usr_quitter')).body.path);
    const removed = await memberRoute.DELETE(
      request('/api/tenant/members/usr_quitter', { method: 'DELETE', cookie: director }), params({ userId: 'usr_quitter' }));
    expect(removed.status).toBe(200);
    expect((await viewReset(quitter)).status).toBe(410);
  });

  it('a Director withdraws an open link, and it stops working', async () => {
    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_wrong_inbox', email: 'wrong.inbox@access.test' });
    const token = resetToken((await issue(director, 'usr_wrong_inbox')).body.path);
    expect((await viewReset(token)).status).toBe(200);

    expect((await withdraw(director, 'usr_wrong_inbox')).status).toBe(200);
    expect((await viewReset(token)).status).toBe(410);
    expect((await useReset(token, 'a-long-enough-password')).status).toBe(410);

    // Nothing open any more, and a member with no link at all
    expect((await withdraw(director, 'usr_wrong_inbox')).status).toBe(404);
    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_never_reset', email: 'never.reset@access.test' });
    expect((await withdraw(director, 'usr_never_reset')).status).toBe(404);
  });

  it('only a Director of the member’s workspace can withdraw a link', async () => {
    await signIn(T, 'Fleet Dispatcher', { userId: 'usr_keep_link', email: 'keep.link@access.test' });
    const token = resetToken((await issue(director, 'usr_keep_link')).body.path);

    const outsider = (await signIn(OTHER, 'Operations Director')).cookie;
    expect((await withdraw(outsider, 'usr_keep_link')).status).toBe(404);
    const dispatcher = (await signIn(T, 'Fleet Dispatcher')).cookie;
    expect((await withdraw(dispatcher, 'usr_keep_link')).status).toBe(403);

    expect((await viewReset(token)).status).toBe(200);
    expect(await rows(`select count(*)::int as n from password_resets where user_id = 'usr_keep_link' and revoked_at is null`))
      .toEqual([{ n: 1 }]);
  });

  it('the members list shows which members have an open link, and until when', async () => {
    await signIn(T, 'Finance Manager', { userId: 'usr_listed', email: 'listed@access.test' });
    expect(await listedReset('usr_listed')).toBeNull();

    const created = await issue(director, 'usr_listed');
    const listed = await listedReset('usr_listed');
    expect(listed).not.toBeNull();
    expect(new Date(listed!).getTime()).toBe(new Date(created.body.expiresAt).getTime());

    expect((await withdraw(director, 'usr_listed')).status).toBe(200);
    expect(await listedReset('usr_listed')).toBeNull();

    // Expired and used links aren't open either
    const expiring = await issue(director, 'usr_listed');
    await rows(`update password_resets set expires_at = now() - interval '1 minute' where id = $1`, [expiring.body.id]);
    expect(await listedReset('usr_listed')).toBeNull();
    const used = await issue(director, 'usr_listed');
    expect((await useReset(resetToken(used.body.path), 'a-long-enough-password')).status).toBe(200);
    expect(await listedReset('usr_listed')).toBeNull();
  });

  it('keeps reset links away from the RLS role', async () => {
    expect(await rows(`select has_table_privilege('app_rls', 'password_resets', 'SELECT') as can_read,
      has_table_privilege('app_rls', 'password_resets', 'UPDATE') as can_update`)).toEqual([{ can_read: false, can_update: false }]);
  });
});

describe('changing your own password', () => {
  const login = (email: string, password: string) =>
    loginRoute.POST(request('/api/auth/login', { method: 'POST', body: { email, password } }));

  it('needs a signed-in session', async () => {
    expect((await changePassword('', { currentPassword: 'anything-at-all', newPassword: 'a-long-enough-password' })).status).toBe(401);
  });

  it('refuses a wrong current password, and a new one that is too short, too long or unchanged', async () => {
    const me = await signIn(T, 'Fleet Dispatcher', { userId: 'usr_changer', email: 'changer@access.test', password: 'my-current-password' });
    const wrong = await json(await changePassword(me.cookie, { currentPassword: 'not-my-password', newPassword: 'a-brand-new-password' }));
    expect(wrong.status).toBe(401);
    expect(wrong.body.error).toMatch(/current password/);

    const tryNew = async (newPassword: string) =>
      (await changePassword(me.cookie, { currentPassword: 'my-current-password', newPassword })).status;
    expect(await tryNew('too short')).toBe(400);
    expect(await tryNew('🚚'.repeat(9))).toBe(400);
    expect(await tryNew('x'.repeat(129))).toBe(400);
    expect(await tryNew('my-current-password')).toBe(400);
    expect(await tryNew(PWNED_ONLY)).toBe(400); // same leaked-password checks as sign-up and reset

    // Nothing changed, and this browser is still signed in
    expect((await getOrders(me.cookie)).status).toBe(200);
    expect((await login('changer@access.test', 'my-current-password')).status).toBe(200);
  });

  it('ends every other session of the account, withdraws reset links, and the old password stops working', async () => {
    const here = await signIn(T, 'Finance Manager', { userId: 'usr_rotate', email: 'rotate@access.test', password: 'the-old-password' });
    const phone = await signIn(T, 'Finance Manager', { userId: 'usr_rotate', email: 'rotate@access.test' });
    await createSession('usr_rotate', OTHER); // from a workspace they belonged to before
    const colleague = await signIn(T, 'Warehouse Supervisor', { userId: 'usr_rotate_colleague', email: 'rotate.colleague@access.test' });
    const link = await issueResetRoute.POST(
      request('/api/tenant/members/usr_rotate/password-reset', { method: 'POST', cookie: director }), params({ userId: 'usr_rotate' }));
    expect(link.status).toBe(201);

    const res = await changePassword(here.cookie, { currentPassword: 'the-old-password', newPassword: 'a brand new passphrase' });
    expect(res.status).toBe(200);
    expect((await res.json()).otherSessionsEnded).toBe(2);

    // This browser continues in a fresh session; the cookie it came with (and any copy) is dead
    const fresh = cookieFrom(res)!;
    expect((await getOrders(fresh)).status).toBe(200);
    expect((await getOrders(here.cookie)).status).toBe(401);
    expect((await getOrders(phone.cookie)).status).toBe(401);
    expect(await rows(`select tenant_id from sessions where user_id = 'usr_rotate' and revoked_at is null`)).toEqual([{ tenant_id: T }]);
    expect((await getOrders(colleague.cookie)).status).toBe(200);
    expect(await rows(`select count(*)::int as n from password_resets
      where user_id = 'usr_rotate' and used_at is null and revoked_at is null`)).toEqual([{ n: 0 }]);

    expect((await login('rotate@access.test', 'the-old-password')).status).toBe(401);
    expect((await login('rotate@access.test', 'a brand new passphrase')).status).toBe(200);
  });
});

describe('refusing common and leaked passwords', () => {
  const LEAKED = 'This password appears in lists of leaked passwords. Choose another.';
  const FROM_CONTEXT = 'This password is based on your email, your company name or LogisticsEdge. Choose another.';
  const PASSPHRASE = 'monsoon lorry at dawn';

  const signUp = async (email: string, password: string, companyName = 'Saffron Road Carriers') =>
    json(await signUpRoute.POST(request('/api/auth/register-subscription', {
      method: 'POST', body: { companyName, adminName: 'New Owner', email, password, plan: 'FLEX' },
    })));
  const inviteFor = async (email: string) => tokenOf((await invite(director, email, 'Fleet Dispatcher')).body.path);
  const acceptWith = async (token: string, password: string) => json(await accept(token, { name: 'New Teammate', password }));
  const resetFor = async (userId: string, email: string) => {
    await signIn(T, 'Fleet Dispatcher', { userId, email });
    const created = await issueResetRoute.POST(
      request(`/api/tenant/members/${userId}/password-reset`, { method: 'POST', cookie: director }), params({ userId }));
    return String((await created.json()).path).replace('/reset/', '');
  };
  const resetWith = async (token: string, password: string) =>
    json(await resetRoute.POST(request(`/api/password-resets/${token}`, { method: 'POST', body: { password } }), params({ token })));

  it('refuses a common password at sign-up, invite acceptance and reset, in any case, without asking the API', async () => {
    expect(await signUp('common@signup.test', 'qwertyuiop')).toMatchObject({ status: 400, body: { message: LEAKED } });
    expect(await rows(`select count(*)::int as n from users where email = 'common@signup.test'`)).toEqual([{ n: 0 }]);

    const inviteToken = await inviteFor('common.invite@access.test');
    expect(await acceptWith(inviteToken, 'LIVERPOOL1')).toMatchObject({ status: 400, body: { error: LEAKED } });
    expect((await viewInvite(inviteToken)).status).toBe(200); // still unused

    const resetToken = await resetFor('usr_common', 'common.reset@access.test');
    expect(await resetWith(resetToken, '1q2w3e4r5t')).toMatchObject({ status: 400, body: { error: LEAKED } });
    expect((await resetWith(resetToken, PASSPHRASE)).status).toBe(200); // the link wasn't used up

    expect(pwnedAsked).toEqual([`https://api.pwnedpasswords.com/range/${sha1(PASSPHRASE).slice(0, 5)}`]);
  });

  it('accepts an uncommon passphrase at sign-up, invite acceptance and reset', async () => {
    expect(await signUp('passphrase@signup.test', PASSPHRASE)).toMatchObject({ status: 200, body: { success: true } });
    expect((await acceptWith(await inviteFor('passphrase.invite@access.test'), PASSPHRASE)).status).toBe(200);
    expect((await resetWith(await resetFor('usr_passphrase', 'passphrase.reset@access.test'), PASSPHRASE)).status).toBe(200);
  });

  it('refuses a password Have I Been Pwned lists, sending it only the first 5 characters of the SHA-1', async () => {
    expect(await signUp('pwned@signup.test', PWNED_ONLY)).toMatchObject({ status: 400, body: { message: LEAKED } });
    const resetToken = await resetFor('usr_pwned', 'pwned.reset@access.test');
    expect(await resetWith(resetToken, PWNED_ONLY)).toMatchObject({ status: 400, body: { error: LEAKED } });
    expect(pwnedAsked).toEqual(Array(2).fill(`https://api.pwnedpasswords.com/range/${sha1(PWNED_ONLY).slice(0, 5)}`));
  });

  it('refuses a password made of LogisticsEdge, the email or the company name plus a few characters', async () => {
    expect(await signUp('ravi.kumar@saffronroad.in', 'RaviKumar@1985')).toMatchObject({ status: 400, body: { message: FROM_CONTEXT } });
    expect(await signUp('owner@saffron.test', 'Saffron Road 2026!')).toMatchObject({ status: 400, body: { message: FROM_CONTEXT } });
    const inviteToken = await inviteFor('context.invite@access.test');
    expect(await acceptWith(inviteToken, 'Access-Movers-2026')).toMatchObject({ status: 400, body: { error: FROM_CONTEXT } });

    const resetToken = await resetFor('usr_context', 'context.reset@access.test');
    expect(await resetWith(resetToken, 'LogisticsEdge!2026')).toMatchObject({ status: 400, body: { error: FROM_CONTEXT } });
    // Containing one is fine when the rest is a passphrase of its own
    expect((await resetWith(resetToken, 'logisticsedge moved my mangoes')).status).toBe(200);
  });

  it('allows the password when Have I Been Pwned is down or too slow, but still checks the bundled list', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    pwnedApi = 'down';
    const resetToken = await resetFor('usr_offline', 'offline.reset@access.test');
    expect(await resetWith(resetToken, 'qwertyuiop')).toMatchObject({ status: 400, body: { error: LEAKED } });
    expect((await resetWith(resetToken, PWNED_ONLY)).status).toBe(200);

    pwnedApi = 'hanging';
    expect((await acceptWith(await inviteFor('slow.invite@access.test'), PWNED_ONLY)).status).toBe(200);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Have I Been Pwned check skipped'), expect.anything());
    warn.mockRestore();
  });
});

describe('rate limiter', () => {
  it('allows up to the limit within the window, per key', () => {
    for (let i = 0; i < 3; i++) expect(isRateLimited('k1', 3, 60_000)).toBe(false);
    expect(isRateLimited('k1', 3, 60_000)).toBe(true);
    expect(isRateLimited('k2', 3, 60_000)).toBe(false);
  });

  it('limits invitation guessing per client', async () => {
    const attempt = () => acceptRoute.POST(
      request('/api/invitations/guess', { method: 'POST', body: { password: 'x' }, headers: { 'x-forwarded-for': '203.0.113.9' } }),
      params({ token: 'guess' }));
    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(404);
    expect((await attempt()).status).toBe(429);
  });

  it('limits reset link guessing per client', async () => {
    const headers = { 'x-forwarded-for': '203.0.113.10' };
    const attempt = () => resetRoute.POST(
      request('/api/password-resets/guess', { method: 'POST', body: { password: 'a-long-enough-password' }, headers }),
      params({ token: 'guess' }));
    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(404);
    expect((await attempt()).status).toBe(429);

    const view = () => resetRoute.GET(request('/api/password-resets/guess', { headers }), params({ token: 'guess' }));
    for (let i = 0; i < 60; i++) expect((await view()).status).toBe(404);
    expect((await view()).status).toBe(429);
  });

  it('limits current-password guessing per account, from a signed-in browser', async () => {
    const me = await signIn(T, 'Compliance Officer', { userId: 'usr_guess_change', email: 'guess.change@access.test', password: 'the-right-password' });
    const attempt = (cookie: string, currentPassword: string) =>
      changePassword(cookie, { currentPassword, newPassword: 'a-brand-new-password' });
    for (let i = 0; i < 5; i++) expect((await attempt(me.cookie, `wrong-guess-${i}`)).status).toBe(401);
    expect((await attempt(me.cookie, 'the-right-password')).status).toBe(429);
    expect((await getOrders(me.cookie)).status).toBe(200); // still signed in, password unchanged

    // Another account isn't slowed down
    const other = await signIn(T, 'Compliance Officer', { userId: 'usr_guess_other', email: 'guess.other@access.test' });
    expect((await attempt(other.cookie, 'wrong-guess')).status).toBe(401);
  });
});
