'use client';
// ─── Today — the operations dashboard ─────────────────────────────────────────
// Management by exception (docs/DESIGN_SYSTEM.md §6): one sentence of what needs attention,
// a status strip whose context lines come from live data, a "Needs attention" list that links to
// where each thing gets fixed, and the trip board. Every figure on this page is computed from
// the workspace's own records; nothing is illustrative.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertOctagon, AlertTriangle, ArrowRight, CheckCircle2, Clock, FileWarning, MapPin, PackageOpen, Plus,
} from 'lucide-react';
import { useVehicles } from '@/features/vehicles/hooks';
import { useDrivers } from '@/features/drivers/hooks';
import { useOrders } from '@/features/orders/hooks';
import { useTrips } from '@/features/trips/hooks';
import { useSystemAlerts } from '@/lib/liveNotifications';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { maskLicence } from '@/lib/masking';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';
import { Skeleton } from '@/components/ui/Skeleton';
import { CountUp } from '@/components/ui/CountUp';

type Tone = 'ok' | 'warn' | 'error' | 'neutral';

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const city = (place: string) => place.split(',')[0].trim();
const kg = (n: number) => `${n.toLocaleString('en-IN')} kg`;

function daysUntil(date: string): number {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? Infinity : Math.ceil((t - Date.now()) / 86_400_000);
}

function waitingFor(createdAt: string): string {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (!Number.isFinite(hours) || hours < 0) return '';
  if (hours < 1) return 'just booked';
  if (hours < 24) return `waiting ${Math.floor(hours)} h`;
  const days = Math.floor(hours / 24);
  return `waiting ${days} ${plural(days, 'day', 'days')}`;
}

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(new Date()));
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

