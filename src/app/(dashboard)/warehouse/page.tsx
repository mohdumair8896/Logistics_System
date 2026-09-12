'use client';
import { useState } from 'react';
import { useWarehouse } from '@/features/warehouse/hooks';

import {
  Warehouse, Package, CheckCircle, Truck,
  QrCode, Check, ShieldCheck, Layers, FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LabeledProgress } from '@/components/ui/LabeledProgress';
import { Checkbox16 } from '@/components/ui/Checkbox16';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeWithDot } from '@/components/ui/BadgeWithDot';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/Dialog';
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/Empty';
import { Skeleton } from '@/components/ui/Skeleton';

export default function WarehousePage() {
  const { orders, inventory, vehicles, drivers, confirmLoading, addTrip, scanOrderItem, customers, products } = useWarehouse();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [loadingBay, setLoadingBay] = useState('Bay 4 - North Dispatch');
  const [safetyChecks, setSafetyChecks] = useState({
    tirePressure: true,
    cargoStraps: true,
    sealVerified: true,
    manifestSigned: true
  });
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  const allocatedOrders = orders.filter(o => o.status === 'Allocated');
  const activeOrder = orders.find(o => o.id === (selectedOrder || allocatedOrders[0]?.id)) || null;
  const vehicle = activeOrder ? vehicles.find(v => v.id === activeOrder.vehicleId) : null;
  const driver = activeOrder ? drivers.find(d => d.id === activeOrder.driverId) : null;

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;
  const getInventory = (productId: string) => inventory.find(i => i.productId === productId)?.quantity || 0;

  const allSafetyChecked = Object.values(safetyChecks).every(Boolean);

  const handleScanAll = () => {
    if (!activeOrder) return;
    activeOrder.items.forEach(item => {
      scanOrderItem(activeOrder.id, item.productId);
    });
    toast.success('Cargo Manifest Verified', { description: `${activeOrder.items.length} pallet batches barcode scanned and cleared for loading.` });
  };

  const handleConfirmLoading = () => {
    if (!activeOrder) return;
    confirmLoading(activeOrder.id, loadingBay);
    const tripId = addTrip(activeOrder.id);
    toast.success('Transit Dispatched', { description: `Loading bay cleared. Corridor trip ${tripId} initiated on live GPS tracking.` });
    setLoaded(true);
    setTimeout(() => {
      router.push('/trips');
    }, 1500);
  };

  return (
    <div className="animate-slide-in">
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/warehouse">Operations</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Warehouse &amp; Staging Bays</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">Warehouse Staging &amp; Loading Manifest</div>
          <div className="page-subtitle">Bay allocation, cargo barcode scanning &amp; axle load distribution</div>
        </div>
      </div>

      {/* Inventory Stock Overview Cards */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-high)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Warehouse size={16} color="var(--brand)" /> Central Warehouse Inventory &amp; Storage Bays
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-low)' }}>Location: Lucknow Central Logistics Park</span>
        </div>

        <div className="grid-6">
          {products.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : (
            products.map(p => {
              const stock = getInventory(p.id);
              const low = stock < 10000;
              return (
                <div key={p.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{(p.category ?? 'General').split(' ')[0]}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: low ? 'var(--brand)' : 'var(--brand)', marginTop: 6 }}>
                    {stock.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-low)' }}>kg</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="responsive-split-2">
        {/* Left Column: Orders Ready for Loading */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Allocated Queue ({allocatedOrders.length})</span>
            <span className="badge badge-blue" style={{ fontSize: 10 }}>Ready to Load</span>
          </div>

          {allocatedOrders.length === 0 ? (
            <div style={{ padding: '32px 16px' }}>
              <Empty>
                <EmptyMedia>
                  <Package size={36} color="var(--text-low)" />
                </EmptyMedia>
                <EmptyTitle>No allocated orders</EmptyTitle>
                <EmptyDescription>All pending freight assignments have been staged and loaded.</EmptyDescription>
              </Empty>
            </div>
          ) : (
            allocatedOrders.map(o => {
              const cust = customers.find(c => c.id === o.customerId);
              const veh = vehicles.find(v => v.id === o.vehicleId);
              const isSelected = activeOrder?.id === o.id;
              return (
                <div
                  key={o.id}
                  onClick={() => { setSelectedOrder(o.id); setLoaded(false); }}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59,130,246,0.12)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--brand)' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 12.5 }}>{o.id}</span>
                    <BadgeWithDot color="brand" size="sm">ALLOCATED</BadgeWithDot>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-high)', fontSize: 13, marginTop: 4 }}>{cust?.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>
                    Truck: <strong style={{ color: 'var(--text-high)' }}>{veh?.vehicleNo}</strong> · {(o.totalWeight ?? 0).toLocaleString()} kg
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Section: Loading Bay Assignment + Manifest & Checklists (Stitch Screen 8) */}
        <div>
          {loaded ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ animation: 'float 1s ease-in-out infinite' }}>
                <CheckCircle size={56} color="var(--brand)" style={{ margin: '0 auto 16px' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)' }}>Cargo Loaded & Sealed!</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-mid)', marginTop: 8 }}>
                Trip created for vehicle {vehicle?.vehicleNo}. Dispatch authorized.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 6 }}>Redirecting to active trips corridor...</div>
            </div>
          ) : !activeOrder ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <Truck size={40} color="var(--text-low)" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-low)', fontSize: 13 }}>Select an allocated order to open staging bay</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Bay Assignment & Vehicle Banner (Stitch Screen 8) */}
              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(42,92,154,0.15), var(--surface-2))', border: '1px solid rgba(59,130,246,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      Staging Bay Assignment
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-high)', marginTop: 2 }}>
                      {loadingBay}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Assigned Truck & Driver</div>
                        <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>
                          {vehicle?.vehicleNo} ({driver?.name || 'Ahmed Khan'})
                        </div>
                      </div>
                      <Avatar name={driver?.name || 'Driver'} size="sm" status="online" />
                    </div>
                    <select
                      className="form-select"
                      style={{ width: 'auto', fontSize: 12 }}
                      value={loadingBay}
                      onChange={e => setLoadingBay(e.target.value)}
                    >
                      <option>Bay 4 - North Dispatch</option>
                      <option>Bay 2 - Heavy Express</option>
                      <option>Bay 1 - Bulk Staging</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Manifest with Barcode Scan Verification (Stitch Screen 8) */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-high)' }}>
                      Cargo Manifest & Barcode Verification
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-low)' }}>
                      Scan each pallet batch prior to truck loading
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Dialog>
                      <DialogTrigger render={
                        <button type="button" className="btn btn-ghost btn-sm" style={{ gap: 6, fontSize: 11.5 }}>
                          <FileText size={13} /> Full Manifest
                        </button>
                      } />
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Staging Bay Manifest — Order {activeOrder.id}</DialogTitle>
                          <DialogDescription>
                            Consolidated bill of lading, temperature bounds, and pallet load certification for {loadingBay}.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-3 space-y-3 text-sm">
                          <div className="p-3 bg-[var(--surface-2)] rounded-lg space-y-1 text-xs border border-[var(--border)]">
                            <div className="flex justify-between">
                              <span className="text-[var(--text-low)]">Destination Address</span>
                              <span className="font-semibold text-[var(--text-high)]">{activeOrder.destination}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--text-low)]">Total Payload Weight</span>
                              <span className="mono font-bold text-[var(--brand)]">{(activeOrder.totalWeight ?? 0).toLocaleString()} kg</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--text-low)]">Assigned Transport Vehicle</span>
                              <span className="mono font-bold text-[var(--text-high)]">{vehicle?.vehicleNo || 'Unassigned'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--text-low)]">Assigned Corridor Pilot</span>
                              <span className="font-semibold text-[var(--text-high)]">{driver?.name || 'Ahmed Khan'}</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-mid)]">Batches to Load</h4>
                            {activeOrder.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2 rounded bg-[var(--surface-2)] text-xs border border-[var(--border)]">
                                <span className="font-medium text-[var(--text-high)]">{getProductName(it.productId)}</span>
                                <span className="mono font-semibold text-[var(--brand)]">{it.quantity.toLocaleString()} kg</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose render={
                            <button type="button" className="btn btn-secondary">Close Manifest</button>
                          } />
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <button className="btn btn-secondary btn-sm" onClick={handleScanAll}>
                      <QrCode size={13} /> Quick Scan All
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeOrder.items.map((item, idx) => {
                    const stock = getInventory(item.productId);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          background: item.scanned ? 'rgba(45, 138, 78, 0.1)' : 'var(--surface-2)',
                          border: `1px solid ${item.scanned ? 'rgba(45, 138, 78, 0.4)' : 'var(--border)'}`,
                          borderRadius: 8
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-high)' }}>
                            {getProductName(item.productId)}
                          </div>                          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>
                            Batch: <span className="mono" style={{ color: 'var(--brand)' }}>{item.batchCode || `BT-${idx + 88}`}</span> · Stock available: {stock.toLocaleString()} kg
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-high)' }}>
                            {item.quantity.toLocaleString()} kg
                          </span>
                          <button
                            className={`btn btn-sm ${item.scanned ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => scanOrderItem(activeOrder.id, item.productId)}
                          >
                            {item.scanned ? (
                              <><Check size={12} /> SCANNED</>
                            ) : (
                              <><QrCode size={12} /> SCAN BATCH</>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weight Distribution & Axle Balance Gauge (Stitch Screen 8) */}
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="card">
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-high)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={14} color="var(--brand)" /> Axle Load & Weight Distribution
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-low)' }}>Front Axle Load: <strong>38%</strong></span>
                    <span style={{ color: 'var(--text-low)' }}>Rear Axle Load: <strong>62%</strong></span>
                  </div>
                  <LabeledProgress progress={62} labels={["Front: 38% · Rear: 62%", "Load distribution within safe limits"]} height={8} intervalMs={4000} />
                  <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={12} /> Optimal weight balance within safety limits
                  </div>
                </div>

                {/* Pre-Departure Safety Checklist */}
                <div className="card">
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-high)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={16} color="var(--brand)" /> Pre-Departure Safety Checks
                    </div>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: allSafetyChecked ? '#059669' : '#D97706',
                      background: allSafetyChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                      border: `1px solid ${allSafetyChecked ? 'rgba(16, 185, 129, 0.25)' : 'rgba(217, 119, 6, 0.25)'}`,
                      padding: '2px 8px',
                      borderRadius: 999
                    }}>
                      {allSafetyChecked ? '4/4 Complete' : `${Object.values(safetyChecks).filter(Boolean).length}/4 Verified`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { key: 'tirePressure', label: 'Tire Pressure & Brakes', desc: '4-wheel pneumatic check verified', badge: 'Mandatory', badgeColor: 'warning' as const },
                      { key: 'cargoStraps', label: 'Cargo Lashings & Straps', desc: 'Ratchets torqued to load spec', badge: 'Secure', badgeColor: 'success' as const },
                      { key: 'sealVerified', label: 'Security Seal Affixed', desc: 'Tamper-evident container seal', badge: 'Audit', badgeColor: 'info' as const },
                      { key: 'manifestSigned', label: 'Manifest Signed', desc: 'Driver & dispatcher signed off', badge: 'Ready', badgeColor: 'purple' as const },
                    ].map(chk => (
                      <Checkbox16
                        key={chk.key}
                        label={chk.label}
                        description={chk.desc}
                        badge={chk.badge}
                        badgeColor={chk.badgeColor}
                        variant="card"
                        checked={safetyChecks[chk.key as keyof typeof safetyChecks]}
                        onChange={(val) => setSafetyChecks(prev => ({ ...prev, [chk.key]: val }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Safety incomplete warning alert */}
              {!allSafetyChecked && (
                <div className="mb-3">
                  <Alert variant="warning">
                    <AlertTitle>Pre-Departure Safety Protocol Incomplete</AlertTitle>
                    <AlertDescription>
                      All 4 mandatory safety criteria (tire pressure, cargo ratchets, container seal, driver manifest sign-off) must be confirmed prior to corridor departure.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Confirm Loading Button */}
              <button
                className="btn btn-primary btn-lg w-full"
                style={{
                  justifyContent: 'center',
                  background: allSafetyChecked ? 'linear-gradient(135deg, #0057FF, #0040CC)' : 'var(--surface-3)',
                  color: allSafetyChecked ? '#ffffff' : 'var(--text-low)',
                  boxShadow: allSafetyChecked ? '0 4px 14px rgba(0, 87, 255, 0.25)' : 'none',
                  cursor: allSafetyChecked ? 'pointer' : 'not-allowed',
                  border: 'none',
                  borderRadius: 10,
                }}
                onClick={handleConfirmLoading}
                disabled={!allSafetyChecked}
              >
                <Truck size={16} /> Confirm Loading &amp; Dispatch Trip to Corridor →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
