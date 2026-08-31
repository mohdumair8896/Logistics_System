'use client';
import { useState } from 'react';
import { Palette, Type, Sliders, Check, Moon, Sun, Layers, Sparkles } from 'lucide-react';

export default function DesignSystemPage() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [seedColor, setSeedColor] = useState('#2A5C9A');
  const [applied, setApplied] = useState(false);

  const colors = [
    { name: 'Primary Blue', hex: '#2A5C9A', role: 'Main Actions & Brand Identity', text: '#fff' },
    { name: 'Secondary Slate', hex: '#1A2B3C', role: 'Background Cards & Navigation', text: '#fff' },
    { name: 'Tertiary Emerald', hex: '#2D8A4E', role: 'Success, Verified & Complete', text: '#fff' },
    { name: 'Neutral Slate', hex: '#64748B', role: 'Borders, Metadata & Secondary Text', text: '#fff' },
    { name: 'Accent Amber', hex: '#F59E0B', role: 'Alerts, Warnings & Pending SLA', text: '#111' },
    { name: 'Signal Red', hex: '#EF4444', role: 'Errors, Maintenance & Delays', text: '#fff' },
  ];

  const handleApply = () => {
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title">Precision Logistics Design System</div>
          <div className="page-subtitle">Standardized visual design tokens, components & theme presets (Stitch Screen 1)</div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Left Column: Color Palette Tokens & Typography */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Colors Card */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Palette size={16} color="#38bdf8" /> Core Color Palette Tokens
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {colors.map(c => (
                <div key={c.name} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: c.hex, boxShadow: `0 0 12px ${c.hex}40`, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: '#60a5fa', marginTop: 1 }}>{c.hex}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{c.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography Tokens */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Type size={16} color="#38bdf8" /> Typography Hierarchy (Inter & JetBrains Mono)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Headline 1 — 24px / 800 ExtraBold</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Precision Fleet Control</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Body Text — 13.5px / 500 Medium</div>
                <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Automated corridor routing, capacity optimization and live telematics tracking.</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Code & Numbers — JetBrains Mono</div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: '#60a5fa' }}>ORD-1001 • UP32 AB 1234 • 7,500 KG</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Theme Editor & UI Components */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Live Theme Editor (Stitch Screen 1) */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(42,92,154,0.15), var(--bg-card))', border: '1px solid rgba(59,130,246,0.3)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={16} color="#38bdf8" /> Live Theme & Brand Customizer
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Theme Mode</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className={`btn ${themeMode === 'dark' ? 'btn-primary' : 'btn-secondary'} w-full`}
                    style={{ justifyContent: 'center' }}
                    onClick={() => setThemeMode('dark')}
                  >
                    <Moon size={14} /> Dark Mode (Active)
                  </button>
                  <button
                    className={`btn ${themeMode === 'light' ? 'btn-primary' : 'btn-secondary'} w-full`}
                    style={{ justifyContent: 'center' }}
                    onClick={() => setThemeMode('light')}
                  >
                    <Sun size={14} /> Light Mode
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Seed Brand Color Hex</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={seedColor}
                    onChange={e => setSeedColor(e.target.value)}
                    style={{ width: 44, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }}
                  />
                  <input
                    className="form-input mono"
                    value={seedColor}
                    onChange={e => setSeedColor(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn btn-success w-full btn-lg" style={{ justifyContent: 'center', marginTop: 6 }} onClick={handleApply}>
                {applied ? <><Check size={16} /> Theme Settings Applied</> : <><Sparkles size={16} /> Save & Apply Theme Tokens</>}
              </button>
            </div>
          </div>

          {/* Component Showcase */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} color="#38bdf8" /> UI Element Tokens
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Button Variants</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm">Primary</button>
                  <button className="btn btn-secondary btn-sm">Secondary</button>
                  <button className="btn btn-success btn-sm">Success</button>
                  <button className="btn btn-warning btn-sm">Warning</button>
                  <button className="btn btn-ghost btn-sm">Ghost</button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Status Badges</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-green">Available</span>
                  <span className="badge badge-blue">In Transit</span>
                  <span className="badge badge-yellow">Pending</span>
                  <span className="badge badge-red">Maintenance</span>
                  <span className="badge badge-cyan">Live GPS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
