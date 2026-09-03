'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import {
  Navigation, MapPin, Clock, Truck, ChevronRight, Play,
  FastForward, CheckCircle, Gauge, Fuel, Thermometer, ShieldCheck,
  Phone, MessageSquare, AlertTriangle, AlertCircle, Radio, Activity,
  Compass, Zap, RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DriverChatModal from '@/components/layout/DriverChatModal';

export default function TrackingPage() {
  const { trips, vehicles, drivers, orders, customers, updateTrip } = useStore();
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [chatDriverId, setChatDriverId] = useState<string | null>(null);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeTrips = trips.filter(t => t.status === 'In Transit');
  const trip = trips.find(t => t.id === selectedTrip) || activeTrips[0] || null;

  useEffect(() => {
    if (activeTrips.length > 0 && !selectedTrip) {
      setSelectedTrip(activeTrips[0].id);
    }
  }, [activeTrips.length, selectedTrip]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const vehicle = trip ? vehicles.find(v => v.id === trip.vehicleId) : null;
  const driver = trip ? drivers.find(d => d.id === trip.driverId) : null;
  const order = trip ? orders.find(o => o.id === trip.orderId) : null;
  const customer = order ? customers.find(c => c.id === order.customerId) : null;

  const distDone = trip ? Math.round((trip.progress / 100) * trip.distance) : 0;
  const distLeft = trip ? trip.distance - distDone : 0;

  // Real speedometer needle angle calculation (0 to 120 km/h maps to -90 to 90 deg)
  const currentSpeed = trip?.speedKmH || 64;
  const needleDeg = Math.min(90, Math.max(-90, ((currentSpeed / 120) * 180) - 90));

  const startSimulation = () => {
    if (!trip || trip.progress >= 100) return;
    setSimulating(true);
    intervalRef.current = setInterval(() => {
      const current = useStore.getState().trips.find(t => t.id === trip.id);
      if (!current || current.progress >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setSimulating(false);
        return;
      }
      const newProgress = Math.min(100, current.progress + 15);
      const remaining = trip.distance - Math.round((newProgress / 100) * trip.distance);
      const etaMin = Math.round((remaining / trip.distance) * (trip.distance / 60 * 60));

      const updatedCheckpoints = (current.checkpoints || []).map((cp, idx) => {
        const threshold = (idx + 1) * (100 / (current.checkpoints?.length || 3));
        return {
          ...cp,
          passed: newProgress >= threshold - 10,
          time: newProgress >= threshold - 10 ? cp.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      });

      updateTrip(trip.id, {
        progress: newProgress,
        eta: newProgress >= 100 ? 'Arrived at Destination!' : `${etaMin} min`,
        status: newProgress >= 100 ? 'Delivered' : 'In Transit',
        speedKmH: newProgress >= 100 ? 0 : Math.floor(Math.random() * 12) + 62,
        fuelPercent: Math.max(15, (current.fuelPercent || 85) - 3),
        geofenceStatus: newProgress >= 100 ? 'Docked Inside Facility' : 'Inside Corridor (NH-19)',
        checkpoints: updatedCheckpoints
      });

      if (newProgress >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setSimulating(false);
        setTimeout(() => router.push('/delivery'), 1800);
      }
    }, 700);
  };

  const defaultCheckpoints = [
    { name: `${trip?.origin || 'Origin'} Terminal Dispatch`, location: 'Ingate Checkpoint', passed: true, time: trip?.startedAt || '08:30 AM' },
    { name: 'National Express Highway Corridor Toll', location: 'Tollgate NH-19', passed: (trip?.progress || 0) > 40, time: (trip?.progress || 0) > 40 ? '10:15 AM' : undefined },
    { name: `${trip?.destination || 'Destination'} Facility Ingate`, location: 'Delivery Gate 2', passed: (trip?.progress || 0) >= 100, time: (trip?.progress || 0) >= 100 ? 'Arrived' : undefined }
  ];

  const displayCheckpoints = trip?.checkpoints && trip.checkpoints.length > 0 ? trip.checkpoints : defaultCheckpoints;

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radio size={22} color="var(--accent)" />
            Live Telematics & Geofence Corridor Tracking
          </div>
          <div className="page-subtitle">
            High-frequency GPS sensor HUD, real-time speed diagnostics & route telematics
          </div>
        </div>

        {trip && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-cyan" style={{ fontSize: 11, padding: '4px 10px' }}>
              GPS LOCK: ACTIVE (35ms latency)
            </span>
          </div>
        )}
      </div>

      {activeTrips.length === 0 && trips.filter(t => t.status === 'Delivered').length > 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>All Dispatched Trips Completed!</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            View completed shipments in the Delivery & e-POD module or allocate new orders.
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 16 }}
            onClick={() => router.push('/orders')}
          >
            Go to Orders Queue →
          </button>
        </div>
      ) : (
        <div className="responsive-split-2">
          {/* Active Trips Sidebar Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Active Transit Fleet ({activeTrips.length})
              </span>
              <span className="badge badge-cyan" style={{ fontSize: 9.5 }}>LIVE STREAM</span>
            </div>

            {activeTrips.map(t => {
              const v = vehicles.find(veh => veh.id === t.vehicleId);
              const d = drivers.find(drv => drv.id === t.driverId);
              const isSelected = (trip?.id === t.id);

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrip(t.id)}
                  className={`card ${isSelected ? 'rec-card' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: 14,
                    borderColor: isSelected ? 'var(--accent)' : undefined,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className="mono" style={{ fontWeight: 800, fontSize: 13, color: 'var(--accent)' }}>
                      {t.id}
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: 9.5 }}>
                      {t.speedKmH || 64} KM/H
                    </span>
                  </div>

                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {t.origin.split(' ')[0]} → {t.destination}
                  </div>

                  <div className="progress-bar" style={{ marginBottom: 6 }}>
                    <div className="progress-fill" style={{ width: `${t.progress}%` }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{t.progress}% traveled</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>ETA: {t.eta}</span>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="mono">{v?.vehicleNo}</span>
                    <span>{d?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Tracking Canvas & Telematics HUD */}
          {trip && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Telematics Gauge HUD */}
              <div className="grid-4" style={{ gap: 12 }}>
                {/* Visual Speedometer Gauge Card */}
                <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Velocity HUD
                    </span>
                    <Gauge size={15} color="var(--accent)" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0' }}>
                    {/* SVG Semi-Circle Speedometer */}
                    <svg width="60" height="40" viewBox="0 0 60 40">
                      <path d="M 5 35 A 25 25 0 0 1 55 35" fill="none" stroke="var(--border)" strokeWidth="6" strokeLinecap="round" />
                      <path d="M 5 35 A 25 25 0 0 1 55 35" fill="none" stroke="var(--accent)" strokeWidth="6" strokeDasharray="80" strokeDashoffset={80 - (80 * (currentSpeed / 120))} strokeLinecap="round" />
                      <line x1="30" y1="35" x2={30 + 18 * Math.cos((needleDeg * Math.PI) / 180)} y2={35 + 18 * Math.sin((needleDeg * Math.PI) / 180)} stroke="#FAFAF9" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="30" cy="35" r="3" fill="var(--accent)" />
                    </svg>

                    <div>
                      <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                        {trip.speedKmH || 64}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>KM / HOUR</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 10.5, color: '#10b981', fontWeight: 600 }}>
                    Cruising inside speed limit
                  </div>
                </div>

                {/* Fuel Level */}
                <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Diesel Fuel
                    </span>
                    <Fuel size={15} color="#10b981" />
                  </div>

                  <div style={{ margin: '8px 0' }}>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                      {trip.fuelPercent || 78}%
                    </div>
                    <div className="progress-bar" style={{ marginTop: 8 }}>
                      <div className="progress-fill" style={{ width: `${trip.fuelPercent || 78}%`, background: (trip.fuelPercent || 78) > 25 ? '#10b981' : 'var(--danger)' }} />
                    </div>
                  </div>

                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Range: ~{Math.round((trip.fuelPercent || 78) * 6.5)} km remaining
                  </div>
                </div>

                {/* Cargo Temperature */}
                <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Reefer / Cargo
                    </span>
                    <Thermometer size={15} color="var(--warning)" />
                  </div>

                  <div style={{ margin: '8px 0' }}>
                    <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {trip.cargoTemp || '21.5°C'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Ambient Insulated
                    </div>
                  </div>

                  <div style={{ fontSize: 10.5, color: '#10b981', fontWeight: 600 }}>
                    Sensor Calibrated
                  </div>
                </div>

                {/* Geofence Perimeter */}
                <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Geofence Guard
                    </span>
                    <ShieldCheck size={15} color="#10b981" />
                  </div>

                  <div style={{ margin: '8px 0' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="status-dot dot-green" />
                      {trip.geofenceStatus || 'Inside Corridor'}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                      Route: NH-19 Corridor Verified
                    </div>
                  </div>

                  <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
                    Deviation Alert: 0 km
                  </div>
                </div>
              </div>

              {/* Corridor Route Visualizer with Interactive Distance HUD */}
              <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 24, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 320, position: 'relative' }}>
                  {/* Origin node */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {trip.origin}
                    </span>
                  </div>

                  {/* Route Progress Track */}
                  <div style={{ width: 3, height: 32, background: '#10b981', margin: '4px 0' }} />
                  <div style={{ position: 'relative', width: '100%', height: 130 }}>
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, #10b981 0%, var(--accent) 100%)', transform: 'translateX(-50%)' }} />

                    {/* Animated High-Visibility Vehicle Pulse */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: `${Math.min(90, Math.max(10, trip.progress))}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        transition: 'top 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <div
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '2px solid var(--accent)',
                          borderRadius: 20,
                          padding: '4px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 0 20px var(--accent)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Truck size={16} color="var(--accent)" />
                        <span className="mono" style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {vehicle?.vehicleNo || 'TRUCK'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ width: 3, height: 32, background: trip.progress >= 100 ? '#10b981' : 'var(--border)', margin: '4px 0' }} />

                  {/* Destination node */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: trip.progress >= 100 ? '#10b981' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: trip.progress >= 100 ? '#10b981' : 'var(--text-muted)' }}>
                      {trip.destination}
                    </span>
                  </div>
                </div>

                {/* Distance & ETA Floating Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'rgba(28, 25, 23, 0.92)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    textAlign: 'right'
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Distance Remaining</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
                    {distLeft} km
                  </div>
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                    ETA: {trip.eta}
                  </div>
                </div>
              </div>

              {/* Waypoint Checkpoints Log & Simulation Action Bar */}
              <div className="grid-2" style={{ gap: 16 }}>
                {/* Waypoint Log */}
                <div className="card">
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={15} color="var(--accent)" /> Corridor Checkpoint Log
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {displayCheckpoints.map((cp, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          padding: '8px 0',
                          borderBottom: idx < displayCheckpoints.length - 1 ? '1px solid var(--border)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: cp.passed ? '#10b981' : 'var(--text-muted)',
                              boxShadow: cp.passed ? '0 0 8px #10b981' : 'none'
                            }}
                          />
                          <div>
                            <div style={{ color: cp.passed ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: cp.passed ? 600 : 400 }}>
                              {cp.name}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{cp.location}</div>
                          </div>
                        </div>
                        <span className="mono" style={{ fontSize: 11, color: cp.passed ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                          {cp.passed ? cp.time || 'Passed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Driver Communication & Simulation Trigger */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 6 }}>
                      Driver & Telematics Control
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                      Assigned Driver: <strong style={{ color: 'var(--text-primary)' }}>{driver?.name}</strong> • Phone: <span className="mono">{driver?.phone}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => driver && setChatDriverId(driver.id)}
                      >
                        <MessageSquare size={14} /> Dispatch Chat
                      </button>
                      <a
                        href={`tel:${driver?.phone}`}
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
                      >
                        <Phone size={14} color="#10b981" /> Direct Call
                      </a>
                    </div>
                  </div>

                  {trip.progress < 100 ? (
                    <button
                      className={`btn ${simulating ? 'btn-warning' : 'btn-primary'} w-full btn-lg`}
                      style={{ justifyContent: 'center' }}
                      onClick={startSimulation}
                      disabled={simulating}
                    >
                      {simulating ? (
                        <>
                          <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#111', borderRadius: '50%' }} className="animate-spin" />
                          Simulating Fast-Forward Transit...
                        </>
                      ) : (
                        <>
                          <FastForward size={16} /> Fast-Forward Journey Simulation (Live Telematics)
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn btn-success w-full btn-lg"
                      style={{ justifyContent: 'center' }}
                      onClick={() => router.push('/delivery')}
                    >
                      <CheckCircle size={16} /> Destination Arrived — Finalize e-POD
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Driver Chat Modal */}
      {chatDriverId && (
        <DriverChatModal driverId={chatDriverId} onClose={() => setChatDriverId(null)} />
      )}
    </div>
  );
}
