// ─── Product preview: the "Today" dashboard, as it looks in the demo workspace ─
// Built from the app's own classes (status strip, attention rows, trip table, sidebar items),
// so it changes when the app changes. Static and inert: no data fetching, nothing clickable.
// The figures are the demo workspace's (scripts/seed.ts), with city names in place of hub names.

import {
  AlertOctagon, AlertTriangle, ArrowRight, BookOpen, Clock, Cpu, FileText, FileWarning, LayoutDashboard,
  MapPin, Menu, Navigation, Package, PackageCheck, PackageOpen, Plus, Search, ShoppingCart, Sparkles,
  Truck, Users, Warehouse,
} from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandMark';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';

const NAV = [
  { label: 'Overview', items: [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Cpu, label: 'EdgePilot AI Ops' },
  ] },
  { label: 'Operations', items: [
    { icon: ShoppingCart, label: 'Orders', count: 1 },
    { icon: MapPin, label: 'Allocation' },
    { icon: Warehouse, label: 'Warehouse & Bays' },
    { icon: Navigation, label: 'Trips' },
  ] },
  { label: 'Delivery & billing', items: [
    { icon: Package, label: 'Corridor Tracking', count: 1 },
    { icon: Search, label: 'Customer Tracking' },
    { icon: PackageCheck, label: 'Delivery & POD' },
    { icon: FileText, label: 'Invoices & Billing' },
  ] },
  { label: 'Fleet & drivers', items: [
    { icon: Truck, label: 'Vehicles' },
    { icon: Users, label: 'Drivers' },
  ] },
  { label: 'Sales & knowledge', items: [
    { icon: Sparkles, label: 'Leads CRM', count: 2 },
    { icon: BookOpen, label: 'Knowledge Base' },
  ] },
];

const STRIP = [
  { label: 'Waiting for a truck', value: '1', context: '1 allocated, not yet loaded', tone: 'warn' },
  { label: 'On the road', value: '1', context: '9.0 t moving', tone: 'neutral' },
  { label: 'Trucks free', value: '3', context: 'of 6 · 1 in workshop', tone: 'neutral' },
  { label: 'Drivers free', value: '3', context: 'of 6', tone: 'neutral' },
  { label: 'Alerts', value: '2', context: '1 critical', tone: 'error' },
];

const ATTENTION = [
  { icon: AlertOctagon, tone: 'error', title: 'Deepak Verma: licence renewal due', detail: 'Commercial licence expires in under 60 days. Upload pending in the driver portal.' },
  { icon: AlertTriangle, tone: 'warn', title: 'Fog on the Lucknow–Agra corridor', detail: 'Reduced visibility on NH-19. 50 km/h recommended for heavy vehicles.' },
  { icon: PackageOpen, tone: 'warn', title: 'ORD-1001 needs a truck', detail: 'Lucknow → Kanpur · 7,500 kg · waiting 2 h', action: 'Allocate' },
  { icon: FileWarning, tone: 'warn', title: 'Deepak Verma: documents not verified', detail: 'Can’t be assigned to a trip until verified', action: 'Review' },
];

const MIX = [
  { title: 'Trucks (6)', rows: [
    { label: 'Free', n: 3, color: 'var(--status-done)' },
    { label: 'On trip', n: 2, color: 'var(--status-active)' },
    { label: 'Workshop', n: 1, color: 'var(--status-neutral)' },
  ] },
  { title: 'Orders (5)', rows: [
    { label: 'Waiting', n: 1, color: 'var(--marking)' },
    { label: 'Allocated', n: 1, color: 'var(--status-neutral)' },
    { label: 'On the road', n: 1, color: 'var(--status-active)' },
    { label: 'Delivered', n: 2, color: 'var(--status-done)' },
  ] },
];

const TRIPS = [
  { id: 'TRP-1001', route: 'Lucknow → Delhi NCR', km: 512, driver: 'Ravi Kumar', truck: 'UP32 CD 5678', progress: 58, eta: '3 h 15 min', status: 'In Transit' },
  { id: 'TRP-1002', route: 'Lucknow → Prayagraj', km: 200, driver: 'Imran Ali', truck: 'UP32 EF 9012', progress: 100, eta: 'Arrived', status: 'Delivered' },
];

