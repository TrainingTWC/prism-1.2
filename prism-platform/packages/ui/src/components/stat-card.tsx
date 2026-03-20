import React from 'react';
import { cn } from '../utils/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean } | 'up' | 'down' | 'neutral';
  status?: string;
  className?: string;
  /** Mini visualization to show in the top-right area */
  visual?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  status: _status,
  className,
  visual,
}: StatCardProps) {
  const trendObj = typeof trend === 'object' && trend !== null ? trend : null;
  const trendDir = typeof trend === 'string' ? trend : (trendObj ? (trendObj.isPositive ? 'up' : 'down') : null);

  return (
    <div
      className={cn(
        'widget p-6 transition-all duration-300 ease-out group',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-obsidian-400">{title}</p>
        {icon && <div>{icon}</div>}
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-bold tracking-tight text-obsidian-50 font-mono-value">
            {value}
          </p>
          {trendObj && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className={cn(
                'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl',
                trendObj.isPositive
                  ? 'bg-[rgba(13,140,99,0.08)] text-[#10b37d]'
                  : 'bg-[rgba(239,68,68,0.08)] text-[#EF4444]'
              )}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                    d={trendObj.isPositive ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                </svg>
                {trendObj.value}%
              </span>
              <span className="text-[11px] text-obsidian-500">vs last period</span>
            </div>
          )}
          {subtitle && (
            <p
              className={cn(
                'mt-2 text-xs',
                trendDir === 'up' && 'text-[#22C55E]',
                trendDir === 'down' && 'text-[#EF4444]',
                (!trendDir || trendDir === 'neutral') && 'text-obsidian-400',
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {visual && <div className="shrink-0">{visual}</div>}
      </div>
    </div>
  );
}
