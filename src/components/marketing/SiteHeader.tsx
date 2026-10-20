'use client';
// ─── Marketing header (home and pricing) ──────────────────────────────────────
// A floating glass bar: it firms up once the page scrolls, a pill slides behind whichever link is hovered or
// focused, "Product" opens a panel of shortcuts into the page, and a thin line along the bottom shows how far
// down the page you are. Below 960 px the links fold into a full-width sheet.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Calculator, ChevronDown, LayoutDashboard, LayoutGrid, ListChecks, Menu, Route, Search, X,
} from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandMark';

const LINKS = [
  { href: '/#how', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#quote', label: 'Get a rate' },
  { href: '/track', label: 'Track a shipment' },
];

const PRODUCT = [
  {
    title: 'Explore',
    items: [
      { href: '/#how', icon: Route, label: 'How a load moves', text: 'Book, allocate, track, deliver, bill' },
      { href: '/#product', icon: LayoutDashboard, label: 'The Today screen', text: 'What is waiting, moving and needs a look' },
      { href: '/#modules', icon: LayoutGrid, label: 'What’s in a workspace', text: 'Orders, tracking, POD, invoices and more' },
    ],
  },
  {
    title: 'Get going',
    items: [
      { href: '/#start', icon: ListChecks, label: 'Getting started', text: 'Three steps to your first trip' },
      { href: '/#quote', icon: Calculator, label: 'Get a rate', text: 'An indicative price for a load in seconds' },
      { href: '/track', icon: Search, label: 'Track a shipment', text: 'With an order or trip number' },
    ],
  },
];

type Pill = { x: number; w: number; on: boolean };

export function SiteHeader({ current }: { current?: '/pricing' }) {
  const [open, setOpen] = useState(false);          // phone sheet
  const [panel, setPanel] = useState(false);        // Product panel
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState<Pill>({ x: 0, w: 0, on: false });
  const navRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  // Scrolled state and the progress line (a transform, not React state, so it never re-renders per frame)
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progressRef.current?.style.setProperty('transform', `scaleX(${p})`);
      setScrolled(window.scrollY > 8);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Escape closes whatever is open; a click outside closes the Product panel
  useEffect(() => {
    if (!open && !panel) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setPanel(false); } };
    const onDown = (e: PointerEvent) => {
      if (panel && navRef.current && !navRef.current.closest('.mk-header')?.contains(e.target as Node)) setPanel(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open, panel]);

  // The sliding pill follows the hovered or focused nav item
  const pointAt = (el: HTMLElement) => {
    const nav = navRef.current;
    if (!nav) return;
    const r = el.getBoundingClientRect();
    setPill({ x: r.left - nav.getBoundingClientRect().left, w: r.width, on: true });
  };
  const navHandlers = {
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => pointAt(e.currentTarget),
    onFocus: (e: React.FocusEvent<HTMLElement>) => pointAt(e.currentTarget),
  };

  // Product panel opens on hover (with a short grace period on the way out) and on click
  const openPanel = () => { window.clearTimeout(closeTimer.current); setPanel(true); };
  const closePanelSoon = () => { closeTimer.current = window.setTimeout(() => setPanel(false), 160); };

  return (
    <header className="mk-header" data-scrolled={scrolled || undefined}>
      <a href="#main" className="mk-skip">Skip to content</a>
      <div className="mk-wrap">
        <div className="mk-header-bar">
          <Link href="/" className="mk-brand">
            <BrandMark size={28} />
            LogisticsEdge
          </Link>

          <nav
            ref={navRef}
            className="mk-nav"
            aria-label="Main"
            onPointerLeave={() => setPill(p => ({ ...p, on: false }))}
          >
            <span className="mk-nav-pill" aria-hidden="true" data-on={pill.on || undefined} style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />
            <div className="mk-nav-product" onPointerEnter={openPanel} onPointerLeave={closePanelSoon}>
              <button
                type="button"
                className="mk-nav-item"
                aria-expanded={panel}
                aria-controls="mk-product-panel"
                onClick={() => setPanel(v => !v)}
                {...navHandlers}
              >
                Product <ChevronDown size={14} aria-hidden="true" />
              </button>
              <div id="mk-product-panel" className="mk-panel" data-open={panel || undefined} hidden={!panel}>
                <div className="mk-panel-cols">
                  {PRODUCT.map(col => (
                    <div key={col.title}>
                      <p className="mk-panel-title">{col.title}</p>
                      <ul>
                        {col.items.map(item => (
                          <li key={item.label}>
                            <Link href={item.href} className="mk-panel-link" onClick={() => setPanel(false)}>
                              <span className="mk-panel-icon"><item.icon size={18} aria-hidden="true" /></span>
                              <span>
                                <b>{item.label}</b>
                                <small>{item.text}</small>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <Link href="/pricing" className="mk-panel-feature" onClick={() => setPanel(false)}>
                  <span className="mk-panel-feature-img" aria-hidden="true" />
                  <b>Plans and limits</b>
                  <small>Trucks, shipments and agent actions per plan. No card to start.</small>
                  <span className="mk-panel-more">See pricing <ArrowRight size={14} aria-hidden="true" /></span>
                </Link>
              </div>
            </div>
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="mk-nav-item"
                aria-current={l.href === current ? 'page' : undefined}
                {...navHandlers}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <Link href="/login" className="btn btn-ghost mk-btn-sm mk-header-signin">Sign in</Link>
          <Link href="/pricing" className="btn btn-primary mk-btn-sm mk-header-start mk-glow">
            Start a workspace <ArrowRight size={15} aria-hidden="true" className="mk-arrow" />
          </Link>
          <button
            type="button"
            className="mk-menu-btn"
            aria-expanded={open}
            aria-controls="mk-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>

          <span className="mk-header-progress" aria-hidden="true"><span ref={progressRef} /></span>
        </div>

        {open && (
          <nav id="mk-menu" className="mk-menu" aria-label="Main">
            <ul className="mk-menu-main">
              {[...LINKS, { href: '/login', label: 'Sign in' }].map((l, i) => (
                <li key={l.label} style={{ '--i': i } as React.CSSProperties}>
                  <Link href={l.href} onClick={() => setOpen(false)}>
                    {l.label} <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mk-panel-title">Product</p>
            <ul className="mk-menu-product">
              {PRODUCT.flatMap(col => col.items).slice(0, 4).map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="mk-panel-link" onClick={() => setOpen(false)}>
                    <span className="mk-panel-icon"><item.icon size={18} aria-hidden="true" /></span>
                    <span><b>{item.label}</b><small>{item.text}</small></span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="btn btn-primary mk-btn mk-menu-cta" onClick={() => setOpen(false)}>
              Start a workspace <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
