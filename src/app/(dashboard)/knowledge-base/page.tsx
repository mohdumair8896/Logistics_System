'use client';
import { useState } from 'react';
import { useKnowledgeBase, KnowledgeBaseItem, KBCategory } from '@/features/knowledge-base/hooks';
import {
  BookOpen, Plus, Search, Trash2,
  Sparkles, X
} from 'lucide-react';
import { toast } from 'sonner';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { BadgeWithDot, BadgeColor } from '@/components/ui/BadgeWithDot';
import { BadgeGroup } from '@/components/ui/BadgeGroup';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog';
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/Empty';

export default function KnowledgeBasePage() {
  const { items: knowledgeBase, addItem: addKnowledgeBaseItem, deleteItem: deleteKnowledgeBaseItem } = useKnowledgeBase();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'Hours & Operations' as KBCategory,
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

  const getCategoryBadgeColor = (cat: string): BadgeColor => {
    switch (cat) {
      case 'Hours & Operations':
        return 'brand';
      case 'Lane Rates':
        return 'success';
      case 'Cold-Chain SLA':
        return 'warning';
      case 'Safety & HAZMAT':
        return 'error';
      case 'GST & Invoicing':
        return 'neutral';
      default:
        return 'gray';
    }
  };

  const filteredItems = knowledgeBase.filter(item => {
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;

    const keywordsArray = form.keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    await addKnowledgeBaseItem({
      title: form.title,
      category: form.category,
      content: form.content,
      keywords: keywordsArray.length > 0 ? keywordsArray : [form.title.toLowerCase()]
    });

    toast.success('Knowledge Base Updated', {
      description: `Article "${form.title}" added to LogisticsEdge training repository.`
    });

    setShowAddModal(false);
    setForm({ title: '', category: 'Hours & Operations', content: '', keywords: '' });
  };

  const handleDelete = async (id: string, title: string) => {
    await deleteKnowledgeBaseItem(id);
    toast.info('Article Removed', { description: `Deleted "${title}" from knowledge base.` });
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
              <BreadcrumbLink href="/knowledge-base">Tools &amp; Policy</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Knowledge Base</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} color="var(--brand)" />
            Knowledge Base & Corridor Policy Portal
          </div>
          <div className="page-subtitle">
            Configure freight tariffs, hub operating guidelines & cold-chain SOPs queryable by LogisticsEdge
          </div>
          <div style={{ marginTop: 8 }}>
            <BadgeGroup
              addonText="Policy Index"
              color="brand"
              size="sm"
            >
              {filteredItems.length} active documents indexed for dispatch reasoning
            </BadgeGroup>
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
                  background: activeCategory === cat ? 'var(--brand-10)' : 'var(--surface-2)',
                  color: activeCategory === cat ? 'var(--brand)' : 'var(--text-mid)',
                  fontWeight: activeCategory === cat ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="input-group input-group-sm" style={{ width: 240 }}>
            <Search size={13} />
            <input
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
        {filteredItems.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', padding: '40px 16px', textAlign: 'center' }}>
            <Empty>
              <EmptyMedia>
                <BookOpen size={36} color="var(--text-low)" />
              </EmptyMedia>
              <EmptyTitle>No policy documents found</EmptyTitle>
              <EmptyDescription>
                {search ? `No articles matching "${search}". Try searching for tariffs, cold-chain, or SLA terms.` : 'No documents indexed in this policy category.'}
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          filteredItems.map(item => (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <BadgeWithDot size="sm" color={getCategoryBadgeColor(item.category)}>
                    {item.category}
                  </BadgeWithDot>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-low)' }}>
                    {item.id}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-high)', marginBottom: 8, lineHeight: 1.3 }}>
                  {item.title}
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 12 }}>
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
                        background: 'var(--surface-2)',
                        color: 'var(--text-low)'
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
                  color: 'var(--text-low)'
                }}>
                  <span>Updated: {item.lastUpdated}</span>
                  <AlertDialog>
                    <AlertDialogTrigger render={
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--status-error, #DC2626)', cursor: 'pointer', padding: 2 }}
                        title="Remove document"
                      >
                        <Trash2 size={13} />
                      </button>
                    } />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Policy Document?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &ldquo;{item.title}&rdquo;? This will permanently remove it from the LogisticsEdge RAG indexing repository.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleDelete(item.id, item.title)}
                        >
                          Delete Document
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
              <div className="modal-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="var(--brand)" /> Add Knowledge Document
                </span>
                <button type="button" onClick={() => setShowAddModal(false)} className="modal-close-btn" aria-label="Close modal">
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
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as KnowledgeBaseItem['category'] }))}
                  >
                    <option value="Hours & Operations">Hours &amp; Operations</option>
                    <option value="Lane Rates">Lane Rates</option>
                    <option value="Cold-Chain SLA">Cold-Chain SLA</option>
                    <option value="Safety & HAZMAT">Safety &amp; HAZMAT</option>
                    <option value="GST & Invoicing">GST &amp; Invoicing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Knowledge Content &amp; Rules</label>
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
                    Save &amp; Ingest
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
