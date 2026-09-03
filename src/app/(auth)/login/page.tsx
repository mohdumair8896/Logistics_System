'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Truck, Eye, EyeOff, LogIn, ShieldCheck, KeyRound, X, Check, Lock } from 'lucide-react';

const enterpriseRoles = [
  {
    role: 'Operations Director',
    email: 'admin@precisionlogistics.com',
    name: 'Rajesh Varma',
    facility: 'Lucknow Central Hub',
    desc: 'Full command & control, billing approval, fleet assignment'
  },
  {
    role: 'Fleet Dispatcher',
    email: 'dispatch@precisionlogistics.com',
    name: 'Ananya Singh',
    facility: 'Delhi NCR Corridor Terminal',
    desc: 'Live trip dispatch, truck allocation, driver communication'
  },
  {
    role: 'Compliance Officer',
    email: 'compliance@precisionlogistics.com',
    name: 'Vikram Rathore',
    facility: 'Kanpur Regional Terminal',
    desc: 'Driver licensing, safety checks, axle weight auditing'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const login = useStore(s => s.login);
  const [selectedRole, setSelectedRole] = useState(enterpriseRoles[0]);
  const [email, setEmail] = useState(enterpriseRoles[0].email);
  const [password, setPassword] = useState('Logistics2026!');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSelectRole = (r: typeof enterpriseRoles[0]) => {
    setSelectedRole(r);
    setEmail(r.email);
    setPassword('Logistics2026!');
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid business email address.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    await new Promise(r => setTimeout(r, 500));

    login({
      email,
      name: selectedRole.email === email ? selectedRole.name : email.split('@')[0],
      role: selectedRole.email === email ? selectedRole.role : 'Operations Director',
      facility: selectedRole.facility
    });

    router.push('/dashboard');
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient background orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 450, height: 450, background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, padding: 20, zIndex: 1 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 58,
            height: 58,
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: 16,
            marginBottom: 14,
            boxShadow: '0 0 30px rgba(245,158,11,0.4)'
          }}>
            <Truck size={28} color="#1C1917" />
          </div>
          <h1 style={{ fontSize: 23, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 4 }}>
            Precision Logistics System
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Enterprise Fleet Intelligence Platform
          </p>
        </div>

        {/* Login Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '26px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {/* Quick Role Switcher */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
              Select Operational Role
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {enterpriseRoles.map(r => {
                const isSelected = selectedRole.email === r.email;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                      color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      transition: 'all 0.15s'
                    }}
                  >
                    {r.role}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>Corporate Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@precisionlogistics.com"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ fontSize: 12 }}>Security Password</label>
                <button
                  type="button"
                  onClick={() => { setForgotModal(true); setResetSent(false); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11.5, cursor: 'pointer' }}
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
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Remember terminal session
              </label>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>SSL Encrypted</span>
            </div>

            {error && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', color: '#f87171', fontSize: 12 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? (
                <>
                  <div style={{ width: 15, height: 15, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%' }} className="animate-spin" />
                  Authenticating Session...
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  SIGN IN TO LMS PLATFORM →
                </>
              )}
            </button>
          </form>
        </div>

        {/* Enterprise Compliance Notice */}
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Enterprise Access Protocol</strong>: SOC-2 Type II Certified • 256-bit TLS Gateway. All terminal sessions monitored for safety compliance.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-muted)' }}>
          © 2026 Precision Logistics System. All operational rights reserved.
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="modal-overlay" onClick={() => setForgotModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Security Token Dispatch</span>
              <button onClick={() => setForgotModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: 14 }}>
                <KeyRound size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Verification Token Dispatched</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Check your corporate mailbox for the one-time authentication passkey.</p>
                <button className="btn btn-primary w-full" style={{ marginTop: 14 }} onClick={() => setForgotModal(false)}>Return to Sign In</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Enter your registered organizational email address to receive a secure recovery credential.</p>
                <input className="form-input" defaultValue={email} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setForgotModal(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 1.5 }} onClick={() => setResetSent(true)}>Dispatch Token</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
