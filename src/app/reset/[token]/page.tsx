'use client';
// ─── /reset/[token] — choose a new password from a Director's reset link ─────
// NIST SP 800-63B: 10–128 characters, any characters (spaces too), paste allowed, no composition
// rules. The server re-checks (src/lib/passwords.ts passwordProblem) and signs the member in fresh.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandMark';
import { DotSpinner } from '@/components/ui/DotSpinner';

// Mirrors PASSWORD_MIN_LENGTH / PASSWORD_MAX_LENGTH in src/lib/passwords.ts (server-only module)
const MIN = 10;
const MAX = 128;

interface ResetInfo {
  name: string;
  email: string;
  companyName: string;
  expiresAt: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const [info, setInfo] = useState<ResetInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/password-resets/${encodeURIComponent(token)}`)
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) setInfo(data);
        else setLoadError(data.error || 'This reset link is not valid.');
      })
      .catch(() => { if (!cancelled) setLoadError('No connection. Check your internet and reload.'); });
    return () => { cancelled = true; };
  }, [token]);

  const length = [...password].length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info) return;
    setError('');
    if (length < MIN) { setError(`Use at least ${MIN} characters. A few words with spaces works well.`); return; }
    if (length > MAX) { setError(`Use at most ${MAX} characters.`); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/password-resets/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 410) { setInfo(null); setLoadError(data.error || 'This reset link can no longer be used.'); return; }
        setError(data.error || data.message || 'Could not change the password. Please try again.');
        return;
      }
      router.replace(data.redirectUrl || '/dashboard');
    } catch {
      setError('No connection. Check your internet and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-form-pane" style={{ background: 'var(--surface-1)' }}>
      <Link href="/" className="auth-wordmark" aria-label="LogisticsEdge home">
        <BrandMark size={28} />
        <span>LogisticsEdge</span>
      </Link>

      <div className="auth-form-wrap">
        <h1 className="auth-title">New password</h1>
        <p className="auth-lede">
          {info
            ? <>For your <strong>{info.companyName}</strong> workspace.</>
            : loadError ? 'Reset links work once and expire after 24 hours.' : 'Choose a new password for your account.'}
        </p>

        {!info && !loadError && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <DotSpinner size={20} />
          </div>
        )}

        {loadError && (
          <div className="auth-form">
            <div role="alert" className="auth-error">{loadError}</div>
            <Link href="/login" className="btn btn-secondary auth-submit" style={{ justifyContent: 'center' }}>Go to sign in</Link>
          </div>
        )}

        {info && (
          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {/* The account's email, so password managers save the new password against it */}
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Account</label>
              <input id="reset-email" className="form-input auth-input" type="email" autoComplete="username"
                value={info.email} readOnly />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-password">New password</label>
              <div className="input-group auth-input">
                <input
                  id="reset-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoFocus
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-describedby="reset-password-hint"
                  aria-invalid={!!error}
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  aria-pressed={showPass}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div id="reset-password-hint" style={{ fontSize: 12, color: length > MAX ? 'var(--status-error)' : 'var(--text-low)' }}>
                {MIN} to {MAX} characters. Spaces and any symbols are fine, and so is pasting from a password manager.
              </div>
            </div>

            {error && <div role="alert" className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? <><DotSpinner size={16} color="#ffffff" /> Saving…</> : 'Save password and sign in'}
            </button>

            <div style={{ fontSize: 12, color: 'var(--text-low)' }}>
              Saving signs you out on every other device. The link works once, until{' '}
              {new Date(info.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}.
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
