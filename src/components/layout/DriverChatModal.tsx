'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { X, Send, Phone, CheckCheck, Truck, User } from 'lucide-react';

interface Props {
  driverId: string;
  onClose: () => void;
}

export default function DriverChatModal({ driverId, onClose }: Props) {
  const { drivers, vehicles, messages, sendDriverMessage } = useStore();
  const [input, setInput] = useState('');
  const driver = drivers.find(d => d.id === driverId);
  const vehicle = driver ? vehicles.find(v => v.id === driver.vehicleId) : null;
  const conversation = messages[driverId] || [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendDriverMessage(driverId, input.trim());
    setInput('');
  };

  const quickReplies = [
    'What is your current GPS location?',
    'Please confirm arrival at delivery point.',
    'Speed limit advisory: NH-19 corridor.',
    'Warehouse Bay 4 is ready for loading.'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #2a5c9a, #3b82f6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
              {driver?.name.split(' ').map(n => n[0]).join('') || 'D'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{driver?.name || 'Driver'}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={`status-dot ${driver?.status === 'Available' ? 'dot-green' : 'dot-blue'}`} />
                <span>{driver?.status}</span>
                {vehicle && (
                  <>
                    <span>•</span>
                    <Truck size={12} />
                    <span className="mono">{vehicle.vehicleNo}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href={`tel:${driver?.phone}`} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} title="Call Driver">
              <Phone size={14} color="#34d399" />
            </a>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message history */}
        <div style={{ height: 320, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-primary)' }}>
          {conversation.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>
              No previous messages with {driver?.name}. Send a dispatch notice below.
            </div>
          ) : (
            conversation.map((msg, i) => {
              const isDispatcher = msg.sender === 'dispatcher';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isDispatcher ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    borderBottomRightRadius: isDispatcher ? 2 : 12,
                    borderBottomLeftRadius: isDispatcher ? 12 : 2,
                    background: isDispatcher ? 'linear-gradient(135deg, #2a5c9a, #1d4ed8)' : 'var(--bg-card)',
                    color: isDispatcher ? 'white' : 'var(--text-primary)',
                    border: isDispatcher ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border)',
                    fontSize: 13,
                    lineHeight: 1.4
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {msg.time}
                    {isDispatcher && <CheckCheck size={12} color="#60a5fa" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick replies */}
        <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { sendDriverMessage(driverId, qr); }}
              style={{
                fontSize: 11,
                padding: '4px 10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message ${driver?.name || 'Driver'}...`}
            style={{ borderRadius: 20 }}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 20, padding: '8px 16px' }} disabled={!input.trim()}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
