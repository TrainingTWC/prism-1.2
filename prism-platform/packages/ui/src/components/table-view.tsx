import React from 'react';
import { cn } from '../utils/cn';

export interface TableViewProps<T> {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
    mono?: boolean;
  }[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  className?: string;
}

export function TableView<T>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  className,
}: TableViewProps<T>) {
  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-normal ease-out-expo',
        className
      )}
    >
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-obsidian-600/30">
              {columns.map((col, idx) => (
                <th key={idx} className={cn(
                  'px-6 py-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.12em] text-obsidian-400',
                  col.className
                )}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((_, idx) => (
                    <td key={idx} className="px-6 py-5">
                      <div className="h-4 skeleton rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center text-obsidian-400">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-obsidian-600/20 transition-all duration-fast group',
                    onRowClick && 'cursor-pointer hover:bg-[rgba(13,140,99,0.03)]'
                  )}
                >
                  {columns.map((col, colIdx) => {
                    const content = typeof col.accessor === 'function' 
                      ? col.accessor(row) 
                      : (row[col.accessor] as React.ReactNode);
                    
                    return (
                      <td key={colIdx} className={cn(
                        'px-6 py-4 text-obsidian-200 group-hover:text-obsidian-100 transition-colors duration-fast',
                        col.mono && 'font-mono text-[11px]',
                        col.className
                      )}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
