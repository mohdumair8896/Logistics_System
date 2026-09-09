'use client';
// ─── Drivers Feature — DriverDossier Component ────────────────────────────────
// The driver profile detail panel (right side).
// To change the driver profile UI → edit ONLY this file.

import { Star, ShieldCheck, ShieldAlert, Phone, MessageSquare, Plus, RotateCcw } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';
import type { Driver } from '../types';
import type { Vehicle } from '@/features/vehicles/types';

const STATUS_COLOR: Record<string, string> = {
  'Available': 'badge-green',
  'On Trip': 'badge-blue',
  'Off Duty': 'badge-gray'
};

interface Props {
  driver: Driver;
  assignedVehicle: Vehicle | null;
  onChat: () => void;
  onReassign: () => void;
}

export default function DriverDossier({ driver, assignedVehicle, onChat, onReassign }: Props) {
  return (
    <div className="card">
      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #2a5c9a, var(--brand))', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 800 }}>
          {driver.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-high)' }}>{driver.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill={i < Math.floor(driver.rating) ? 'var(--brand)' : 'none'} color={i < Math.floor(driver.rating) ? 'var(--brand)' : 'var(--border-mid)'} />
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-low)', marginLeft: 4 }}>{driver.rating} Rating</span>
          </div>
        </div>
        <span className={`badge ${STATUS_COLOR[driver.status] || 'badge-gray'}`} style={{ marginLeft: 'auto' }}>{driver.status}</span>
      </div>

      {/* Document verification badge */}
      <div style={{
        padding: '10px 14px',
        background: driver.documentVerified ? 'rgba(45,138,78,0.15)' : 'rgba(239,68,68,0.15)',
        border: `1px solid ${driver.documentVerified ? 'rgba(45,138,78,0.4)' : 'rgba(239,68,68,0.4)'}`,
        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {driver.documentVerified ? <ShieldCheck size={16} color="var(--brand)" /> : <ShieldAlert size={16} color="var(--brand-dark)" />}
          <span style={{ fontSize: 12.5, fontWeight: 700, color: driver.documentVerified ? 'var(--brand)' : 'var(--text-low)' }}>
            {driver.documentVerified ? 'DOCUMENT VERIFIED' : 'VERIFICATION PENDING'}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-low)' }}>RTO Verified</span>
      </div>

      {/* Credentials */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, marginBottom: 16 }}>
        {[
          ['Contact Phone', driver.phone, true],
          ['Commercial License No.', driver.licenseNo, true],
          ['License Expiry Date', driver.licenseExpiry, false],
          ['Completed Trips', `${driver.trips} trips`, false],
        ].map(([label, value, mono], i, arr) => (
          <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: i < arr.length - 1 ? 6 : 0 }}>
            <span style={{ color: 'var(--text-low)' }}>{label}</span>
            <span className={mono ? 'mono' : ''} style={{ fontWeight: 600, color: 'var(--text-high)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Document upload */}
      <div className="card" style={{ marginBottom: 16, padding: 14 }}>
        <FileUpload
          label="Update Commercial License or Medical Certificate"
          description="Upload scanned DL or fitness cert to update RTO verification"
          onFileSelect={(f) => console.log('Uploaded driver document:', f.name)}
        />
      </div>

      {/* Vehicle assignment */}
      <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Current Vehicle Assignment</div>
        {assignedVehicle ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-high)' }}>{assignedVehicle.vehicleNo}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>{assignedVehicle.type} · {assignedVehicle.capacity.toLocaleString()} kg</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onReassign}><RotateCcw size={12} /> Reassign Vehicle</button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-low)' }}>No vehicle currently assigned</span>
            <button className="btn btn-primary btn-sm" onClick={onReassign}><Plus size={12} /> Assign Vehicle</button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onChat}>
          <MessageSquare size={14} /> Send Message
        </button>
        <a href={`tel:${driver.phone}`} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>
          <Phone size={14} color="var(--icon)" /> Direct Call
        </a>
      </div>
    </div>
  );
}
