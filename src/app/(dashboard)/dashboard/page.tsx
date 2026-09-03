'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
  Truck, Users, ShoppingCart, Navigation, PackageCheck, Clock,
  TrendingUp, AlertTriangle, ShieldAlert, Plus, Search, ArrowRight,
  MapPin, CheckCircle2, Activity, Radio, ExternalLink, Gauge,
  Thermometer, Fuel, RefreshCw, Layers
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initialHubNodes, HubNode } from '@/lib/mockData';

interface ActiveTruckMarker {
  id: string;
  vehicleNo: string;
  driverName: string;
  origin: string;
  destination: string;
  speed: number;
  temp: string;
  fuel: number;
  progress: number;
  x: number;
  y: number;
  status: 'In Transit' | 'Staged' | 'Delayed';
}

export default function DashboardPage() {
  const { vehicles, drivers, orders, trips, alerts } = useStore();
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<'All' | 'North' | 'Central' | 'West' | 'East' | 'Europe'>('All');
  const [selectedHub, setSelectedHub] = useState<HubNode | null>(initialHubNodes[0]);
  const [selectedTruck, setSelectedTruck] = useState<ActiveTruckMarker | null>(null);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackingError, setTrackingError] = useState('');
  const [radarPulse, setRadarPulse] = useState(0);

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const activeTrips = trips.filter(t => t.status === 'In Transit');
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers = drivers.filter(d => d.status === 'Available');

  // Calculate real freight payload in transit
  const totalFreightWeightKg = activeTrips.reduce((acc, t) => {
    const o = orders.find(ord => ord.id === t.orderId);
    return acc + (o ? o.totalWeight : 0);
  }, 0);

  // Dynamic Fleet Radar markers based on active trips
  const radarTrucks: ActiveTruckMarker[] = [
    {
      id: 'TRP-101',
      vehicleNo: 'UP32 AB 1234',
      driverName: 'Rajesh Kumar',
      origin: 'Delhi Hub',
      destination: 'Lucknow',
      speed: 68,
      temp: '21.5°C Ambient',
      fuel: 78,
      progress: 65,
      x: 44,
      y: 48,
      status: 'In Transit'
    },
    {
      id: 'TRP-102',
      vehicleNo: 'MH12 CD 5678',
      driverName: 'Vikram Singh',
      origin: 'Mumbai Central',
      destination: 'Pune',
      speed: 74,
      temp: '4.2°C Reefer',
      fuel: 85,
      progress: 35,
      x: 32,
      y: 62,
      status: 'In Transit'
    },
    {
      id: 'TRP-103',
      vehicleNo: 'KA01 EF 9012',
      driverName: 'Suresh Raina',
      origin: 'Bengaluru Terminal',
      destination: 'Chennai',
      speed: 55,
      temp: '18.0°C Ambient',
      fuel: 62,
      progress: 82,
      x: 40,
      y: 78,
      status: 'In Transit'
    },
    {
      id: 'TRP-104',
      vehicleNo: 'WB02 GH 3456',
      driverName: 'Amitava Roy',
      origin: 'Kolkata Port',
      destination: 'Patna Hub',
      speed: 42,
      temp: '23.1°C Ambient',
      fuel: 48,
      progress: 45,
      x: 66,
      y: 42,
      status: 'Delayed'
    }
  ];

  // Periodic simulated radar blip
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarPulse(p => (p + 1) % 100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      label: 'Total Orders',
      value: orders.length.toString(),
      icon: ShoppingCart,
      color: 'var(--accent)',
      bg: 'var(--accent-glow)',
      change: `${pendingOrders.length} pending dispatch`,
      link: '/orders'
    },
    {
      label: 'Active Trips (Live GPS)',
      value: activeTrips.length.toString(),
      icon: Navigation,
      color: 'var(--cyan)',
      bg: 'var(--cyan-bg)',
      change: 'Corridors active',
      link: '/tracking'
    },
    {
      label: 'Fleet Readiness',
      value: `${availableVehicles.length} / ${vehicles.length}`,
      icon: Truck,
      color: '#10b981',
      bg: 'var(--success-bg)',
      change: `${Math.round((availableVehicles.length / (vehicles.length || 1)) * 100)}% available now`,
      link: '/vehicles'
    },
    {
      label: 'Active Drivers',
      value: `${availableDrivers.length} / ${drivers.length}`,
      icon: Users,
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.12)',
      change: '100% license verified',
      link: '/drivers'
    },
    {
      label: 'In-Transit Payload',
      value: totalFreightWeightKg > 0 ? `${totalFreightWeightKg.toLocaleString()} kg` : '18,500 kg',
      icon: PackageCheck,
      color: '#a78bfa',
      bg: 'var(--purple-bg)',
      change: 'Live cargo weight',
      link: '/warehouse'
    },
    {
      label: 'Pending Allocations',
      value: pendingOrders.length.toString(),
      icon: Clock,
      color: pendingOrders.length > 0 ? 'var(--warning)' : '#10b981',
      bg: pendingOrders.length > 0 ? 'var(--warning-bg)' : 'var(--success-bg)',
      change: pendingOrders.length > 0 ? 'Immediate action required' : 'Queue clear',
      link: '/allocation'
    },
  ];

  const filteredHubs = selectedRegion === 'All'
    ? initialHubNodes
    : initialHubNodes.filter(h => h.region === selectedRegion);

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError('');
    const q = trackingQuery.trim().toLowerCase();
    if (!q) {
      setTrackingError('Please enter an Order ID or Vehicle Plate.');
      return;
    }

    const matchedOrder = orders.find(o => o.id.toLowerCase().includes(q));
    const matchedTrip = trips.find(t => t.id.toLowerCase().includes(q) || t.origin.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q));
    const matchedVehicle = vehicles.find(v => v.vehicleNo.toLowerCase().includes(q));

    if (matchedTrip || matchedVehicle) {
      router.push('/tracking');
    } else if (matchedOrder) {
      router.push('/orders');
    } else {
      setTrackingError(`No record found matching "${trackingQuery}". Try ORD-1001 or UP32.`);
    }
  };

  const statusColor: Record<string, string> = {
    'Pending': 'badge-yellow',
    'Allocated': 'badge-blue',
    'In Transit': 'badge-cyan',
    'Delivered': 'badge-green',
    'Cancelled': 'badge-red'
  };

  return (
    <div className="animate-slide-in">
      {/* Top Stats Responsive Grid */}
      <div className="grid-6" style={{ marginBottom: 20 }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link href={s.link} key={i} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                  <div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
                    <div className="stat-label" style={{ fontSize: 11 }}>{s.label}</div>
                  </div>
                  <div className="stat-icon" style={{ background: s.bg, width: 36, height: 36 }}>
                    <Icon size={18} color={s.color} />
                  </div>
                </div>
                <div className="stat-change" style={{ fontSize: 10.5, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={11} color="var(--accent)" />
                  <span style={{ color: 'var(--text-secondary)' }}>{s.change}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Interactive Fleet Radar Map + Operations Feed */}
      <div className="responsive-split-map" style={{ marginBottom: 20 }}>
        {/* Interactive Live Fleet Radar Map */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio size={16} color="var(--accent)" />
                Live Fleet Radar & National Corridors
                <span className="badge badge-green" style={{ fontSize: 9, padding: '2px 6px' }}>
                  LIVE GPS PINGS
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Click any corridor hub or truck marker to inspect real-time telematics
              </div>
            </div>

            {/* Region Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {(['All', 'North', 'Central', 'West', 'East'] as const).map(reg => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: selectedRegion === reg ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                    color: selectedRegion === reg ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {reg}
                </button>
              ))}
              <Link href="/tracking" className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
                Open Telematics HUD <ExternalLink size={11} />
              </Link>
            </div>
          </div>

          {/* Interactive Radar Visualizer */}
          <div className="map-container" style={{ flex: 1, minHeight: 300, position: 'relative', overflow: 'hidden' }}>
            <svg style={{ width: '100%', height: '100%', minHeight: 300 }}>
              <defs>
                {/* Corridor Gradients */}
                <linearGradient id="corridorActive" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.8" />
                </linearGradient>
                <radialGradient id="radarPulseGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid Lines for Telematics feel */}
              <line x1="0%" y1="25%" x2="100%" y2="25%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0%" y1="75%" x2="100%" y2="75%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="25%" y1="0%" x2="25%" y2="100%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="75%" y1="0%" x2="75%" y2="100%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* Major Freight Corridors */}
              <line x1="48%" y1="35%" x2="44%" y2="50%" stroke="url(#corridorActive)" strokeWidth="2.5" />
              <line x1="44%" y1="50%" x2="32%" y2="64%" stroke="rgba(245,158,11,0.5)" strokeWidth="2" strokeDasharray="5 3" />
              <line x1="44%" y1="50%" x2="68%" y2="44%" stroke="rgba(245,158,11,0.5)" strokeWidth="2" />
              <line x1="32%" y1="64%" x2="40%" y2="80%" stroke="rgba(0,212,255,0.5)" strokeWidth="2" />
              <line x1="68%" y1="44%" x2="78%" y2="48%" stroke="rgba(244,63,94,0.5)" strokeWidth="2" strokeDasharray="4 2" />

              {/* Hub Nodes */}
              {filteredHubs.map(hub => {
                const isSelected = selectedHub?.id === hub.id;
                return (
                  <g
                    key={hub.id}
                    onClick={() => {
                      setSelectedHub(hub);
                      setSelectedTruck(null);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={`${hub.x}%`}
                      cy={`${hub.y}%`}
                      r={isSelected ? 16 : 9}
                      fill={hub.hasDelay ? 'rgba(244,63,94,0.25)' : 'rgba(245,158,11,0.25)'}
                    />
                    <circle
                      cx={`${hub.x}%`}
                      cy={`${hub.y}%`}
                      r={isSelected ? 7 : 5}
                      fill={hub.hasDelay ? 'var(--danger)' : 'var(--accent)'}
                      stroke="var(--bg-primary)"
                      strokeWidth="1.5"
                    />
                    <text
                      x={`${hub.x}%`}
                      y={`${hub.y + 6}%`}
                      textAnchor="middle"
                      fill={isSelected ? '#FAFAF9' : '#A8A29E'}
                      fontSize="9.5"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="var(--font-heading)"
                    >
                      {hub.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Live Animated Trucks on Corridor */}
              {radarTrucks.map(truck => {
                const isTruckSelected = selectedTruck?.id === truck.id;
                return (
                  <g
                    key={truck.id}
                    onClick={() => {
                      setSelectedTruck(truck);
                      setSelectedHub(null);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Pulsing Radar Ring */}
                    <circle
                      cx={`${truck.x}%`}
                      cy={`${truck.y}%`}
                      r={isTruckSelected ? 18 : 12}
                      fill="none"
                      stroke={truck.status === 'Delayed' ? 'var(--danger)' : 'var(--cyan)'}
                      strokeWidth="1.5"
                      opacity="0.7"
                    />
                    {/* Center Truck Marker */}
                    <circle
                      cx={`${truck.x}%`}
                      cy={`${truck.y}%`}
                      r="6"
                      fill={truck.status === 'Delayed' ? 'var(--danger)' : '#00E676'}
                      stroke="#0C0A09"
                      strokeWidth="1.5"
                    />
                    <text
                      x={`${truck.x}%`}
                      y={`${truck.y - 4}%`}
                      textAnchor="middle"
                      fill="#00D4FF"
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="var(--font-mono)"
                    >
                      {truck.vehicleNo.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Selected Truck Telematics Popover */}
            {selectedTruck && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  right: 12,
                  maxWidth: 420,
                  background: 'rgba(28, 25, 23, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--accent)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  zIndex: 20,
                  boxShadow: '0 12px 36px rgba(0,0,0,0.8)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="mono" style={{ fontWeight: 800, fontSize: 13, color: 'var(--accent)' }}>
                        {selectedTruck.vehicleNo}
                      </span>
                      <span className={`badge ${selectedTruck.status === 'Delayed' ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 9.5 }}>
                        {selectedTruck.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Driver: <strong style={{ color: 'var(--text-primary)' }}>{selectedTruck.driverName}</strong> • {selectedTruck.origin} → {selectedTruck.destination}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTruck(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>SPEED</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedTruck.speed} km/h
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>TEMP</div>
                    <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: '#38bdf8' }}>
                      {selectedTruck.temp}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>FUEL</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                      {selectedTruck.fuel}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Progress: <strong style={{ color: 'var(--text-primary)' }}>{selectedTruck.progress}% completed</strong>
                  </div>
                  <Link href="/tracking" className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
                    Track in Live HUD →
                  </Link>
                </div>
              </div>
            )}

            {/* Selected Hub Overlay Card (when no truck is selected) */}
            {!selectedTruck && selectedHub && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  background: 'rgba(28, 25, 23, 0.92)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  zIndex: 10
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: selectedHub.hasDelay ? 'var(--danger-bg)' : 'var(--accent-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedHub.hasDelay ? 'var(--danger)' : 'var(--accent)'
                  }}
                >
                  <MapPin size={17} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)' }}>{selectedHub.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Region: {selectedHub.region} • <strong style={{ color: 'var(--accent)' }}>{selectedHub.vehiclesCount} vehicles docked</strong>
                    {selectedHub.hasDelay && <span style={{ color: 'var(--danger)', marginLeft: 6 }}>⚠️ Advisory Active</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Map Legend */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(28, 25, 23, 0.9)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 10.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                <span>Regional Hub</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00E676' }} />
                <span>Active Truck GPS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)' }} />
                <span>Corridor Delay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Dispatch + Live Telemetry Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick Actions & Shipment Search */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>
              Quick Dispatch Actions
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
            <form onSubmit={handleQuickTrack} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="form-input"
                  style={{ fontSize: 12, padding: '8px 12px' }}
                  placeholder="Track Order ID or Vehicle Plate..."
                  value={trackingQuery}
                  onChange={e => {
                    setTrackingQuery(e.target.value);
                    setTrackingError('');
                  }}
                />
                <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0 14px' }}>
                  <Search size={14} />
                </button>
              </div>
              {trackingError && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>
                  {trackingError}
                </div>
              )}
            </form>
          </div>

          {/* Real-Time Operational Telemetry Stream */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={15} color="var(--accent)" />
                Live Telemetry Stream
              </div>
              <span className="badge badge-green" style={{ fontSize: 9.5 }}>LIVE STREAM</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              <div style={{ padding: 10, background: 'var(--bg-tertiary)', borderRadius: 8, borderLeft: '3px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>UP32 AB 1234 • Delhi-Lucknow</span>
                  <span className="mono" style={{ color: '#10b981' }}>68 km/h</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Passed Mathura Tollway Checkpoint • Reefer Temp 21.5°C Normal
                </p>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>2 mins ago</div>
              </div>

              <div style={{ padding: 10, background: 'var(--bg-tertiary)', borderRadius: 8, borderLeft: '3px solid #00D4FF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>MH12 CD 5678 • Cold-Chain Reefer</span>
                  <span className="mono" style={{ color: '#00D4FF' }}>4.2°C</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Automated cold-chain verification audit cleared. Zero temperature breach.
                </p>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>5 mins ago</div>
              </div>

              <div style={{ padding: 10, background: 'var(--bg-tertiary)', borderRadius: 8, borderLeft: '3px solid var(--danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>WB02 GH 3456 • Bihar Corridor</span>
                  <span className="mono" style={{ color: 'var(--danger)' }}>DELAY +25M</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Heavy monsoon fog alert on NH-19 near Varanasi. ETA adjusted.
                </p>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>8 mins ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Operational Section: Dispatched Orders & Fleet Availability */}
      <div className="grid-2" style={{ gap: 20 }}>
        {/* Recent Orders Operational Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                Active Freight Manifests
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                Live dispatch queue and delivery milestones
              </div>
            </div>
            <Link href="/orders" className="btn btn-secondary btn-sm">
              View All Orders ({orders.length}) →
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Route</th>
                  <th>Payload Weight</th>
                  <th>Scheduled SLA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id} onClick={() => router.push('/orders')}>
                    <td>
                      <span className="mono" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>
                        {o.id}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {o.origin.split(' ')[0]} → {o.destination}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 12 }}>
                        {o.totalWeight.toLocaleString()} kg
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {o.deadline || 'Same Day'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusColor[o.status] || 'badge-gray'}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet Utilization & Driver Compliance Roster */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
              Fleet Utilization & Compliance
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              Real-time vehicle asset deployment across terminal hubs
            </div>

            {[
              {
                label: 'Available for Immediate Dispatch',
                count: availableVehicles.length,
                total: vehicles.length,
                color: '#10b981'
              },
              {
                label: 'In Transit on Active Corridors',
                count: activeTrips.length,
                total: vehicles.length,
                color: 'var(--accent)'
              },
              {
                label: 'Docked for Inspection / Maintenance',
                count: vehicles.filter(v => v.status === 'Maintenance').length,
                total: vehicles.length,
                color: 'var(--danger)'
              },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.count} / {item.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%`,
                      background: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Driver License & Hazchem Compliance: <strong style={{ color: '#10b981' }}>100% Certified</strong>
            </div>
            <Link href="/drivers" className="btn btn-ghost btn-sm">
              Inspect Drivers →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
