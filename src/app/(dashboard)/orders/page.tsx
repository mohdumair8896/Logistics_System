'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { ShoppingCart, Plus, X, Trash2, ArrowRight, Download, Search, Filter, Clock, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const { orders, customers, products, addOrder } = useStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Allocated' | 'In Transit' | 'Delivered'>('All');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    customerId: 'C001',
    destination: 'Kanpur Facility',
    origin: 'Lucknow Central Hub',
    items: [
      { productId: 'P001', quantity: 5000 },
      { productId: 'P002', quantity: 2500 }
    ],
    distance: 82,
    freightRate: 2.4
  });

  const statusColor: Record<string, string> = {
    'Pending': 'badge-yellow',
    'Allocated': 'badge-blue',
    'In Transit': 'badge-cyan',
    'Delivered': 'badge-green',
    'Cancelled': 'badge-red'
  };

  const totalWeight = form.items.reduce((s, i) => s + (i.quantity || 0), 0);

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'All' || o.status === activeTab;
    const cust = customers.find(c => c.id === o.customerId);
    const matchesSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.destination.toLowerCase().includes(search.toLowerCase()) ||
      (cust?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleAdd = () => {
    if (!form.destination) return;
    const id = addOrder({
      ...form,
      totalWeight,
      status: 'Pending',
      vehicleId: null,
      driverId: null
    });
    setShowCreate(false);
    // Jump straight to allocation if needed
    router.push('/allocation');
  };

  const handleExportCSV = () => {
    const headers = 'Order ID,Customer,Origin,Destination,Weight (kg),Status,Created At\n';
    const rows = orders.map(o => {
      const cust = customers.find(c => c.id === o.customerId)?.name || o.customerId;
      return `${o.id},"${cust}","${o.origin}","${o.destination}",${o.totalWeight},${o.status},${o.createdAt}`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Precision_Orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: 'P001', quantity: 0 }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: string, val: string | number) => setForm(f => ({
    ...f,
    items: f.items.map((item, idx) => idx === i ? { ...item, [field]: field === 'quantity' ? +val : val } : item)
  }));

  return (
    <div className="animate-slide-in">
      <div className="page-header">
        <div>
          <div className="page-title">Order Management & Dispatch Queue</div>
          <div className="page-subtitle">{orders.length} total orders across regional corridors</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create New Order
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar (matching Stitch Screen 6) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        {/* Tab filters */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
          {(['All', 'Pending', 'Allocated', 'In Transit', 'Delivered'] as const).map(tab => {
            const count = tab === 'All' ? orders.length : orders.filter(o => o.status === tab).length;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: active ? '#60a5fa' : 'var(--text-secondary)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {tab}
                <span style={{
                  fontSize: 10.5,
                  padding: '1px 5px',
                  borderRadius: 8,
                  background: active ? '#3b82f6' : 'var(--bg-tertiary)',
                  color: active ? 'white' : 'var(--text-muted)',
                  fontWeight: 700
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 34, fontSize: 12.5 }}
            placeholder="Search orders, customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Route Corridor</th>
              <th>Weight</th>
              <th>SLA / Deadline</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Workflow Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No orders match current filter
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const cust = customers.find(c => c.id === order.customerId);
                return (
                  <tr key={order.id}>
                    <td>
                      <span className="mono" style={{ color: '#60a5fa', fontWeight: 700, fontSize: 12.5 }}>
                        {order.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cust?.name || order.customerId}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.items.length} items manifest</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{order.origin.split(' ')[0]}</span>
                        <span style={{ color: '#60a5fa' }}>→</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{order.destination}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{order.distance} km corridor</div>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {order.totalWeight.toLocaleString()} kg
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: order.status === 'Pending' ? '#fbbf24' : 'var(--text-muted)' }}>
                        <Clock size={12} />
                        {order.deadline || 'Today 18:00'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusColor[order.status] || 'badge-gray'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {order.status === 'Pending' && (
                        <button className="btn btn-sm btn-primary" onClick={() => router.push('/allocation')}>
                          Allocate Truck <ArrowRight size={12} />
                        </button>
                      )}
                      {order.status === 'Allocated' && (
                        <button className="btn btn-sm btn-secondary" onClick={() => router.push('/warehouse')}>
                          Load Bay <ArrowRight size={12} />
                        </button>
                      )}
                      {order.status === 'In Transit' && (
                        <button className="btn btn-sm btn-ghost" onClick={() => router.push('/tracking')}>
                          Live Telematics
                        </button>
                      )}
                      {order.status === 'Delivered' && (
                        <button className="btn btn-sm btn-ghost" onClick={() => router.push('/invoices')}>
                          Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Create New Dispatch Order</span>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Customer Account</label>
                  <select className="form-select" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.address.split(',')[0]})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Origin Hub</label>
                  <input className="form-input" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} placeholder="Lucknow Central Hub" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Destination Facility</label>
                  <input className="form-input" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} placeholder="Kanpur Facility" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Corridor Distance (km)</label>
                  <input className="form-input" type="number" value={form.distance} onChange={e => setForm({...form, distance: +e.target.value})} />
                </div>
              </div>

              {/* Items & Quantities */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Product Items Manifest</label>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={addItem}>
                    <Plus size={12} /> Add Item
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select className="form-select" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} style={{ flex: 2 }}>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input className="form-input" type="number" placeholder="Qty (kg)" value={item.quantity || ''} onChange={e => updateItem(i, 'quantity', e.target.value)} style={{ flex: 1 }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 24 }}>kg</span>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight total calculation */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Estimated Total Payload</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Calculates vehicle capacity required</div>
                </div>
                <span className="mono" style={{ fontSize: 20, fontWeight: 800, color: '#60a5fa' }}>
                  {totalWeight.toLocaleString()} kg
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAdd} disabled={!form.destination || totalWeight === 0}>
                  <ShoppingCart size={15} /> Create & Proceed to Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
