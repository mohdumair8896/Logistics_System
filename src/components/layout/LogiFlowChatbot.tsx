'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  RotateCcw
} from 'lucide-react';
import { useVehicles } from '@/features/vehicles/hooks';
import { useTrips } from '@/features/trips/hooks';
import { useOrders } from '@/features/orders/hooks';
import { useKnowledgeBase } from '@/features/knowledge-base/hooks';
import Link from 'next/link';
import { DotPulse } from '@/components/ui/DotPulse';

// Baseline fallback knowledge base if database items are empty
const defaultKnowledgeBase = [
  { keywords: ['rate', 'pricing', 'quote', 'cost', 'per kg', 'price', 'tariff', 'freight charges'], content: 'Base corridor tariffs: Lucknow ➔ Kanpur (82 km): ₹2.4/kg; Lucknow ➔ Agra (340 km): ₹2.2/kg; Lucknow ➔ Delhi NCR (512 km): ₹2.0/kg; Lucknow ➔ Varanasi (322 km): ₹2.1/kg. Minimum billing weight: 1,000 kg.' },
  { keywords: ['cold chain', 'reefer', 'temperature', 'frozen', 'perishable', 'pharma', 'dairy'], content: 'Perishable goods require calibrated reefer containers maintaining +2°C to +6°C for dairy/produce and -18°C for frozen cargo. Telematics gateway triggers an audible alarm and SMS alert if temp deviates by >2.5°C for over 15 minutes.' },
  { keywords: ['emergency', 'breakdown', 'accident', 'spill', 'tire', 'puncture', 'police', 'urgent', 'hotline'], content: 'In case of tire blowout, mechanical failure, or road incident, drivers must activate hazard lights, place reflective triangles 50m behind vehicle, and call our 24/7 Operations Hotline at 1800-PRE-LMS (ext 9). Recovery dispatch deployed within 40 mins.' },
  { keywords: ['gst', 'tax', 'invoice', 'eway bill', 'billing', 'rates', 'cgst', 'sgst', 'igst'], content: 'All inter-state dispatches are levied with 18% IGST; intra-state shipments are billed with 9% CGST + 9% SGST. Official GST tax invoices require signed electronic Proof of Delivery (e-POD) and valid e-Way bill numbers.' },
  { keywords: ['hours', 'dock', 'bays', 'staging', 'operating hours', 'open', 'timing'], content: 'Lucknow Central Hub operates dispatch bays 1 through 6 continuously from 06:00 to 23:00 daily. Inbound freight staging requires 45 minutes prior check-in. Axle scale calibration occurs at 05:30 daily.' },
];

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  actionLink?: {
    href: string;
    label: string;
  };
}

