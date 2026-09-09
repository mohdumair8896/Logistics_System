'use client';
import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { X, Send, Phone, CheckCheck, Truck } from 'lucide-react';

interface Props {
  driverId: string;
  onClose: () => void;
}

export default function DriverChatModal({ driverId, onClose }: Props) {
  const { drivers, vehicles, messages, sendDriverMessage, receiveDriverReply } = useStore();
  const [input, setInput] = useState('');
  const [driverTyping, setDriverTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const driver = drivers.find(d => d.id === driverId);
  const vehicle = driver ? vehicles.find(v => v.id === driver.vehicleId) : null;
  const conversation = messages[driverId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.length, driverTyping]);

  const simulateDriverReply = (sentText: string) => {
    setDriverTyping(true);
    setTimeout(() => {
      setDriverTyping(false);
      const lower = sentText.toLowerCase();
      let reply = 'Message acknowledged Dispatch. Operating all systems within corridor parameters.';

      if (lower.includes('location') || lower.includes('gps') || lower.includes('where')) {
        reply = `Current GPS: Milestone 142 on NH-19 expressway corridor. Highway speed 62 km/h. Fuel at 82%.`;
      } else if (lower.includes('arrival') || lower.includes('reach') || lower.includes('delivery')) {
        reply = `Approaching receiver destination gate now. Standing by for e-POD and unloading verification.`;
      } else if (lower.includes('speed') || lower.includes('slow') || lower.includes('limit')) {
        reply = `Copy that Dispatch. Reducing speed to 55 km/h immediately. Road condition is slightly wet.`;
      } else if (lower.includes('bay') || lower.includes('load') || lower.includes('warehouse')) {
        reply = `Understood! Backing truck into designated staging bay right now.`;
      }

      receiveDriverReply(driverId, reply);
    }, 1400);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    sendDriverMessage(driverId, text);
    setInput('');
    simulateDriverReply(text);
  };

  const handleQuickReply = (qr: string) => {
    sendDriverMessage(driverId, qr);
    simulateDriverReply(qr);
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
        <div style={{ background: 'var(--surface-2)', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #2a5c9a, var(--brand))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
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
              onClick={onClose}
              aria-label="Close chat"
              style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, minWidth: 40, minHeight: 40, borderRadius: 8 }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message history */}
        <div style={{ height: 320, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface)' }}>
          {conversation.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-low)', fontSize: 13 }}>
              No previous messages with {driver?.name}. Send a dispatch notice below.
            </div>
          ) : (
            conversation.map((msg, i) => {
              const isDispatcher = msg.sender === 'dispatcher';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isDispatcher ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    borderBottomRightRadius: isDispatcher ? 2 : 12,
                    borderBottomLeftRadius: isDispatcher ? 12 : 2,
                    background: isDispatcher ? 'linear-gradient(135deg, #2a5c9a, #1d4ed8)' : 'var(--surface-1)',
                    color: isDispatcher ? 'white' : 'var(--text-high)',
                    border: isDispatcher ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border)',
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

          {/* Typing Indicator */}
          {driverTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--surface-1)', borderRadius: 10, width: 'fit-content', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{driver?.name || 'Driver'} is typing...</span>
              <div style={{ width: 10, height: 10, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
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
        <form onSubmit={handleSend} style={{ padding: '12px 16px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
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
