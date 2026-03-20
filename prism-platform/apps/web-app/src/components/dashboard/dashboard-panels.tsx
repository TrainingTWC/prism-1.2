'use client';

import React from 'react';
import { cn } from '@prism/ui';

interface DashboardChartPlaceholderProps {
    title: string;
    subtitle?: string;
    height?: number;
    children?: React.ReactNode;
    className?: string;
}

export function DashboardChartPanel({ title, subtitle, height = 300, children, className }: DashboardChartPlaceholderProps) {
    return (
        <div className={cn(
            "rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] backdrop-blur-xl p-6 transition-all duration-normal ease-out-expo hover:border-obsidian-600/50",
            className
        )}>
            <div className="mb-4">
                <h3 className="text-base font-bold text-obsidian-100">{title}</h3>
                {subtitle && <p className="text-xs text-obsidian-400 mt-0.5">{subtitle}</p>}
            </div>
            <div style={{ minHeight: height }}>
                {children || (
                    <div className="flex items-center justify-center h-full min-h-[200px] rounded-xl border border-dashed border-obsidian-600/30">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-obsidian-700/40 flex items-center justify-center">
                                <svg className="w-6 h-6 text-obsidian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="text-xs text-obsidian-400 font-medium">Chart data loads from API</p>
                            <p className="text-[10px] text-obsidian-500 mt-1">Connect data source to render</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function DashboardInfoPanel({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            "rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] backdrop-blur-xl p-6",
            className
        )}>
            <h3 className="text-base font-bold text-obsidian-100 mb-4">{title}</h3>
            {children || (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 rounded-xl bg-obsidian-700/30 animate-pulse" />
                    ))}
                </div>
            )}
        </div>
    );
}
