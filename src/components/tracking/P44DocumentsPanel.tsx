'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  MoreVertical,
  Edit2,
  Trash2,
  Plus,
  ArrowUpDown,
  FileCheck2,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import type { Trip } from '@/features/trips/types';
import type { Order } from '@/features/orders/types';
import type { Invoice } from '@/features/invoices/types';

interface Props {
  trip: Trip | null;
  order: Order | null;
  invoice: Invoice | null;
}

interface DocItem {
  id: string;
  title: string;
  filename: string;
  filesize: string;
  dateAdded: string;
  author: string;
  type: 'invoice' | 'packing_list' | 'pod';
}

export default function P44DocumentsPanel({ trip, order, invoice }: Props) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const isDelivered = trip?.status === 'Delivered';

  const [docs, setDocs] = useState<DocItem[]>([
    {
      id: 'doc-1',
      title: 'Commercial Invoice & Tax Bill',
      filename: `${invoice?.id || 'INV-1004'}_tax_bill.pdf`,
      filesize: '1.8 MB',
      dateAdded: 'Today · 08:30 AM IST',
      author: 'Finance Operations Desk',
      type: 'invoice',
    },
    {
      id: 'doc-2',
      title: 'Warehouse Staging Manifest & Packing List',
      filename: `${order?.id || 'ORD-0995'}_packing_manifest.pdf`,
      filesize: '520 KB',
      dateAdded: 'Today · 06:15 AM IST',
      author: 'Loading Dock Terminal B-04',
      type: 'packing_list',
    },
    {
      id: 'doc-3',
      title: 'Consignee Signed Proof of Delivery (e-POD)',
      filename: `${trip?.id || 'TRP-1001'}_signed_pod.pdf`,
      filesize: isDelivered ? '2.4 MB' : 'Pending signature',
      dateAdded: isDelivered ? (trip?.completedAt || 'Today · 13:45 IST') : 'In-Transit',
      author: 'Verified Fleet Receiving Gate',
      type: 'pod',
    },
  ]);

  const handleDownload = (doc: DocItem) => {
    setActiveMenuId(null);
    toast.success(`Downloading ${doc.filename}...`, {
      description: `Document securely extracted for audit.`,
    });
  };

  const handleEdit = (doc: DocItem) => {
    setActiveMenuId(null);
    toast.info(`Editing metadata for ${doc.title}`);
  };

  const handleDelete = (docId: string) => {
    setActiveMenuId(null);
    setDocs(prev => prev.filter(d => d.id !== docId));
    toast.error('Document removed from shipment file');
  };

  const handleAttach = () => {
    toast.success('Document Attached Successfully', {
      description: 'Uploaded Bill of Lading (B/L) to dispatch dossier.',
    });
    setDocs(prev => [
      ...prev,
      {
        id: `doc-${Date.now()}`,
        title: 'Lorry Receipt (LR) & Carrier Contract',
        filename: `LR_${Math.floor(100000 + Math.random() * 900000)}.pdf`,
        filesize: '890 KB',
        dateAdded: 'Just now',
        author: 'Dispatch Operations',
        type: 'packing_list',
      },
    ]);
  };

  return (
    <div
      style={{
        background: 'var(--bg-card, #0f172a)',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 16, background: '#2563eb', borderRadius: 2 }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary, #ffffff)' }}>
            Documents
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
            ({docs.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => toast.success('Downloading complete shipment documents ZIP package...')}
            title="Download all documents"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Download size={13} />
            <span>Download all</span>
          </button>
        </div>
      </div>

      {/* Filter / Sort Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <ArrowUpDown size={12} />
          <span style={{ fontWeight: 600 }}>By date added</span>
        </div>
        <span>{docs.length} verified electronic files</span>
      </div>

      {/* Document Items List matching Image 1 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {docs.map((doc) => (
          <div
            key={doc.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.06)',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            {/* Document Type Icon */}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                background: doc.type === 'invoice'
                  ? 'rgba(59, 130, 246, 0.15)'
                  : doc.type === 'pod'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(168, 85, 247, 0.15)',
                border: `1px solid ${
                  doc.type === 'invoice'
                    ? 'rgba(59, 130, 246, 0.3)'
                    : doc.type === 'pod'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(168, 85, 247, 0.3)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {doc.type === 'invoice' ? (
                <FileText size={16} color="var(--brand)" />
              ) : doc.type === 'pod' ? (
                <FileCheck2 size={16} color="var(--brand)" />
              ) : (
                <FileSpreadsheet size={16} color="#c084fc" />
              )}
            </div>

            {/* Document Meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
                  {doc.title}
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>• {doc.dateAdded}</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)', marginTop: 3 }}>
                {doc.filename} · <span style={{ color: '#e2e8f0' }}>{doc.filesize}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                Added by {doc.author}
              </div>
            </div>

            {/* 3-Dots Action Button & Dropdown matching Image 1 */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                style={{
                  background: activeMenuId === doc.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  padding: 4,
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <MoreVertical size={16} />
              </button>

              {activeMenuId === doc.id && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 28,
                    width: 130,
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    padding: 4,
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <button
                    onClick={() => handleDownload(doc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      color: '#e2e8f0',
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handleEdit(doc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      color: '#e2e8f0',
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      color: 'var(--text-low)',
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Attach Documents Button matching Image 1 */}
      <button
        onClick={handleAttach}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px dashed rgba(255, 255, 255, 0.18)',
          borderRadius: 8,
          color: 'var(--brand)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: 6,
          transition: 'background 0.2s, border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
          e.currentTarget.style.borderColor = 'var(--brand)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
        }}
      >
        <Plus size={14} />
        <span>Attach documents</span>
      </button>
    </div>
  );
}
