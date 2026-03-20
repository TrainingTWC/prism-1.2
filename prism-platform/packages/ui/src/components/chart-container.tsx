import React from 'react';
import { cn } from '../utils/cn';
import { ResponsiveContainer } from 'recharts';

export interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactElement;
  className?: string;
  height?: number | string;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  className,
  height = 300,
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        className
      )}
    >
      {title && (
        <div className="flex flex-col">
          <h3 className="text-base font-semibold tracking-tight text-obsidian-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-obsidian-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
