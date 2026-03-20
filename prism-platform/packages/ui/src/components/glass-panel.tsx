import React from 'react';
import { cn } from '../utils/cn';

export interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  title?: string;
  variant?: 'glass' | 'solid' | 'widget';
  actions?: React.ReactNode;
}

export function GlassPanel({
  children,
  className,
  padding = 'md',
  title,
  variant = 'glass',
  actions,
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'transition-all duration-normal ease-out-expo',
        variant === 'glass' && 'glass',
        variant === 'solid' && 'bg-obsidian-800 border border-obsidian-600/50 rounded-[20px]',
        variant === 'widget' && 'widget',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-6',
        padding === 'lg' && 'p-8',
        padding === 'none' && 'p-0',
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-obsidian-100">{title}</h3>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
