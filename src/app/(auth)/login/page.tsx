'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Truck, Eye, EyeOff, LogIn, ShieldCheck, KeyRound, X } from 'lucide-react';

const demoRoles = [
  {
    role: 'Operations Director',
    email: 'admin@precisionlogistics.com',
    name: 'Alex Morgan',
    facility: 'Central Distribution Hub',
    desc: 'Full command & control, billing approval, fleet assignment',
  },
  {
    role: 'Fleet Dispatcher',
    email: 'dispatch@precisionlogistics.com',
    name: 'Sam Rivera',
    facility: 'North Corridor Terminal',
    desc: 'Live trip dispatch, truck allocation, driver communication',
  },
  {
    role: 'Compliance Officer',
    email: 'compliance@precisionlogistics.com',
    name: 'Jordan Patel',
    facility: 'West Regional Terminal',
    desc: 'Driver licensing, safety checks, axle weight auditing',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useStore(s => s.login);
  const [selectedRole, setSelectedRole] = useState(demoRoles[0]);
  const [email, setEmail] = useState(demoRoles[0].email);
  const [password, setPassword] = useState('Logistics2026!');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSelectRole = (r: typeof demoRoles[0]) => {
    setSelectedRole(r);
    setEmail(r.email);
    setPassword('Logistics2026!');
    setError('');
  };

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

      login({
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        facility: data.user.facility,
      });

      router.push('/dashboard');
    } catch {
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
            LogiFlow Platform
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
          {/* Role picker */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Select Role
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--brand)', background: 'var(--brand-10)', padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>
                Demo Auto-Filled
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {demoRoles.map(r => {
                const isSelected = selectedRole.email === r.email;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    style={{
                      padding: '8px 6px', borderRadius: 8,
                      border: `1px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--brand-10)' : 'var(--surface-2)',
                      color: isSelected ? 'var(--brand)' : 'var(--text-mid)',
                      fontSize: 11, fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer', textAlign: 'center', lineHeight: 1.2,
                      transition: 'all 0.13s',
                    }}
                  >
                    {r.role}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@logiflow.io"
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
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: 40 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', display: 'flex' }}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-mid)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--brand)' }}
                />
                Keep me signed in
              </label>
              <span style={{ color: 'var(--text-low)', fontSize: 10.5 }}>SSL Encrypted</span>
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
              style={{ justifyContent: 'center', marginTop: 4, width: '100%' }}
            >
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  Sign In →
                </>
              )}
            </button>
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
          © 2026 LogiFlow Platform. All rights reserved.
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="modal-overlay" onClick={() => setForgotModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Reset Password</span>
              <button onClick={() => setForgotModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}>
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
      )}
    </div>
  );
}
