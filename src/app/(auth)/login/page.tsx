'use client';
// ─── Sign in ──────────────────────────────────────────────────────────────────
// Two panes on desktop (form + highway panel), one column on phones. Every control on this page
// does what it says: there is no "remember me" (sessions are fixed at 8 h) and no fake reset email.
// Patterns: docs/DESIGN_SYSTEM.md §5.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Eye, EyeOff, FileCheck2, Route } from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandMark';
import { DotSpinner } from '@/components/ui/DotSpinner';

/** Only same-site paths are allowed as a post-login destination. */
function safeReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/login')) return '/dashboard';
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [returning, setReturning] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Arrived here from a protected page (signed out or session ended)
  useEffect(() => {
    setReturning(new URLSearchParams(window.location.search).has('from'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@')) {
      setError('Enter the email address you use for work.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(res.status === 401
          ? 'That email and password don’t match. Check both and try again.'
          : data.message || 'Sign-in failed. Please try again.');
        setLoading(false);
        return;
      }
      router.replace(safeReturnPath(new URLSearchParams(window.location.search).get('from')));
    } catch {
      setError('No connection. Check your internet and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* ── Form pane ── */}
      <main className="auth-form-pane">
        <Link href="/" className="auth-wordmark" aria-label="LogisticsEdge home">
          <BrandMark size={28} />
          <span>LogisticsEdge</span>
        </Link>

        <div className="auth-form-wrap">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-lede">
            {returning ? 'Sign in to continue where you left off.' : 'Welcome back. Sign in to your company workspace.'}
          </p>

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Work email</label>
              <input
                id="login-email"
                className="form-input auth-input"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-invalid={!!error && !email.includes('@')}
              />
            </div>

            <div className="form-group">
              <div className="auth-label-row">
                <label className="form-label" htmlFor="login-password">Password</label>
                <button type="button" className="auth-link-btn" onClick={() => setHelpOpen(v => !v)} aria-expanded={helpOpen} aria-controls="login-help">
                  Forgot password?
                </button>
              </div>
              <div className="input-group auth-input">
                <input
                  id="login-password"
                  ref={passwordRef}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyUp={e => setCapsLock(e.getModifierState('CapsLock'))}
                  onBlur={() => setCapsLock(false)}
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
              {capsLock && <div className="auth-hint">Caps Lock is on</div>}
            </div>

            {helpOpen && (
              <div id="login-help" className="auth-help">
                Ask your Operations Director for a reset link. They create it under Team &amp; Roles; it works once, for 24 hours,
                and lets you choose a new password. If you are your workspace’s only Director, write to{' '}
                <a href="mailto:support@logisticsedge.io">support@logisticsedge.io</a> from your work email.
              </div>
            )}

            {error && <div role="alert" className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <><DotSpinner size={16} color="#ffffff" /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className="auth-alt">
            New to LogisticsEdge? <Link href="/pricing">See plans and start a workspace</Link>
          </p>
        </div>

        <footer className="auth-footer">
          <span>© 2026 LogisticsEdge</span>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </footer>
      </main>

      {/* ── Highway pane: a golden-hour still from the home page's closing film ── */}
      <aside className="auth-road-pane" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- one sized WebP still, desktop only */}
        <img className="auth-road-photo" src="/media/login-highway.webp" alt="" width={960} height={720} decoding="async" />

        <div className="auth-road-copy">
          <div className="auth-road-title">Every load, from booking to bill.</div>
          <ul className="auth-road-list">
            <li><ClipboardList size={16} /> Book orders and price lanes in rupees</li>
            <li><Route size={16} /> Dispatch trucks and follow every trip live</li>
            <li><FileCheck2 size={16} /> Capture proof of delivery and send GST invoices</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
