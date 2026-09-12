'use client';

import React, { useRef, useState } from 'react';

export interface PinInputProps {
  length?: number;
  value?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function PinInput({
  length = 6,
  value: controlledValue,
  onChange,
  onComplete,
  label = 'Verification Security PIN',
  description = 'Enter the 6-digit OTP passcode to verify cargo consignee handover.',
  disabled = false,
  className = '',
}: PinInputProps) {
  const [internalValue, setInternalValue] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = controlledValue !== undefined
    ? controlledValue.split('').concat(Array(length).fill('')).slice(0, length)
    : internalValue;

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;

    if (controlledValue === undefined) {
      setInternalValue(newDigits);
    }

    const fullCode = newDigits.join('');
    onChange?.(fullCode);

    // Auto-advance to next input
    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (fullCode.length === length && !newDigits.includes('')) {
      onComplete?.(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const newDigits = pasted.split('').concat(Array(length).fill('')).slice(0, length);
    if (controlledValue === undefined) {
      setInternalValue(newDigits);
    }

    const fullCode = newDigits.join('');
    onChange?.(fullCode);

    const nextIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[nextIndex]?.focus();

    if (fullCode.length === length && !newDigits.includes('')) {
      onComplete?.(fullCode);
    }
  };

  const half = Math.floor(length / 2);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-high, #141414)' }}>
          {label}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {digits.map((digit, idx) => {
          const isDivider = idx === half;
          return (
            <React.Fragment key={idx}>
              {isDivider && (
                <div
                  style={{
                    width: 8,
                    height: 2,
                    background: 'var(--border-mid, #D2CFC8)',
                    margin: '0 2px',
                  }}
                />
              )}
              <input
                ref={(el) => { inputsRef.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={disabled}
                onChange={(e) => handleChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                style={{
                  width: 44,
                  height: 48,
                  borderRadius: 10,
                  border: '1px solid var(--border, #E6E4DF)',
                  background: 'var(--surface-1, #FFFFFF)',
                  textAlign: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--text-high, #141414)',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--brand, #0057FF)';
                  e.target.style.boxShadow = '0 0 0 3px var(--brand-10, rgba(0,87,255,0.1))';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border, #E6E4DF)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </React.Fragment>
          );
        })}
      </div>

      {description && (
        <div style={{ fontSize: 11, color: 'var(--text-low, #909090)', lineHeight: 1.4 }}>
          {description}
        </div>
      )}
    </div>
  );
}
