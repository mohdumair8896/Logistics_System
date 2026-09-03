'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import {
  Send, Bot, Truck, CheckCircle2, ChevronRight,
  RefreshCw, AlertTriangle, Radio, Phone, Sparkles
} from 'lucide-react';

interface MessageCard {
  type: 'tracking' | 'quote' | 'emergency' | 'booking_confirm';
  data: any;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  card?: MessageCard;
}

export default function WidgetFramePage() {
  const { orders, trips, vehicles, addShipperLead, knowledgeBase } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'bot',
      text: 'Hello! I am LogiFlow, your 24/7 Autonomous Logistics Dispatcher. How can I assist with your freight operations today?',
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'LF_READY' }, '*');
    }
  }, []);

  useEffect(() => {
    // Smooth auto-scroll internal chat container only — never trigger parent window scrolling
    const scrollBottom = () => {
      if (chatScrollRef.current) {
        const el = chatScrollRef.current;
        el.scrollTo({
          top: el.scrollHeight + 100,
          behavior: 'smooth'
        });
      }
    };
    scrollBottom();
    const t1 = setTimeout(scrollBottom, 60);
    const t2 = setTimeout(scrollBottom, 220);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages, isTyping]);

  const handleSend = async (userText?: string) => {
    const query = (userText || input).trim();
    if (!query) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: `msg-${Date.now()}`, sender: 'user', text: query, time };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      processInboundQuery(query, time);
      setIsTyping(false);
    }, 600);
  };

  const processInboundQuery = (query: string, time: string) => {
    const q = query.toLowerCase();

    // 1. Track & Trace Intent
    if (q.includes('track') || q.includes('where') || q.includes('ord-') || q.includes('trp-')) {
      const matchOrder = orders.find(o => q.includes(o.id.toLowerCase())) || orders[0];
      const matchTrip = trips.find(t => t.orderId === matchOrder.id) || trips[0];
      const matchVeh = vehicles.find(v => v.id === matchTrip?.vehicleId) || vehicles[0];

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Here is the real-time telematics dispatch for shipment ${matchOrder.id}:`,
          time,
          card: {
            type: 'tracking',
            data: {
              orderId: matchOrder.id,
              origin: matchOrder.origin,
              destination: matchOrder.destination,
              status: matchTrip?.status || matchOrder.status,
              vehicleNo: matchVeh?.vehicleNo || 'UP32 CD 5678',
              speedKmH: matchTrip?.speedKmH || 68,
              progress: matchTrip?.progress || 58,
              eta: 'Today ~21:30'
            }
          }
        }
      ]);

      if (window.parent !== window) {
        window.parent.postMessage({ type: 'LF_TRACK_DISPATCH', orderId: matchOrder.id }, '*');
      }
      return;
    }

    // 2. Corridor Alarm / Emergency Protocol
    if (q.includes('emergency') || q.includes('accident') || q.includes('breakdown') || q.includes('alarm') || q.includes('temp') || q.includes('puncture')) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '🚨 URGENT CORRIDOR PROTOCOL ACTIVATED: Your safety alarm has been flagged directly to Operations Control.',
          time,
          card: {
            type: 'emergency',
            data: {
              hotline: '1800-PRE-LMS (Toll Free)',
              etaResponse: 'Rapid response unit deployed within 40 mins',
              protocol: 'Hazard lights ON • Triangles placed 50m behind'
            }
          }
        }
      ]);
      return;
    }

    // 3. Freight Spot Quotation Intent
    if (q.includes('quote') || q.includes('rate') || q.includes('cost') || q.includes('price') || q.includes('kg')) {
      const weight = 8000;
      const ratePerKg = 2.2;
      const baseFreight = weight * ratePerKg;
      const gst = baseFreight * 0.18;
      const total = baseFreight + gst;

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Here is an automated spot tariff estimate for an 8,000 kg standard freight haul (Lucknow ➔ Delhi Corridor):`,
          time,
          card: {
            type: 'quote',
            data: {
              weight: '8,000 kg',
              corridor: 'Lucknow Central Hub → Delhi NCR',
              baseRate: `₹${ratePerKg}/kg (₹${baseFreight.toLocaleString()})`,
              gst: `₹${gst.toLocaleString()} (18% IGST)`,
              total: `₹${total.toLocaleString()}`,
              validity: 'Spot Rate locked for 24 Hours'
            }
          }
        }
      ]);
      return;
    }

    // 4. Freight Booking Intent
    if (q.includes('book') || q.includes('order') || q.includes('schedule') || q.includes('shipment')) {
      const leadId = addShipperLead({
        shipperName: 'Inbound Shipper (Chat)',
        companyName: 'Corporate Consignee',
        phone: '+91 98765 43210',
        email: 'dispatch@corporate.in',
        originHub: 'Lucknow Central Hub',
        destinationHub: 'Delhi NCR Hub',
        cargoType: 'Standard Freight',
        estimatedWeightKg: 8000,
        freightQuote: 18880,
        targetDeliveryDate: '2026-09-06',
        isUrgent: false,
        transcriptSnippet: query
      });

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Consignment intake request logged successfully. Lead Reference: ${leadId}. Our fleet planner is assigning an optimal trailer.`,
          time,
          card: {
            type: 'booking_confirm',
            data: {
              leadId,
              corridor: 'Lucknow Central Hub → Delhi NCR',
              capacityBooked: '8,000 kg payload slot',
              nextStep: 'Loading bay manifest queued for staging'
            }
          }
        }
      ]);

      if (window.parent !== window) {
        window.parent.postMessage({ type: 'LF_LEAD_CONVERTED', leadId }, '*');
      }
      return;
    }

    // 5. Default Knowledge Base Retrieval
    const kbMatch = knowledgeBase.find(k => k.keywords.some(kw => q.includes(kw)));
    if (kbMatch) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `[${kbMatch.category}] ${kbMatch.title}: ${kbMatch.content}`,
          time
        }
      ]);
      return;
    }

    // General fallback
    setMessages(prev => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'I can assist you with live shipment tracking (e.g. "Track ORD-1001"), instant freight pricing ("Quote for 8000kg"), cargo bookings, or emergency roadside assistance. Select an option below or ask any question.',
        time
      }
    ]);
  };

  const handleBookNowFromQuote = () => {
    handleSend('I would like to book this spot quote for our shipment.');
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F8FAFC',
      color: '#0F172A',
      fontFamily: "'Inter', 'Geist', system-ui, -apple-system, sans-serif",
      overflow: 'hidden'
    }}>
      {/* Widget Header — DentaFlow Navy Style */}
      <div style={{
        padding: '12px 18px',
        background: '#0F172A',
        borderBottom: '1px solid #1E293B',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
            flexShrink: 0
          }}>
            <Truck size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 7, letterSpacing: '-0.01em' }}>
              <span>LogiFlow AI</span>
              <span style={{
                fontSize: 9.5,
                padding: '1px 7px',
                borderRadius: 9999,
                background: '#ECFDF5',
                color: '#047857',
                fontWeight: 700,
                border: '1px solid rgba(167,243,208,0.7)',
                letterSpacing: '0.2px'
              }}>
                24/7 COPILOT
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1.5 }}>
              Autonomous Dispatch & Tracking Assistant
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setMessages([messages[0]])}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94A3B8'; }}
            title="Reset conversation"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area — Clean Light Theme */}
      <div
        ref={chatScrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {messages.map(m => {
          const isBot = m.sender === 'bot';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: 9,
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                maxWidth: isBot ? '92%' : '82%'
              }}
            >
              {isBot && (
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: '#EEF2F8',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  <Bot size={15} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                <div style={{
                  padding: '11px 15px',
                  borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                  fontSize: 13,
                  lineHeight: 1.5,
                  background: isBot ? '#FFFFFF' : '#0F172A',
                  color: isBot ? '#0F172A' : '#FFFFFF',
                  border: isBot ? '1px solid #E2E8F0' : 'none',
                  fontWeight: isBot ? 450 : 500,
                  boxShadow: isBot
                    ? '0 1px 4px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.02)'
                    : '0 2px 8px rgba(15,23,42,0.18)'
                }}>
                  {m.text}
                </div>

                {/* Inline Rich Cards */}
                {m.card?.type === 'tracking' && (
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    padding: '13px 15px',
                    fontSize: 12,
                    boxShadow: '0 2px 10px rgba(15,23,42,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: '#0284C7', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Radio size={14} color="#0284C7" /> Live GPS: {m.card.data.orderId}
                      </span>
                      <span style={{ color: '#059669', fontWeight: 700, fontSize: 10.5, background: '#ECFDF5', padding: '2px 8px', borderRadius: 9999, border: '1px solid #A7F3D0' }}>
                        ● {m.card.data.status}
                      </span>
                    </div>
                    <div style={{ color: '#475569', marginBottom: 6, fontWeight: 500 }}>
                      {m.card.data.origin} ➔ {m.card.data.destination}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 11, marginBottom: 8 }}>
                      <span>Truck: <strong style={{ color: '#0F172A' }}>{m.card.data.vehicleNo}</strong></span>
                      <span>Speed: <strong style={{ color: '#0F172A' }}>{m.card.data.speedKmH} km/h</strong></span>
                    </div>
                    <div style={{ width: '100%', height: 5, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${m.card.data.progress}%`, height: '100%', background: '#0284C7', borderRadius: 3 }} />
                    </div>
                  </div>
                )}

                {m.card?.type === 'quote' && (
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    padding: '14px 16px',
                    fontSize: 12,
                    boxShadow: '0 2px 10px rgba(15,23,42,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Sparkles size={14} color="#059669" /> Instant Spot Tariff
                      </span>
                      <span style={{ color: '#059669', fontFamily: "'JetBrains Mono', monospace" }}>{m.card.data.weight}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 8 }}>{m.card.data.corridor}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 11.5, marginBottom: 4 }}>
                      <span>Freight Base:</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.card.data.baseRate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 11.5, marginBottom: 8 }}>
                      <span>GST (18% IGST):</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.card.data.gst}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#059669', borderTop: '1px solid #E2E8F0', paddingTop: 8, marginBottom: 10, fontSize: 13 }}>
                      <span>Net Total:</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.card.data.total}</span>
                    </div>
                    <button
                      onClick={handleBookNowFromQuote}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#0F172A',
                        border: 'none',
                        borderRadius: 8,
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 11.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#0F172A')}
                    >
                      Book This Capacity Slot <ChevronRight size={13} />
                    </button>
                  </div>
                )}

                {m.card?.type === 'emergency' && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 14,
                    padding: '13px 15px',
                    fontSize: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626', fontWeight: 700, marginBottom: 8 }}>
                      <AlertTriangle size={15} /> Direct Operations SOS Line
                    </div>
                    <a
                      href="tel:1800773567"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#DC2626',
                        color: '#FFFFFF',
                        padding: '8px 14px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: 12,
                        marginBottom: 8,
                        boxShadow: '0 2px 6px rgba(220,38,38,0.25)'
                      }}
                    >
                      <Phone size={14} /> Call Hotline: {m.card.data.hotline}
                    </a>
                    <div style={{ fontSize: 11, color: '#7F1D1D', lineHeight: 1.4 }}>
                      {m.card.data.etaResponse}
                    </div>
                  </div>
                )}

                {m.card?.type === 'booking_confirm' && (
                  <div style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: 14,
                    padding: '13px 15px',
                    fontSize: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 700, marginBottom: 6 }}>
                      <CheckCircle2 size={15} /> Lead Registered: {m.card.data.leadId}
                    </div>
                    <div style={{ color: '#065F46', fontSize: 11.5 }}>{m.card.data.corridor}</div>
                    <div style={{ color: '#047857', fontSize: 11, marginTop: 4 }}>
                      Status: Queued for fleet recommendation & trailer pairing.
                    </div>
                  </div>
                )}

                <span suppressHydrationWarning style={{
                  fontSize: 10,
                  color: '#94A3B8',
                  alignSelf: isBot ? 'flex-start' : 'flex-end',
                  padding: '0 4px',
                  letterSpacing: '0.2px'
                }}>
                  {m.time}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontSize: 12, paddingLeft: 38 }}>
            <div style={{ width: 14, height: 14, border: '2px solid rgba(5,150,105,0.3)', borderTopColor: '#059669', borderRadius: '50%' }} className="animate-spin" />
            <span>LogiFlow is retrieving telematics...</span>
          </div>
        )}
        <div style={{ height: 14, flexShrink: 0 }} />
      </div>

      {/* Quick Action Chips — Clean Light Pills */}
      <div style={{
        padding: '8px 14px',
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        scrollbarWidth: 'none'
      }}>
        {[
          { label: '📦 Track ORD-1001', msg: 'Where is shipment ORD-1001?' },
          { label: '⚡ Spot Quote', msg: 'Get spot freight quote for 8000 kg Lucknow to Delhi' },
          { label: '📋 Book Freight', msg: 'I need to book a 5000kg freight shipment' },
          { label: '🚨 Roadside SOS', msg: 'Emergency: truck breakdown on Highway NH-27', danger: true },
        ].map(c => (
          <button
            key={c.label}
            onClick={() => handleSend(c.msg)}
            style={{
              background: c.danger ? '#FEF2F2' : '#F1F5F9',
              border: `1px solid ${c.danger ? '#FECACA' : '#E2E8F0'}`,
              borderRadius: 20,
              padding: '5px 11px',
              fontSize: 11,
              fontWeight: 600,
              color: c.danger ? '#DC2626' : '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = c.danger ? '#FEE2E2' : '#E2E8F0';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = c.danger ? '#FEF2F2' : '#F1F5F9';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Input Form — Clean Rounded Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          padding: '11px 14px',
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          gap: 9,
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <input
          type="text"
          value={input}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask LogiFlow (e.g. Track ORD-1001, quote, emergency)..."
          style={{
            flex: 1,
            background: '#F8FAFC',
            border: `1.5px solid ${inputFocused ? '#059669' : '#E2E8F0'}`,
            borderRadius: 10,
            padding: '9px 14px',
            fontSize: 12.5,
            color: '#0F172A',
            outline: 'none',
            fontFamily: 'inherit',
            boxShadow: inputFocused ? '0 0 0 3px rgba(5,150,105,0.12)' : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s'
          }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: input.trim() ? '#0F172A' : '#F1F5F9',
            border: 'none',
            color: input.trim() ? '#FFFFFF' : '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s',
            flexShrink: 0,
            boxShadow: input.trim() ? '0 2px 8px rgba(15,23,42,0.2)' : 'none'
          }}
          onMouseEnter={e => {
            if (input.trim()) e.currentTarget.style.background = '#1E293B';
          }}
          onMouseLeave={e => {
            if (input.trim()) e.currentTarget.style.background = '#0F172A';
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
