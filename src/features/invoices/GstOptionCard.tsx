'use client';
// ─── GST option (Annexure V) per financial year ──────────────────────────────
// Shows which GST option new invoices use, and lets a Director or Finance Manager record the
// GTA's declaration for this or next financial year. Invoices already raised keep their GST.

import { useState } from 'react';
import { toast } from 'sonner';
import { useGstOptions } from './hooks';
import { followingFinancialYear } from './gst';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { can } from '@/lib/permissions';

export function GstOptionCard() {
  const { info, saveOption } = useGstOptions();
  const { user } = useCurrentUser();
  const [year, setYear] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ scheme: string; gstin: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!info) return null;

  const fy = year ?? info.currentFinancialYear;
  const saved = info.options.find(o => o.financialYear === fy);
  const lastGstin = info.options.find(o => o.supplierGstin)?.supplierGstin ?? '';
  const scheme = draft?.scheme ?? saved?.scheme ?? info.defaultScheme;
  const gstin = draft?.gstin ?? saved?.supplierGstin ?? lastGstin;
  const years = [...new Set([followingFinancialYear(info.currentFinancialYear), info.currentFinancialYear, ...info.options.map(o => o.financialYear)])]
    .sort().reverse();
  const current = info.options.find(o => o.financialYear === info.currentFinancialYear);
  const currentLabel = info.schemes.find(s => s.id === (current?.scheme ?? info.defaultScheme))?.label;
  const editable = can(user.role, 'invoice.update');

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveOption(fy, scheme, gstin);
    setSaving(false);
    if (ok) {
      setDraft(null);
      toast.success('GST option saved', { description: `Invoices raised in FY ${fy} from now on use it.` });
    }
  };

  return (
    <div className="card" style={{ marginBottom: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-high)' }}>GST option (Annexure V)</div>
        <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>
          FY {info.currentFinancialYear}: <strong style={{ color: 'var(--text-high)' }}>{currentLabel}</strong>
          {current ? '' : ' (default: no option recorded)'}
        </div>
      </div>

      {editable && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 10 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="gst-fy">Financial year</label>
            <select id="gst-fy" className="form-select" value={fy} onChange={e => { setYear(e.target.value); setDraft(null); }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 220px' }}>
            <label className="form-label" htmlFor="gst-scheme">Option</label>
            <select id="gst-scheme" className="form-select" value={scheme} onChange={e => setDraft({ scheme: e.target.value, gstin })}>
              {info.schemes.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
            <label className="form-label" htmlFor="gst-gstin">Your GSTIN</label>
            <input id="gst-gstin" className="form-input" value={gstin} maxLength={15} placeholder="09AAAAA0000A1Z5"
              onChange={e => setDraft({ scheme, gstin: e.target.value.toUpperCase() })} />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || (!draft && !!saved)}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
      <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 8 }}>
        New invoices use the option for the year they are raised in. Invoices already raised keep their GST.
        Rates follow the 22 Sep 2025 change; confirm them with your CA.
      </div>
    </div>
  );
}
