'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getStatusBadgeClass } from '@/lib/formatters';
import {
  ShoppingCart, Plus, X, Trash2, ArrowRight, Download, Search,
  Clock, ArrowUpDown, ArrowUp, ArrowDown, Navigation, Truck, QrCode
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ShipmentQR } from '@/components/ui/ShipmentQR';
import { InlineDisclosureMenu } from '@/components/ui/InlineDisclosureMenu';
import { Pagination2 } from '@/components/ui/Pagination2';
import { AdaptiveSlider } from '@/components/ui/AdaptiveSlider';


export default function OrdersPage() {
  const { orders, addOrder, updateOrder, customers, products } = useStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Allocated' | 'In Transit' | 'Delivered'>('All');
  const [search, setSearch] = useState('');
  const [maxWeight, setMaxWeight] = useState(25000);
  const [showSlider, setShowSlider] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [sortField, setSortField] = useState<'id' | 'destination' | 'weight' | 'status'>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const PAGE_SIZE = 10;

  const [form, setForm] = useState({
    customerId: 'C001',
    destination: 'East Distribution Center',
    origin: 'Central Distribution Hub',
    items: [
      { productId: 'P001', quantity: 5000 },
      { productId: 'P002', quantity: 2500 }
    ],
    distance: 82,
    freightRate: 2.4
  });

  const totalWeight = form.items.reduce((s, i) => s + (i.quantity || 0), 0);

  const handleSort = (field: 'id' | 'destination' | 'weight' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredOrders = orders
    .filter(o => {
      const matchesTab = activeTab === 'All' || o.status === activeTab;
      const cust = customers.find(c => c.id === o.customerId);
      const matchesSearch = !search ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.destination.toLowerCase().includes(search.toLowerCase()) ||
        (cust?.name || '').toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') comparison = a.id.localeCompare(b.id);
      if (sortField === 'destination') comparison = a.destination.localeCompare(b.destination);
      if (sortField === 'weight') comparison = a.totalWeight - b.totalWeight;
      if (sortField === 'status') comparison = a.status.localeCompare(b.status);
      return sortAsc ? comparison : -comparison;
    });

  const handleAdd = () => {
    if (!form.destination.trim()) return;
    const id = addOrder({
      ...form,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      totalWeight,
      status: 'Pending',
      vehicleId: null,
      driverId: null
    });
    toast.success('Order Dispatched to Queue', { description: `Shipment ${id} generated. Ready for fleet allocation.` });
    setShowCreate(false);
    setPage(1);
    setTimeout(() => router.push('/allocation'), 600);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const headers = 'Order ID,Customer,Origin,Destination,Weight (kg),Status,Created At\n';
      const rows = orders.map(o => {
        const cust = customers.find(c => c.id === o.customerId)?.name || o.customerId;
        return `${o.id},"${cust}","${o.origin}","${o.destination}",${o.totalWeight},${o.status},${o.createdAt}`;
      }).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LogiFlow_Orders_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      toast.info('Orders Exported', { description: 'CSV downloaded successfully.' });
    }, 100);
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
          <button className="btn btn-secondary" onClick={handleExportCSV} disabled={isExporting} aria-busy={isExporting}>
            <Download size={15} /> {isExporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create New Order
          </button>
        </div>
      </div>

      {/* Pending / Cancelled alerts — watermelon Alert20/Alert24 pattern */}
      {orders.filter(o => o.status === 'Cancelled').length > 0 && (
        <AlertBanner variant="error" title={`${orders.filter(o => o.status === 'Cancelled').length} order(s) cancelled`} dismissible>
          Review cancelled freight bookings and verify inventory return status.
        </AlertBanner>
      )}
      {orders.filter(o => o.status === 'Pending').length > 0 && (
        <AlertBanner variant="warning" title={`${orders.filter(o => o.status === 'Pending').length} order(s) awaiting vehicle allocation`} compact dismissible />
      )}

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        {/* Tab filters */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
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
                  background: active ? 'var(--brand-10)' : 'transparent',
                  color: active ? 'var(--brand)' : 'var(--text-mid)',
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
                  background: active ? 'var(--brand)' : 'var(--border)',
                  color: active ? '#fff' : 'var(--text-low)',
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
          <Search size={14} color="var(--icon)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
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
        <div className="table-container">
          <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }} aria-sort={sortField === 'id' ? (sortAsc ? 'ascending' : 'descending') : 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Order ID</span>
                  {sortField === 'id' ? (sortAsc ? <ArrowUp size={12} color="var(--icon)" /> : <ArrowDown size={12} color="var(--icon)" />) : <ArrowUpDown size={11} color="var(--text-low)" />}
                </div>
              </th>
              <th>Customer</th>
              <th onClick={() => handleSort('destination')} style={{ cursor: 'pointer', userSelect: 'none' }} aria-sort={sortField === 'destination' ? (sortAsc ? 'ascending' : 'descending') : 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Route Corridor</span>
                  {sortField === 'destination' ? (sortAsc ? <ArrowUp size={12} color="var(--icon)" /> : <ArrowDown size={12} color="var(--icon)" />) : <ArrowUpDown size={11} color="var(--text-low)" />}
                </div>
              </th>
              <th onClick={() => handleSort('weight')} style={{ cursor: 'pointer', userSelect: 'none' }} aria-sort={sortField === 'weight' ? (sortAsc ? 'ascending' : 'descending') : 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Weight</span>
                  {sortField === 'weight' ? (sortAsc ? <ArrowUp size={12} color="var(--icon)" /> : <ArrowDown size={12} color="var(--icon)" />) : <ArrowUpDown size={11} color="var(--text-low)" />}
                </div>
              </th>
              <th>Deadline</th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }} aria-sort={sortField === 'status' ? (sortAsc ? 'ascending' : 'descending') : 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Status</span>
                  {sortField === 'status' ? (sortAsc ? <ArrowUp size={12} color="var(--icon)" /> : <ArrowDown size={12} color="var(--icon)" />) : <ArrowUpDown size={11} color="var(--text-low)" />}
                </div>
              </th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-low)' }}>
                  No orders match current filter
                </td>
              </tr>
            ) : (
              filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(order => {
                const cust = customers.find(c => c.id === order.customerId);
                return (
                  <tr key={order.id}>
                    <td>
                      <span className="mono" style={{ color: 'var(--mono-id)', fontWeight: 700, fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>
                        {order.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-high)' }}>{cust?.name || order.customerId}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{order.items.length} items manifest</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-low)' }}>{order.origin.split(' ')[0]}</span>
                        <span style={{ color: 'var(--brand)' }}>→</span>
                        <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{order.destination}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-low)' }}>{order.distance} km corridor</div>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)', fontFamily: 'var(--font-mono)' }}>
                        {order.totalWeight.toLocaleString()} kg
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: order.status === 'Pending' ? 'var(--brand)' : 'var(--text-low)' }}>
                        <Clock size={12} />
                        {order.deadline || 'Today 18:00'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {order.status === 'Pending' && (
                          <button className="btn btn-sm btn-primary" onClick={() => router.push('/allocation')}>
                            Allocate <ArrowRight size={11} />
                          </button>
                        )}
                        {order.status === 'Allocated' && (
                          <button className="btn btn-sm btn-secondary" onClick={() => router.push('/warehouse')}>
                            Bay <ArrowRight size={11} />
                          </button>
                        )}
                        {order.status === 'In Transit' && (
                          <button className="btn btn-sm btn-ghost" onClick={() => router.push('/tracking')}>
                            Track
                          </button>
                        )}
                        {order.status === 'Delivered' && (
                          <button className="btn btn-sm btn-ghost" onClick={() => router.push('/invoices')}>
                            Invoice
                          </button>
                        )}
                        <InlineDisclosureMenu
                          actions={[
                            {
                              id: 'track',
                              label: 'Telematics',
                              icon: <Navigation size={12} />,
                              onClick: () => router.push('/tracking'),
                            },
                            {
                              id: 'manifest',
                              label: 'Bay Loading',
                              icon: <Truck size={12} />,
                              onClick: () => router.push('/warehouse'),
                            },
                            {
                              id: 'cancel',
                              label: 'Cancel Order',
                              icon: <X size={12} />,
                              variant: 'danger',
                              onClick: () => updateOrder(order.id, { status: 'Cancelled' }),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
        <Pagination2
            currentPage={page}
            totalPages={Math.ceil(filteredOrders.length / PAGE_SIZE)}
            totalItems={filteredOrders.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>

      {/* Create Order Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Create New Dispatch Order</span>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}>
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
                  <input className="form-input" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} placeholder="Central Distribution Hub" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Destination</label>
                  <input className="form-input" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} placeholder="East Distribution Center" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Distance (km)</label>
                  <input className="form-input" type="number" value={form.distance} onChange={e => setForm({...form, distance: +e.target.value})} />
                </div>
              </div>

              {/* Items & Quantities */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Cargo Items</label>
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
                      <span style={{ fontSize: 11, color: 'var(--text-low)', minWidth: 24 }}>kg</span>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer' }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight total calculation */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Estimated Total Payload</div>
                  <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>Calculates vehicle capacity required</div>
                </div>
                <span className="mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
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
