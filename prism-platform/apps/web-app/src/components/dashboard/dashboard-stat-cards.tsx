'use client';

import React from 'react';
import { cn } from '@prism/ui';

interface DashboardStatProps {
    label: string;
    value: string | number;
    trend?: { value: number; isPositive: boolean };
    icon?: React.ReactNode;
    color?: string;
}

export function DashboardStatCards({ stats, className }: { stats: DashboardStatProps[]; className?: string }) {
    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="relative overflow-hidden rounded-2xl border border-obsidian-600/30 bg-[var(--bg-surface)] backdrop-blur-xl p-5 transition-all duration-normal ease-out-expo hover:border-obsidian-600/50 hover:bg-[var(--bg-surface-hover)] group"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-obsidian-400 mb-2">{stat.label}</p>
                            <p className="text-2xl font-bold text-obsidian-50 font-mono tracking-tight">{stat.value}</p>
                            {stat.trend && (
                                <div className={cn(
                                    "flex items-center mt-2 text-xs font-semibold",
                                    stat.trend.isPositive ? "text-[#22C55E]" : "text-[#EF4444]"
                                )}>
                                    <svg className={cn("w-3 h-3 mr-1", !stat.trend.isPositive && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                                    </svg>
                                    {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                                </div>
                            )}
                        </div>
                        {stat.icon && (
                            <div className="p-2 rounded-xl" style={{ backgroundColor: `${stat.color || '#10b37d'}10` }}>
                                {stat.icon}
                            </div>
                        )}
                    </div>
                    {/* Bottom accent line */}
                    <div 
                        className="absolute bottom-0 left-0 h-[2px] w-full opacity-0 group-hover:opacity-100 transition-opacity duration-normal"
                        style={{ background: `linear-gradient(90deg, transparent, ${stat.color || '#10b37d'}40, transparent)` }}
                    />
                </div>
            ))}
        </div>
    );
}
