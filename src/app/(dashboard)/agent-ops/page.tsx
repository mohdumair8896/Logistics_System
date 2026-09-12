'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, AlertTriangle, MessageSquare, RefreshCw, Send,
  Sparkles, Check, X, Eye, ShieldAlert, Layers, UserCheck, Play
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';
import { BadgeGroup } from '@/components/ui/BadgeGroup';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/Breadcrumb';
import { Bubble, BubbleContent } from '@/components/ui/Bubble';
import { Message, MessageAvatar, MessageContent, MessageFooter, Marker, MarkerContent } from '@/components/ui/Message';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/Empty';
import { Spinner } from '@/components/ui/Spinner';

interface BriefData {
  greeting: string;
  timestamp: string;
  summary: {
    activeShipments: number;
    onTrack: number;
    requireAttention: number;
    severeExceptions: number;
    disputedFreightInr: number;
    overdueReceivablesInr: number;
    unavailableTrucks: number;
    missingPods: number;
  };
  topRisks: { lane: string; detail: string; severity: string }[];
  metrics: {
    totalAutomatedTasks: number;
    hoursSaved: number;
    pendingApprovals: number;
    freightLeakagePreventedInr: number;
    disputedInvoicesResolved: number;
    activeWorkforceCount: number;
  };
}

interface QueueItem {
  id: string;
  shipmentId?: string;
  tripId?: string;
  vehicleId?: string;
  driverId?: string;
  eventType: string;
  actor: string;
  title: string;
  description: string;
  location?: string;
  evidence?: {
    telemetry?: { speedKmH?: number; haltDurationMin?: number; lastPing?: string };
    driverMessage?: string;
    driverLanguage?: string;
    contractRule?: string;
    slaTarget?: string;
    financialImpactInr?: number;
    confidenceScore?: number;
  };
  policyId?: string;
  autonomyLevel: number;
  approvalRequired: boolean;
  approvalStatus: 'AUTO_APPROVED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  actionDraft?: string;
  createdAt: string;
}

interface DriverMessage {
  id: string;
  sender: 'driver' | 'dispatcher';
  text: string;
  createdAt: string;
}

