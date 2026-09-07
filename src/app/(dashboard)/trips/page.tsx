'use client';
import { useStore } from '@/lib/store';
import { initialCustomers as customers, initialProducts as products } from '@/lib/mockData';
import { Navigation, Clock, MapPin, CheckCircle, Truck } from 'lucide-react';
import Link from 'next/link';

export default function TripsPage() {
  const { trips, vehicles, drivers, orders } = useStore();

  const statusColor: Record<string, string> = { 'In Transit': 'badge-cyan', 'Delivered': 'badge-green', 'Cancelled': 'badge-red' };
  const dotColor: Record<string, string> = { 'In Transit': 'dot-blue', 'Delivered': 'dot-green', 'Cancelled': 'dot-red' };

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

      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Trips</div>
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
                        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{trip.id}</span>
                        <span className={`badge ${statusColor[trip.status] || 'badge-gray'}`}>{trip.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {customer?.name} • {trip.origin} → {trip.destination}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ETA</div>
                      <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 13 }}>{trip.eta}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span>{trip.origin}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{trip.progress}%</span>
                      <span>{trip.destination}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${trip.progress}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      <span>{distDone} km done</span>
                      <span>{distLeft} km remaining</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Truck size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>{vehicle?.vehicleNo}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{driver?.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trip.load.toLocaleString()} kg</span>
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
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>All Trips</div>
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
                      <td><span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--accent)' }}>{trip.id}</span></td>
                      <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trip.orderId}</span></td>
                      <td style={{ fontSize: 12 }}>{trip.origin} → {trip.destination}</td>
                      <td><span style={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}>{vehicle?.vehicleNo || '—'}</span></td>
                      <td style={{ fontSize: 12 }}>{driver?.name || '—'}</td>
                      <td><span className="mono" style={{ fontSize: 12 }}>{trip.load.toLocaleString()} kg</span></td>
                      <td><span className={`badge ${statusColor[trip.status] || 'badge-gray'}`}>{trip.status}</span></td>
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
