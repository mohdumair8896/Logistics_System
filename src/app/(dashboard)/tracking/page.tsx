'use client';
import { useState, useEffect } from 'react';
import { useTrips } from '@/features/trips/hooks';
import { useVehicles } from '@/features/vehicles/hooks';
import { useDrivers } from '@/features/drivers/hooks';
import { useOrders } from '@/features/orders/hooks';
import { useCustomers } from '@/features/customers/hooks';
import { useInvoices } from '@/features/invoices/hooks';
import { CheckCircle, ChevronLeft, ChevronRight, MapPin, Truck, Clock, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import DriverChatModal from '@/components/layout/DriverChatModal';
import TelemetryPanel from '@/components/tracking/TelemetryPanel';
import { LabeledProgress } from '@/components/ui/LabeledProgress';
import { ShipmentQR } from '@/components/ui/ShipmentQR';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { CopyButton } from '@/components/ui/CopyButton';
import { ShareButton } from '@/components/ui/ShareButton';
import { DotSpinner } from '@/components/ui/DotSpinner';

// Load Leaflet map client-side only (no SSR)
const P44CorridorMap = dynamic(() => import('@/components/tracking/P44CorridorMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', minHeight: 280, background: 'var(--surface-2)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <DotSpinner size={30} color="var(--brand)" />
      <div style={{ fontSize: 12, color: 'var(--text-low)', fontWeight: 500 }}>Syncing corridor telematics…</div>
    </div>
  ),
});

// ─── Real GPS polling interval ─────────────────────────────────────────────────
// Polls /api/trips every 8 seconds to pick up GPS lat/lng sent by driver smartphone.
const GPS_POLL_INTERVAL = 8000;