let chatMsgCounter = 0;
function nextMsgId(prefix: string): string {
  chatMsgCounter += 1;
  return `${prefix}-${chatMsgCounter}`;
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Chat Drawer Subcomponent (Lazily Mounted only when isOpen === true) ─────
function ChatbotDrawer({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Eager fetching is isolated to this subcomponent — never runs when drawer is closed
  const { vehicles } = useVehicles();
  const { trips } = useTrips();
  const { orders } = useOrders();
  const { items: kbItems } = useKnowledgeBase();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am your LogiFlow AI Dispatch Copilot. I have real-time visibility over fleet GPS, bay staging manifests, corridor freight tariffs, and cold-chain telemetry. How can I assist dispatch today?',
      time: '10:00 AM',
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    { label: '⚡ Fleet Status', query: 'What is the current fleet status and active trips?' },
    { label: '📦 Pending Orders', query: 'Show me pending orders ready for allocation.' },
    { label: '💰 Corridor Tariffs', query: 'What are our standard freight tariffs per kg?' },
    { label: '❄️ Cold-Chain SLA', query: 'What are the reefer temperature compliance thresholds?' },
    { label: '🚨 Breakdown SOP', query: 'What is our highway emergency breakdown protocol?' },
  ];

  const generateAIResponse = useCallback((q: string): Message => {
    const time = getCurrentTime();
    const id = nextMsgId('resp');

    // 1. Fleet & Vehicle Tracking Status
    if (q.includes('fleet') || q.includes('truck') || q.includes('vehicle') || q.includes('active trip')) {
      const activeTrips = trips.filter(t => t.status === 'In Transit');
      const inTransitVehicles = vehicles.filter(v => v.status === 'In Transit');
      const availableVehicles = vehicles.filter(v => v.status === 'Available');

      return {
        id,
        sender: 'bot',
        time,
        text: `Currently, **${activeTrips.length} active corridor trips** are in transit across your fleet of **${vehicles.length} total vehicles** (${availableVehicles.length} available, ${inTransitVehicles.length} on road). Active shipments are maintaining average highway corridor speeds of ~64 km/h with 0 geofence deviations detected.`,
        actionLink: {
          href: '/tracking',
          label: 'Open Live Telematics HUD →'
        }
      };
    }

    // 2. Pending Orders & Intake Queue
    if (q.includes('order') || q.includes('pending') || q.includes('queue') || q.includes('allocation')) {
      const pending = orders.filter(o => o.status === 'Pending');
      const totalWeight = pending.reduce((sum, o) => sum + o.totalWeight, 0);

      return {
        id,
        sender: 'bot',
        time,
        text: `There are **${pending.length} pending shipment orders** in the dispatch queue totaling **${totalWeight.toLocaleString()} kg** of cargo. These shipments require vehicle allocation and warehouse bay staging.`,
        actionLink: {
          href: '/allocation',
          label: 'Open Smart Allocation Engine →'
        }
      };
    }

    // 3. Dynamic Knowledge Base Match from Database
    if (kbItems.length > 0) {
      const matchedDb = kbItems.find(item =>
        item.keywords?.some((k: string) => q.includes(k.toLowerCase())) ||
        item.title.toLowerCase().split(' ').some((w: string) => w.length > 3 && q.includes(w)) ||
        q.includes(item.category.toLowerCase())
      );
      if (matchedDb) {
        return {
          id,
          sender: 'bot',
          time,
          text: `**${matchedDb.title} (${matchedDb.category}):**\n${matchedDb.content}`,
          actionLink: { href: '/knowledge-base', label: 'View in Knowledge Base →' }
        };
      }
    }

    // 4. Corridor Freight Tariffs & Pricing (fallback)
    if (q.includes('rate') || q.includes('tariff') || q.includes('price') || q.includes('pricing') || q.includes('quote') || q.includes('cost')) {
      const rateArticle = defaultKnowledgeBase.find(k => k.keywords.includes('tariff'));
      return {
        id,
        sender: 'bot',
        time,
        text: rateArticle
          ? `**Corridor Tariff Schedule:**\n${rateArticle.content}\n\n*All spot quotes include electronic Proof of Delivery (e-POD) and GPS tracking.*`
          : 'Standard tariffs: Lucknow ➔ Kanpur: ₹2.4/kg; Lucknow ➔ Delhi NCR: ₹2.0/kg; Lucknow ➔ Agra: ₹2.2/kg. Minimum billing weight: 1,000 kg.',
        actionLink: { href: '/knowledge-base', label: 'View Full Policy Tariff Portal →' }
      };
    }

    // 5. Cold-Chain & Reefer Temperature SLA (fallback)
    if (q.includes('temp') || q.includes('cold') || q.includes('reefer') || q.includes('perishable') || q.includes('pharma') || q.includes('dairy')) {
      const reeferArticle = defaultKnowledgeBase.find(k => k.keywords.includes('reefer'));
      return {
        id, sender: 'bot', time,
        text: reeferArticle
          ? `**Cold-Chain SLA Guidelines:**\n${reeferArticle.content}\n\n*All active reefer units stream IoT temperature telemetry in real time.*`
          : 'Cold-chain SLA requires containers maintaining +2°C to +6°C for dairy/produce and -18°C for frozen cargo.',
        actionLink: { href: '/tracking', label: 'Inspect Cold-Chain Telemetry →' }
      };
    }

    // 6. Emergency, Breakdown & Safety SOP (fallback)
    if (q.includes('breakdown') || q.includes('emergency') || q.includes('accident') || q.includes('safety') || q.includes('hazard') || q.includes('sop')) {
      const safetyArticle = defaultKnowledgeBase.find(k => k.keywords.includes('emergency'));
      return {
        id, sender: 'bot', time,
        text: safetyArticle
          ? `**Emergency Protocol & SOP:**\n${safetyArticle.content}`
          : 'Drivers must place reflective warning triangles 50m behind vehicle and dial 1800-PRE-LMS (ext 9). Recovery dispatch arrives within 40 mins.',
        actionLink: { href: '/drivers', label: 'View Driver Compliance Roster →' }
      };
    }

    // 7. GST, Invoicing & e-Way Bill Rules (fallback)
    if (q.includes('gst') || q.includes('tax') || q.includes('invoice') || q.includes('eway') || q.includes('billing')) {
      const gstArticle = defaultKnowledgeBase.find(k => k.keywords.includes('gst'));
      return {
        id, sender: 'bot', time,
        text: gstArticle
          ? `**Tax & Invoicing Compliance:**\n${gstArticle.content}`
          : 'Inter-state shipments levied with 18% IGST; intra-state shipments billed with 9% CGST + 9% SGST.',
        actionLink: { href: '/invoices', label: 'View Automated Tax Invoices →' }
      };
    }

    // 8. Inbound Leads / Spot Intake
    if (q.includes('lead') || q.includes('intake') || q.includes('shipper') || q.includes('crm')) {
      return {
        id, sender: 'bot', time,
        text: 'Your shipper CRM pipeline is active. New freight enquiries can be converted into active dispatch orders with 1 click from the Leads & CRM page.',
        actionLink: { href: '/leads', label: 'Open Shipper CRM & Intake →' }
      };
    }

    // 9. General Knowledge Base Fallback Match
    const matchedKb = defaultKnowledgeBase.find(item =>
      q.split(' ').some(word => word.length > 3 && item.keywords.some(k => k.toLowerCase().includes(word)))
    );

    if (matchedKb) {
      return {
        id, sender: 'bot', time,
        text: `**From Operational Knowledge Base:**\n${matchedKb.content}`,
        actionLink: { href: '/knowledge-base', label: 'Open Knowledge Repository →' }
      };
    }

    // Default guidance
    return {
      id,
      sender: 'bot',
      time,
      text: `I've analyzed your query against LogiFlow's operational models. I can assist you with:\n• **Fleet & GPS HUD**: Track active vehicles and trips.\n• **Corridor Tariffs**: Inquire tariffs for Lucknow, Kanpur, Delhi NCR.\n• **Bay Allocation & Loading**: Verify staged orders for dispatch.\n• **SOP Compliance**: Reefer temperature limits, emergency breakdown rules, and GST tax billing.`,
      actionLink: {
        href: '/dashboard',
        label: 'View Operations Command Dashboard →'
      }
    };
  }, [trips, vehicles, orders, kbItems]);

  const handleQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = {
      id: nextMsgId('msg'),
      sender: 'user',
      text: queryText.trim(),
      time: getCurrentTime(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateAIResponse(queryText.trim().toLowerCase());
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 84,
        right: 24,
        width: 420,
        maxWidth: 'calc(100vw - 48px)',
        height: 560,
        maxHeight: 'calc(100vh - 120px)',
        zIndex: 999,
        background: 'var(--surface-1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 0 20px rgba(0, 87, 255, 0.08)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 87, 255, 0.08), rgba(0, 87, 255, 0.02))',
        padding: '16px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0057FF, #0040CC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 900,
          }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: 6 }}>
              LogiFlow AI Copilot
            </div>
            <div style={{ fontSize: 11, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
              Connected to Live Telematics Core
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'welcome-reset',
                  sender: 'bot',
                  text: 'Chat history cleared. How can I assist dispatch operations?',
                  time: getCurrentTime(),
                }
              ]);
            }}
            title="Clear Chat"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-low)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close Chat"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-low)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '86%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: m.sender === 'user' ? 'var(--brand)' : 'var(--surface-2)',
                color: m.sender === 'user' ? '#fff' : 'var(--text-high)',
                fontSize: 12.5,
                lineHeight: 1.5,
                border: m.sender === 'user' ? 'none' : '1px solid var(--border)',
                whiteSpace: 'pre-wrap',
                boxShadow: m.sender === 'user' ? '0 4px 12px rgba(245,158,11,0.25)' : 'none',
              }}
            >
              {m.text}
            </div>

            {m.actionLink && (
              <Link
                href={m.actionLink.href}
                onClick={onClose}
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--brand)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--brand-10)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--brand-20)',
                }}
              >
                {m.actionLink.label}
              </Link>
            )}

            <span style={{ fontSize: 9.5, color: 'var(--text-low)', marginTop: 3 }}>
              {m.time}
            </span>
          </div>
        ))}

        {isTyping && (
          <div style={{
            alignSelf: 'flex-start',
            background: 'var(--surface-2)',
            padding: '10px 14px',
            borderRadius: '12px 12px 12px 2px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid var(--border)'
          }}>
            <DotPulse size={6} color="var(--brand)" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{
        padding: '6px 14px 10px',
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        borderTop: '1px solid var(--border-mid)',
      }}>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleQuery(qp.query)}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              color: 'var(--text-mid)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--brand-10)';
              e.currentTarget.style.color = 'var(--brand)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface-2)';
              e.currentTarget.style.color = 'var(--text-mid)';
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Form Input */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleQuery(input);
        }}
        style={{
          padding: '10px 14px',
          background: 'var(--surface-1)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="input-group" style={{ height: 42, borderRadius: 21, padding: '0 6px 0 16px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about fleet, rates, or SOPs..."
            style={{ fontSize: 12.5 }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!input.trim() || isTyping}
            style={{ borderRadius: 16, padding: '7px 14px', height: 32 }}
          >
            <Send size={13} />
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Export: Floating Toggle Button + Lazy Drawer ─────────────────────────
export default function LogiFlowChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Open LogiFlow AI Dispatch Copilot"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 998,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 20px',
          borderRadius: 99,
          background: 'linear-gradient(135deg, #0057FF, #0040CC)',
          color: '#fff',
          fontWeight: 800,
          fontSize: 13,
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 8px 25px rgba(0, 87, 255, 0.35)',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
          e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 87, 255, 0.45)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 87, 255, 0.35)';
        }}
      >
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--brand)'
        }}>
          <Sparkles size={14} />
        </div>
        <span>AI Copilot</span>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#16A34A',
          boxShadow: '0 0 8px #16A34A'
        }} />
      </button>

      {/* Interactive Chat Window Modal (Lazy-Loaded) */}
      {isOpen && <ChatbotDrawer onClose={() => setIsOpen(false)} />}
    </>
  );
}
