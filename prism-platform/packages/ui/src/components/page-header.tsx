import React from 'react';
import { cn } from '../utils/cn';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  overline?: string;
  actions?: React.ReactNode;
  breadcrumbs?: string[];
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  overline,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        className
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          {overline && (
            <span className="text-overline">{overline}</span>
          )}
          <h1 className="text-[32px] font-extrabold tracking-tight text-obsidian-100 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-normal text-obsidian-300 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      <div className="h-px w-full bg-gradient-to-r from-[#0d8c63]/30 via-[#0d8c63]/10 to-transparent" />
    </div>
  );
}
