'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  CheckCircle, Truck,
  AlertTriangle, Clock, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

export default function AllocationPage() {
  const { orders, vehicles, drivers, customers, allocateVehicle } = useStore();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [allocated, setAllocated] = useState(false);
  const [allocatedVehNo, setAllocatedVehNo] = useState('');
  const [overrideModal, setOverrideModal] = useState<{ vehicleId: string; reason: string } | null>(null);
  const router = useRouter();

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const activeOrder = orders.find(o => o.id === (selectedOrder || pendingOrders[0]?.id)) || null;
  const customer = activeOrder ? customers.find(c => c.id === activeOrder.customerId) : null;

  // Calculate matching & alternative vehicles for activeOrder
  const evaluatedVehicles = vehicles.map(v => {
    const assignedDriver = drivers.find(d => d.id === v.driverId);
    const availableCap = v.capacity - v.currentLoad;
    const reqWeight = activeOrder ? activeOrder.totalWeight : 0;
    const diff = availableCap - reqWeight;
    const isFit = diff >= 0;
    const isMaintenance = v.status === 'Maintenance';
    const isBusy = v.status === 'In Transit';
    const utilization = isFit && availableCap > 0 ? Math.round((reqWeight / v.capacity) * 100) : 0;

    let reason: string | null = null;
    let canOverride = false;

    if (isMaintenance) {
      reason = 'In Maintenance';
    } else if (isBusy) {
      reason = 'In Transit (ETA > 4hrs)';
      canOverride = true;
    } else if (!isFit) {
      reason = `Insufficient Capacity (${diff.toLocaleString()} kg)`;
    } else if (!assignedDriver || assignedDriver.status !== 'Available') {
      reason = 'Driver off duty or unavailable';
      canOverride = true;
    }

    const isRecommended = isFit && !isMaintenance && !isBusy && assignedDriver && assignedDriver.status === 'Available';

    return {
      ...v,
      driver: assignedDriver,
      availableCap,
      diff,
      isFit,
      utilization,
      reason,
      canOverride,
      isRecommended
    };
  });

  const recommendedVehicle = evaluatedVehicles.find(v => v.isRecommended);
  const alternativeVehicles = evaluatedVehicles.filter(v => v.id !== recommendedVehicle?.id);

  const handleAllocate = (vehicleId: string, driverId: string, overrideReason?: string) => {
    if (!activeOrder) return;
    const veh = vehicles.find(v => v.id === vehicleId);
    setAllocatedVehNo(veh?.vehicleNo || vehicleId);
    allocateVehicle(activeOrder.id, vehicleId, driverId, overrideReason);
    toast(
      'Fleet Asset Dispatched & Assigned',
      `Order ${activeOrder.id} successfully paired with ${veh?.vehicleNo || vehicleId}. Transferred to Bay Staging.`,
      'success'
    );
    setAllocated(true);
    setOverrideModal(null);
    setTimeout(() => {
      setAllocated(false);
      setSelectedOrder(null);
      router.push('/warehouse');
    }, 1500);
  };

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title">Smart Vehicle Allocation Engine</div>
          <div className="page-subtitle">{pendingOrders.length} shipments requiring vehicle & driver assignment</div>
        </div>
      </div>

      <div className="responsive-split-2">
        {/* Left Column: Pending Orders Queue */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Pending Orders ({pendingOrders.length})</span>
            <span className="badge badge-yellow" style={{ fontSize: 10 }}>Action Required</span>
          </div>

          {pendingOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
              All orders allocated!
            </div>
          ) : (
            pendingOrders.map(o => {
              const cust = customers.find(c => c.id === o.customerId);
              const isSelected = (activeOrder?.id === o.id);
              return (
                <div
                  key={o.id}
                  onClick={() => { setSelectedOrder(o.id); setAllocated(false); }}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-glow)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontWeight: 800, color: '#60a5fa', fontSize: 12.5 }}>{o.id}</span>
                    <span className="badge badge-yellow" style={{ fontSize: 10 }}>PENDING</span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, marginTop: 4 }}>{cust?.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {o.destination} • <strong style={{ color: 'var(--text-secondary)' }}>{o.totalWeight.toLocaleString()} kg</strong>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Section: Order Dossier + Recommendation + Alternatives */}
        <div>
          {!activeOrder ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 700 }}>Queue Clear</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>No pending orders require allocation.</div>
            </div>
          ) : allocated ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ animation: 'float 1s ease-in-out infinite' }}>
                <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>Vehicle Allocated Successfully!</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 8 }}>
                Assigned <strong style={{ color: 'white' }}>{allocatedVehNo}</strong> to {activeOrder.id}.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Redirecting to warehouse bay loading...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Order Dossier + Recommendation Split Grid (Stitch Screen 7) */}
              <div className="grid-2" style={{ gap: 16 }}>
                {/* Left Panel: Order Details */}
                <div className="card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: '#60a5fa' }}>{activeOrder.id}</span>
                    <span className="badge badge-yellow">PENDING ALLOCATION</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Customer</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{customer?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Corridor</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeOrder.origin.split(' ')[0]} → {activeOrder.destination}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Payload Required</span>
                      <span className="mono" style={{ fontWeight: 800, color: '#38bdf8' }}>{activeOrder.totalWeight.toLocaleString()} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-muted)' }}>SLA Deadline</span>
                      <span style={{ fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {activeOrder.deadline || 'Today 18:00'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Commodity Type</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Industrial Fasteners & Steel</span>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Recommended Match */}
                {recommendedVehicle ? (
                  <div className="rec-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          ⭐ RECOMMENDED MATCH
                        </span>
                        <span className="badge badge-green" style={{ fontSize: 10 }}>Optimal Fit</span>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {recommendedVehicle.vehicleNo}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                        {recommendedVehicle.type} • {recommendedVehicle.capacity.toLocaleString()} kg Capacity
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '12px 0', padding: 10, background: 'rgba(0,0,0,0.25)', borderRadius: 8, fontSize: 12 }}>
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Utilization</div>
                          <div style={{ fontWeight: 800, color: '#34d399', fontSize: 14 }}>{recommendedVehicle.utilization}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Assigned Driver</div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{recommendedVehicle.driver?.name || 'Ahmed Khan'}</div>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-success w-full btn-lg"
                      style={{ justifyContent: 'center' }}
                      onClick={() => handleAllocate(recommendedVehicle.id, recommendedVehicle.driver?.id || 'D001')}
                    >
                      <Truck size={16} /> ALLOCATE THIS TRUCK
                    </button>
                  </div>
                ) : (
                  <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
                    <div>
                      <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontWeight: 700, fontSize: 13 }}>No Exact 100% Fit</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Review alternative fleet options below</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Panel: Alternative Vehicles Table (Stitch Screen 7) */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>
                    Alternative Fleet Vehicles & Feasibility Matrix
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Automated constraint solver</span>
                </div>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vehicle No.</th>
                      <th>Capacity</th>
                      <th>Assigned Driver</th>
                      <th>Status / Reason</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alternativeVehicles.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 12.5, color: 'var(--text-primary)' }}>
                            {v.vehicleNo}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.type}</div>
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: 12 }}>{v.capacity.toLocaleString()} kg</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12 }}>{v.driver?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</span>
                        </td>
                        <td>
                          {v.reason?.includes('Insufficient') ? (
                            <span className="badge badge-red" style={{ fontSize: 11 }}>{v.reason}</span>
                          ) : v.reason?.includes('Maintenance') ? (
                            <span className="badge badge-yellow" style={{ fontSize: 11 }}>{v.reason}</span>
                          ) : v.reason?.includes('In Transit') ? (
                            <span className="badge badge-purple" style={{ fontSize: 11 }}>{v.reason}</span>
                          ) : (
                            <span className="badge badge-gray" style={{ fontSize: 11 }}>{v.reason || 'Sub-optimal'}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {v.canOverride ? (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => setOverrideModal({ vehicleId: v.id, reason: v.reason || 'Manager Override' })}
                            >
                              Override
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Incompatible</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Override Reason Modal */}
      {overrideModal && (
        <div className="modal-overlay" onClick={() => setOverrideModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b' }}>
                <ShieldAlert size={18} />
                Manager Allocation Override
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              This vehicle has constraint warning: <strong style={{ color: '#ef4444' }}>{overrideModal.reason}</strong>.
              Confirm override to assign it anyway?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setOverrideModal(null)}>Cancel</button>
              <button
                className="btn btn-warning"
                style={{ flex: 1.5 }}
                onClick={() => handleAllocate(overrideModal.vehicleId, 'D001', 'Manager Verified Override')}
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
