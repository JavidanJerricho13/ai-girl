'use client';

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSort === field;

  return (
    <th
      className={`text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-zinc-300 transition-colors select-none ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentOrder === 'asc' ? (
            <ArrowUp size={12} className="text-indigo-400" />
          ) : (
            <ArrowDown size={12} className="text-indigo-400" />
          )
        ) : (
          <ArrowUpDown size={10} className="text-zinc-700" />
        )}
      </span>
    </th>
  );
}
