'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { initialCustomers as customers } from '@/lib/mockData';
import type { Customer } from '@/lib/store';
import {
  MapPin, Truck,
  FastForward, CheckCircle, Gauge, Fuel, Thermometer, ShieldCheck,
  Phone, MessageSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DriverChatModal from '@/components/layout/DriverChatModal';
import { toast } from 'sonner';

export default function TrackingPage() {
  const { trips, vehicles, drivers, orders, updateTrip } = useStore();
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
  const customer = order ? customers.find((c: Customer) => c.id === order.customerId) : null;

  const distDone = trip ? Math.round((trip.progress / 100) * trip.distance) : 0;
  const distLeft = trip ? trip.distance - distDone : 0;

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
      const newProgress = Math.min(100, current.progress + 10);
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
        speedKmH: newProgress >= 100 ? 0 : Math.floor(Math.random() * 15) + 60,
        fuelPercent: Math.max(20, (current.fuelPercent || 85) - 2),
        geofenceStatus: newProgress >= 100 ? 'Arrived' : 'Inside Corridor',
        checkpoints: updatedCheckpoints
      });

      if (newProgress >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setSimulating(false);
        // Peak-End Rule: positive celebration before leaving the page
        toast.success('Shipment Delivered! 🎉', { description: 'Cargo successfully delivered. Generating POD.' });
        setTimeout(() => router.push('/delivery'), 1800);
      }
    }, 600);
  };

  const defaultCheckpoints = [
    { name: `${trip?.origin || 'Origin'} Hub Ingate`, location: 'Terminal Dispatch', passed: true, time: trip?.startedAt },
    { name: 'National Corridor Express Toll', location: 'NH-19 Checkpoint', passed: (trip?.progress || 0) > 40, time: (trip?.progress || 0) > 40 ? '10:15 AM' : undefined },
    { name: `${trip?.destination || 'Destination'} Facility Ingate`, location: 'Delivery Gate', passed: (trip?.progress || 0) >= 100, time: (trip?.progress || 0) >= 100 ? 'Arrived' : undefined }
  ];

  const displayCheckpoints = trip?.checkpoints && trip.checkpoints.length > 0 ? trip.checkpoints : defaultCheckpoints;

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title">Live Telematics & Geofencing Tracking</div>
          <div className="page-subtitle">Real-time GPS coordinates, vehicle HUD sensors & waypoint logs</div>
        </div>
      </div>

      {activeTrips.length === 0 && trips.filter(t => t.status === 'Delivered').length > 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>All Active Deliveries Completed!</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>View completed shipments in the Delivery & POD module.</div>
        </div>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: '320px 1fr', gap: 20 }}>
          {/* Active Trips Sidebar List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Active Corridor Trips ({activeTrips.length})
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
                    borderColor: isSelected ? 'rgba(59,130,246,0.5)' : undefined
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className="mono" style={{ fontWeight: 800, fontSize: 13, color: '#60a5fa' }}>{t.id}</span>
                    <span className="badge badge-cyan" style={{ fontSize: 10 }}>LIVE GPS</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {t.origin.split(' ')[0]} → {t.destination}
                  </div>

                  <div className="progress-bar" style={{ marginBottom: 6 }}>
                    <div className="progress-fill" style={{ width: `${t.progress}%` }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{t.progress}% complete</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>ETA: {t.eta}</span>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="mono">{v?.vehicleNo}</span>
                    <span>{d?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Tracking Canvas & Telematics HUD (Stitch Screen 10) */}
          {trip && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Telematics HUD Bar (Stitch Screen 10) */}
              <div className="grid-4" style={{ gap: 12 }}>
                <div className="hud-gauge">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="hud-gauge-label">Live Speed</span>
                    <Gauge size={13} color="#60a5fa" />
                  </div>
                  <div className="hud-gauge-value" style={{ color: '#60a5fa' }}>
                    {trip.speedKmH || 64} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>km/h</span>
                  </div>
                </div>

                <div className="hud-gauge">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="hud-gauge-label">Fuel Level</span>
                    <Fuel size={13} color="#34d399" />
                  </div>
                  <div className="hud-gauge-value" style={{ color: '#34d399' }}>
                    {trip.fuelPercent || 78}%
                  </div>
                </div>

                <div className="hud-gauge">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="hud-gauge-label">Cargo Temp</span>
                    <Thermometer size={13} color="#f59e0b" />
                  </div>
                  <div className="hud-gauge-value" style={{ fontSize: 14, color: '#f59e0b', marginTop: 2 }}>
                    {trip.cargoTemp || '21.5°C Ambient'}
                  </div>
                </div>

                <div className="hud-gauge">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="hud-gauge-label">Geofence</span>
                    <ShieldCheck size={13} color="#10b981" />
                  </div>
                  <div className="hud-gauge-value" style={{ fontSize: 13, color: '#10b981', marginTop: 2 }}>
                    {trip.geofenceStatus || 'Inside Corridor'}
                  </div>
                </div>
              </div>

              {/* Corridor Route Visualizer */}
              <div className="map-container" style={{ minHeight: 260, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 260, position: 'relative' }}>
                  {/* Origin node */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{trip.origin}</span>
                  </div>

                  {/* Route progress track */}
                  <div style={{ width: 2, height: 30, background: '#10b981', margin: '4px 0' }} />
                  <div style={{ position: 'relative', width: 220, height: 110 }}>
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, #10b981 0%, #3b82f6 100%)', transform: 'translateX(-50%)' }} />

                    {/* Truck icon */}
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      top: `${Math.min(88, (trip.progress / 100) * 100)}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: 26,
                      filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.9))',
                      transition: 'top 0.5s ease',
                      animation: simulating ? 'float 1s infinite' : 'none'
                    }}>
                      🚚
                    </div>
                  </div>
                  <div style={{ width: 2, height: 30, background: trip.progress >= 100 ? '#10b981' : 'var(--border-light)', margin: '4px 0' }} />

                  {/* Destination node */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: trip.progress >= 100 ? '#10b981' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: trip.progress >= 100 ? '#10b981' : 'var(--text-muted)' }}>{trip.destination}</span>
                  </div>
                </div>

                {/* Live Distance & ETA Pill */}
                <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(17, 24, 39, 0.92)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '10px 14px', textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Remaining Distance</div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>{distLeft} km</div>
                  <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginTop: 4 }}>ETA: {trip.eta}</div>
                </div>
              </div>

              {/* Waypoint Checkpoint Log & Simulation Controls (Stitch Screen 10) */}
              <div className="grid-2" style={{ gap: 16 }}>
                {/* Waypoint Log */}
                <div className="card">
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#38bdf8" /> Corridor Checkpoint Log
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {displayCheckpoints.map((cp, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: idx < displayCheckpoints.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: cp.passed ? '#10b981' : 'var(--text-muted)' }} />
                          <span style={{ color: cp.passed ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: cp.passed ? 600 : 400 }}>{cp.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: cp.passed ? '#34d399' : 'var(--text-muted)' }}>
                          {cp.passed ? cp.time || 'Passed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Driver Controls & Simulation Trigger */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 8 }}>
                      Driver & Dispatch Controls
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                      Driver: <strong style={{ color: 'var(--text-primary)' }}>{driver?.name}</strong> • Vehicle: <span className="mono" style={{ color: '#60a5fa' }}>{vehicle?.vehicleNo}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => driver && setChatDriverId(driver.id)}>
                        <MessageSquare size={13} /> Chat Driver
                      </button>
                      <a href={`tel:${driver?.phone}`} className="btn btn-ghost btn-sm" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>
                        <Phone size={13} color="#34d399" /> Call
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
                        <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#111', borderRadius: '50%' }} className="animate-spin" /> Simulating Transit...</>
                      ) : (
                        <><FastForward size={16} /> Fast-Forward Journey Simulation</>
                      )}
                    </button>
                  ) : (
                    <button className="btn btn-success w-full btn-lg" style={{ justifyContent: 'center' }} onClick={() => router.push('/delivery')}>
                      <CheckCircle size={16} /> Arrived — Proceed to Delivery & e-POD
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
