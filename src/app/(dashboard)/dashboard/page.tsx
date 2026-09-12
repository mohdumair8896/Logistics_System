'use client';
import { useState } from 'react';
import { useVehicles } from '@/features/vehicles/hooks';
import { useDrivers } from '@/features/drivers/hooks';
import { useOrders } from '@/features/orders/hooks';
import { useCustomers } from '@/features/customers/hooks';
import { useTrips } from '@/features/trips/hooks';
import { useSystemAlerts } from '@/lib/liveNotifications';
import {
  Truck, Users, ShoppingCart, Navigation, Weight,
  Plus, ArrowRight, MapPin, Activity,
  AlertTriangle, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ListStack } from '@/components/ui/ListStack';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';
import { FleetActivityAreaChart } from '@/components/charts/FleetActivityAreaChart';
import { FleetPerformanceGradientChart } from '@/components/charts/FleetPerformanceGradientChart';


export default function DashboardPage() {
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { trips } = useTrips();
  const { alerts } = useSystemAlerts(30000);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'delivered'>('all');

  // ---- Live metrics ----
  const pendingOrders    = orders.filter(o => o.status === 'Pending');
  const activeTrips      = trips.filter(t => t.status === 'In Transit');
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers  = drivers.filter(d => d.status === 'Available');

  const totalFreightKg = activeTrips.reduce((acc, t) => {
    const o = orders.find(ord => ord.id === t.orderId);
    return acc + (o ? o.totalWeight : 0);
  }, 0);

  const freightTons = (totalFreightKg / 1000).toFixed(1);

  const kpiCards = [
    { label: 'Active Trips',        value: activeTrips.length,     icon: Navigation,  href: '/tracking', note: 'In transit now' },
    { label: 'Pending Orders',      value: pendingOrders.length,    icon: ShoppingCart, href: '/orders',   note: 'Awaiting dispatch' },
    { label: 'Available Vehicles',  value: availableVehicles.length,icon: Truck,        href: '/vehicles', note: 'Ready to allocate' },
    { label: 'Available Drivers',   value: availableDrivers.length, icon: Users,        href: '/drivers',  note: 'On standby' },
    { label: 'Freight In Transit',  value: `${freightTons}t`,       icon: Weight,       href: '/trips',    note: 'Active payload' },
  ];

  // ---- Trip table ----
  const allTrips = [...trips].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  const filteredTrips = allTrips.filter(t => {
    if (activeTab === 'active')    return t.status === 'In Transit';
    if (activeTab === 'delivered') return t.status === 'Delivered';
    return true;
  });

  const recentOrders  = [...orders].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 5);
  const activeAlerts  = alerts.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="page-subtitle">Live fleet intelligence — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/orders')}>
            <Plus size={13} /> New Order
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/allocation')}>
            <MapPin size={13} /> Allocate Vehicle
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid-5">
        {kpiCards.map(({ label, value, icon: Icon, href, note }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer', gap: 12 }}>
              <div className="stat-icon">
                <Icon size={20} color="var(--brand)" />
              </div>
              <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--brand)', marginTop: 4, fontWeight: 600 }}>
                  {note} →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Critical system alerts (watermelon Alert pattern) ── */}
      {activeAlerts.filter(a => a.severity === 'critical').slice(0, 1).map(a => (
        <AlertBanner key={a.id} variant="error" title={a.title} dismissible>
          {a.description}
        </AlertBanner>
      ))}
      {activeAlerts.filter(a => a.severity === 'warning').slice(0, 1).map(a => (
        <AlertBanner key={a.id} variant="warning" title={a.title} dismissible>
          {a.description}
        </AlertBanner>
      ))}

      {/* ── Real-Time Fleet Telemetry & Performance (Shadcn Recharts Area Charts) ── */}
      <div className="grid-2">
        <FleetActivityAreaChart />
        <FleetPerformanceGradientChart />
      </div>

      {/* ── Active trips + recent orders stacked lists (watermelon list-stack pattern) ── */}
      {(activeTrips.length > 0 || recentOrders.length > 0) && (
        <div className="grid-2">
          {activeTrips.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                Active Trips ({activeTrips.length})
              </div>
              <ListStack
                items={activeTrips.slice(0, 4).map(t => ({
                  id: t.id,
                  title: t.id,
                  subtitle: `${t.origin.split(',')[0]} \u2192 ${t.destination.split(',')[0]}`,
                  meta: `ETA ${t.eta || '\u2014'}`,
                  badge: t.status,
                  badgeVariant: 'blue' as const,
                  icon: <Truck size={16} />,
                  onClick: () => router.push(`/tracking?trip=${t.id}`),
                }))}
                cardHeight={62}
              />
            </div>
          )}
          {recentOrders.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                Recent Orders
              </div>
              <ListStack
                items={recentOrders.slice(0, 4).map(o => ({
                  id: o.id,
                  title: o.id,
                  subtitle: `${o.origin.split(',')[0]} \u2192 ${o.destination.split(',')[0]}`,
                  meta: o.totalWeight ? `${o.totalWeight} kg` : undefined,
                  badge: o.status,
                  badgeVariant: (
                    o.status === 'Delivered' ? 'green' :
                    o.status === 'Pending'   ? 'yellow' :
                    o.status === 'Cancelled' ? 'gray'   : 'blue'
                  ) as 'blue' | 'green' | 'yellow' | 'gray',
                  icon: <ShoppingCart size={16} />,
                  onClick: () => router.push('/orders'),
                }))}
                cardHeight={62}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Fleet Trip Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={16} color="var(--brand)" />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-high)' }}>Fleet Activity</span>
            <span style={{
              background: 'var(--brand-10)', color: 'var(--brand)', fontSize: 10,
              fontWeight: 700, padding: '2px 7px', borderRadius: 10, border: '1px solid var(--brand-20)',
            }}>{trips.length} trips</span>
          </div>

          {/* Tab filters */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'active', 'delivered'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '4px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  background: activeTab === tab ? 'var(--brand)' : 'var(--surface-2)',
                  color: activeTab === tab ? '#fff' : 'var(--text-mid)',
                  borderColor: activeTab === tab ? 'var(--brand)' : 'var(--border)',
                  transition: 'all 0.13s',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <Link href="/trips" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <ArrowRight size={13} />
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Route</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Progress</th>
                <th>ETA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-low)' }}>
                    No trips match this filter.
                  </td>
                </tr>
              ) : (
                filteredTrips.map(trip => {
                  const driver  = drivers.find(d => d.id === trip.driverId);
                  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                  return (
                    <tr key={trip.id} onClick={() => router.push('/tracking')} style={{ cursor: 'pointer' }}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--brand)' }}>
                          {trip.id}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)' }}>
                          {trip.origin.split(',')[0]} → {trip.destination.split(',')[0]}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{trip.distance} km</div>
                      </td>
                      <td style={{ color: 'var(--text-mid)', fontSize: 12.5 }}>
                        {driver ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar name={driver.name} size="xs" status={driver.status === 'Available' ? 'online' : 'busy'} />
                            <span>{driver.name}</span>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-mid)', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>
                        {vehicle?.vehicleNo || '—'}
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div className="progress-bar" style={{ flex: 1, height: 5 }}>
                            <div className="progress-fill" style={{ width: `${trip.progress}%` }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', width: 30 }}>
                            {trip.progress}%
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        {trip.eta || (trip.status === 'Delivered' ? 'Arrived' : '—')}
                      </td>
                      <td>
                        <BadgeWithDot
                          color={trip.status === 'In Transit' ? 'brand' : trip.status === 'Delivered' ? 'success' : 'gray'}
                          pulse={trip.status === 'In Transit'}
                          size="sm"
                        >
                          {trip.status}
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

      {/* ── Secondary Grid: Recent Orders + Alerts ── */}
      <div className="grid-2">
        {/* Recent Orders */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={15} color="var(--brand)" />
              <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-high)' }}>Recent Orders</span>
            </div>
            <Link href="/orders" style={{ fontSize: 11.5, color: 'var(--brand)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div>
            {recentOrders.map((order, i) => {
              const customer = customers.find(c => c.id === order.customerId);
              return (
                <div
                  key={order.id}
                  onClick={() => router.push('/orders')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 16px', borderBottom: i < recentOrders.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--brand-10)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>{order.id}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 1 }}>
                      {customer?.name || 'Unknown'} · {order.destination.split(',')[0]}
                    </div>
                  </div>
                  <BadgeWithDot
                    color={
                      order.status === 'Pending' ? 'warning' :
                      order.status === 'Delivered' ? 'success' :
                      order.status === 'Allocated' ? 'brand' : 'gray'
                    }
                    pulse={order.status === 'Pending'}
                    size="sm"
                  >
                    {order.status}
                  </BadgeWithDot>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Alerts */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} color="var(--brand)" />
              <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-high)' }}>System Alerts</span>
            </div>
            {activeAlerts.length > 0 && (
              <span className="badge badge-blue">{activeAlerts.length} active</span>
            )}
          </div>
          <div>
            {activeAlerts.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-low)' }}>
                <CheckCircle2 size={28} color="var(--brand)" style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>All systems normal</div>
              </div>
            ) : (
              activeAlerts.map((alert, i) => {
                const Icon = alert.severity === 'critical' ? XCircle : AlertTriangle;
                return (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '11px 16px',
                      borderBottom: i < activeAlerts.length - 1 ? '1px solid var(--border)' : 'none',
                      borderLeft: `3px solid var(--brand)`,
                    }}
                  >
                    <Icon size={14} color="var(--brand)" style={{ marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)' }}>{alert.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2, lineHeight: 1.35 }}>{alert.description}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    
    </div>
  );
}
