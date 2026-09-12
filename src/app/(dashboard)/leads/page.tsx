'use client';
import { useState } from 'react';
import { useLeads } from '@/features/leads/hooks';
import {
  Search, Truck, CheckCircle,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';

export default function LeadsCRMPage() {
  const { leads, updateLeadStatus, convertLeadToOrder, loading } = useLeads();
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Allocated' | 'Contacted' | 'Archived'>('All');
  const [search, setSearch] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const router = useRouter();

  const filteredLeads = leads.filter(l => {
    const matchesTab = activeTab === 'All' || l.status === activeTab;
    const matchesSearch = !search ||
      l.shipperName.toLowerCase().includes(search.toLowerCase()) ||
      l.companyName.toLowerCase().includes(search.toLowerCase()) ||
      l.originHub.toLowerCase().includes(search.toLowerCase()) ||
      l.destinationHub.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const selectedLead = leads.find(l => l.id === selectedLeadId) || filteredLeads[0] || null;

  // Pipeline Metrics
  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.freightQuote || 0), 0);
  const newLeadsCount = leads.filter(l => l.status === 'New').length;
  const allocatedCount = leads.filter(l => l.status === 'Allocated').length;

  const handleConvertLead = async (leadId: string) => {
    const orderId = await convertLeadToOrder(leadId);
    toast.success('Lead Dispatched to Active Fleet', {
      description: `Shipment order ${orderId} created from inbound lead. Ready for vehicle allocation.`
    });
    setTimeout(() => {
      router.push('/allocation');
    }, 1200);
  };

  return (
    <div className="animate-slide-in">
      {loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-low)' }}>Loading leads from database...</div>}
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="var(--brand)" />
            Inbound Shipper Leads & Spot Intake CRM
          </div>
          <div className="page-subtitle">
            24/7 Captured freight requests, spot tariff quotations & dispatch conversion
          </div>
        </div>
      </div>

      {/* Inbound Leads Alert — watermelon AlertBanner pattern */}
      {newLeadsCount > 0 && (
        <AlertBanner
          variant="warning"
          title={`${newLeadsCount} new inbound shipper lead(s) awaiting freight review`}
          dismissible
        >
          Review captured cargo specifications and convert verified spot leads to dispatch orders.
        </AlertBanner>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase' }}>
              Inbound Shipper Leads
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-high)', marginTop: 4 }}>
              {leads.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 2 }}>{newLeadsCount} Pending Review</div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase' }}>
              Pipeline Freight Value
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand)', marginTop: 4 }}>
              ₹{totalPipelineValue.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>Spot tariff estimates</div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase' }}>
              Dispatched & Allocated
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand)', marginTop: 4 }}>
              {allocatedCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>Active corridor dispatches</div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase' }}>
              Conversion Rate
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-high)', marginTop: 4 }}>
              {leads.length > 0 ? Math.round((allocatedCount / leads.length) * 100) : 0}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 2 }}>Autonomous chat triage</div>
          </div>
        </div>
      </div>

      {/* Main Split CRM View */}
      <div className="responsive-split-2">
        {/* Left Column: Leads Table & Filters */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Tabs & Search Filter */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['All', 'New', 'Allocated', 'Contacted', 'Archived'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: activeTab === tab ? 'var(--brand-10)' : 'var(--surface-2)',
                    color: activeTab === tab ? 'var(--brand)' : 'var(--text-mid)',
                    fontWeight: activeTab === tab ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="input-group input-group-sm" style={{ width: 190 }}>
              <Search size={13} />
              <input
                placeholder="Search leads..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shipper / Organization</th>
                  <th>Corridor</th>
                  <th>Payload</th>
                  <th>Quote</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-low)' }}>
                      No leads matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => {
                    const isSelected = selectedLead?.id === lead.id;
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        style={{ background: isSelected ? 'var(--brand-10, rgba(0,87,255,0.08))' : '' }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={lead.shipperName} size="xs" />
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-high)' }}>{lead.shipperName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{lead.companyName}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 11.5 }}>
                            {lead.originHub.split(' ')[0]} → {lead.destinationHub.split(' ')[0]}
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{lead.cargoType}</span>
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: 12 }}>{lead.estimatedWeightKg.toLocaleString()} kg</span>
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>
                            ₹{lead.freightQuote.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <BadgeWithDot
                            color={
                              lead.status === 'New' ? 'warning' :
                              lead.status === 'Allocated' ? 'success' :
                              lead.status === 'Contacted' ? 'brand' : 'gray'
                            }
                            pulse={lead.status === 'New'}
                            size="sm"
                          >
                            {lead.status}
                          </BadgeWithDot>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Lead Inspection & Dispatch Actions */}
        <div>
          {selectedLead ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={selectedLead.shipperName} size="lg" />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-high)' }}>
                      {selectedLead.shipperName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-low)' }}>
                      {selectedLead.companyName} · Reference: <span className="mono">{selectedLead.id}</span>
                    </div>
                  </div>
                </div>
                <BadgeWithDot
                  color={
                    selectedLead.status === 'New' ? 'warning' :
                    selectedLead.status === 'Allocated' ? 'success' :
                    selectedLead.status === 'Contacted' ? 'brand' : 'gray'
                  }
                  pulse={selectedLead.status === 'New'}
                  size="sm"
                >
                  {selectedLead.status}
                </BadgeWithDot>
              </div>

              {/* Contact Credentials */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
                <div style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-low)', fontSize: 10.5, marginBottom: 2 }}>Direct Phone</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-high)' }}>{selectedLead.phone}</div>
                </div>
                <div style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-low)', fontSize: 10.5, marginBottom: 2 }}>Corporate Email</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-high)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{selectedLead.email}</div>
                </div>
              </div>

              {/* Haul Specifications */}
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-low)' }}>Origin Hub:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>{selectedLead.originHub}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-low)' }}>Destination:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>{selectedLead.destinationHub}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-low)' }}>Payload Weight:</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--text-high)' }}>{selectedLead.estimatedWeightKg.toLocaleString()} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-low)' }}>Target Pickup:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>{selectedLead.targetDeliveryDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                  <span style={{ color: 'var(--text-low)' }}>Estimated Tariff Quote:</span>
                  <span className="mono" style={{ fontWeight: 800, color: 'var(--brand)' }}>₹{selectedLead.freightQuote.toLocaleString()}</span>
                </div>
              </div>

              {/* Conversation Transcript Snippet */}
              {selectedLead.transcriptSnippet && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Conversation Transcript Snippet
                  </div>
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: 'var(--surface-2, #F3F2EF)',
                    border: '1px solid var(--border, #E6E4DF)',
                    fontSize: 12,
                    color: 'var(--text-mid, #525252)',
                    fontStyle: 'italic',
                    lineHeight: 1.5
                  }}>
                    &quot;{selectedLead.transcriptSnippet}&quot;
                  </div>
                </div>
              )}

              {/* Status & Dispatch Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {selectedLead.status !== 'Allocated' ? (
                  <button
                    onClick={() => handleConvertLead(selectedLead.id)}
                    className="btn btn-primary w-full"
                    style={{
                      justifyContent: 'center',
                      gap: 8,
                      padding: '11px',
                      background: 'linear-gradient(135deg, #0057FF, #0040CC)',
                      boxShadow: '0 4px 14px rgba(0, 87, 255, 0.25)',
                      borderRadius: 10,
                      border: 'none',
                    }}
                  >
                    <Truck size={15} /> Approve & Dispatch to Fleet Allocation →
                  </button>
                ) : (
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(22, 163, 74, 0.08)',
                    border: '1px solid rgba(22, 163, 74, 0.25)',
                    borderRadius: 8,
                    color: '#16a34a',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontWeight: 700
                  }}>
                    <CheckCircle size={15} /> Converted to Active Order ({selectedLead.associatedOrderId})
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => updateLeadStatus(selectedLead.id, 'Contacted')}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Mark Contacted
                  </button>
                  <button
                    onClick={() => updateLeadStatus(selectedLead.id, 'Archived')}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center', color: 'var(--text-low)' }}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-low)' }}>
              Select a lead from the CRM table to view specifications and dispatch status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
