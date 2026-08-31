'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Truck, Eye, EyeOff, LogIn, ShieldCheck, KeyRound, X } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const login = useStore(s => s.login);
  const [email, setEmail] = useState('admin@precisionlogistics.com');
  const [password, setPassword] = useState('demo1234');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    if (email && password) {
      login();
      router.push('/dashboard');
    } else {
      setError('Please enter valid credentials');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 450, height: 450, background: 'radial-gradient(circle, rgba(42,92,154,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(45,138,78,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 430, padding: 24, zIndex: 1 }}>
        {/* Brand Header (Stitch Screen 2) */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #2a5c9a, #1a2b3c)',
            border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: 18,
            marginBottom: 16,
            boxShadow: '0 0 35px rgba(42,92,154,0.5)'
          }}>
            <Truck size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 4 }}>
            Precision Logistics System
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            Enterprise Fleet Intelligence MVP
          </p>
        </div>

        {/* Login Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 30, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Sign in to access your fleet dashboard</h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>Unified control center for dispatches, telematics & billing</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@precisionlogistics.com"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <button
                  type="button"
                  onClick={() => { setForgotModal(true); setResetSent(false); }}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 11.5, cursor: 'pointer' }}
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

            {error && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', color: '#f87171', fontSize: 12.5 }}>
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
                  <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  SIGN IN →
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Mode Badge */}
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(45,138,78,0.1)', border: '1px solid rgba(45,138,78,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={16} color="#34d399" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            <strong style={{ color: '#34d399' }}>Demo Environment</strong> • Pre-configured credentials active.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11.5, color: 'var(--text-muted)' }}>
          © 2026 Precision Logistics System. All rights reserved.
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="modal-overlay" onClick={() => setForgotModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Reset Password</span>
              <button onClick={() => setForgotModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: 14 }}>
                <KeyRound size={36} color="#34d399" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Password Reset Link Sent</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Check your dispatch admin mailbox for the temporary verification token.</p>
                <button className="btn btn-primary w-full" style={{ marginTop: 14 }} onClick={() => setForgotModal(false)}>Done</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Enter your registered email to receive an instant access token.</p>
                <input className="form-input" defaultValue="admin@precisionlogistics.com" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setForgotModal(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 1.5 }} onClick={() => setResetSent(true)}>Send Reset Token</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
