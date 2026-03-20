'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, LayoutGroup } from 'framer-motion';
import { dashboardModules, ViewToggle, ModuleIcon } from '@/components/dashboard/dashboard-type-selector';

const MotionLink = motion.create(Link);
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.5 };

export default function DashboardsPage() {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const isGrid = view === 'grid';

    return (
        <div className="space-y-8 pb-10">
            {/* Page Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-obsidian-500 mb-1">Navigate</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-obsidian-50 tracking-tight">Dashboards</h1>
                    <p className="text-xs sm:text-sm text-obsidian-400 mt-1 hidden sm:block">Select a department dashboard to view analytics and insights.</p>
                </div>
                <ViewToggle view={view} onChange={setView} />
            </div>

            {/* Dashboard Modules — morphing layout */}
            <LayoutGroup>
                <div
                    className={
                        isGrid
                            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                            : "flex flex-col gap-1.5"
                    }
                >
                    {dashboardModules.map((mod) => (
                        <MotionLink
                            key={mod.id}
                            layout
                            layoutId={`dash-${mod.id}`}
                            href={mod.href}
                            className={
                                isGrid
                                    ? "relative aspect-square flex flex-col items-center justify-center p-4 border border-[var(--border-subtle)] bg-[var(--card-bg)] group hover:shadow-lg hover:border-[var(--border-primary)] hover:bg-[var(--card-bg-hover)]"
                                    : "relative flex items-center gap-4 px-4 py-3 border border-[var(--border-subtle)] bg-[var(--card-bg)] group hover:bg-[var(--card-bg-hover)] hover:border-[var(--border-primary)] hover:shadow-md"
                            }
                            style={{ borderRadius: isGrid ? 16 : 12 }}
                            transition={{ layout: SPRING }}
                        >
                            {/* Badge */}
                            {mod.badge && (
                                <motion.span
                                    layout="position"
                                    className={
                                        isGrid
                                            ? "absolute top-2.5 right-2.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-obsidian-700/60 text-obsidian-400 border border-obsidian-600/30"
                                            : "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-obsidian-700/60 text-obsidian-400 border border-obsidian-600/30 order-3"
                                    }
                                    transition={SPRING}
                                >
                                    {mod.badge}
                                </motion.span>
                            )}

                            {/* Icon */}
                            <motion.div
                                layout="position"
                                className="flex items-center justify-center flex-shrink-0"
                                animate={{
                                    width: isGrid ? 44 : 36,
                                    height: isGrid ? 44 : 36,
                                    borderRadius: isGrid ? 12 : 8,
                                    marginBottom: isGrid ? 12 : 0,
                                }}
                                style={{ backgroundColor: `${mod.color}15`, border: `1px solid ${mod.color}25` }}
                                transition={SPRING}
                            >
                                <ModuleIcon id={mod.id} color={mod.color} size={18} />
                            </motion.div>

                            {/* Labels */}
                            <motion.div
                                layout="position"
                                className={isGrid ? "flex flex-col items-center" : "flex-1 min-w-0 flex items-center gap-2"}
                                transition={SPRING}
                            >
                                <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-obsidian-50 transition-colors leading-tight">
                                    {mod.label}
                                </span>
                                <span className={isGrid ? "text-[10px] text-[var(--text-muted)] mt-1" : "text-[10px] text-[var(--text-muted)]"}>
                                    {mod.description}
                                </span>
                            </motion.div>

                            {/* List chevron — always in DOM, animated width/opacity */}
                            <motion.svg
                                animate={{
                                    opacity: !isGrid ? 1 : 0,
                                    width: !isGrid ? 16 : 0,
                                }}
                                transition={SPRING}
                                className="h-4 text-obsidian-500 group-hover:text-[var(--text-primary)] flex-shrink-0 order-4 overflow-hidden"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </motion.svg>

                            {/* Grid "Open →" hint — absolute, no flow impact */}
                            {isGrid && (
                                <span
                                    className="absolute bottom-3 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    style={{ color: mod.color }}
                                >
                                    Open →
                                </span>
                            )}
                        </MotionLink>
                    ))}
                </div>
            </LayoutGroup>
        </div>
    );
}
