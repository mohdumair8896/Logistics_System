'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useDrivers } from '@/features/drivers/hooks';
import { useVehicles } from '@/features/vehicles/hooks';
import { X, Send, Phone, CheckCheck, Truck } from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { DotSpinner } from '@/components/ui/DotSpinner';

// ─── Real DB-backed driver chat ────────────────────────────────────────────────
// Messages are stored in Neon PostgreSQL driver_messages table.
// Phase 4: WhatsApp delivery will be added via Meta Cloud API webhook.
// ❌ REMOVED: simulateDriverReply() — fake auto-reply simulation

interface Message {
  id?: string;
  sender: 'driver' | 'dispatcher';
  text: string;
  time: string;
}

interface Props {
  driverId: string;
  onClose: () => void;
}

export default function DriverChatModal({ driverId, onClose }: Props) {
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const driver = drivers.find(d => d.id === driverId);
  const vehicle = driver ? vehicles.find(v => v.id === driver.vehicleId) : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load message history from DB
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${driverId}`);
      if (res.ok) {
        const data: Message[] = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('[DriverChat] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchMessages();
    // Poll for new driver replies every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic UI update
    const optimistic: Message = { sender: 'dispatcher', text, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, optimistic]);

    try {
      await fetch(`/api/messages/${driverId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sender: 'dispatcher' }),
      });
      // Phase 4: WhatsApp message will be sent from the API route automatically
    } catch (err) {
      console.error('[DriverChat] send error', err);
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (qr: string) => {
    setInput(qr);
  };

  const quickReplies = [
    'What is your current GPS location?',
    'Please confirm arrival at delivery point.',
    'Speed limit advisory: NH-19 corridor.',
    'Warehouse Bay 4 is ready for loading.',
  ];

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: 'var(--surface-2)', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #0057FF, #0040CC)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, boxShadow: '0 2px 8px rgba(0,87,255,0.2)' }}>
              {driver?.name.split(' ').map(n => n[0]).join('') || 'D'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-high)' }}>{driver?.name || 'Driver'}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-low)', display: 'flex', alignItems: 'center', gap: 6 }}>
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
              <Phone size={14} color="var(--icon)" />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="modal-close-btn"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message history */}
        <div style={{ height: 320, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--text-low)', fontSize: 12 }}>
              <DotSpinner size={24} color="var(--brand)" />
              <span>Syncing driver messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-low)', fontSize: 13 }}>
              No previous messages with {driver?.name}. Send a dispatch notice below.
            </div>
          ) : (
            messages.map((msg, i) => {
              const isDispatcher = msg.sender === 'dispatcher';
              return (
                <div key={msg.id ?? i} style={{ display: 'flex', flexDirection: 'column', alignItems: isDispatcher ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    borderBottomRightRadius: isDispatcher ? 2 : 12,
                    borderBottomLeftRadius: isDispatcher ? 12 : 2,
                    background: isDispatcher ? 'linear-gradient(135deg, #0057FF, #0040CC)' : 'var(--surface-1)',
                    color: isDispatcher ? 'white' : 'var(--text-high)',
                    border: isDispatcher ? 'none' : '1px solid var(--border)',
                    boxShadow: isDispatcher ? '0 2px 8px rgba(0,87,255,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                    fontSize: 13,
                    lineHeight: 1.4
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {msg.time}
                    {isDispatcher && <CheckCheck size={12} color="var(--brand)" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        <div style={{ padding: '8px 16px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickReply(qr)}
              style={{
                fontSize: 11,
                padding: '4px 10px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                color: 'var(--text-mid)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ padding: '10px 16px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)' }}>
          <div className="input-group" style={{ height: 40, borderRadius: 20, padding: '0 6px 0 14px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Message ${driver?.name || 'Driver'}...`}
              style={{ fontSize: 13 }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 16, padding: '6px 14px', height: 30 }} disabled={!input.trim() || sending}>
              <Send size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
