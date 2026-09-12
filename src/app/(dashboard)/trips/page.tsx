'use client';
import { useTrips } from '@/features/trips/hooks';
import { useVehicles } from '@/features/vehicles/hooks';
import { useDrivers } from '@/features/drivers/hooks';
import { useOrders } from '@/features/orders/hooks';
import { useCustomers } from '@/features/customers/hooks';
import { Navigation, Truck } from 'lucide-react';
import Link from 'next/link';
import { ListStack } from '@/components/ui/ListStack';
import { LabeledProgress } from '@/components/ui/LabeledProgress';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';

export default function TripsPage() {
  const { trips } = useTrips();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { orders } = useOrders();
  const { customers } = useCustomers();

  const activeTrips = trips.filter(t => t.status === 'In Transit');
  const completedTrips = trips.filter(t => t.status !== 'In Transit');

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title">Trips</div>
          <div className="page-subtitle">{activeTrips.length} active, {completedTrips.length} completed</div>
        </div>
        <Link href="/tracking" className="btn btn-primary">
          <Navigation size={15} /> Live Tracking
        </Link>
      </div>

      {/* Trips Corridor Alert */}
      {activeTrips.length > 0 ? (
        <AlertBanner variant="info" title={`${activeTrips.length} freight corridor trip(s) actively in transit`} compact dismissible />
      ) : (
        <AlertBanner variant="success" title="All trips completed and delivered" compact dismissible />
      )}

      {/* Active Trips ListStack — watermelon list-stack pattern */}
      {activeTrips.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Live Active Trips ({activeTrips.length})
          </div>
          <ListStack
            items={activeTrips.slice(0, 5).map(t => ({
              id: t.id,
              title: t.id,
              subtitle: `${(t.origin || '').split(',')[0]} → ${(t.destination || '').split(',')[0]}`,
              meta: t.eta ? `ETA ${t.eta}` : undefined,
              badge: t.status,
              badgeVariant: 'blue' as const,
            }))}
            cardHeight={60}
          />
        </div>
      )}

      {/* Active Trips Detail Cards */}
      {activeTrips.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Trips</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeTrips.map(trip => {
              const vehicle = vehicles.find(v => v.id === trip.vehicleId);
              const driver = drivers.find(d => d.id === trip.driverId);
              const order = orders.find(o => o.id === trip.orderId);
              const customer = order ? customers.find(c => c.id === order.customerId) : null;
              const distDone = Math.round((trip.progress / 100) * trip.distance);
              const distLeft = trip.distance - distDone;
              return (
                <Link key={trip.id} href="/tracking" className="card" style={{ cursor: 'pointer', display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-high)', fontFamily: 'JetBrains Mono, monospace' }}>{trip.id}</span>
                        <BadgeWithDot
                          color={trip.status === 'In Transit' ? 'brand' : trip.status === 'Delivered' ? 'success' : 'gray'}
                          pulse={trip.status === 'In Transit'}
                          size="sm"
                        >
                          {trip.status}
                        </BadgeWithDot>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 4 }}>
                        {customer?.name ? `${customer.name} · ` : ''}{trip.origin} → {trip.destination}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-low)' }}>ETA</div>
                      <div style={{ fontWeight: 700, color: 'var(--status-done, #16A34A)', fontSize: 13 }}>{trip.eta}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-low)', marginBottom: 6 }}>
                      <span>{trip.origin}</span>
                      <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{trip.progress}%</span>
                      <span>{trip.destination}</span>
                    </div>
                    <LabeledProgress
                      progress={trip.progress}
                      labels={[
                        `Trip ${trip.id} En Route (${trip.progress}%)`,
                        `${distDone} km done • ${distLeft} km remaining`,
                        `Corridor ETA: ${trip.eta || 'On Schedule'}`
                      ]}
                      height={7}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-low)', marginTop: 4 }}>
                      <span>{distDone} km done</span>
                      <span>{distLeft} km remaining</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Truck size={13} color="var(--text-low)" />
                      <span style={{ fontSize: 12, color: 'var(--text-mid)', fontFamily: 'JetBrains Mono, monospace' }}>{vehicle?.vehicleNo}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Avatar name={driver?.name || 'Driver'} size="xs" status={driver ? 'online' : 'offline'} />
                      <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{driver?.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-low)' }}>{(trip.load ?? 0).toLocaleString()} kg</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* All Trips Table */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>All Trips</div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Trip ID</th><th>Order</th><th>Route</th><th>Vehicle</th><th>Driver</th><th>Load</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {[...trips].reverse().map(trip => {
                  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                  const driver = drivers.find(d => d.id === trip.driverId);
                  return (
                    <tr key={trip.id}>
                      <td><span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--brand)' }}>{trip.id}</span></td>
                      <td><span style={{ fontSize: 12, color: 'var(--text-low)' }}>{trip.orderId}</span></td>
                      <td style={{ fontSize: 12 }}>{trip.origin} → {trip.destination}</td>
                      <td><span style={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}>{vehicle?.vehicleNo || '—'}</span></td>
                      <td style={{ fontSize: 12 }}>
                        {driver ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar name={driver.name} size="xs" status={driver.status === 'Available' ? 'online' : 'busy'} />
                            <span>{driver.name}</span>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td><span className="mono" style={{ fontSize: 12 }}>{(trip.load ?? 0).toLocaleString()} kg</span></td>
                      <td>
                        <BadgeWithDot
                          color={trip.status === 'In Transit' ? 'brand' : trip.status === 'Delivered' ? 'success' : 'gray'}
                          pulse={trip.status === 'In Transit'}
                          size="sm"
                        >
                          {trip.status}
                        </BadgeWithDot>
                      </td>
                      <td>
                        {trip.status === 'In Transit' && (
                          <Link href="/tracking" className="btn btn-sm btn-ghost">Track</Link>
                        )}
                        {trip.status === 'Delivered' && (
                          <Link href="/delivery" className="btn btn-sm btn-ghost">POD</Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