export default function TrackingPage() {
  const { trips, completeDelivery, refetch: refetchTrips } = useTrips();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { invoices } = useInvoices();

  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [chatDriverId, setChatDriverId] = useState<string | null>(null);
  const router = useRouter();

  // Poll for live GPS updates from driver phones
  useEffect(() => {
    const id = setInterval(refetchTrips, GPS_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [refetchTrips]);

  const activeTrips = trips.filter(t => t.status === 'In Transit');
  const trip = trips.find(t => t.id === selectedTrip) || activeTrips[0] || null;

  // Derived data
  const vehicle  = trip ? vehicles.find(v => v.id === trip.vehicleId) ?? null : null;
  const driver   = trip ? drivers.find(d => d.id === trip.driverId) ?? null : null;
  const order    = trip ? orders.find(o => o.id === trip.orderId) ?? null : null;
  const customer = order ? customers.find(c => c.id === order.customerId) ?? null : null;
  const invoice  = order ? invoices.find(inv => inv.orderId === order.id) ?? null : null;

  const distDone = trip ? Math.round((trip.progress / 100) * trip.distance) : 0;
  const distLeft = trip ? trip.distance - distDone : 0;

  // Checkpoints
  const defaultCheckpoints = [
    { name: `${trip?.origin?.split(',')[0] || 'Origin'} Dispatch Gate`, location: 'Terminal', passed: true, time: trip?.startedAt ?? undefined },
    { name: 'Highway Checkpoint', location: 'Corridor', passed: (trip?.progress ?? 0) > 40, time: (trip?.progress ?? 0) > 40 ? '10:15' : undefined },
    { name: `${trip?.destination?.split(',')[0] || 'Destination'} Ingate`, location: 'Delivery', passed: (trip?.progress ?? 0) >= 100, time: (trip?.progress ?? 0) >= 100 ? 'Arrived' : undefined },
  ];
  const displayCheckpoints = (trip?.checkpoints && trip.checkpoints.length > 0) ? trip.checkpoints : defaultCheckpoints;

  // ─── Mark Delivered ────────────────────────────────────────────────────────
  // Called manually by dispatcher when they confirm delivery.
  // Cascades: trip → order → vehicle → driver via API.
  const handleCompleteDelivery = async () => {
    if (!trip) return;
    await completeDelivery(trip.id);
    toast.success('Shipment Delivered!', { description: 'Cargo delivered. Generating POD.' });
    setTimeout(() => router.push('/delivery'), 1500);
  };

  // ─── Manual GPS refresh ────────────────────────────────────────────────────
  const handleRefreshGps = async () => {
    await refetchTrips();
    toast.info('GPS refreshed from server');
  };

  // Empty state
  if (activeTrips.length === 0 && trips.filter(t => t.status === 'Delivered').length > 0) {
    return (
      <div className="animate-slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="card" style={{ textAlign: 'center', padding: 60, maxWidth: 400 }}>
          <CheckCircle size={44} color="var(--brand)" style={{ margin: '0 auto 14px' }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-high)', marginBottom: 8 }}>All Deliveries Completed</div>
          <div style={{ fontSize: 13, color: 'var(--text-low)', marginBottom: 18 }}>View completed shipments in the Delivery &amp; POD module.</div>
          <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => router.push('/delivery')}>
            Go to Delivery &amp; POD
          </button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="animate-slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="card" style={{ textAlign: 'center', padding: 60, maxWidth: 400 }}>
          <Package size={44} color="var(--brand)" style={{ margin: '0 auto 14px', opacity: 0.5 }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-high)', marginBottom: 8 }}>No Active Trips</div>
          <div style={{ fontSize: 13, color: 'var(--text-low)', marginBottom: 18 }}>Dispatch a trip to see live tracking here.</div>
          <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => router.push('/trips')}>
            Go to Trips
          </button>
        </div>
      </div>
    );
  }

  const allViewableTrips = trips.filter(t => t.status === 'In Transit' || t.status === 'Delivered').slice(0, 6);
  const currentIdx = allViewableTrips.findIndex(t => t.id === trip.id);

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Trip selector banner ── */}
      <div className="journey-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={16} color="var(--brand)" />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-high)' }}>Live Tracking</span>
          <span className="badge badge-blue" style={{ fontSize: 9.5, animation: 'pulse 2s infinite' }}>
            {activeTrips.length} ACTIVE
          </span>
        </div>

        <div className="journey-trip-chips">
          {allViewableTrips.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTrip(t.id)}
              className={`journey-trip-chip ${t.id === trip.id ? 'journey-trip-chip-active' : 'journey-trip-chip-inactive'}`}
            >
              {t.id}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 5 }}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={currentIdx <= 0}
            onClick={() => currentIdx > 0 && setSelectedTrip(allViewableTrips[currentIdx - 1].id)}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={currentIdx >= allViewableTrips.length - 1}
            onClick={() => currentIdx < allViewableTrips.length - 1 && setSelectedTrip(allViewableTrips[currentIdx + 1].id)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── 3-column layout ── */}
      <div className="tracking-grid">

        {/* ── Column 1: Shipment Info ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Hero card */}
          <div className="card" style={{ borderLeft: '4px solid var(--brand)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
                  Shipment
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 800, color: 'var(--text-high)' }}>
                    {trip.id}
                  </span>
                  <CopyButton text={trip.id} label="Trip ID" variant="icon" size={13} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className="badge badge-blue" style={{ fontSize: 10 }}>
                  {trip.status}
                </span>
                <ShareButton
                  url={typeof window !== 'undefined' ? `${window.location.origin}/track/${trip.orderId || trip.id}` : undefined}
                  title={`Live Freight Tracking ${trip.id}`}
                  buttonText="Share"
                  style={{ padding: '3px 8px', fontSize: 11 }}
                />
              </div>
            </div>

            {/* Route */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)', fontWeight: 600, textTransform: 'uppercase' }}>Origin</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{trip.origin.split(',')[0]}</div>
                </div>
              </div>
              <div style={{ width: 2, height: 16, background: 'var(--brand-20)', marginLeft: 3 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <MapPin size={8} color="var(--brand)" style={{ marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-low)', fontWeight: 600, textTransform: 'uppercase' }}>Destination</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>{trip.destination.split(',')[0]}</div>
                </div>
              </div>
            </div>

            {/* Key data */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Distance',  value: `${trip.distance} km` },
                { label: 'Load',      value: `${trip.load} kg` },
                { label: 'ETA',       value: trip.eta || '—' },
                { label: 'Progress',  value: `${trip.progress}%` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle card */}
          {vehicle && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Vehicle</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, background: 'var(--brand-10)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={16} color="var(--brand)" />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 800, color: 'var(--text-high)' }}>{vehicle.vehicleNo}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{vehicle.type} · {vehicle.capacity}kg cap</div>
                </div>
              </div>
            </div>
          )}

          {/* Customer card */}
          {customer && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Customer</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)' }}>{customer.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>{customer.phone}</div>
            </div>
          )}

          {/* Checkpoint list */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Checkpoints</div>
            <div className="cp-list">
              {displayCheckpoints.map((cp, i) => (
                <div key={i} className={`cp-row ${cp.passed ? 'cp-done' : 'cp-pending'}`}>
                  <div className="cp-dot">
                    {cp.passed && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: cp.passed ? 'var(--text-high)' : 'var(--text-low)' }}>{cp.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{cp.location}</div>
                    {cp.time && <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>{cp.time}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Column 2: Real Map ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <MapPin size={14} color="var(--brand)" />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-high)' }}>Corridor Map</span>
                {trip.lat && trip.lng && (
                  <span style={{ fontSize: 10, color: 'var(--brand)', fontFamily: 'monospace' }}>
                    {parseFloat(trip.lat as unknown as string).toFixed(4)}°N {parseFloat(trip.lng as unknown as string).toFixed(4)}°E
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleRefreshGps}
                  title="Refresh GPS from server"
                  style={{ fontSize: 10, padding: '3px 8px' }}
                >
                  ↻ GPS
                </button>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block', animation: 'dotPulse 1.4s infinite ease-in-out' }} />
                <span style={{ fontSize: 10, color: 'var(--brand)', fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
            <div style={{ height: 380 }} key={trip.id}>
              <P44CorridorMap
                origin={trip.origin}
                destination={trip.destination}
                progress={trip.progress}
                liveCoords={trip.lat && trip.lng ? { lat: parseFloat(trip.lat as unknown as string), lng: parseFloat(trip.lng as unknown as string) } : undefined}
                waypoints={displayCheckpoints.map((cp) => ({
                  name: cp.name,
                  lat: 0, lng: 0,
                  passed: cp.passed,
                }))}
                geofenceStatus={trip.geofenceStatus}
              />
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { color: 'var(--brand)', label: 'Completed route' },
                { color: 'var(--border-mid)', label: 'Remaining route' },
                { label: '🚛 Current position' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--text-low)' }}>
                  {color && <div style={{ width: 14, height: 3, borderRadius: 2, background: color }} />}
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Transit progress bar */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Transit Progress</div>
            <LabeledProgress
              progress={trip.progress}
              labels={[
                `${trip.origin.split(',')[0]} → ${trip.destination.split(',')[0]}`,
                `${distDone} km covered · ${distLeft} km remaining`,
                `ETA: ${trip.eta || '—'}`,
                `Load: ${trip.load} kg in transit`,
              ]}
              height={10}
              intervalMs={2500}
            />
          </div>

          {/* Invoice quick-link */}
          {invoice && (
            <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1 }}>Invoice</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 800, color: 'var(--text-high)', marginTop: 3 }}>{invoice.id}</div>
                <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 2 }}>₹{invoice.total.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                <span className={`badge ${invoice.status === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>{invoice.status}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => router.push('/invoices')}>View</button>
              </div>
            </div>
          )}

          {/* Corridor team avatars */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Corridor Operations Team
            </div>
            <AvatarStack
              avatars={[
                { id: driver?.id || 'd1', name: driver?.name || 'Primary Driver', role: 'Driver', status: 'online' },
                { id: 'disp1', name: 'Sam Rivera', role: 'Fleet Dispatcher', status: 'online' },
                { id: 'comp1', name: 'Jordan Patel', role: 'Compliance Officer', status: 'busy' },
              ]}
              label="Active Dispatchers & Crew"
            />
          </div>

          {/* QR for driver GPS app link */}
          <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Driver GPS App</div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                /driver-app?v={trip.vehicleId}&t={trip.id}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>Scan to open on driver&apos;s phone</div>
            </div>
            <ShipmentQR
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/driver-app?v=${trip.vehicleId}&t=${trip.id}`}
              label="GPS App"
              size={120}
            />
          </div>
        </div>

        {/* ── Column 3: Telemetry + Controls ── */}
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TelemetryPanel
            trip={trip}
            vehicle={vehicle}
            driver={driver}
            distDone={distDone}
            distLeft={distLeft}
            simulating={false}
            onStartSimulation={handleCompleteDelivery}
            onChatDriver={() => driver && setChatDriverId(driver.id)}
            onNavigateDelivery={() => router.push('/delivery')}
          />

          {/* ETA card */}
          {trip.eta && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Clock size={14} color="var(--brand)" />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1 }}>Estimated Arrival</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-high)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{trip.eta}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Driver chat modal */}
      {chatDriverId && <DriverChatModal driverId={chatDriverId} onClose={() => setChatDriverId(null)} />}
    </div>
  );
}
