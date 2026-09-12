'use client';

import * as React from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from './Empty';

export interface Column<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  enableHiding?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  searchFilterFn?: (item: T, query: string) => boolean;
  pageSize?: number;
  enableSelection?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  getRowId?: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchPlaceholder = 'Filter records...',
  searchKey,
  searchFilterFn,
  pageSize = 10,
  enableSelection = true,
  onSelectionChange,
  getRowId = (item: T) => String((item as { id?: string | number }).id || Math.random()),
  emptyTitle = 'No matching records',
  emptyDescription = 'Try adjusting your search terms or filters.',
  className,
}: DataTableProps<T>) {
  // ─── SEARCH STATE ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = React.useState('');

  // ─── SORTING STATE ───────────────────────────────────────────────────────────
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  // ─── COLUMN VISIBILITY ───────────────────────────────────────────────────────
  const [visibleColumnIds, setVisibleColumnIds] = React.useState<Set<string>>(
    () => new Set(columns.map((c) => c.id))
  );
  const [isVisibilityOpen, setIsVisibilityOpen] = React.useState(false);

  // ─── ROW SELECTION ───────────────────────────────────────────────────────────
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(new Set());

  // ─── PAGINATION ──────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filter items
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();

    if (searchFilterFn) {
      return data.filter((item) => searchFilterFn(item, q));
    }

    if (searchKey) {
      return data.filter((item) => String(item[searchKey] || '').toLowerCase().includes(q));
    }

    // Default search across all properties
    return data.filter((item) =>
      Object.values(item).some((val) =>
        String(val || '').toLowerCase().includes(q)
      )
    );
  }, [data, searchQuery, searchFilterFn, searchKey]);

  // Sort items
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col || !col.accessorKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[col.accessorKey!];
      const valB = b[col.accessorKey!];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      const cmp = strA.localeCompare(strB);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = sortedData.slice(startIndex, startIndex + pageSize);

  const handleToggleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(sortedData.map(getRowId));
      setSelectedRowIds(allIds);
      onSelectionChange?.(sortedData);
    } else {
      setSelectedRowIds(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleToggleRow = (item: T) => {
    const id = getRowId(item);
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);

    setSelectedRowIds(next);
    const selectedItems = data.filter((d) => next.has(getRowId(d)));
    onSelectionChange?.(selectedItems);
  };

  const isAllSelected = sortedData.length > 0 && selectedRowIds.size >= sortedData.length;
  const isSomeSelected = selectedRowIds.size > 0 && !isAllSelected;

  const visibleColumns = columns.filter((c) => visibleColumnIds.has(c.id));

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Table Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--icon,#6B7280)]" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border,#E6E4DF)] bg-[var(--surface-1,#FFFFFF)] text-xs text-[var(--text-high)] placeholder-[var(--text-low)] outline-none focus:border-[var(--brand,#0057FF)]"
          />
        </div>

        {/* Column Visibility Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsVisibilityOpen(!isVisibilityOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border,#E6E4DF)] bg-[var(--surface-1,#FFFFFF)] text-xs font-semibold text-[var(--text-mid)] hover:bg-[var(--surface-2)] transition cursor-pointer"
          >
            <SlidersHorizontal className="size-3.5 text-[var(--icon)]" />
            <span>Columns</span>
          </button>

          {isVisibilityOpen && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] w-48 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-2 shadow-xl z-50 text-xs"
              onMouseLeave={() => setIsVisibilityOpen(false)}
            >
              <div className="text-[10px] font-bold text-[var(--text-low)] px-2 py-1 uppercase tracking-wider">
                Toggle Columns
              </div>
              {columns.map((col) => {
                if (col.enableHiding === false) return null;
                const isChecked = visibleColumnIds.has(col.id);
                return (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--surface-2)] cursor-pointer select-none text-[var(--text-high)]"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const next = new Set(visibleColumnIds);
                        if (isChecked) {
                          if (next.size > 1) next.delete(col.id);
                        } else {
                          next.add(col.id);
                        }
                        setVisibleColumnIds(next);
                      }}
                      className="size-3.5 accent-[var(--brand)] rounded"
                    />
                    <span>{typeof col.header === 'string' ? col.header : col.id}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table Surface */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border,#E6E4DF)] bg-[var(--surface-1,#FFFFFF)] shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--border,#E6E4DF)] bg-[var(--surface-2,#F3F2EF)]/60 text-[var(--text-mid)] font-semibold">
              {enableSelection && (
                <th className="w-12 px-3.5 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="size-3.5 accent-[var(--brand)] rounded cursor-pointer"
                    aria-label="Select all"
                  />
                </th>
              )}

              {visibleColumns.map((col) => (
                <th key={col.id} className="px-4 py-3 font-semibold text-[var(--text-mid)] select-none">
                  {col.sortable !== false && col.accessorKey ? (
                    <button
                      type="button"
                      onClick={() => handleToggleSort(col.id)}
                      className="flex items-center gap-1.5 font-semibold text-[var(--text-high)] hover:text-[var(--brand)] transition cursor-pointer"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="size-3 text-[var(--icon)]" />
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border,#E6E4DF)]">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (enableSelection ? 1 : 0)} className="py-12">
                  <Empty className="p-4">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" />
                      <EmptyTitle>{emptyTitle}</EmptyTitle>
                      <EmptyDescription>{emptyDescription}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </td>
              </tr>
            ) : (
              pageItems.map((item, rowIdx) => {
                const id = getRowId(item);
                const isSelected = selectedRowIds.has(id);

                return (
                  <tr
                    key={id}
                    className={cn(
                      'transition-colors hover:bg-[var(--surface-2,#F3F2EF)]/50',
                      isSelected && 'bg-[var(--brand-10,#0057FF14)] hover:bg-[var(--brand-10)]'
                    )}
                  >
                    {enableSelection && (
                      <td className="w-12 px-3.5 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(item)}
                          className="size-3.5 accent-[var(--brand)] rounded cursor-pointer"
                          aria-label={`Select row ${id}`}
                        />
                      </td>
                    )}

                    {visibleColumns.map((col) => {
                      const value = col.accessorKey ? item[col.accessorKey] : undefined;
                      return (
                        <td key={col.id} className="px-4 py-3 text-[var(--text-high)] align-middle">
                          {col.cell ? col.cell(item, rowIdx) : String(value ?? '')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-1 py-1 text-xs text-[var(--text-mid)] flex-wrap gap-2">
        {enableSelection && (
          <div>
            {selectedRowIds.size} of {sortedData.length} row(s) selected
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-high)] hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-high)] hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
