'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Search, Filter, Phone, Truck, CheckCircle,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

export default function LeadsCRMPage() {
  const { leads, updateLeadStatus, convertLeadToOrder } = useStore();
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Allocated' | 'Contacted' | 'Archived'>('All');
  const [search, setSearch] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leads[0]?.id || null);
  const router = useRouter();
  const { toast } = useToast();

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

  const handleConvertLead = (leadId: string) => {
    const orderId = convertLeadToOrder(leadId);
    toast(
      'Lead Dispatched to Active Fleet',
      `Shipment order ${orderId} created from inbound lead. Ready for vehicle allocation.`,
      'success'
    );
    setTimeout(() => {
      router.push('/allocation');
    }, 1200);
  };

  const statusColor: Record<string, string> = {
    'New': 'badge-yellow',
    'Allocated': 'badge-green',
    'Contacted': 'badge-blue',
    'Archived': 'badge-gray'
  };

  return (
    <div className="animate-slide-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="var(--accent)" />
            Inbound Shipper Leads & Spot Intake CRM
          </div>
          <div className="page-subtitle">
            24/7 Captured freight requests, spot tariff quotations & dispatch conversion
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Inbound Shipper Leads
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
              {leads.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{newLeadsCount} Pending Review</div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Pipeline Freight Value
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
              ₹{totalPipelineValue.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Spot tariff estimates</div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Dispatched & Allocated
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--cyan)', marginTop: 4 }}>
              {allocatedCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Active corridor dispatches</div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Conversion Rate
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: '#F59E0B', marginTop: 4 }}>
              {leads.length > 0 ? Math.round((allocatedCount / leads.length) * 100) : 0}%
            </div>
            <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>Autonomous chat triage</div>
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
                    background: activeTab === tab ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                    color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 170 }}>
              <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 26, fontSize: 11.5, padding: '5px 8px 5px 26px' }}
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
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
                        style={{ background: isSelected ? 'rgba(245,158,11,0.1)' : '' }}
                      >
                        <td>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lead.shipperName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.companyName}</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 11.5 }}>
                            {lead.originHub.split(' ')[0]} → {lead.destinationHub.split(' ')[0]}
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{lead.cargoType}</span>
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: 12 }}>{lead.estimatedWeightKg.toLocaleString()} kg</span>
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>
                            ₹{lead.freightQuote.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusColor[lead.status] || 'badge-gray'}`}>{lead.status}</span>
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
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedLead.shipperName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {selectedLead.companyName} • Reference: <span className="mono">{selectedLead.id}</span>
                  </div>
                </div>
                <span className={`badge ${statusColor[selectedLead.status] || 'badge-gray'}`}>
                  {selectedLead.status}
                </span>
              </div>

              {/* Contact Credentials */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
                <div style={{ padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 2 }}>Direct Phone</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedLead.phone}</div>
                </div>
                <div style={{ padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 2 }}>Corporate Email</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{selectedLead.email}</div>
                </div>
              </div>

              {/* Haul Specifications */}
              <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Origin Hub:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedLead.originHub}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Destination:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedLead.destinationHub}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payload Weight:</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedLead.estimatedWeightKg.toLocaleString()} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Pickup:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedLead.targetDeliveryDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Tariff Quote:</span>
                  <span className="mono" style={{ fontWeight: 800, color: '#10b981' }}>₹{selectedLead.freightQuote.toLocaleString()}</span>
                </div>
              </div>

              {/* Conversation Transcript Snippet */}
              {selectedLead.transcriptSnippet && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Conversation Transcript Snippet
                  </div>
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#141210',
                    border: '1px solid var(--border)',
                    fontSize: 11.5,
                    color: '#D6D3D1',
                    fontStyle: 'italic',
                    lineHeight: 1.4
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
                    style={{ justifyContent: 'center', gap: 8, padding: '10px' }}
                  >
                    <Truck size={15} /> Approve & Dispatch to Fleet Allocation →
                  </button>
                ) : (
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 8,
                    color: '#10b981',
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
                    style={{ flex: 1, justifyContent: 'center', color: 'var(--text-muted)' }}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              Select a lead from the CRM table to view specifications and dispatch status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
