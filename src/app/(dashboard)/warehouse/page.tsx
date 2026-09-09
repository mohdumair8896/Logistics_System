'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';

import {
  Warehouse, Package, CheckCircle, Truck,
  QrCode, Check, ShieldCheck, Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { LabeledProgress } from '@/components/ui/LabeledProgress';
import { ShipmentQR } from '@/components/ui/ShipmentQR';
import { Checkbox16 } from '@/components/ui/Checkbox16';

export default function WarehousePage() {
  const { orders, inventory, vehicles, drivers, confirmLoading, addTrip, scanOrderItem, customers, products } = useStore();
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
      <div className="page-header">
        <div>
          <div className="page-title">Warehouse Staging & Loading Manifest</div>
          <div className="page-subtitle">Bay allocation, cargo barcode scanning & axle load distribution</div>
        </div>
      </div>

      {/* Inventory Stock Overview Cards */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-high)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Warehouse size={16} color="var(--brand)" /> Central Warehouse Inventory & Storage Bays
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-low)' }}>Location: Lucknow Central Logistics Park</span>
        </div>

        <div className="grid-6">
          {products.map(p => {
            const stock = getInventory(p.id);
            const low = stock < 10000;
            return (
              <div key={p.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{p.category.split(' ')[0]}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-high)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: low ? 'var(--brand)' : 'var(--brand)', marginTop: 6 }}>
                  {stock.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-low)' }}>kg</span>
                </div>
              </div>
            );
          })}
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
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-low)', fontSize: 13 }}>
              <Package size={36} color="var(--text-low)" style={{ margin: '0 auto 10px' }} />
              No allocated orders waiting. Allocate pending orders first.
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
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>ALLOCATED</span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-high)', fontSize: 13, marginTop: 4 }}>{cust?.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-low)', marginTop: 2 }}>
                    Truck: <strong style={{ color: 'var(--text-high)' }}>{veh?.vehicleNo}</strong> � {o.totalWeight.toLocaleString()} kg
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Assigned Truck & Driver</div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>
                        {vehicle?.vehicleNo} ({driver?.name})
                      </div>
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
                  <button className="btn btn-secondary btn-sm" onClick={handleScanAll}>
                    <QrCode size={13} /> Quick Scan All
                  </button>
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
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>
                            Batch: <span className="mono" style={{ color: 'var(--brand)' }}>{item.batchCode || `BT-${idx + 88}`}</span> � Stock available: {stock.toLocaleString()} kg
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
                  <LabeledProgress progress={62} labels={["Front: 38% � Rear: 62%", "Load distribution within safe limits"]} height={8} intervalMs={4000} />
                  <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={12} /> Optimal weight balance within safety limits
                  </div>
                </div>

                {/* Pre-Departure Safety Checklist — watermelon checkbox-16 pattern */}
                <div className="card">
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-high)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} color="var(--brand)" /> Pre-Departure Safety Checks
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                    {[
                      { key: 'tirePressure', label: 'Tire Pressure & Brakes', desc: '4-wheel pneumatic check verified', badge: 'Mandatory' },
                      { key: 'cargoStraps', label: 'Cargo Lashings & Straps', desc: 'Ratchets torqued to load spec', badge: 'Secure' },
                      { key: 'sealVerified', label: 'Security Seal Affixed', desc: 'Tamper-evident container seal', badge: 'Audit' },
                      { key: 'manifestSigned', label: 'Manifest Signed', desc: 'Driver & dispatcher signed off', badge: 'Ready' },
                    ].map(chk => (
                      <Checkbox16
                        key={chk.key}
                        label={chk.label}
                        description={chk.desc}
                        badge={chk.badge}
                        checked={safetyChecks[chk.key as keyof typeof safetyChecks]}
                        onChange={(val) => setSafetyChecks(prev => ({ ...prev, [chk.key]: val }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm Loading Button */}
              <button
                className="btn btn-success btn-lg w-full"
                style={{ justifyContent: 'center' }}
                onClick={handleConfirmLoading}
                disabled={!allSafetyChecked}
              >
                <Truck size={16} /> Confirm Loading & Dispatch Trip to Corridor ?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
