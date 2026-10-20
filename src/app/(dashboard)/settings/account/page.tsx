'use client';
// ─── Account — change your own password while signed in ───────────────────────
// Same rules as /reset/[token] (NIST SP 800-63B: 10–128 characters, paste allowed, no composition
// rules); the server re-checks them and signs out every other session of the account.

import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/useCurrentUser';

// Mirrors PASSWORD_MIN_LENGTH / PASSWORD_MAX_LENGTH in src/lib/passwords.ts (server-only module)
const MIN = 10;
const MAX = 128;

function PasswordField({ id, label, value, onChange, autoComplete, hint }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  hint?: React.ReactNode;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="input-group">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          className="auth-eye"
          onClick={() => setShown(v => !v)}
          aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={shown}
        >
          {shown ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <div id={`${id}-hint`} style={{ fontSize: 12, color: 'var(--text-low)' }}>{hint}</div>}
    </div>
  );
}

export default function AccountPage() {
  const { user } = useCurrentUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const length = [...newPassword].length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!currentPassword) { setError('Enter your current password.'); return; }
    if (length < MIN) { setError(`Use at least ${MIN} characters for the new password. A few words with spaces works well.`); return; }
    if (length > MAX) { setError(`Use at most ${MAX} characters for the new password.`); return; }
    if (newPassword === currentPassword) { setError('The new password is the same as your current one.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || data.message || 'Could not change the password. Please try again.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      const others = Number(data.otherSessionsEnded) || 0;
      toast.success('Password changed', {
        description: others > 0
          ? `Signed out of ${others} other session${others === 1 ? '' : 's'}. You stay signed in here.`
          : 'You stay signed in here. Any other sessions were signed out.',
      });
    } catch {
      setError('No connection. Check your internet and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title">Account</div>
          <div className="page-subtitle">Your sign-in details</div>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit} noValidate
        style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KeyRound size={16} color="var(--brand)" />
          <span style={{ fontWeight: 700 }}>Change password</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-mid)', overflowWrap: 'anywhere' }}>
          {user.email ? <>Signed in as <strong>{user.email}</strong>. </> : null}
          Changing it signs you out on every other device, in every workspace.
        </div>

        {/* The account's email, so password managers save the new password against it */}
        <input type="email" autoComplete="username" value={user.email} readOnly hidden />

        <PasswordField id="current-password" label="Current password" autoComplete="current-password"
          value={currentPassword} onChange={setCurrentPassword} />
        <PasswordField id="new-password" label="New password" autoComplete="new-password"
          value={newPassword} onChange={setNewPassword}
          hint={<span style={{ color: length > MAX ? 'var(--status-error)' : undefined }}>
            {MIN} to {MAX} characters. Spaces and any symbols are fine, and so is pasting from a password manager.
          </span>} />

        {error && <div role="alert" className="auth-error">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
