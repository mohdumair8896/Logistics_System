'use client';
// ─── Team & Roles — invite teammates, change roles, reset passwords, remove access ─
// Operations Directors only (the API enforces it; others see an explanation).

import { useCallback, useEffect, useState } from 'react';
import { Check, KeyRound, Link2, MessageCircle, ShieldCheck, Trash2, UserPlus, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiMutate } from '@/lib/apiClient';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { PERMISSIONS, STAFF_ROLES, type Permission, type StaffRole } from '@/lib/permissions';
import { CopyButton } from '@/components/ui/CopyButton';
import { AlertDialog } from '@/components/ui/AlertDialog';

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean | null;
  joinedAt: string | null;
  isYou: boolean;
  resetLinkExpiresAt: string | null;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  createdAt: string | null;
  expiresAt: string;
  expired: boolean;
}

interface CreatedInvite {
  id: string;
  email: string;
  role: string;
  url: string;
  expiresAt: string;
}

interface CreatedReset {
  userId: string;
  name: string;
  email: string;
  url: string;
  expiresAt: string;
}

const ROLE_SUMMARY: Record<StaffRole, string> = {
  'Operations Director': 'Full control, including team, billing and AI autonomy',
  'Fleet Dispatcher': 'Orders, allocation, trips, drivers and customer comms',
  'Warehouse Supervisor': 'Barcode scans, loading bays and dispatching loaded trucks',
  'Compliance Officer': 'Driver documents, fleet records, incidents and compliance checks',
  'Finance Manager': 'Invoices, payments, customers and financial approvals',
};

/** Capabilities shown in the access matrix (subset of PERMISSIONS, in plain words). */
const MATRIX: { permission: Permission; label: string }[] = [
  { permission: 'order.create', label: 'Create & edit orders' },
  { permission: 'order.allocate', label: 'Allocate vehicles' },
  { permission: 'order.allocate.override', label: 'Override allocation rules' },
  { permission: 'warehouse.load', label: 'Scan & load at the bay' },
  { permission: 'trip.complete', label: 'Complete deliveries' },
  { permission: 'invoice.update', label: 'Mark invoices paid / disputed' },
  { permission: 'fleet.manage', label: 'Manage vehicles & drivers' },
  { permission: 'driver.verify', label: 'Verify driver documents' },
  { permission: 'proposal.approve', label: 'Approve AI actions' },
  { permission: 'autonomy.configure', label: 'Set AI autonomy level' },
  { permission: 'team.manage', label: 'Manage team & roles' },
];

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

