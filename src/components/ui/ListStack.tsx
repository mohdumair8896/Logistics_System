'use client';
/**
 * ListStack — inspired by watermelon.sh list-stack
 *
 * Stacked cards that fan out/collapse with spring animations.
 * Logistics use: recent orders, active alerts, trip queue.
 *
 * Usage:
 *   <ListStack items={trips.slice(0,3).map(t => ({
 *     id: t.id,
 *     title: t.id,
 *     subtitle: `${t.origin} → ${t.destination}`,
 *     meta: t.eta,
 *     badge: t.status,
 *     icon: <Truck size={18} />,
 *   }))} />
 */

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface StackItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  badgeVariant?: 'blue' | 'green' | 'yellow' | 'gray';
  icon?: ReactNode;
  onClick?: () => void;
}

interface ListStackProps {
  items: StackItem[];
  /** Height of each card in px */
  cardHeight?: number;
}

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  blue:   { bg: 'var(--status-active-bg)',  color: 'var(--status-active)'  },
  green:  { bg: 'var(--status-done-bg)',    color: 'var(--status-done)'    },
  yellow: { bg: 'var(--status-warn-bg)',    color: 'var(--status-warn)'    },
  gray:   { bg: 'var(--status-neutral-bg)', color: 'var(--status-neutral)' },
};

const GAP           = 10;
const COLLAPSED_OFFSET = -8; // overlap when collapsed

export function ListStack({ items, cardHeight = 64 }: ListStackProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Cards */}
      <div
        style={{
          position: 'relative',
          height: expanded
            ? items.length * (cardHeight + GAP)
            : cardHeight + Math.abs(COLLAPSED_OFFSET) * (items.length - 1) + 8,
          transition: 'height 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {items.map((item, i) => {
          const bdg = BADGE_STYLE[item.badgeVariant ?? 'blue'];
          return (
            <motion.div
              key={item.id}
              onClick={item.onClick}
              animate={expanded ? 'open' : 'closed'}
              variants={{
                open: {
                  y: (items.length - 1 - i) * (cardHeight + GAP),
                  scale: 1,
                  zIndex: i + 1,
                  opacity: 1,
                },
                closed: {
                  y: i * COLLAPSED_OFFSET,
                  scale: 1 - i * 0.03,
                  zIndex: items.length - i,
                  opacity: i > 2 ? 0 : 1 - i * 0.1,
                },
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: cardHeight,
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0 14px',
                cursor: item.onClick ? 'pointer' : 'default',
              }}
            >
              {/* Icon */}
              {item.icon && (
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--icon)',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
              )}

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-high)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {item.title}
                </div>
                {item.subtitle && (
                  <div style={{
                    fontSize: 11.5,
                    color: 'var(--text-low)',
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.subtitle}
                  </div>
                )}
              </div>

              {/* Meta + badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                {item.badge && (
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: bdg.bg,
                    color: bdg.color,
                    border: `1px solid ${bdg.color}30`,
                  }}>
                    {item.badge}
                  </span>
                )}
                {item.meta && (
                  <span style={{
                    fontSize: 11,
                    color: 'var(--text-low)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {item.meta}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expand / collapse toggle */}
      {items.length > 1 && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            marginTop: expanded ? 10 : 6,
            width: '100%',
            padding: '6px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--brand)',
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={expanded ? 'less' : 'more'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {expanded ? 'Collapse' : `Show all ${items.length}`}
            </motion.span>
          </AnimatePresence>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      )}
    </div>
  );
}
