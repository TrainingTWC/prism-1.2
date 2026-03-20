import React from 'react';
import { cn } from '../utils/cn';

export interface FilterBarProps {
  children?: React.ReactNode;
  className?: string;
  onSearch?: (term: string) => void;
  onClear?: () => void;
  showClear?: boolean;
  placeholder?: string;
}

export function FilterBar({
  children,
  className,
  onSearch,
  onClear,
  showClear = false,
  placeholder = 'Search...',
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'glass rounded-card p-4 flex flex-wrap items-center gap-4 transition-all duration-normal ease-out-expo',
        className
      )}
    >
      {onSearch && (
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-obsidian-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input
            type="search"
            onChange={(e) => onSearch(e.target.value)}
            className="w-full py-2 pl-9 pr-4 text-sm bg-obsidian-800 border border-obsidian-600/50 rounded-card text-obsidian-200 placeholder-obsidian-400 focus:border-[#0d8c63]/40 focus:ring-0 outline-none transition-all duration-fast"
            placeholder={placeholder}
          />
        </div>
      )}
      {children && (
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {children}
        </div>
      )}
      {showClear && onClear && (
        <button
          onClick={onClear}
          className="text-xs font-medium text-obsidian-400 hover:text-obsidian-200 transition-colors duration-fast"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export function FilterItem({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-obsidian-400 px-1">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