export default function TeamPage() {
  const { user } = useCurrentUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('Fleet Dispatcher');
  const [inviting, setInviting] = useState(false);
  const [created, setCreated] = useState<CreatedInvite | null>(null);
  const [toRemove, setToRemove] = useState<Member | null>(null);
  const [resetLink, setResetLink] = useState<CreatedReset | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/tenant/members');
      if (res.status === 403) { setForbidden(true); return; }
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setMembers(data.members);
      setInvites(data.invitations);
    } catch {
      toast.error('Could not load your team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    const result = await apiMutate<{ id: string; email: string; role: string; path: string; expiresAt: string }>(
      '/api/tenant/invitations', 'POST', { email: email.trim(), role },
    );
    setInviting(false);
    if (!result.ok) return;
    setCreated({ ...result.data, url: `${window.location.origin}${result.data.path}` });
    setEmail('');
    load();
  };

  const changeRole = async (member: Member, newRole: string) => {
    const result = await apiMutate(`/api/tenant/members/${encodeURIComponent(member.userId)}`, 'PATCH', { role: newRole });
    if (result.ok) {
      toast.success(`${member.name} is now ${newRole}`, { description: 'They will be asked to sign in again.' });
      load();
    }
  };

  const removeMember = async (member: Member) => {
    const result = await apiMutate(`/api/tenant/members/${encodeURIComponent(member.userId)}`, 'DELETE');
    if (result.ok) {
      toast.success(`${member.name} was removed`, { description: 'Their access ended immediately.' });
      if (resetLink?.userId === member.userId) setResetLink(null); // its link no longer works
      load();
    }
  };

  const createResetLink = async (member: Member) => {
    setResetting(member.userId);
    const result = await apiMutate<{ userId: string; name: string; email: string; path: string; expiresAt: string }>(
      `/api/tenant/members/${encodeURIComponent(member.userId)}/password-reset`, 'POST',
    );
    setResetting(null);
    if (!result.ok) return;
    setResetLink({ ...result.data, url: `${window.location.origin}${result.data.path}` });
    load();
  };

  const withdrawResetLink = async (member: Member) => {
    setWithdrawing(member.userId);
    const result = await apiMutate(`/api/tenant/members/${encodeURIComponent(member.userId)}/password-reset`, 'DELETE');
    setWithdrawing(null);
    if (result.ok) {
      toast.success(`Reset link for ${member.name} withdrawn`);
      if (resetLink?.userId === member.userId) setResetLink(null); // its link no longer works
    }
    load(); // a 404 means it was used or withdrawn elsewhere; refresh either way
  };

  const revokeInvite = async (invite: Invite) => {
    const result = await apiMutate(`/api/tenant/invitations/${encodeURIComponent(invite.id)}`, 'DELETE');
    if (result.ok) {
      toast.success(`Invitation for ${invite.email} withdrawn`);
      if (created?.id === invite.id) setCreated(null); // its link no longer works
      load();
    }
  };

  if (forbidden) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48, maxWidth: 520, margin: '40px auto' }}>
        <ShieldCheck size={40} color="var(--text-low)" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Only an Operations Director can manage the team</div>
        <div style={{ color: 'var(--text-low)', fontSize: 13 }}>Ask your workspace administrator to invite people or change roles.</div>
      </div>
    );
  }

  const workspace = user.companyName ? `${user.companyName} on LogisticsEdge` : 'our LogisticsEdge workspace';
  const whatsappText = created
    ? `You're invited to join ${workspace} as ${created.role}. Accept here (link works once, valid until ${fmtDate(created.expiresAt)}): ${created.url}`
    : '';
  const resetWhatsappText = resetLink
    ? `Here's your link to choose a new password for ${workspace}. It works once, until ${fmtDateTime(resetLink.expiresAt)}: ${resetLink.url}`
    : '';

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title">Team &amp; Roles</div>
          <div className="page-subtitle">Invite teammates with a link and decide what each role can change</div>
        </div>
      </div>

      <div className="responsive-split-12-1">
        {/* minWidth 0: on phones the members table scrolls inside its card instead of widening the page */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Password reset link, shown once */}
          {resetLink && (
            <div className="card" role="status" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={16} color="var(--brand)" />
                <span style={{ fontWeight: 700 }}>Password reset link for {resetLink.name}</span>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setResetLink(null)} aria-label="Close reset link">
                  <X size={14} />
                </button>
              </div>
              <div style={{ fontSize: 13 }}>
                Send it to <strong>{resetLink.email}</strong>. It works once, until {fmtDateTime(resetLink.expiresAt)}.
                When they choose a new password, they are signed out everywhere else.
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--text-mid)' }}>{resetLink.url}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <CopyButton text={resetLink.url} label="Reset link" variant="button" buttonText="Copy link" />
                <a className="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer"
                  href={`https://wa.me/?text=${encodeURIComponent(resetWhatsappText)}`}>
                  <MessageCircle size={14} /> Share on WhatsApp
                </a>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-low)' }}>
                This is the only time the link is shown. Withdrawing it, or creating another one, stops it working.
              </div>
            </div>
          )}

          {/* Members */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
              <Users size={16} color="var(--brand)" />
              <span style={{ fontWeight: 700 }}>Members</span>
              <span className="badge badge-gray">{members.length}</span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Joined</th><th aria-label="Actions" /></tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={4} style={{ color: 'var(--text-low)' }}>Loading…</td></tr>
                  )}
                  {members.map(m => (
                    <tr key={m.userId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.name}{m.isYou && <span className="badge badge-blue" style={{ marginLeft: 6 }}>You</span>}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{m.email}{m.isActive === false && ' · disabled'}</div>
                        {m.resetLinkExpiresAt && (
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 2, marginTop: 4, fontSize: 12 }}>
                            <span>
                              <KeyRound size={12} color="var(--brand)" aria-hidden style={{ display: 'inline-block', verticalAlign: -2, marginRight: 4 }} />
                              Reset link open until <span style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(m.resetLinkExpiresAt)}</span>
                            </span>
                            <button className="btn btn-ghost btn-sm" onClick={() => withdrawResetLink(m)} disabled={withdrawing === m.userId}
                              aria-label={`Withdraw the password reset link for ${m.name}`}>
                              <X size={14} /> {withdrawing === m.userId ? 'Withdrawing…' : 'Withdraw'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {m.isYou ? (
                          <span>{m.role}</span>
                        ) : (
                          <select
                            className="form-select"
                            style={{ minWidth: 170 }}
                            aria-label={`Role for ${m.name}`}
                            value={m.role}
                            onChange={e => changeRole(m, e.target.value)}
                          >
                            {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(m.joinedAt)}</td>
                      <td>
                        {!m.isYou && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                            {m.isActive !== false && (
                              <button className="btn btn-ghost btn-sm" onClick={() => createResetLink(m)} disabled={resetting === m.userId}
                                aria-label={`Create a password reset link for ${m.name}`}>
                                <KeyRound size={14} /> {resetting === m.userId ? 'Creating…' : 'Reset password'}
                              </button>
                            )}
                            <button className="btn btn-ghost btn-sm" onClick={() => setToRemove(m)} aria-label={`Remove ${m.name}`}>
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending invitations */}
          {invites.length > 0 && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
                <Link2 size={16} color="var(--brand)" />
                <span style={{ fontWeight: 700 }}>Pending invitations</span>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <tbody>
                    {invites.map(i => (
                      <tr key={i.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{i.email}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{i.role}</div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {i.expired
                            ? <span className="badge badge-red">Expired</span>
                            : <span style={{ fontSize: 12, color: 'var(--text-low)' }}>Expires {fmtDate(i.expiresAt)}</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => revokeInvite(i)}>
                            <X size={14} /> Withdraw
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Invite */}
        <div>
          <form className="card" onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserPlus size={16} color="var(--brand)" />
              <span style={{ fontWeight: 700 }}>Invite a teammate</span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="invite-email">Work email</label>
              <input id="invite-email" className="form-input" type="email" autoComplete="off" required
                value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="invite-role">Role</label>
              <select id="invite-role" className="form-select" value={role} onChange={e => setRole(e.target.value as StaffRole)}>
                {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 4 }}>{ROLE_SUMMARY[role]}</div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={inviting || !email.trim()}>
              {inviting ? 'Creating link…' : 'Create invite link'}
            </button>

            {created && (
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13 }}>
                  Link for <strong>{created.email}</strong> ({created.role}). Valid until {fmtDate(created.expiresAt)}; it works once.
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--text-mid)' }}>{created.url}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <CopyButton text={created.url} label="Invite link" variant="button" buttonText="Copy link" />
                  <a className="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer"
                    href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}>
                    <MessageCircle size={14} /> Share on WhatsApp
                  </a>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>This is the only time the link is shown.</div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Access matrix */}
      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <ShieldCheck size={16} color="var(--brand)" />
          <span style={{ fontWeight: 700 }}>What each role can do</span>
        </div>
        <div className="table-container">
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Capability</th>
                {STAFF_ROLES.map(r => <th key={r} style={{ textAlign: 'center', whiteSpace: 'normal' }}>{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map(row => (
                <tr key={row.permission}>
                  <td style={{ whiteSpace: 'nowrap' }}>{row.label}</td>
                  {STAFF_ROLES.map(r => (
                    <td key={r} style={{ textAlign: 'center' }}>
                      {(PERMISSIONS[row.permission] as readonly string[]).includes(r)
                        ? <Check size={14} color="var(--success)" aria-label="allowed" style={{ display: 'inline-block' }} />
                        : <span style={{ color: 'var(--text-low)' }} aria-label="not allowed">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 8 }}>Every role can view the whole workspace.</div>
      </div>

      <AlertDialog
        open={!!toRemove}
        onOpenChange={open => !open && setToRemove(null)}
        title="Remove from workspace"
        description={toRemove ? `${toRemove.name} will lose access immediately. You can invite them again later.` : ''}
        confirmText="Remove"
        variant="danger"
        onConfirm={async () => {
          if (toRemove) await removeMember(toRemove);
          setToRemove(null);
        }}
      />
    </div>
  );
}
