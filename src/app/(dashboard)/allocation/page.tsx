'use client';
import { useState } from 'react';
import { useAllocation } from '@/features/allocation/hooks';
import {
  CheckCircle, Truck,
  AlertTriangle, Clock, CheckCircle2, ShieldAlert, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { DotPulse } from '@/components/ui/DotPulse';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';

export default function AllocationPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const { pendingOrders, activeOrder, customer, evaluatedVehicles, recommendedVehicle, alternativeVehicles, allocateVehicle } = useAllocation(selectedOrder);
  const [allocated, setAllocated] = useState(false);
  const [allocatedVehNo, setAllocatedVehNo] = useState('');
  const [overrideModal, setOverrideModal] = useState<{ vehicleId: string; reason: string } | null>(null);
  const router = useRouter();



  const handleAllocate = (vehicleId: string, driverId: string, overrideReason?: string) => {
    if (!activeOrder) return;
    const veh = evaluatedVehicles.find(v => v.id === vehicleId);
    setAllocatedVehNo(veh?.vehicleNo || vehicleId);
    allocateVehicle(activeOrder.id, vehicleId, driverId);
    toast.success('Fleet Asset Dispatched & Assigned', {
      description: overrideReason
        ? `Order ${activeOrder.id} override assigned (${overrideReason}). Transferred to Bay Staging.`
        : `Order ${activeOrder.id} successfully paired with ${veh?.vehicleNo || vehicleId}. Transferred to Bay Staging.`
    });
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

      {/* Allocation Alert — watermelon AlertBanner pattern */}
      {pendingOrders.length > 0 ? (
        <AlertBanner
          variant="warning"
          title={`${pendingOrders.length} order(s) awaiting fleet asset allocation`}
          dismissible
        >
          Assign available vehicles and verified commercial drivers to prevent dispatch schedule delays.
        </AlertBanner>
      ) : (
        <AlertBanner
          variant="success"
          title="All orders successfully allocated and staged"
          compact
          dismissible
        />
      )}

      <div className="responsive-split-2">
        {/* Left Column: Pending Orders Queue */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Pending Orders ({pendingOrders.length})</span>
            <span className="badge badge-yellow" style={{ fontSize: 10 }}>Action Required</span>
          </div>

          {pendingOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-low)', fontSize: 13 }}>
              <CheckCircle2 size={36} color="var(--brand)" style={{ margin: '0 auto 10px' }} />
              All orders allocated!
            </div>
          ) : (
            pendingOrders.map(o => {
              const cust = o.customerId === customer?.id ? customer : null;
              const isSelected = (activeOrder?.id === o.id);
              return (
                <div
                  key={o.id}
                  onClick={() => { setSelectedOrder(o.id); setAllocated(false); }}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--brand-10)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--brand)' : '3px solid transparent',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 12.5 }}>{o.id}</span>
                    <BadgeWithDot color="warning" size="sm" pulse>PENDING</BadgeWithDot>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-high)', fontSize: 13, marginTop: 4 }}>{cust?.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>
                    {o.destination} · <strong style={{ color: 'var(--text-mid)' }}>{(o.totalWeight ?? 0).toLocaleString()} kg</strong>
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
              <CheckCircle size={44} color="var(--brand)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 700 }}>Queue Clear</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-low)', marginTop: 4 }}>No pending orders require allocation.</div>
            </div>
          ) : allocated ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ animation: 'float 1s ease-in-out infinite' }}>
                <CheckCircle size={56} color="var(--brand)" style={{ margin: '0 auto 16px' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)' }}>Vehicle Allocated Successfully!</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-mid)', marginTop: 8 }}>
                Assigned <strong style={{ color: 'var(--text-high)' }}>{allocatedVehNo}</strong> to {activeOrder.id}.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--surface-2)', padding: '5px 12px', borderRadius: 20 }}>
                <span>Redirecting to warehouse bay loading</span>
                <DotPulse size={4} color="var(--brand)" />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Order Dossier + Recommendation Split Grid (Stitch Screen 7) */}
              <div className="grid-2" style={{ gap: 16 }}>
                {/* Left Panel: Order Details */}
                <div className="card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: 'var(--brand)' }}>{activeOrder.id}</span>
                    <BadgeWithDot color="warning" size="sm" pulse>PENDING ALLOCATION</BadgeWithDot>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-low)' }}>Customer</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>{customer?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-low)' }}>Corridor</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>{activeOrder.origin.split(' ')[0]} → {activeOrder.destination}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-low)' }}>Payload Required</span>
                      <span className="mono" style={{ fontWeight: 800, color: 'var(--brand)' }}>{(activeOrder.totalWeight ?? 0).toLocaleString()} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      <span style={{ color: 'var(--text-low)' }}>SLA Deadline</span>
                      <span style={{ fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {activeOrder.deadline || 'Today 18:00'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-low)' }}>Commodity Type</span>
                      <span style={{ color: 'var(--text-mid)' }}>Industrial Fasteners & Steel</span>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Recommended Match */}
                {recommendedVehicle ? (
                  <div className="rec-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          <Sparkles size={12} /> RECOMMENDED MATCH
                        </span>
                        <span className="badge badge-green" style={{ fontSize: 10, fontWeight: 700 }}>Optimal Fit</span>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-high)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.3px' }}>
                        {recommendedVehicle.vehicleNo}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>
                        {recommendedVehicle.type} · {(recommendedVehicle.capacity ?? 0).toLocaleString()} kg Capacity
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        margin: '14px 0',
                        padding: '12px 14px',
                        background: 'var(--surface-2, #F3F2EF)',
                        border: '1px solid var(--border, #E6E4DF)',
                        borderRadius: 10,
                        fontSize: 12
                      }}>
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-mid, #525252)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Utilization</div>
                          <div style={{ fontWeight: 800, color: 'var(--brand, #0057FF)', fontSize: 16, marginTop: 2 }}>{recommendedVehicle.utilization}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-mid, #525252)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Driver</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                            <Avatar name={recommendedVehicle.driver?.name || 'Ahmed Khan'} size="xs" status="online" />
                            <span style={{ fontWeight: 700, color: 'var(--text-high, #141414)', fontSize: 13.5 }}>{recommendedVehicle.driver?.name || 'Ahmed Khan'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary w-full btn-lg"
                      style={{
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #0057FF, #0040CC)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: 13,
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 14px rgba(0, 87, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 10,
                        border: 'none',
                        padding: '12px 18px',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleAllocate(recommendedVehicle.id, recommendedVehicle.driver?.id || 'D001')}
                    >
                      <Truck size={16} /> ALLOCATE THIS TRUCK
                    </button>
                  </div>
                ) : (
                  <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
                    <div>
                      <AlertTriangle size={32} color="var(--brand)" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontWeight: 700, fontSize: 13 }}>No Exact 100% Fit</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>Review alternative fleet options below</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Panel: Alternative Vehicles Table (Stitch Screen 7) */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-mid)' }}>
                    Alternative Fleet Vehicles & Feasibility Matrix
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-low)' }}>Automated constraint solver</span>
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
                          <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 12.5, color: 'var(--text-high)' }}>
                            {v.vehicleNo}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{v.type}</div>
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: 12 }}>{(v.capacity ?? 0).toLocaleString()} kg</span>
                        </td>
                        <td>
                          {v.driver ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Avatar name={v.driver.name} size="xs" status="online" />
                              <span style={{ fontSize: 12, color: 'var(--text-high)' }}>{v.driver.name}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-low)' }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          <BadgeWithDot
                            color={
                              v.reason?.includes('Insufficient') ? 'error' :
                              v.reason?.includes('Maintenance') ? 'warning' :
                              v.reason?.includes('In Transit') ? 'brand' : 'gray'
                            }
                            size="sm"
                          >
                            {v.reason || 'Sub-optimal'}
                          </BadgeWithDot>
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
                            <span style={{ fontSize: 11, color: 'var(--text-low)' }}>Incompatible</span>
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

      {/* Override Reason Modal — rendered at body level via portal */}
      {overrideModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setOverrideModal(null)}>
            <div
              className="modal"
              style={{ maxWidth: 440, background: 'var(--surface-1)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand)' }}>
                  <ShieldAlert size={18} />
                  Manager Allocation Override
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 14 }}>
                This vehicle has constraint warning: <strong style={{ color: 'var(--brand-dark)' }}>{overrideModal.reason}</strong>.
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
        </ModalPortal>
      )}
    </div>
  );
}
