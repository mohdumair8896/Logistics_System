'use client';
// ─── Getting started: three steps that light up in turn ───────────────────────
// The step nearest the middle of the screen is the active one; the counter beside the heading follows it.
// Without script every step is shown at full strength.

import { useEffect, useRef, useState } from 'react';

const STEPS = [
  {
    title: 'Create your workspace',
    text: 'Pick a plan and set up your company. No card is needed to create the workspace.',
  },
  {
    title: 'Add your trucks and drivers',
    text: 'Enter each truck’s number, type and capacity, and each driver’s licence number and expiry. Unverified documents show up on Today.',
  },
  {
    title: 'Take your first booking',
    text: 'Create the order, allocate a free truck and send the driver their trip link. Your customer can follow it from then on.',
  },
];

const pad = (n: number) => String(n).padStart(2, '0');

export function Workflow() {
  const listRef = useRef<HTMLOListElement | null>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.children) as HTMLElement[];
    setActive(0);
    // A thin band across the middle of the screen: whichever step crosses it is active
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(items.indexOf(e.target as HTMLElement)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="start" className="mk-section mk-workflow-sec" aria-labelledby="workflow-title">
      <div className="mk-wrap mk-workflow">
        <div className="mk-workflow-intro">
          <p className="mk-kicker">Getting started</p>
          <h2 id="workflow-title" className="mk-h2">Three steps to your <mark className="mk-mark">first trip</mark>.</h2>
          <p className="mk-section-lede">From a new workspace to a truck on the road, without a setup project.</p>
          <p className="mk-workflow-count" aria-hidden="true">
            <b>{pad((active ?? 0) + 1)}</b> / {pad(STEPS.length)}
          </p>
        </div>
        <ol ref={listRef} className="mk-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="mk-step-card" data-dim={(active !== null && active !== i) || undefined}>
              <span className="mk-step-ghost" aria-hidden="true">{pad(i + 1)}</span>
              <span className="mk-step-chip" aria-hidden="true">{pad(i + 1)}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