export default function AgentOpsPage() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [queueItems, setQueueItems] = useState<{
    critical: QueueItem[];
    attention: QueueItem[];
    routine: QueueItem[];
  }>({ critical: [], attention: [], routine: [] });
  const [autonomyLevel, setAutonomyLevel] = useState<number>(4);
  const [activeTab, setActiveTab] = useState<'brief' | 'queue' | 'workforce' | 'driver-terminal'>('brief');
  const [queueSubTab, setQueueSubTab] = useState<'critical' | 'attention' | 'routine'>('critical');
  const [selectedItemForEvidence, setSelectedItemForEvidence] = useState<QueueItem | null>(null);
  const [driverMessages, setDriverMessages] = useState<DriverMessage[]>([]);
  const [driverText, setDriverText] = useState('');
  const selectedDriverId = 'D001';
  const [executingRoutine, setExecutingRoutine] = useState(false);
  const [sendingDriverMsg, setSendingDriverMsg] = useState(false);

  // 1. Fetch Monday Morning Brief
  const fetchBrief = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/brief');
      const data = await res.json();
      if (data.success && data.data) {
        setBrief(data.data);
      }
    } catch (err) {
      console.error('[AgentOps] Error fetching brief:', err);
    }
  }, []);

  // 2. Fetch Operations Queue
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/queue');
      const data = await res.json();
      if (data.success && data.data) {
        setQueueItems({
          critical: data.data.critical || [],
          attention: data.data.attention || [],
          routine: data.data.routine || [],
        });
        if (typeof data.data.autonomyLevel === 'number') {
          setAutonomyLevel(data.data.autonomyLevel);
        }
      }
    } catch (err) {
      console.error('[AgentOps] Error fetching queue:', err);
    }
  }, []);

  // 3. Fetch Driver Messages
  const fetchDriverChat = useCallback(async () => {
    try {
      const res = await fetch(`/api/agent/driver-chat?driverId=${selectedDriverId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setDriverMessages(data.messages);
      }
    } catch (err) {
      console.error('[AgentOps] Error fetching driver chat:', err);
    }
  }, [selectedDriverId]);

  useEffect(() => {
    void Promise.all([fetchBrief(), fetchQueue(), fetchDriverChat()]);
  }, [fetchBrief, fetchQueue, fetchDriverChat]);

  // Handle 1-Click "Execute Routine Operations"
  const handleExecuteRoutine = async () => {
    setExecutingRoutine(true);
    toast.info('Autonomous Workforce Running Routine Playbooks...', {
      description: 'Resolving scheduled pings, ETA syncs, dock buffering, and low-risk dunning.',
    });

    try {
      const res = await fetch('/api/agent/brief', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Routine Operations Executed!', {
          description: data.message,
        });
        await Promise.all([fetchBrief(), fetchQueue()]);
      }
    } catch {
      toast.error('Failed to execute routine operations');
    } finally {
      setExecutingRoutine(false);
    }
  };

  // Handle Autonomy Level Change
  const handleAutonomyChange = async (newLevel: number) => {
    setAutonomyLevel(newLevel);
    try {
      await fetch('/api/agent/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAutonomyLevel: newLevel }),
      });
      toast.success(`Autonomy Policy Updated`, {
        description: `Operations Layer set to Level ${newLevel} (${getAutonomyLevelTitle(newLevel)})`,
      });
    } catch {
      toast.error('Could not update autonomy level');
    }
  };

  // Handle Action Approval / Rejection in Queue
  const handleQueueDecision = async (eventId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/agent/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, decision }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Action [${decision}] Recorded`, {
          description: `Event Graph and audit logs updated. Tool execution completed.`,
        });
        setSelectedItemForEvidence(null);
        await Promise.all([fetchQueue(), fetchBrief()]);
      }
    } catch {
      toast.error(`Failed to process ${decision}`);
    }
  };

  // Handle Driver Chat Send (Hindi / Hinglish / English)
  const handleSendDriverMessage = async (customText?: string) => {
    const textToSend = customText || driverText;
    if (!textToSend.trim()) return;

    setSendingDriverMsg(true);
    try {
      const res = await fetch('/api/agent/driver-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: selectedDriverId,
          text: textToSend,
          channel: 'WHATSAPP',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Driver Agent Processed Intent', {
          description: `Identified: [${data.driverResult?.data?.intent || 'GENERAL'}]. Dispatched action & Hindi reply.`,
        });
        setDriverText('');
        await Promise.all([fetchDriverChat(), fetchQueue(), fetchBrief()]);
      }
    } catch {
      toast.error('Failed to send driver message');
    } finally {
      setSendingDriverMsg(false);
    }
  };

  const getAutonomyLevelTitle = (lvl: number) => {
    switch (lvl) {
      case 0: return 'Level 0: Observe Only';
      case 1: return 'Level 1: Recommend';
      case 2: return 'Level 2: Draft (Manual Send)';
      case 3: return 'Level 3: Low-Risk Autonomous';
      case 4: return 'Level 4: Medium-Risk Autonomous (Recommended)';
      case 5: return 'Level 5: Full Autonomy (High-Value Approval)';
      default: return `Level ${lvl}`;
    }
  };

  return (
    <div className="animate-slide-in" style={{ maxWidth: 1600, margin: '0 auto', color: 'var(--text-high)' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>EdgePilot AI Ops Command Center</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Top Industrial Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-high)' }}>
              AI Operations Command Center
            </h1>
            <BadgeGroup
              addonText="FLEETOS"
              color="brand"
              size="sm"
            >
              AI Operations Layer
            </BadgeGroup>
            <BadgeWithDot color="success" pulse size="sm">
              7 Autonomous Agents Active
            </BadgeWithDot>
          </div>
          <p style={{ color: 'var(--text-mid)', fontSize: 13, margin: 0 }}>
            Operating layer sitting above TMS, GPS telematics, driver WhatsApp, and billing ledgers.
          </p>
        </div>

        {/* Autonomy Ladder Global Selector */}
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-low)', fontWeight: 700, letterSpacing: '0.04em' }}>
              Autonomy Ladder
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand)' }}>
              {getAutonomyLevelTitle(autonomyLevel)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleAutonomyChange(lvl)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: autonomyLevel === lvl ? 'var(--brand)' : 'transparent',
                  color: autonomyLevel === lvl ? '#FFFFFF' : 'var(--text-mid)',
                  transition: 'all 0.15s ease',
                }}
              >
                L{lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Network Exception Alert */}
      {brief?.summary?.severeExceptions && brief.summary.severeExceptions > 0 ? (
        <AlertBanner
          variant="error"
          title={`${brief.summary.severeExceptions} Critical Highway Exceptions Requiring Immediate Mitigation`}
          className="mb-5"
          dismissible
        >
          Severe exceptions active across network corridors (vehicle breakdown, geofence deviation, loading detention). Autonomous mitigation playbooks are staged for execution.
        </AlertBanner>
      ) : null}

      {/* ── Main Navigation Tabs ── */}
      <div style={{
        display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 24, flexWrap: 'wrap'
      }}>
        {[
          { id: 'brief', label: 'Monday Operations Brief', icon: Sparkles, badge: brief?.summary?.requireAttention },
          { id: 'queue', label: 'Live Operations Queue', icon: Layers, badge: queueItems.critical.length + queueItems.attention.length },
          { id: 'workforce', label: 'AI Workforce Roster', icon: UserCheck, badge: 4 },
          { id: 'driver-terminal', label: 'Hindi / Hinglish Driver Terminal', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'brief' | 'queue' | 'workforce' | 'driver-terminal')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8,
                border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                background: isActive ? 'var(--surface-1)' : 'transparent',
                color: isActive ? 'var(--brand)' : 'var(--text-mid)',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              {tab.label}
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span style={{
                  background: tab.id === 'queue' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(0, 87, 255, 0.08)',
                  color: tab.id === 'queue' ? '#DC2626' : 'var(--brand)',
                  padding: '1px 6px', borderRadius: 999, fontSize: 11, fontWeight: 700
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: MONDAY OPERATIONS BRIEF                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'brief' && (
        <div>
          {/* Executive Morning Banner */}
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px',
            marginBottom: 24, position: 'relative', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Weekly AI Operations Brief
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-high)' }}>
                  {brief?.greeting || 'Good morning. 2,143 active shipments.'}
                </h2>
                <p style={{ color: 'var(--text-mid)', fontSize: 14, maxWidth: 800, margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: '#16A34A' }}>{brief?.summary?.onTrack?.toLocaleString() ?? 1987} shipments</strong> are moving on-schedule.
                  There are <strong style={{ color: '#D97706' }}>{brief?.summary?.requireAttention ?? 156} tasks</strong> requiring attention and
                  <strong style={{ color: '#DC2626' }}> {brief?.summary?.severeExceptions ?? 23} critical exceptions</strong>.
                  ₹{(brief?.summary?.disputedFreightInr ?? 184200).toLocaleString()} freight currently disputed.
                </p>
              </div>

              {/* 1-Click Action Button */}
              <button
                onClick={handleExecuteRoutine}
                disabled={executingRoutine}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: 'linear-gradient(135deg, #0057FF 0%, #0040CC 100%)',
                  color: '#FFFFFF', border: 'none', borderRadius: 10,
                  padding: '14px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 87, 255, 0.3)', transition: 'all 0.15s ease',
                  opacity: executingRoutine ? 0.7 : 1
                }}
              >
                <Play size={16} fill="#FFFFFF" />
                {executingRoutine ? 'Executing Playbooks...' : 'Handle Everything Routine (1-Click)'}
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 24,
              borderTop: '1px solid var(--border)', paddingTop: 20
            }}>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Tasks Automated This Week</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)', marginTop: 2 }}>
                  {(brief?.metrics?.totalAutomatedTasks ?? 142).toLocaleString()} tasks
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Operational Hours Saved</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#16A34A', marginTop: 2 }}>
                  {(brief?.metrics?.hoursSaved ?? 48).toLocaleString()} hrs
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Freight Leakage Prevented</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706', marginTop: 2 }}>
                  ₹{(brief?.metrics?.freightLeakagePreventedInr ?? 184000).toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Overdue Receivables Accelerating</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706', marginTop: 2 }}>
                  ₹{(brief?.summary?.overdueReceivablesInr ?? 924500).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Top Corridor & Exception Risks */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-high)' }}>
                  <AlertTriangle size={18} color="#D97706" /> Top Operational Risks Across Network
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-low)' }}>Updated in real-time</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {brief?.topRisks?.map((risk, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-high)' }}>{risk.lane}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{risk.detail}</div>
                    </div>
                    <BadgeWithDot
                      color={risk.severity === 'CRITICAL' ? 'error' : 'warning'}
                      pulse={risk.severity === 'CRITICAL'}
                      size="sm"
                    >
                      {risk.severity}
                    </BadgeWithDot>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Employee Productivity Snapshot */}
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-high)' }}>
                <Activity size={18} color="#16A34A" /> Digital Operations Shift
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>Control Tower Manager</span>
                    <span style={{ color: '#16A34A', fontWeight: 700 }}>98.4% Auto</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: '98%', height: '100%', background: '#16A34A' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>Freight Accountant</span>
                    <span style={{ color: 'var(--brand)', fontWeight: 700 }}>₹1.84L Protected</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: '92%', height: '100%', background: 'var(--brand)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>Documentation Clerk</span>
                    <span style={{ color: '#D97706', fontWeight: 700 }}>734 PODs Audited</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: '88%', height: '100%', background: '#D97706' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>Collections Executive</span>
                    <span style={{ color: 'var(--brand)', fontWeight: 700 }}>326 Cadences Sent</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: '85%', height: '100%', background: 'var(--brand)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: LIVE AI OPERATIONS QUEUE (Critical / Attention / Routine)      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'queue' && (
        <div>
          {/* Subtabs for Queue severity */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => setQueueSubTab('critical')}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: queueSubTab === 'critical' ? '1px solid rgba(220,38,38,0.3)' : '1px solid var(--border)',
                background: queueSubTab === 'critical' ? 'rgba(220, 38, 38, 0.08)' : 'var(--surface-1)',
                color: queueSubTab === 'critical' ? '#DC2626' : 'var(--text-mid)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              🔴 Critical Escalations ({queueItems.critical.length})
            </button>
            <button
              onClick={() => setQueueSubTab('attention')}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: queueSubTab === 'attention' ? '1px solid rgba(217,119,6,0.3)' : '1px solid var(--border)',
                background: queueSubTab === 'attention' ? 'rgba(217, 119, 6, 0.08)' : 'var(--surface-1)',
                color: queueSubTab === 'attention' ? '#D97706' : 'var(--text-mid)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              🟠 Needs Attention ({queueItems.attention.length})
            </button>
            <button
              onClick={() => setQueueSubTab('routine')}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: queueSubTab === 'routine' ? '1px solid rgba(22,163,74,0.3)' : '1px solid var(--border)',
                background: queueSubTab === 'routine' ? 'rgba(22, 163, 74, 0.08)' : 'var(--surface-1)',
                color: queueSubTab === 'routine' ? '#16A34A' : 'var(--text-mid)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              🟢 Auto-Resolved & Routine ({queueItems.routine.length})
            </button>
          </div>

          {/* Queue Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(queueSubTab === 'critical' ? queueItems.critical : queueSubTab === 'attention' ? queueItems.attention : queueItems.routine).map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800,
                      background: item.approvalStatus === 'PENDING_APPROVAL' ? 'rgba(217,119,6,0.08)' : 'rgba(22,163,74,0.08)',
                      color: item.approvalStatus === 'PENDING_APPROVAL' ? '#D97706' : '#16A34A',
                      border: `1px solid ${item.approvalStatus === 'PENDING_APPROVAL' ? 'rgba(217,119,6,0.2)' : 'rgba(22,163,74,0.2)'}`
                    }}>
                      {item.approvalStatus === 'PENDING_APPROVAL' ? 'APPROVAL REQUIRED' : 'AUTO-RESOLVED'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-low)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {item.shipmentId || item.id}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>
                      Level {item.autonomyLevel} Policy
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-high)' }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 2 }}>{item.description}</div>
                  {item.actionDraft && (
                    <div style={{ fontSize: 12, color: 'var(--brand)', marginTop: 6, fontFamily: 'var(--font-mono, monospace)', background: 'rgba(0,87,255,0.05)', border: '1px solid rgba(0,87,255,0.15)', padding: '4px 8px', borderRadius: 4 }}>
                      Proposed Action: {item.actionDraft}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => setSelectedItemForEvidence(item)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      color: 'var(--text-high)', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <Eye size={14} /> Truth Layer
                  </button>

                  {item.approvalStatus === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        onClick={() => handleQueueDecision(item.id, 'APPROVED')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: '#16A34A', border: 'none', color: '#FFFFFF',
                          padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
                        }}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleQueueDecision(item.id, 'REJECTED')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#DC2626',
                          padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: AI WORKFORCE ROSTER (The 4 Digital Employees)                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'workforce' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {[
            {
              title: 'Control Tower Manager',
              role: 'Corridor Telematics & Disruption Self-Healing',
              agentIds: ['exception-agent', 'shipment-agent'],
              status: 'Active (24/7)',
              metricTitle: 'Active Monitored Fleet',
              metricValue: '500 Trucks',
              description: 'Watches GPS telemetry, predicts SLA delay risks, queries highway traffic corridors, and reschedules loading bays automatically.',
              accent: 'var(--brand)'
            },
            {
              title: 'Freight Accountant',
              role: '3-Way Tariff Audit & Leakage Shield',
              agentIds: ['billing-agent'],
              status: 'Active (24/7)',
              metricTitle: 'Leakage Intercepted',
              metricValue: '₹1.84 Lakhs',
              description: 'Matches LR weights, weighbridge slips, GPS dwell time, and agreed rate cards. Auto-disputes excess toll and unauthorized detention fees.',
              accent: '#16A34A'
            },
            {
              title: 'Documentation Clerk',
              role: 'Physical Scan, POD & E-Way Verification',
              agentIds: ['documentation-agent'],
              status: 'Active (24/7)',
              metricTitle: 'Verified Clean PODs',
              metricValue: '734 Uploads',
              description: 'Cross-checks receiver stamps, receiver signatures, and shortage notes against invoice line items before releasing freight bills.',
              accent: '#D97706'
            },
            {
              title: 'Collections Executive',
              role: 'Cash Flow & Accounts Receivable Dunning',
              agentIds: ['collections-agent'],
              status: 'Active (24/7)',
              metricTitle: 'Accelerated Receivables',
              metricValue: '₹18.2 Lakhs',
              description: 'Tracks invoice aging at 15d, 30d, 45d+. Sends polite WhatsApp payment links with attached GST invoices and investigates withheld disputes.',
              accent: 'var(--brand)'
            },
          ].map((emp, idx) => (
            <div key={idx} style={{
              background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px',
              position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: emp.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {emp.role}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 0 0', color: 'var(--text-high)' }}>
                    {emp.title}
                  </h3>
                </div>
                <BadgeWithDot color="success" pulse size="sm">
                  {emp.status}
                </BadgeWithDot>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 16 }}>
                {emp.description}
              </p>

              <div style={{
                background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{emp.metricTitle}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: emp.accent }}>{emp.metricValue}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: BILINGUAL HINDI / HINGLISH DRIVER TERMINAL                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'driver-terminal' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          {/* Quick Scenario Triggers */}
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-high)' }}>
              Common Indian Road Scenarios
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 16 }}>
              Dispatch rapid driver voice/text messages to evaluate real-time AI Operating Layer resolution:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Warehouse Unloading Queue (Detention)', text: 'Bhai warehouse pe 3 ghante se line lagi hai, unloading kal bol rahe hain' },
                { label: 'Highway Tyre Puncture / Breakdown', text: 'Truck tyre puncture ho gaya, stepney lagana hai aur mechanic chahiye' },
                { label: 'NH-48 Toll Barrier Jam', text: 'Toll barrier pe lamba jam hai road band hai 2 ghante se' },
                { label: 'Diesel / Fuel Query', text: 'Bhai diesel khatam hone wala hai agla pump kahan hai' },
                { label: 'Delivery Location Status Check', text: 'Bhai truck kahan tak pahucha aur delivery time kya hai' },
              ].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendDriverMessage(s.text)}
                  style={{
                    textAlign: 'left', padding: '10px 14px', borderRadius: 8,
                    background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-high)',
                    fontSize: 12, cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--brand)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mid)', fontStyle: 'italic' }}>&quot;{s.text}&quot;</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Console */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px',
            display: 'flex', flexDirection: 'column', height: 560, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>
                  Driver WhatsApp Stream (Ramesh Kumar - UP32-AB-1234)
                </span>
                <span style={{ fontSize: 11, color: '#16A34A', display: 'block' }}>● WhatsApp Verified Channel</span>
              </div>
              <button
                onClick={() => fetchDriverChat()}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {driverMessages.length === 0 ? (
                <Empty className="my-auto border-none bg-transparent">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" />
                    <EmptyTitle>No messages yet</EmptyTitle>
                    <EmptyDescription>
                      Click a quick scenario on the left or send a driver voice/text query below.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                driverMessages.map((msg) => (
                  <Message key={msg.id} align={msg.sender === 'driver' ? 'start' : 'end'}>
                    <MessageAvatar>
                      <Avatar
                        name={msg.sender === 'driver' ? 'Ramesh Kumar' : 'EdgePilot AI'}
                        size="xs"
                        status={msg.sender === 'driver' ? 'online' : undefined}
                      />
                    </MessageAvatar>
                    <MessageContent>
                      <div style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--text-low)',
                        paddingLeft: 4,
                        paddingRight: 4,
                        textAlign: msg.sender === 'driver' ? 'left' : 'right'
                      }}>
                        {msg.sender === 'driver' ? 'Driver (Ramesh Kumar)' : 'EdgePilot AI (Hindi NLU)'}
                      </div>
                      <Bubble
                        align={msg.sender === 'driver' ? 'start' : 'end'}
                        variant={msg.sender === 'driver' ? 'muted' : 'brand'}
                      >
                        <BubbleContent>{msg.text}</BubbleContent>
                      </Bubble>
                      <MessageFooter>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </MessageFooter>
                    </MessageContent>
                  </Message>
                ))
              )}

              {sendingDriverMsg && (
                <Marker role="status">
                  <MarkerContent className="flex items-center gap-2">
                    <Spinner size="xs" />
                    <span>EdgePilot NLU analyzing driver message...</span>
                  </MarkerContent>
                </Marker>
              )}
            </div>

            {/* Input Box */}
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <input
                type="text"
                placeholder="Type driver message in Hindi or English (e.g. 'Bhai jam me fasa hu 2 ghante se')..."
                value={driverText}
                onChange={(e) => setDriverText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendDriverMessage(); }}
                style={{
                  flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '10px 14px', color: 'var(--text-high)', fontSize: 13, outline: 'none'
                }}
              />
              <button
                onClick={() => handleSendDriverMessage()}
                disabled={sendingDriverMsg || !driverText.trim()}
                style={{
                  background: 'var(--brand)', color: '#FFFFFF', border: 'none', borderRadius: 8,
                  padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 2px 8px rgba(0,87,255,0.3)'
                }}
              >
                {sendingDriverMsg ? <Spinner size="xs" /> : <Send size={14} />} Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SLIDE-OVER MODAL: TRUTH LAYER & EVIDENCE DOSSIER                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedItemForEvidence && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: 580, height: '100%', background: 'var(--surface-1)', borderLeft: '1px solid var(--border)',
            padding: '28px', display: 'flex', flexDirection: 'column', overflowY: 'auto',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.15)', color: 'var(--text-high)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={20} color="var(--brand)" />
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-high)' }}>
                  Operational Truth Layer
                </h3>
              </div>
              <button
                onClick={() => setSelectedItemForEvidence(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-mid)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text-low)', textTransform: 'uppercase', fontWeight: 700 }}>
                Event / Incident Context
              </span>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-high)', marginTop: 4 }}>
                {selectedItemForEvidence.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>
                {selectedItemForEvidence.description}
              </div>
            </div>

            {/* Evidence Chain */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', marginBottom: 12 }}>
                Verified Evidence Chain
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                {selectedItemForEvidence.evidence?.telemetry && (
                  <div>
                    <span style={{ color: 'var(--text-mid)' }}>GPS Telematics: </span>
                    <span style={{ color: 'var(--text-high)', fontFamily: 'var(--font-mono, monospace)' }}>
                      Speed: {selectedItemForEvidence.evidence.telemetry.speedKmH ?? 0} km/h | Dwell: {selectedItemForEvidence.evidence.telemetry.haltDurationMin ?? 0}m
                    </span>
                  </div>
                )}

                {selectedItemForEvidence.evidence?.driverMessage && (
                  <div>
                    <span style={{ color: 'var(--text-mid)' }}>Driver Transcript: </span>
                    <span style={{ color: '#D97706', fontStyle: 'italic' }}>
                      &quot;{selectedItemForEvidence.evidence.driverMessage}&quot;
                    </span>
                  </div>
                )}

                {selectedItemForEvidence.evidence?.contractRule && (
                  <div>
                    <span style={{ color: 'var(--text-mid)' }}>Contract Rule: </span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>
                      {selectedItemForEvidence.evidence.contractRule}
                    </span>
                  </div>
                )}

                {selectedItemForEvidence.evidence?.financialImpactInr !== undefined && (
                  <div>
                    <span style={{ color: 'var(--text-mid)' }}>Financial Impact: </span>
                    <span style={{ color: '#DC2626', fontWeight: 700 }}>
                      ₹{selectedItemForEvidence.evidence.financialImpactInr.toLocaleString()}
                    </span>
                  </div>
                )}

                <div>
                  <span style={{ color: 'var(--text-mid)' }}>AI Confidence: </span>
                  <span style={{ color: 'var(--brand)', fontWeight: 700 }}>
                    {Math.round((selectedItemForEvidence.evidence?.confidenceScore ?? 0.96) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Action Summary & Decision */}
            {selectedItemForEvidence.actionDraft && (
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 6 }}>
                  Recommended Action under Policy {selectedItemForEvidence.policyId || 'POL-DEFAULT'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-high)', lineHeight: 1.5 }}>
                  {selectedItemForEvidence.actionDraft}
                </div>
              </div>
            )}

            {selectedItemForEvidence.approvalStatus === 'PENDING_APPROVAL' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                <button
                  onClick={() => handleQueueDecision(selectedItemForEvidence.id, 'APPROVED')}
                  style={{
                    flex: 1, background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: 8,
                    padding: '12px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
                  }}
                >
                  Approve & Execute Tool
                </button>
                <button
                  onClick={() => handleQueueDecision(selectedItemForEvidence.id, 'REJECTED')}
                  style={{
                    flex: 1, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
                    color: '#DC2626', borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Reject Action
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