export function ProductPreview() {
  return (
    <div className="mk-app" aria-hidden="true" inert>
      <div className="mk-app-side">
        <div className="mk-app-ws">
          <BrandMark size={30} />
          <div>
            <b>Demo Workspace</b>
            <span>GROWTH · FLEET OWNER</span>
          </div>
        </div>
        {NAV.map(section => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`nav-item${'active' in item ? ' active' : ''}`}>
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                  {'count' in item && <span className="nav-badge">{item.count}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mk-app-main">
        <div className="mk-app-bar">
          <Menu size={18} className="mk-app-menu" />
          <div className="mk-app-title">
            <b>Today</b>
            <span>What needs attention across your fleet</span>
          </div>
          <span className="mk-app-user">AM</span>
        </div>

        <div className="mk-app-body today">
          <div className="today-head">
            <div>
              <div className="today-greeting">Good morning, Alex</div>
              <p className="today-summary">1 order is waiting for a truck, 2 alerts need a look and 1 driver document needs checking.</p>
            </div>
            <div className="today-actions">
              <span className="btn btn-secondary btn-sm"><Plus size={14} /> New order</span>
              <span className="btn btn-primary btn-sm"><MapPin size={14} /> Allocate trucks</span>
            </div>
          </div>

          <div className="status-strip">
            {STRIP.map(s => (
              <div key={s.label} className={`status-cell tone-${s.tone}`}>
                <span className="status-label">{s.label}</span>
                <span className="status-value figure">{s.value}</span>
                <span className="status-context">{s.context}</span>
              </div>
            ))}
          </div>

          <div className="today-grid">
            <div className="card today-panel">
              <div className="today-panel-head">
                <div style={{ fontSize: 14, fontWeight: 600 }}>Needs attention</div>
                <span className="badge badge-yellow">{ATTENTION.length}</span>
              </div>
              <div className="today-list">
                {ATTENTION.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="attention-row">
                      <Icon size={16} className={`attention-icon tone-${item.tone}`} />
                      <div className="attention-text">
                        <div className="attention-title">{item.title}</div>
                        <div className="attention-detail">{item.detail}</div>
                      </div>
                      {item.action && <span className="attention-action">{item.action} <ArrowRight size={13} /></span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card today-panel">
              <div className="today-panel-head">
                <div style={{ fontSize: 14, fontWeight: 600 }}>Right now</div>
              </div>
              {MIX.map(group => (
                <div key={group.title} className="mix">
                  <div className="mix-title">{group.title}</div>
                  <div className="mix-bar">
                    {group.rows.map(r => <span key={r.label} style={{ flexGrow: r.n, background: r.color }} />)}
                  </div>
                  <div className="mix-legend">
                    {group.rows.map(r => (
                      <span key={r.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span className="mix-swatch" style={{ background: r.color }} />{r.label}<b className="figure">{r.n}</b>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="today-panel-head" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Trips</div>
              <span className="today-link">All trips <ArrowRight size={13} /></span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Trip</th><th>Route</th><th>Driver</th><th>Truck</th><th>Progress</th><th>ETA</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {TRIPS.map(trip => (
                    <tr key={trip.id}>
                      <td className="mono" style={{ fontSize: 12.5, color: 'var(--text-high)' }}>{trip.id}</td>
                      <td>
                        <div style={{ color: 'var(--text-high)' }}>{trip.route}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{trip.km} km</div>
                      </td>
                      <td>{trip.driver}</td>
                      <td className="mono" style={{ fontSize: 12.5 }}>{trip.truck}</td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1, height: 5 }}>
                            <div className="progress-fill" style={{ width: `${trip.progress}%` }} />
                          </div>
                          <span className="figure" style={{ fontSize: 13, width: 34, color: 'var(--text-high)' }}>{trip.progress}%</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          {trip.eta}
                        </span>
                      </td>
                      <td>
                        <BadgeWithDot color={trip.status === 'In Transit' ? 'info' : 'success'} size="sm">{trip.status}</BadgeWithDot>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
