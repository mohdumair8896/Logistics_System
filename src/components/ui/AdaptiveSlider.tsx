'use client';

import { useState, useId, type FC, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AdaptiveSliderProps {
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  onChange?: (value: number) => void;
  className?: string;
}

export const AdaptiveSlider: FC<AdaptiveSliderProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  unit = '',
  onChange,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState<number>(defaultValue ?? min);
  const id = useId();
  const currentVal = value ?? internalValue;
  const percentage = Math.min(100, Math.max(0, ((currentVal - min) / (max - min)) * 100));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value);
    setInternalValue(num);
    onChange?.(num);
  };

  // Dynamic gradient based on logistics load / rate
  const getGradient = (pct: number) => {
    if (pct < 50) return 'linear-gradient(to right, #0057FF, #3B82F6)';
    if (pct < 80) return 'linear-gradient(to right, #0057FF, #F59E0B)';
    return 'linear-gradient(to right, #F59E0B, #DC2626)';
  };

  return (
    <div className={cn('w-full flex flex-col gap-2 py-1', className)}>
      <div className="flex justify-between items-center text-xs font-semibold">
        {label && <label htmlFor={id} className="text-[var(--text-mid)] tracking-tight">{label}</label>}
        <span className="mono font-bold text-[var(--brand)] px-2 py-0.5 rounded-md bg-[rgba(0,87,255,0.08)] border border-[rgba(0,87,255,0.15)]">
          {currentVal.toLocaleString()} {unit}
        </span>
      </div>

      <div className="relative flex items-center h-6 select-none">
        {/* Track Background */}
        <div className="absolute w-full h-2 rounded-full bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              background: getGradient(percentage),
            }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
          />
        </div>

        {/* Real Input Slider */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentVal}
          onChange={handleChange}
          className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
        />

        {/* Animated Custom Thumb */}
        <div
          className="absolute pointer-events-none -translate-x-1/2 flex items-center justify-center"
          style={{ left: `${percentage}%` }}
        >
          <motion.div
            className="w-5 h-5 rounded-full bg-white shadow-md border-2 border-[var(--brand)] flex items-center justify-center"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
          </motion.div>
        </div>
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between text-[10px] text-[var(--text-low)] font-mono">
        <span>{min.toLocaleString()} {unit}</span>
        <span>{max.toLocaleString()} {unit}</span>
      </div>
    </div>
  );
};
