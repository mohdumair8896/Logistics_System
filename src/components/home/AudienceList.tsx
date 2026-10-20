'use client';
// ─── Built for: three kinds of operator, each row a link to its own page ─────────
// A hover list. With a mouse, a picture card follows the pointer over the hovered row; keyboard focus places it
// beside the focused row. Touch screens show a small picture in each row instead. Without script the rows are plain
// links. The pictures are the module stills (public/media/modules).

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const AUDIENCES = [
  {
    href: '/for/fleet-owners',
    name: 'Fleet owners',
    text: 'Your own trucks kept loaded, found without a phone call and billed from the delivered trip.',
    image: '/media/modules/corridor-tracking.webp',
  },
  {
    href: '/for/transporters',
    name: 'Transporters',
    text: 'Own and hired trucks in one list, tracked through the driver’s phone on any truck.',
    image: '/media/modules/allocation.webp',
  },
  {
    href: '/for/3pl',
    name: '3PLs',
    text: 'Each shipper’s loads with the trip, the proof of delivery and the invoice kept together.',
    image: '/media/modules/delivery-pod.webp',
  },
];

const pad = (n: number) => String(n).padStart(2, '0');

export function AudienceList() {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // The card's position is two CSS variables on the wrapper, so following the pointer never re-renders React
  const place = (x: number, y: number) => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      boxRef.current?.style.setProperty('--px', `${x}px`);
      boxRef.current?.style.setProperty('--py', `${y}px`);
    });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const box = e.currentTarget.getBoundingClientRect();
    place(e.clientX - box.left, e.clientY - box.top);
  };

  const onFocus = (i: number) => (e: React.FocusEvent<HTMLAnchorElement>) => {
    const wrap = boxRef.current;
    if (!wrap) return;
    const row = e.currentTarget.getBoundingClientRect();
    const box = wrap.getBoundingClientRect();
    place(box.width * 0.74, row.top - box.top + row.height / 2);
    setActive(i);
  };

  return (
    <div
      ref={boxRef}
      className="mk-aud"
      data-active={active !== null || undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActive(null); }}
    >
      <ul className="mk-aud-list">
        {AUDIENCES.map((a, i) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="mk-aud-row"
              data-on={active === i || undefined}
              onPointerEnter={e => { if (e.pointerType === 'mouse') setActive(i); }}
              onFocus={onFocus(i)}
            >
              <span className="mk-aud-num" aria-hidden="true">{pad(i + 1)}</span>
              {/* eslint-disable-next-line @next/next/no-img-element -- already sized WebP stills */}
              <img className="mk-aud-thumb" src={a.image} alt="" width={1280} height={720} loading="lazy" decoding="async" />
              <span className="mk-aud-name">{a.name}</span>
              <span className="mk-aud-text">{a.text}</span>
              <ArrowUpRight className="mk-aud-arrow" size={28} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mk-aud-float" aria-hidden="true">
        {AUDIENCES.map((a, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- already sized WebP stills
          <img key={a.href} src={a.image} alt="" width={1280} height={720} loading="lazy" decoding="async" data-on={active === i || undefined} />
        ))}
      </div>
    </div>
  );
}
