'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import {
  Send, Bot, User, Truck, ShieldAlert, Sparkles, Navigation,
  Clock, MapPin, Calculator, Phone, CheckCircle2, ChevronRight,
  RefreshCw, AlertTriangle, X, Minimize2, ExternalLink
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Notify host page via postMessage
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'LF_READY' }, '*');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (userText?: string) => {
    const query = (userText || input).trim();
    if (!query) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: `msg-${Date.now()}`, sender: 'user', text: query, time };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Call internal triage / API engine
    setTimeout(() => {
      processInboundQuery(query, time);
      setIsTyping(false);
    }, 700);
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
      background: 'var(--bg-primary, #0C0A09)',
      color: 'var(--text-primary, #FAFAF9)',
      fontFamily: 'var(--font-inter, sans-serif)',
      border: '1px solid rgba(245,158,11,0.25)',
      overflow: 'hidden'
    }}>
      {/* Widget Header */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #1C1917, #292524)',
        borderBottom: '1px solid rgba(245,158,11,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
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
            boxShadow: '0 0 14px rgba(245,158,11,0.4)',
            color: '#1C1917'
          }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>LogiFlow AI</span>
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 800 }}>
                24/7 COPILOT
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: '#A8A29E', marginTop: 1 }}>
              Autonomous Dispatch & Tracking Assistant
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setMessages([messages[0]])}
            style={{ background: 'transparent', border: 'none', color: '#A8A29E', cursor: 'pointer', padding: 4 }}
            title="Reset conversation"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {messages.map(m => {
          const isBot = m.sender === 'bot';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: 8,
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                maxWidth: '88%'
              }}
            >
              {isBot && (
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F59E0B',
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  <Truck size={14} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  background: isBot ? '#1C1917' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: isBot ? '#FAFAF9' : '#1C1917',
                  border: isBot ? '1px solid #292524' : 'none',
                  fontWeight: isBot ? 400 : 600,
                  boxShadow: isBot ? 'none' : '0 4px 12px rgba(245,158,11,0.25)'
                }}>
                  {m.text}
                </div>

                {/* Inline Rich Cards */}
                {m.card?.type === 'tracking' && (
                  <div style={{
                    background: '#141210',
                    border: '1px solid rgba(0,212,255,0.3)',
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 11.5
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: '#00D4FF' }}>Live Corridor GPS: {m.card.data.orderId}</span>
                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: 10 }}>● {m.card.data.status}</span>
                    </div>
                    <div style={{ color: '#D6D3D1', marginBottom: 4 }}>
                      {m.card.data.origin} → {m.card.data.destination}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#A8A29E', fontSize: 10.5, marginBottom: 6 }}>
                      <span>Truck: <strong style={{ color: '#FAFAF9' }}>{m.card.data.vehicleNo}</strong></span>
                      <span>Speed: <strong style={{ color: '#FAFAF9' }}>{m.card.data.speedKmH} km/h</strong></span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: '#292524', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${m.card.data.progress}%`, height: '100%', background: '#00D4FF' }} />
                    </div>
                  </div>
                )}

                {m.card?.type === 'quote' && (
                  <div style={{
                    background: '#141210',
                    border: '1px solid rgba(245,158,11,0.35)',
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 11.5
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#F59E0B', marginBottom: 8 }}>
                      <span>Instant Spot Tariff</span>
                      <span>{m.card.data.weight}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#A8A29E', marginBottom: 6 }}>{m.card.data.corridor}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D6D3D1', fontSize: 11, marginBottom: 3 }}>
                      <span>Freight Base:</span>
                      <span>{m.card.data.baseRate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D6D3D1', fontSize: 11, marginBottom: 6 }}>
                      <span>GST (18% IGST):</span>
                      <span>{m.card.data.gst}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#10b981', borderTop: '1px solid #292524', paddingTop: 6, marginBottom: 8 }}>
                      <span>Net Total:</span>
                      <span>{m.card.data.total}</span>
                    </div>
                    <button
                      onClick={handleBookNowFromQuote}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#1C1917',
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      Book This Capacity Slot <ChevronRight size={13} />
                    </button>
                  </div>
                )}

                {m.card?.type === 'emergency' && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 11.5
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontWeight: 700, marginBottom: 6 }}>
                      <AlertTriangle size={15} /> Direct Operations SOS Line
                    </div>
                    <a
                      href="tel:1800773567"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: '#ef4444',
                        color: 'white',
                        padding: '7px 12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: 12,
                        marginBottom: 6
                      }}
                    >
                      <Phone size={14} /> Call 1800-PRE-LMS (Ext 9)
                    </a>
                    <div style={{ fontSize: 10.5, color: '#fca5a5' }}>
                      {m.card.data.etaResponse}
                    </div>
                  </div>
                )}

                {m.card?.type === 'booking_confirm' && (
                  <div style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 11.5
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, marginBottom: 6 }}>
                      <CheckCircle2 size={15} /> Lead Registered: {m.card.data.leadId}
                    </div>
                    <div style={{ color: '#D6D3D1', fontSize: 11 }}>{m.card.data.corridor}</div>
                    <div style={{ color: '#A8A29E', fontSize: 10.5, marginTop: 4 }}>
                      Status: Queued for fleet recommendation & trailer pairing.
                    </div>
                  </div>
                )}

                <span suppressHydrationWarning style={{ fontSize: 9.5, color: '#78716C', alignSelf: isBot ? 'flex-start' : 'flex-end', padding: '0 4px' }}>
                  {m.time}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F59E0B', fontSize: 11.5 }}>
            <div style={{ width: 14, height: 14, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#F59E0B', borderRadius: '50%' }} className="animate-spin" />
            <span>LogiFlow is retrieving telematics...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips */}
      <div style={{
        padding: '6px 12px',
        background: '#141210',
        borderTop: '1px solid #292524',
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}>
        <button
          onClick={() => handleSend('Where is shipment ORD-1001?')}
          style={{
            background: '#1C1917',
            border: '1px solid #292524',
            borderRadius: 14,
            padding: '4px 9px',
            fontSize: 10.5,
            color: '#D6D3D1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          📦 Track ORD-1001
        </button>
        <button
          onClick={() => handleSend('Get spot freight quote for 8000 kg Lucknow to Delhi')}
          style={{
            background: '#1C1917',
            border: '1px solid #292524',
            borderRadius: 14,
            padding: '4px 9px',
            fontSize: 10.5,
            color: '#D6D3D1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          ⚡ Spot Quote
        </button>
        <button
          onClick={() => handleSend('I need to book a 5000kg freight shipment')}
          style={{
            background: '#1C1917',
            border: '1px solid #292524',
            borderRadius: 14,
            padding: '4px 9px',
            fontSize: 10.5,
            color: '#D6D3D1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          📋 Book Freight
        </button>
        <button
          onClick={() => handleSend('Emergency: truck breakdown on Highway NH-27')}
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 14,
            padding: '4px 9px',
            fontSize: 10.5,
            color: '#fca5a5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          🚨 Roadside SOS
        </button>
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          padding: '10px 12px',
          background: '#1C1917',
          borderTop: '1px solid rgba(245,158,11,0.2)',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask LogiFlow (e.g. Track ORD-1001, quote, emergency)..."
          style={{
            flex: 1,
            background: '#141210',
            border: '1px solid #292524',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: '#FAFAF9',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: input.trim() ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#292524',
            border: 'none',
            color: input.trim() ? '#1C1917' : '#78716C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s',
            flexShrink: 0
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
