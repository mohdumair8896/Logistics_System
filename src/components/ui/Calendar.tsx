'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarProps {
  mode?: 'single';
  selected?: Date;
  onSelect?: (date: Date) => void;
  captionLayout?: 'dropdown' | 'buttons';
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function Calendar({
  selected,
  onSelect,
  captionLayout = 'buttons',
  className,
  minDate,
  maxDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => selected || new Date());
  const [internalSelected, setInternalSelected] = React.useState<Date | undefined>(selected);

  const activeSelected = selected !== undefined ? selected : internalSelected;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const d = new Date(year, month, day);
    if (minDate && d < new Date(minDate.setHours(0,0,0,0))) return;
    if (maxDate && d > new Date(maxDate.setHours(23,59,59,999))) return;

    setInternalSelected(d);
    onSelect?.(d);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number) => {
    if (!activeSelected) return false;
    return activeSelected.getDate() === day && activeSelected.getMonth() === month && activeSelected.getFullYear() === year;
  };

  return (
    <div
      className={cn(
        'w-64 select-none rounded-xl border border-[var(--border,#E6E4DF)] bg-[var(--surface-1,#FFFFFF)] p-3 text-xs shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border,#E6E4DF)]">
        {captionLayout === 'dropdown' ? (
          <div className="flex items-center gap-1 font-semibold text-[var(--text-high)]">
            <select
              value={month}
              onChange={(e) => setCurrentMonth(new Date(year, parseInt(e.target.value, 10), 1))}
              className="bg-transparent text-xs font-semibold cursor-pointer outline-none"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value, 10), month, 1))}
              className="bg-transparent text-xs font-semibold cursor-pointer outline-none"
            >
              {Array.from({ length: 15 }, (_, i) => year - 5 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        ) : (
          <span className="font-semibold text-xs text-[var(--text-high)]">
            {MONTH_NAMES[month]} {year}
          </span>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex size-6 items-center justify-center rounded-md text-[var(--icon,#6B7280)] hover:bg-[var(--surface-2)] transition cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex size-6 items-center justify-center rounded-md text-[var(--icon,#6B7280)] hover:bg-[var(--surface-2)] transition cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 text-center mb-1">
        {DAY_NAMES.map((dn) => (
          <div key={dn} className="py-1 text-[10px] font-semibold text-[var(--text-low,#909090)]">
            {dn}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="size-7" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const selectedState = isSelected(day);
          const todayState = isToday(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleSelectDay(day)}
              className={cn(
                'flex size-7 items-center justify-center rounded-lg text-xs font-medium transition cursor-pointer',
                selectedState
                  ? 'bg-[var(--brand,#0057FF)] text-white font-bold'
                  : todayState
                  ? 'border border-[var(--brand,#0057FF)] text-[var(--brand,#0057FF)] font-bold'
                  : 'text-[var(--text-high,#141414)] hover:bg-[var(--surface-2,#F3F2EF)]'
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
