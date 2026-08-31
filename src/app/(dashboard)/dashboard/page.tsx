'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Truck, Users, ShoppingCart, Navigation, PackageCheck, Clock,
  TrendingUp, AlertTriangle, ShieldAlert, Plus, Search, ArrowRight,
  MapPin, CheckCircle2, CloudRain, Wrench, FileWarning, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initialHubNodes, HubNode } from '@/lib/mockData';

export default function DashboardPage() {
  const { vehicles, drivers, orders, trips, alerts, dismissAlert } = useStore();
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<'All' | 'North' | 'Central' | 'West' | 'East' | 'Europe'>('All');
  const [selectedHub, setSelectedHub] = useState<HubNode | null>(initialHubNodes[0]);
  const [trackingQuery, setTrackingQuery] = useState('');

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const activeTrips = trips.filter(t => t.status === 'In Transit');
  const deliveredTrips = trips.filter(t => t.status === 'Delivered');

  const stats = [
    { label: 'Total Orders', value: orders.length + 124, icon: ShoppingCart, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', change: '+12% this week', link: '/orders' },
    { label: 'Active Trips', value: activeTrips.length + 10, icon: Navigation, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', change: 'Live corridor', link: '/tracking' },
    { label: 'Fleet Vehicles', value: vehicles.length + 39, icon: Truck, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', change: `${vehicles.filter(v => v.status === 'Available').length} ready`, link: '/vehicles' },
    { label: 'Active Drivers', value: drivers.length + 46, icon: Users, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', change: '98% verified', link: '/drivers' },
    { label: 'On-Time Delivery', value: '87.4%', icon: PackageCheck, color: '#10b981', bg: 'rgba(16,185,129,0.12)', change: 'SLA target 85%', link: '/delivery' },
    { label: 'Pending Allocations', value: pendingOrders.length, icon: Clock, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', change: `${pendingOrders.length} immediate`, link: '/allocation' },
  ];

  const filteredHubs = selectedRegion === 'All'
    ? initialHubNodes
    : initialHubNodes.filter(h => h.region === selectedRegion);

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/tracking');
  };

  const statusColor: Record<string, string> = {
    'Pending': 'badge-yellow', 'Allocated': 'badge-blue', 'In Transit': 'badge-cyan',
    'Delivered': 'badge-green', 'Cancelled': 'badge-red'
  };

  return (
    <div className="animate-slide-in">
      {/* Top Stats Grid */}
      <div className="grid-6" style={{ marginBottom: 20 }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link href={s.link} key={i} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                  <div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
                    <div className="stat-label" style={{ fontSize: 11 }}>{s.label}</div>
                  </div>
                  <div className="stat-icon" style={{ background: s.bg, width: 34, height: 34 }}>
                    <Icon size={17} color={s.color} />
                  </div>
                </div>
                <div className="stat-change" style={{ fontSize: 10.5, marginTop: 8 }}>
                  <TrendingUp size={11} color="var(--success-light)" />
                  <span style={{ color: 'var(--text-secondary)' }}>{s.change}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Live Regional Map + Side Panels */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Interactive Live Vehicles & Regional Hubs Map */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Navigation size={16} color="#38bdf8" />
                Live Fleet & Regional Hub Network
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Real-time tracking of active corridors & logistics terminals
              </div>
            </div>

            {/* Region Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {(['All', 'North', 'Europe', 'East'] as const).map(reg => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  style={{
                    fontSize: 11,
                    padding: '4px 9px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: selectedRegion === reg ? 'rgba(59,130,246,0.2)' : 'var(--bg-tertiary)',
                    color: selectedRegion === reg ? '#60a5fa' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {reg}
                </button>
              ))}
              <Link href="/tracking" className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
                Full View <ExternalLink size={11} />
              </Link>
            </div>
          </div>

          {/* Interactive Canvas Map */}
          <div className="map-container" style={{ flex: 1, minHeight: 260, position: 'relative', overflow: 'hidden' }}>
            <svg style={{ width: '100%', height: '100%', minHeight: 260 }}>
              {/* Corridor Connections */}
              <line x1="48%" y1="44%" x2="44%" y2="52%" stroke="rgba(59,130,246,0.4)" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="48%" y1="44%" x2="30%" y2="32%" stroke="rgba(6,182,212,0.6)" strokeWidth="2" />
              <line x1="30%" y1="32%" x2="38%" y2="42%" stroke="rgba(59,130,246,0.4)" strokeWidth="2" />
              <line x1="48%" y1="44%" x2="62%" y2="56%" stroke="rgba(59,130,246,0.4)" strokeWidth="2" />
              <line x1="68%" y1="24%" x2="75%" y2="28%" stroke="rgba(59,130,246,0.4)" strokeWidth="2" />
              <line x1="75%" y1="28%" x2="80%" y2="20%" stroke="rgba(239,68,68,0.5)" strokeWidth="2" strokeDasharray="4 2" />

              {/* Hub Nodes */}
              {filteredHubs.map(hub => {
                const isSelected = selectedHub?.id === hub.id;
                return (
                  <g key={hub.id} onClick={() => setSelectedHub(hub)} style={{ cursor: 'pointer' }}>
                    {/* Outer pulse */}
                    <circle
                      cx={`${hub.x}%`}
                      cy={`${hub.y}%`}
                      r={isSelected ? 16 : 10}
                      fill={hub.hasDelay ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}
                    />
                    <circle
                      cx={`${hub.x}%`}
                      cy={`${hub.y}%`}
                      r={isSelected ? 8 : 6}
                      fill={hub.hasDelay ? '#ef4444' : '#3b82f6'}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <text
                      x={`${hub.x}%`}
                      y={`${hub.y + 7}%`}
                      textAnchor="middle"
                      fill={isSelected ? '#f8fafc' : '#94a3b8'}
                      fontSize="10"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="Inter, sans-serif"
                    >
                      {hub.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hub Overlay Card */}
            {selectedHub && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                background: 'rgba(17, 24, 39, 0.92)',
                backdropFilter: 'blur(6px)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                zIndex: 10
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: selectedHub.hasDelay ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedHub.hasDelay ? '#f87171' : '#60a5fa'
                }}>
                  <MapPin size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)' }}>{selectedHub.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Region: {selectedHub.region} • <strong style={{ color: '#60a5fa' }}>{selectedHub.vehiclesCount} vehicles docked</strong>
                    {selectedHub.hasDelay && <span style={{ color: '#ef4444', marginLeft: 6 }}>⚠️ Corridor Delay</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Map Legend */}
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(17, 24, 39, 0.85)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 10.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6' }} />
                <span>On Route Hub</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
                <span>Advisory / Delay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions + System Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick Actions Panel (from Stitch Screen 3) */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Link href="/orders" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Plus size={14} /> New Order
              </Link>
              <Link href="/allocation" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Truck size={14} /> Allocate ({pendingOrders.length})
              </Link>
            </div>

            {/* Quick Track Shipment Search */}
            <form onSubmit={handleQuickTrack} style={{ display: 'flex', gap: 6 }}>
              <input
                className="form-input"
                style={{ fontSize: 12, padding: '7px 11px' }}
                placeholder="Track Order ID or Vehicle (e.g. ORD-1001)..."
                value={trackingQuery}
                onChange={e => setTrackingQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0 12px' }}>
                <Search size={13} />
              </button>
            </form>
          </div>

          {/* Real-Time System Alerts Panel (from Stitch Screen 3) */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={15} color="#f59e0b" />
                Fleet Alerts ({alerts.length})
              </div>
              <span className="badge badge-yellow" style={{ fontSize: 10 }}>Live Telemetry</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 190, overflowY: 'auto' }}>
              {alerts.map(alert => (
                <div key={alert.id} style={{
                  padding: 10,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{alert.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.3 }}>{alert.description}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{alert.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Orders & Fleet Status */}
      <div className="grid-2" style={{ gap: 20 }}>
        {/* Recent Orders Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Recent Dispatch Orders</div>
            <Link href="/orders" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Destination</th>
                <th>Load</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map(o => (
                <tr key={o.id} onClick={() => router.push('/orders')}>
                  <td><span className="mono" style={{ color: '#60a5fa', fontWeight: 700, fontSize: 12 }}>{o.id}</span></td>
                  <td><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{o.destination}</span></td>
                  <td><span className="mono" style={{ fontSize: 12 }}>{o.totalWeight.toLocaleString()} kg</span></td>
                  <td><span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{o.deadline || 'Today'}</span></td>
                  <td><span className={`badge ${statusColor[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fleet Allocation Summary */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>
            Fleet Availability & Driver Roster
          </div>
          {[
            { label: 'Available for Allocation', count: vehicles.filter(v => v.status === 'Available').length, color: '#10b981', total: vehicles.length },
            { label: 'Active In Transit', count: vehicles.filter(v => v.status === 'In Transit').length, color: '#3b82f6', total: vehicles.length },
            { label: 'Scheduled Maintenance', count: vehicles.filter(v => v.status === 'Maintenance').length, color: '#ef4444', total: vehicles.length },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.count} / {item.total}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(item.count / item.total) * 100}%`, background: item.color }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Driver Credential Compliance: <strong style={{ color: '#10b981' }}>100% Verified</strong>
            </div>
            <Link href="/drivers" className="btn btn-ghost btn-sm">Manage Drivers →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
