'use client';
// ─── /invite/[token] — accept a workspace invitation ─────────────────────────
// New email → choose a name and password. Existing account → confirm the password.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Truck, UserCheck } from 'lucide-react';
import { DotSpinner } from '@/components/ui/DotSpinner';

interface InviteInfo {
  companyName: string;
  email: string;
  role: string;
  expiresAt: string;
  accountExists: boolean;
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/invitations/${encodeURIComponent(token)}`)
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) setInfo(data);
        else setLoadError(data.error || 'This invitation link is not valid.');
      })
      .catch(() => { if (!cancelled) setLoadError('Network error. Check your connection and reload.'); });
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info) return;
    setError('');
    if (!info.accountExists) {
      if (name.trim().length < 2) { setError('Enter your full name.'); return; }
      if (password.length < 10) { setError('Choose a password of at least 10 characters.'); return; }
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(info.accountExists ? { password } : { name: name.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Could not accept the invitation.'); return; }
      router.push(data.redirectUrl || '/dashboard');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, background: 'var(--brand)', borderRadius: 14, marginBottom: 12,
            boxShadow: '0 4px 20px var(--brand-glow)',
          }}>
            <Truck size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-high)', fontFamily: 'var(--font-heading)' }}>
            {info ? `Join ${info.companyName}` : 'Workspace invitation'}
          </h1>
          {info && (
            <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 6 }}>
              You&apos;ve been invited as <strong>{info.role}</strong>
            </p>
          )}
        </div>

        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 14,
          padding: '22px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          {!info && !loadError && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <DotSpinner size={20} />
            </div>
          )}

          {loadError && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 14, color: 'var(--text-high)' }}>{loadError}</div>
              <Link href="/login" className="btn btn-secondary" style={{ justifyContent: 'center' }}>Go to sign in</Link>
            </div>
          )}

          {info && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="invite-email">Email</label>
                <input id="invite-email" className="form-input" value={info.email} readOnly disabled />
              </div>

              {info.accountExists ? (
                <div style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>
                  You already have an account. Enter its password to add this workspace.
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="invite-name">Full name</label>
                  <input id="invite-name" className="form-input" autoComplete="name" required
                    value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="invite-password">
                  {info.accountExists ? 'Password' : 'Choose a password'}
                </label>
                <div className="input-group" style={{ height: 42 }}>
                  <input id="invite-password" type={showPass ? 'text' : 'password'} required
                    autoComplete={info.accountExists ? 'current-password' : 'new-password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={info.accountExists ? '••••••••' : 'At least 10 characters'} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', display: 'flex', padding: 4 }}
                    aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" style={{
                  background: 'var(--status-error-bg)', border: '1px solid rgba(192,57,43,0.2)',
                  borderRadius: 8, padding: '8px 12px', color: 'var(--status-error)', fontSize: 12,
                }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}
                style={{ justifyContent: 'center', width: '100%', gap: 10 }}>
                {submitting
                  ? <><DotSpinner size={16} color="#ffffff" /> Joining…</>
                  : <><UserCheck size={15} /> Accept and join</>}
              </button>

              <div style={{ fontSize: 11.5, color: 'var(--text-low)', textAlign: 'center' }}>
                Link valid until {new Date(info.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
