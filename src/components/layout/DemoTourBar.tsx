'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { RotateCcw, ChevronRight, Sparkles } from 'lucide-react';

const demoStages = [
  { step: 1, label: '1. Order', href: '/orders' },
  { step: 2, label: '2. Allocation', href: '/allocation' },
  { step: 3, label: '3. Warehouse', href: '/warehouse' },
  { step: 4, label: '4. Trips', href: '/trips' },
  { step: 5, label: '5. Tracking', href: '/tracking' },
  { step: 6, label: '6. Delivery & e-POD', href: '/delivery' },
  { step: 7, label: '7. Invoices', href: '/invoices' },
];

export default function DemoTourBar() {
  const pathname = usePathname();
  const router = useRouter();
  const resetDemoData = useStore(s => s.resetDemoData);

  const handleReset = () => {
    resetDemoData();
    router.push('/dashboard');
  };

  return (
    <div className="demo-tour-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa', fontWeight: 700 }}>
          <Sparkles size={14} />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '11px' }}>End-to-End Workflow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', padding: '2px 0' }}>
          {demoStages.map((stage, idx) => {
            const isActive = pathname.startsWith(stage.href);
            return (
              <div key={stage.step} style={{ display: 'flex', alignItems: 'center' }}>
                <Link
                  href={stage.href}
                  className={`demo-step-pill ${isActive ? 'active' : ''}`}
                >
                  <span className="demo-step-num">{stage.step}</span>
                  <span>{stage.label.split('. ')[1]}</span>
                </Link>
                {idx < demoStages.length - 1 && (
                  <ChevronRight size={12} color="var(--border-light)" style={{ margin: '0 2px' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleReset}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 11.5, padding: '4px 10px', color: 'var(--text-secondary)' }}
          title="Reset store to initial demo state"
        >
          <RotateCcw size={12} />
          Reset Demo Data
        </button>
      </div>
    </div>
  );
}
