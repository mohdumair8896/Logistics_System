'use client';
import { useState } from 'react';
import { useStore, KnowledgeBaseItem } from '@/lib/store';
import {
  BookOpen, Plus, Search, Filter, Tag, Clock, Trash2, Edit3,
  CheckCircle, Sparkles, X, ChevronRight, Layers, FileText
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function KnowledgeBasePage() {
  const { knowledgeBase, addKnowledgeBaseItem, deleteKnowledgeBaseItem } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '',
    category: 'Hours & Operations' as KnowledgeBaseItem['category'],
    content: '',
    keywords: ''
  });

  const categories = [
    'All',
    'Hours & Operations',
    'Lane Rates',
    'Cold-Chain SLA',
    'Safety & HAZMAT',
    'GST & Invoicing'
  ];

  const filteredItems = knowledgeBase.filter(item => {
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;

    const keywordsArray = form.keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    addKnowledgeBaseItem({
      title: form.title,
      category: form.category,
      content: form.content,
      keywords: keywordsArray.length > 0 ? keywordsArray : [form.title.toLowerCase()]
    });

    toast(
      'Knowledge Base Updated',
      `Article "${form.title}" added to LogiFlow AI training repository.`,
      'success'
    );

    setShowAddModal(false);
    setForm({ title: '', category: 'Hours & Operations', content: '', keywords: '' });
  };

  const handleDelete = (id: string, title: string) => {
    deleteKnowledgeBaseItem(id);
    toast('Article Removed', `Deleted "${title}" from AI knowledge base.`, 'info');
  };

  return (
    <div className="animate-slide-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} color="var(--accent)" />
            AI Knowledge Base & Corridor Policy Portal
          </div>
          <div className="page-subtitle">
            Configure freight tariffs, hub operating guidelines & cold-chain SOPs queryable by LogiFlow AI
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ gap: 6 }}
        >
          <Plus size={15} /> Add Knowledge Document
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontSize: 11.5,
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: activeCategory === cat ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                  color: activeCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: activeCategory === cat ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 220 }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 28, fontSize: 12 }}
              placeholder="Search knowledge base..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* KB Articles Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16
      }}>
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              border: '1px solid var(--border)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className="badge badge-yellow" style={{ fontSize: 10.5 }}>
                  {item.category}
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  {item.id}
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>
                {item.title}
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                {item.content}
              </p>
            </div>

            <div>
              {/* Keywords chips */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                {item.keywords.map(kw => (
                  <span
                    key={kw}
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    #{kw}
                  </span>
                ))}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border)',
                paddingTop: 8,
                fontSize: 11,
                color: 'var(--text-muted)'
              }}>
                <span>Updated: {item.lastUpdated}</span>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                  title="Remove document"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="var(--accent)" /> Add AI Knowledge Document
              </span>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <div className="form-group">
                <label className="form-label">Article Title</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Lucknow to Kanpur Reefer Temperature Guidelines"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                >
                  <option value="Hours & Operations">Hours & Operations</option>
                  <option value="Lane Rates">Lane Rates</option>
                  <option value="Cold-Chain SLA">Cold-Chain SLA</option>
                  <option value="Safety & HAZMAT">Safety & HAZMAT</option>
                  <option value="GST & Invoicing">GST & Invoicing</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Knowledge Content & Rules</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Specify exact operating limits, demurrage charges, rates per ton-km, or safety steps..."
                  required
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Query Keywords (comma separated)</label>
                <input
                  className="form-input"
                  value={form.keywords}
                  onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                  placeholder="e.g., reefer, dairy, temp, ice, cold chain"
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                  Save & Ingest into AI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
