'use client';

import { type FC } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarItem {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  status?: 'online' | 'busy' | 'offline';
}

export interface AvatarStackProps {
  avatars: AvatarItem[];
  maxDisplay?: number;
  size?: number;
  className?: string;
  label?: string;
}

export const AvatarStack: FC<AvatarStackProps> = ({
  avatars,
  maxDisplay = 4,
  size = 28,
  className = '',
  label,
}) => {
  const displayed = avatars.slice(0, maxDisplay);
  const remaining = avatars.length - maxDisplay;

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const getBgColor = (idx: number) => {
    const palette = ['#0057FF', '#2563EB', '#3B82F6', '#60A5FA', '#1D4ED8'];
    return palette[idx % palette.length];
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex -space-x-2 items-center">
        {displayed.map((a, idx) => (
          <div
            key={a.id}
            title={`${a.name}${a.role ? ` (${a.role})` : ''}`}
            className="relative rounded-full ring-2 ring-[var(--surface-1)] shadow-xs select-none flex items-center justify-center font-bold text-white text-[10px]"
            style={{
              width: size,
              height: size,
              backgroundColor: getBgColor(idx),
            }}
          >
            <span>{getInitials(a.name)}</span>
            {a.status && (
              <span
                className={cn(
                  'absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-white',
                  a.status === 'online' && 'bg-emerald-500',
                  a.status === 'busy' && 'bg-amber-500',
                  a.status === 'offline' && 'bg-slate-400'
                )}
              />
            )}
          </div>
        ))}

        {remaining > 0 && (
          <div
            className="rounded-full ring-2 ring-[var(--surface-1)] bg-[var(--surface-2)] text-[var(--text-mid)] font-bold text-[10px] flex items-center justify-center border border-[var(--border)] shadow-xs"
            style={{ width: size, height: size }}
            title={`${remaining} more team members`}
          >
            +{remaining}
          </div>
        )}
      </div>

      {label && <span className="text-xs text-[var(--text-mid)] font-medium">{label}</span>}
    </div>
  );
};
