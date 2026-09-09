'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  RotateCcw
} from 'lucide-react';
import { useStore } from '@/lib/store';
import Link from 'next/link';

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

export default function LogiFlowChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { vehicles, trips, orders, knowledgeBase, leads } = useStore();

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
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    { label: '⚡ Fleet Status', query: 'What is the current fleet status and active trips?' },
    { label: '📦 Pending Orders', query: 'Show me pending orders ready for allocation.' },
    { label: '💰 Corridor Tariffs', query: 'What are our standard freight tariffs per kg?' },
    { label: '❄️ Cold-Chain SLA', query: 'What are the reefer temperature compliance thresholds?' },
    { label: '🚨 Breakdown SOP', query: 'What is our highway emergency breakdown protocol?' },
  ];

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

    // 3. Corridor Freight Tariffs & Pricing
    if (q.includes('rate') || q.includes('tariff') || q.includes('price') || q.includes('pricing') || q.includes('quote') || q.includes('cost')) {
      const rateArticle = knowledgeBase.find(k => k.category === 'Lane Rates');
      return {
        id,
        sender: 'bot',
        time,
        text: rateArticle
          ? `**Corridor Tariff Schedule:**\n${rateArticle.content}\n\n*All spot quotes include electronic Proof of Delivery (e-POD) and GPS tracking.*`
          : 'Standard tariffs: Lucknow ➔ Kanpur: ₹2.4/kg; Lucknow ➔ Delhi NCR: ₹2.0/kg; Lucknow ➔ Agra: ₹2.2/kg. Minimum billing weight: 1,000 kg.',
        actionLink: {
          href: '/knowledge-base',
          label: 'View Full Policy Tariff Portal →'
        }
      };
    }

    // 4. Cold-Chain & Reefer Temperature SLA
    if (q.includes('temp') || q.includes('cold') || q.includes('reefer') || q.includes('perishable') || q.includes('pharma') || q.includes('dairy')) {
      const reeferArticle = knowledgeBase.find(k => k.category === 'Cold-Chain SLA');
      return {
        id,
        sender: 'bot',
        time,
        text: reeferArticle
          ? `**Cold-Chain SLA Guidelines:**\n${reeferArticle.content}\n\n*All active reefer units stream IoT temperature telemetry in real time.*`
          : 'Cold-chain SLA requires containers maintaining +2°C to +6°C for dairy/produce and -18°C for frozen cargo. Telematics alarm fires if deviation exceeds 2.5°C.',
        actionLink: {
          href: '/tracking',
          label: 'Inspect Cold-Chain Telemetry →'
        }
      };
    }

    // 5. Emergency, Breakdown & Safety SOP
    if (q.includes('breakdown') || q.includes('emergency') || q.includes('accident') || q.includes('safety') || q.includes('hazard') || q.includes('sop')) {
      const safetyArticle = knowledgeBase.find(k => k.category === 'Safety & HAZMAT');
      return {
        id,
        sender: 'bot',
        time,
        text: safetyArticle
          ? `**Emergency Protocol & SOP:**\n${safetyArticle.content}`
          : 'Drivers must place reflective warning triangles 50m behind vehicle and dial 24/7 Operations Hotline at 1800-PRE-LMS (ext 9). Recovery dispatch arrives within 40 mins.',
        actionLink: {
          href: '/drivers',
          label: 'View Driver Compliance Roster →'
        }
      };
    }

    // 6. GST, Invoicing & e-Way Bill Rules
    if (q.includes('gst') || q.includes('tax') || q.includes('invoice') || q.includes('eway') || q.includes('billing')) {
      const gstArticle = knowledgeBase.find(k => k.category === 'GST & Invoicing');
      return {
        id,
        sender: 'bot',
        time,
        text: gstArticle
          ? `**Tax & Invoicing Compliance:**\n${gstArticle.content}`
          : 'Inter-state shipments levied with 18% IGST; intra-state shipments billed with 9% CGST + 9% SGST. Official tax invoices generate automatically upon e-POD signoff.',
        actionLink: {
          href: '/invoices',
          label: 'View Automated Tax Invoices →'
        }
      };
    }

    // 7. Inbound Leads / Spot Intake
    if (q.includes('lead') || q.includes('intake') || q.includes('shipper') || q.includes('crm')) {
      const newLeads = leads.filter(l => l.status === 'New');
      return {
        id,
        sender: 'bot',
        time,
        text: `There are currently **${leads.length} captured shipper leads** in your CRM pipeline (${newLeads.length} new enquiries pending triage). High-priority inquiries can be converted into active dispatch orders with 1 click.`,
        actionLink: {
          href: '/leads',
          label: 'Open Shipper CRM & Intake →'
        }
      };
    }

    // 8. General Knowledge Base Fallback Match
    const matchedKb = knowledgeBase.find(item =>
      q.split(' ').some(word => word.length > 3 && (item.title.toLowerCase().includes(word) || item.keywords.some(k => k.toLowerCase().includes(word))))
    );

    if (matchedKb) {
      return {
        id,
        sender: 'bot',
        time,
        text: `**From Knowledge Base (${matchedKb.category}):**\n\n*${matchedKb.title}*\n${matchedKb.content}`,
        actionLink: {
          href: '/knowledge-base',
          label: 'Open Knowledge Repository →'
        }
      };
    }

    // Default intelligent guidance
    return {
      id,
      sender: 'bot',
      time,
      text: `I've analyzed your query against LogiFlow's operational models. I can assist you with:\n• **Fleet & GPS HUD**: Track vehicles UP32 AB 1234, V002, etc.\n• **Corridor Tariffs**: Inquire tariffs for Lucknow, Kanpur, Delhi NCR.\n• **Bay Allocation & Loading**: Verify staged orders for Bays 1 through 6.\n• **SOP Compliance**: Reefer temperature limits, emergency breakdown rules, and GST tax billing.`,
      actionLink: {
        href: '/dashboard',
        label: 'View Operations Command Dashboard →'
      }
    };
  }, [trips, vehicles, orders, knowledgeBase, leads]);

  return (
    <>
      {/* Floating Action Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          background: 'linear-gradient(135deg, var(--brand), #d97706)',
          color: '#fff',
          fontWeight: 800,
          fontSize: 13,
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 10px 35px rgba(245,158,11,0.45)',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
          e.currentTarget.style.boxShadow = '0 14px 45px rgba(245,158,11,0.55)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 35px rgba(245,158,11,0.45)';
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
          background: 'var(--brand)',
          boxShadow: '0 0 8px var(--brand)'
        }} />
      </button>

      {/* Interactive Chat Window Modal */}
      {isOpen && (
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
            border: '1px solid var(--border-mid)',
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(245,158,11,0.15)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(30,41,59,0.8))',
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
                background: 'linear-gradient(135deg, var(--brand), #d97706)',
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
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)' }} />
                  Connected to Live Telematics Core
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setMessages([{
                  id: 'reset',
                  sender: 'bot',
                  text: 'Conversation reset. Ready for dispatch and fleet questions.',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }])}
                title="Reset conversation"
                style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', padding: 6, borderRadius: 6 }}
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Chatbot"
                style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', padding: 6, borderRadius: 6 }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: 'var(--surface)',
          }}>
            {messages.map(m => {
              const isUser = m.sender === 'user';
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: 14,
                    borderBottomRightRadius: isUser ? 2 : 14,
                    borderBottomLeftRadius: isUser ? 14 : 2,
                    background: isUser ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'var(--surface-1)',
                    color: isUser ? '#fff' : 'var(--text-high)',
                    border: isUser ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border)',
                    fontSize: 12.5,
                    lineHeight: 1.45,
                    whiteSpace: 'pre-line',
                  }}>
                    {m.text}

                    {/* Interactive Action Deep Link */}
                    {m.actionLink && (
                      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                        <Link
                          href={m.actionLink.href}
                          onClick={() => setIsOpen(false)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            color: 'var(--brand)',
                            fontWeight: 700,
                            textDecoration: 'none',
                            fontSize: 12,
                          }}
                        >
                          {m.actionLink.label}
                        </Link>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 3 }}>
                    {m.time}
                  </span>
                </div>
              );
            })}

            {/* Typing status */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--surface-1)', borderRadius: 12, width: 'fit-content' }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-low)' }}>Analyzing telemetry & SOP database...</span>
                <div style={{ width: 12, height: 12, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Strip */}
          <div style={{
            padding: '8px 12px',
            background: 'var(--surface-1)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
          }}>
            {quickPrompts.map(qp => (
              <button
                key={qp.label}
                type="button"
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
              padding: '12px 14px',
              background: 'var(--surface-1)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              className="form-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about fleet, rates, or SOPs..."
              style={{ borderRadius: 20, fontSize: 12.5 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!input.trim() || isTyping}
              style={{ borderRadius: 20, padding: '8px 16px' }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