/** "a, b and c" */
function listSentence(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

interface AttentionItem {
  key: string;
  tone: 'error' | 'warn';
  icon: typeof AlertTriangle;
  title: string;
  detail: string;
  href?: string;
  action?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { drivers, loading: driversLoading } = useDrivers();
  const { orders, loading: ordersLoading } = useOrders();
  const { trips, loading: tripsLoading } = useTrips();
  const { alerts } = useSystemAlerts(30000);
  const loading = vehiclesLoading || driversLoading || ordersLoading || tripsLoading;

  // ── Facts ───────────────────────────────────────────────────────────────────
  const pending = orders.filter(o => o.status === 'Pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const allocated = orders.filter(o => o.status === 'Allocated');
  const onRoad = trips.filter(t => t.status === 'In Transit');
  const freeTrucks = vehicles.filter(v => v.status === 'Available');
  const inWorkshop = vehicles.filter(v => v.status === 'Maintenance');
  const freeDrivers = drivers.filter(d => d.status === 'Available');
  const unverified = drivers.filter(d => !d.documentVerified);
  const licenceDue = drivers.filter(d => d.documentVerified && daysUntil(d.licenseExpiry) <= 30);
  const critical = alerts.filter(a => a.severity === 'critical');
  const warnings = alerts.filter(a => a.severity === 'warning');
  const tonnesMoving = onRoad.reduce((sum, t) => sum + (orders.find(o => o.id === t.orderId)?.totalWeight ?? 0), 0) / 1000;

  // ── One sentence of what needs attention ────────────────────────────────────
  const needs: string[] = [];
  if (pending.length) needs.push(`${pending.length} ${plural(pending.length, 'order is', 'orders are')} waiting for a truck`);
  const alertCount = critical.length + warnings.length;
  if (alertCount) needs.push(`${alertCount} ${plural(alertCount, 'alert needs', 'alerts need')} a look`);
  const docCount = unverified.length + licenceDue.length;
  if (docCount) needs.push(`${docCount} driver ${plural(docCount, 'document needs', 'documents need')} checking`);
  const summary = needs.length ? `${listSentence(needs)}.` : 'Nothing needs your attention right now.';
  const firstName = user.name && user.name !== '…' ? user.name.split(' ')[0] : '';

  // ── Status strip ────────────────────────────────────────────────────────────
  const strip: { label: string; value: string; context: string; href: string; tone: Tone }[] = [
    {
      label: 'Waiting for a truck', value: String(pending.length), href: '/allocation',
      context: allocated.length ? `${allocated.length} allocated, not yet loaded` : 'none allocated yet',
      tone: pending.length ? 'warn' : 'ok',
    },
    {
      label: 'On the road', value: String(onRoad.length), href: '/tracking',
      context: onRoad.length ? `${tonnesMoving.toFixed(1)} t moving` : 'no trips running', tone: 'neutral',
    },
    {
      label: 'Trucks free', value: String(freeTrucks.length), href: '/vehicles',
      context: `of ${vehicles.length}${inWorkshop.length ? ` · ${inWorkshop.length} in workshop` : ''}`,
      tone: vehicles.length && !freeTrucks.length ? 'warn' : 'neutral',
    },
    {
      label: 'Drivers free', value: String(freeDrivers.length), href: '/drivers',
      context: `of ${drivers.length}`, tone: drivers.length && !freeDrivers.length ? 'warn' : 'neutral',
    },
    {
      label: 'Alerts', value: String(alertCount), href: '/agent-ops',
      context: critical.length ? `${critical.length} critical` : alertCount ? 'none critical' : 'all clear',
      tone: critical.length ? 'error' : alertCount ? 'warn' : 'ok',
    },
  ];

  // ── Needs attention ─────────────────────────────────────────────────────────
  const attention: AttentionItem[] = [
    ...critical.map(a => ({ key: a.id, tone: 'error' as const, icon: AlertOctagon, title: a.title, detail: a.description })),
    ...warnings.map(a => ({ key: a.id, tone: 'warn' as const, icon: AlertTriangle, title: a.title, detail: a.description })),
    ...pending.slice(0, 4).map(o => ({
      key: o.id, tone: 'warn' as const, icon: PackageOpen,
      title: `${o.id} needs a truck`,
      detail: [`${city(o.origin)} → ${city(o.destination)}`, o.totalWeight ? kg(o.totalWeight) : '', waitingFor(o.createdAt)].filter(Boolean).join(' · '),
      href: '/allocation', action: 'Allocate',
    })),
    ...unverified.map(d => ({
      key: `doc-${d.id}`, tone: 'warn' as const, icon: FileWarning,
      title: `${d.name}: documents not verified`, detail: 'Can’t be assigned to a trip until verified',
      href: '/drivers', action: 'Review',
    })),
    ...licenceDue.map(d => {
      const days = daysUntil(d.licenseExpiry);
      return {
        key: `lic-${d.id}`, tone: (days < 0 ? 'error' : 'warn') as 'error' | 'warn', icon: FileWarning,
        title: `${d.name}: licence ${days < 0 ? 'expired' : `expires in ${days} ${plural(days, 'day', 'days')}`}`,
        detail: `Licence ${maskLicence(d.licenseNo)}`, href: '/drivers', action: 'Review',
      };
    }),
  ];

  // ── Fleet and order mix (real counts) ───────────────────────────────────────
  const fleetMix = [
    { label: 'Free', n: freeTrucks.length, color: 'var(--status-done)' },
    { label: 'On trip', n: vehicles.filter(v => v.status === 'In Transit').length, color: 'var(--status-active)' },
    { label: 'Workshop', n: inWorkshop.length, color: 'var(--status-neutral)' },
  ];
  const orderMix = [
    { label: 'Waiting', n: pending.length, color: 'var(--marking)' },
    { label: 'Allocated', n: allocated.length, color: 'var(--status-neutral)' },
    { label: 'On the road', n: orders.filter(o => o.status === 'In Transit').length, color: 'var(--status-active)' },
    { label: 'Delivered', n: orders.filter(o => o.status === 'Delivered').length, color: 'var(--status-done)' },
  ];

  const board = [...trips].sort((a, b) => {
    if ((a.status === 'In Transit') !== (b.status === 'In Transit')) return a.status === 'In Transit' ? -1 : 1;
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
  }).slice(0, 8);

  return (
    <div className="today">
      {/* ── Greeting + what needs attention ── */}
      <header className="today-head">
        <div>
          <h1 className="today-greeting">{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
          {loading ? <Skeleton className="h-5 w-80 mt-2" /> : <p className="today-summary">{summary}</p>}
        </div>
        <div className="today-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/orders')}>
            <Plus size={14} /> New order
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/allocation')}>
            <MapPin size={14} /> Allocate trucks
          </button>
        </div>
      </header>

      {/* ── Status strip ── */}
      <nav className="status-strip" aria-label="Operations at a glance">
        {strip.map(s => (
          <Link key={s.label} href={s.href} className={`status-cell tone-${s.tone}`}>
            <span className="status-label">{s.label}</span>
            {loading ? <Skeleton className="h-8 w-12 my-1" /> : <span className="status-value figure"><CountUp value={s.value} /></span>}
            <span className="status-context">{loading ? ' ' : s.context}</span>
          </Link>
        ))}
      </nav>

      <div className="today-grid">
        {/* ── Needs attention ── */}
        <section className="card today-panel" aria-labelledby="attention-title">
          <div className="today-panel-head">
            <h2 id="attention-title">Needs attention</h2>
            {!loading && attention.length > 0 && <span className="badge badge-yellow">{attention.length}</span>}
          </div>
          {loading ? (
            <div className="today-list">{[0, 1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : attention.length === 0 ? (
            <div className="today-empty">
              <CheckCircle2 size={22} color="var(--status-done)" />
              <div>
                <div className="today-empty-title">All clear</div>
                <div className="today-empty-text">No waiting orders, alerts or driver documents to check.</div>
              </div>
            </div>
          ) : (
            <ul className="today-list">
              {attention.slice(0, 8).map(item => {
                const Icon = item.icon;
                const body = (
                  <>
                    <Icon size={16} className={`attention-icon tone-${item.tone}`} aria-hidden="true" />
                    <div className="attention-text">
                      <div className="attention-title">{item.title}</div>
                      <div className="attention-detail">{item.detail}</div>
                    </div>
                    {item.action && <span className="attention-action">{item.action} <ArrowRight size={13} /></span>}
                  </>
                );
                return (
                  <li key={item.key}>
                    {item.href ? <Link href={item.href} className="attention-row">{body}</Link> : <div className="attention-row">{body}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Fleet and orders right now ── */}
        <section className="card today-panel" aria-labelledby="mix-title">
          <div className="today-panel-head">
            <h2 id="mix-title">Right now</h2>
          </div>
          {[{ title: `Trucks (${vehicles.length})`, rows: fleetMix, total: vehicles.length },
            { title: `Orders (${orders.length})`, rows: orderMix, total: orders.length }].map(group => (
            <div key={group.title} className="mix">
              <div className="mix-title">{group.title}</div>
              <div className="mix-bar" role="img" aria-label={group.rows.map(r => `${r.label} ${r.n}`).join(', ')}>
                {group.total > 0 && group.rows.filter(r => r.n > 0).map(r => (
                  <span key={r.label} style={{ flexGrow: r.n, background: r.color }} />
                ))}
              </div>
              <ul className="mix-legend">
                {group.rows.map(r => (
                  <li key={r.label}><span className="mix-swatch" style={{ background: r.color }} />{r.label}<b className="figure">{r.n}</b></li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>

      {/* ── Trip board ── */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }} aria-labelledby="board-title">
        <div className="today-panel-head" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          <h2 id="board-title">Trips</h2>
          <Link href="/trips" className="today-link">All trips <ArrowRight size={13} /></Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Trip</th><th>Route</th><th>Driver</th><th>Truck</th><th>Progress</th><th>ETA</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><Skeleton className="h-6 w-full" /></td></tr>
              ) : board.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-low)' }}>
                  No trips yet. Allocate a truck to a waiting order to start one.
                </td></tr>
              ) : board.map(trip => {
                const driver = drivers.find(d => d.id === trip.driverId);
                const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                return (
                  <tr key={trip.id} className="clickable" onClick={() => router.push(`/tracking?trip=${trip.id}`)}>
                    <td className="mono" style={{ fontSize: 12.5, color: 'var(--text-high)' }}>{trip.id}</td>
                    <td>
                      <div style={{ color: 'var(--text-high)' }}>{city(trip.origin)} → {city(trip.destination)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{trip.distance} km</div>
                    </td>
                    <td>{driver?.name ?? '—'}</td>
                    <td className="mono" style={{ fontSize: 12.5 }}>{vehicle?.vehicleNo ?? '—'}</td>
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
                        <Clock size={12} aria-hidden="true" />
                        {trip.eta || (trip.status === 'Delivered' ? 'Arrived' : '—')}
                      </span>
                    </td>
                    <td>
                      <BadgeWithDot color={trip.status === 'In Transit' ? 'info' : trip.status === 'Delivered' ? 'success' : 'gray'} size="sm">
                        {trip.status}
                      </BadgeWithDot>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
