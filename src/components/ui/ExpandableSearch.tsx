'use client';

import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExpandableSearchProps {
  placeholder?: string;
  collapsedWidth?: number;
  expandedWidth?: number;
  onSearch?: (query: string) => void;
  className?: string;
}

export function ExpandableSearch({
  placeholder = 'Quick lookup...',
  collapsedWidth = 36,
  expandedWidth = 240,
  onSearch,
  className = '',
}: ExpandableSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const clean = query.trim();
      if (!clean) return;
      if (onSearch) {
        onSearch(clean);
      } else {
        router.push(`/track/${encodeURIComponent(clean.toUpperCase())}`);
      }
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={`expandable-search ${className}`}
      style={{
        ['--search-collapsed-w' as string]: `${collapsedWidth}px`,
        ['--search-expanded-w' as string]: `${expandedWidth}px`,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={isFocused || query ? placeholder : ''}
        className="expandable-search__input"
        title="Quick search (Press Enter to track)"
      />
      <span className="expandable-search__icon">
        <Search size={15} />
      </span>

      {query && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: 8,
            background: 'none',
            border: 'none',
            color: 'var(--text-low)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
