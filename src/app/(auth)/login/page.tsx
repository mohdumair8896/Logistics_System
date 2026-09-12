'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, Eye, EyeOff, LogIn, ShieldCheck, KeyRound, X } from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { DotSpinner } from '@/components/ui/DotSpinner';
import { Toggle } from '@/components/ui/Toggle';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid business email address.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
        credentials: 'same-origin',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid credentials. Please try again.');
        setLoading(false);
        return;
      }


      router.push('/dashboard');
    } catch (err) {
      console.error('[Login] Authentication request error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle background decoration */}
      <div style={{
        position: 'absolute', top: '8%', right: '10%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(0,87,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '8%', left: '10%', width: 380, height: 380,
        background: 'radial-gradient(circle, rgba(0,87,255,0.04) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 460, padding: 20, zIndex: 1 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, background: 'var(--brand)',
            borderRadius: 14, marginBottom: 14,
            boxShadow: '0 4px 20px var(--brand-glow)',
          }}>
            <Truck size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-high)', letterSpacing: '-0.3px', marginBottom: 4, fontFamily: 'var(--font-heading)' }}>
            LogisticsEdge Platform
          </h1>
          <p style={{ fontSize: 11.5, color: 'var(--text-low)', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase' }}>
            Fleet Intelligence System
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '24px 26px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <button
                  type="button"
                  onClick={() => { setForgotModal(true); setResetSent(false); }}
                  style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-group" style={{ height: 42 }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', display: 'flex', padding: 4 }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '2px 0' }}>
              <Toggle
                size="sm"
                checked={rememberMe}
                onChange={setRememberMe}
                label="Keep me signed in"
                hint="Save workstation session credentials"
              />
              <span style={{ color: 'var(--text-low)', fontSize: 10.5, marginTop: 2 }}>SSL Encrypted</span>
            </div>

            {error && (
              <div style={{
                background: 'var(--status-error-bg)', border: '1px solid rgba(192,57,43,0.2)',
                borderRadius: 8, padding: '8px 12px', color: 'var(--status-error)', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: 4, width: '100%', gap: 10 }}
            >
              {loading ? (
                <>
                  <DotSpinner size={16} color="#ffffff" />
                  Authenticating…
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  Sign In →
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--text-mid)' }}>
              New company?{' '}
              <Link href="/pricing" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
                Choose a Plan &amp; Activate Workspace →
              </Link>
            </div>
          </form>
        </div>

        {/* Security notice */}
        <div style={{
          marginTop: 14, padding: '9px 13px',
          background: 'var(--brand-10)', border: '1px solid var(--brand-20)',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <ShieldCheck size={15} color="var(--brand)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 10.5, color: 'var(--text-mid)', lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--text-high)' }}>Enterprise Security</strong>: SOC-2 Type II Certified • 256-bit TLS. All sessions monitored.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 10.5, color: 'var(--text-low)' }}>
          © 2026 LogisticsEdge Platform. All rights reserved.
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setForgotModal(false)}>
            <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
              <div className="modal-title">
                <span>Reset Password</span>
                <button type="button" onClick={() => setForgotModal(false)} className="modal-close-btn" aria-label="Close modal">
                  <X size={17} />
                </button>
              </div>
              {resetSent ? (
                <div style={{ textAlign: 'center', padding: 12 }}>
                  <KeyRound size={32} color="var(--brand)" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 700, color: 'var(--text-high)' }}>Email Sent</div>
                  <p style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 4 }}>Check your inbox for the password reset link.</p>
                  <button className="btn btn-primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={() => setForgotModal(false)}>
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>Enter your registered email to receive a reset link.</p>
                  <input className="form-input" defaultValue={email} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setForgotModal(false)}>Cancel</button>
                    <button className="btn btn-primary" style={{ flex: 1.5, justifyContent: 'center' }} onClick={() => setResetSent(true)}>Send Link</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
