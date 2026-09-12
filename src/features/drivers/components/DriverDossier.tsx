'use client';
// ─── Drivers Feature — DriverDossier Component ────────────────────────────────
// The driver profile detail panel (right side).
// To change the driver profile UI → edit ONLY this file.

import { Star, Phone, MessageSquare, Plus, RotateCcw } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';
import { BadgeGroup } from '@/components/ui/BadgeGroup';
import type { Driver } from '../types';
import type { Vehicle } from '@/features/vehicles/types';

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
        <Avatar
          name={driver.name}
          size="lg"
          status={driver.status === 'Available' ? 'online' : driver.status === 'On Trip' ? 'busy' : 'offline'}
        />
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-high)' }}>{driver.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill={i < Math.floor(driver.rating) ? '#D97706' : 'none'} color={i < Math.floor(driver.rating) ? '#D97706' : 'var(--border-mid)'} />
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-low)', marginLeft: 4 }}>{driver.rating} Rating</span>
          </div>
        </div>
        <BadgeWithDot
          color={driver.status === 'Available' ? 'success' : driver.status === 'On Trip' ? 'brand' : 'gray'}
          pulse={driver.status === 'On Trip'}
          size="md"
          style={{ marginLeft: 'auto' }}
        >
          {driver.status}
        </BadgeWithDot>
      </div>

      {/* Document verification badge */}
      <div style={{ marginBottom: 16 }}>
        <BadgeGroup
          addonText={driver.documentVerified ? 'VERIFIED' : 'PENDING'}
          color={driver.documentVerified ? 'success' : 'warning'}
          size="md"
        >
          {driver.documentVerified ? 'RTO commercial credentials active & compliant' : 'Commercial license renewal documentation required'}
        </BadgeGroup>
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
          onFileSelect={() => {/* TODO: wire to /api/drivers/[id]/documents upload endpoint */}}
        />
      </div>

      {/* Vehicle assignment */}
      <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Current Vehicle Assignment</div>
        {assignedVehicle ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-high)' }}>{assignedVehicle.vehicleNo}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>{assignedVehicle.type} · {(assignedVehicle.capacity ?? 0).toLocaleString()} kg</div>
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
