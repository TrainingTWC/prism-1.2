'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@prism/ui';

// ── SVG icon paths for each dashboard module ──
const MODULE_ICONS: Record<string, string[]> = {
    'map-view': [
        'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z',
    ],
    hr: [
        'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    ],
    operations: [
        'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z',
        'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    ],
    training: [
        'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    ],
    qa: [
        'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    ],
    finance: [
        'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
    ],
    shlp: [
        'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    ],
    'campus-hiring': [
        'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
    ],
    'trainer-calendar': [
        'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z',
    ],
    'bench-planning': [
        'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    ],
    consolidated: [
        'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z',
    ],
};

function ModuleIcon({ id, color, size = 16 }: { id: string; color: string; size?: number }) {
    const paths = MODULE_ICONS[id] ?? MODULE_ICONS.consolidated;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color }}>
            {paths.map((d, i) => <path key={i} d={d} />)}
        </svg>
    );
}

export interface DashboardModule {
    id: string;
    label: string;
    href: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    badge?: string;
}

export const dashboardModules: DashboardModule[] = [
    { id: 'map-view', label: 'Map View', href: '/dashboards/map-view', color: '#10b37d', bgColor: 'rgba(16,179,125,0.08)', borderColor: 'rgba(16,179,125,0.2)', description: 'Store Geolocation' },
    { id: 'hr', label: 'HR', href: '/dashboards/hr', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)', description: 'Employee Surveys' },
    { id: 'operations', label: 'Operations', href: '/dashboards/operations', color: '#10b37d', bgColor: 'rgba(16,179,125,0.08)', borderColor: 'rgba(16,179,125,0.2)', description: 'Checklists' },
    { id: 'training', label: 'Training', href: '/dashboards/training', color: '#A855F7', bgColor: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.2)', description: 'Audits' },
    { id: 'qa', label: 'QA', href: '/dashboards/qa', color: '#EF4444', bgColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', description: 'Assessments' },
    { id: 'finance', label: 'Finance', href: '/dashboards/finance', color: '#22C55E', bgColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)', description: 'Reports' },
    { id: 'shlp', label: 'SHLP', href: '/dashboards/shlp', color: '#10B981', bgColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)', description: 'Certification' },
    { id: 'campus-hiring', label: 'Campus Hiring', href: '/dashboards/campus-hiring', color: '#6366F1', bgColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)', description: 'Assessment Results' },
    { id: 'trainer-calendar', label: 'Trainer Calendar', href: '/dashboards/trainer-calendar', color: '#A855F7', bgColor: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.2)', description: 'Scheduling' },
    { id: 'bench-planning', label: 'Bench Planning', href: '/dashboards/bench-planning', color: '#10b37d', bgColor: 'rgba(16,179,125,0.08)', borderColor: 'rgba(16,179,125,0.2)', description: 'Barista → SM' },
    { id: 'consolidated', label: 'Consolidated', href: '/dashboards/consolidated', color: '#64748B', bgColor: 'rgba(100,116,139,0.08)', borderColor: 'rgba(100,116,139,0.2)', description: 'Cross-Dept View', badge: 'Editor' },
];

// ── View Toggle Button ──
export function ViewToggle({ view, onChange }: { view: 'grid' | 'list'; onChange: (v: 'grid' | 'list') => void }) {
    return (
        <div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden">
            <button
                onClick={() => onChange('grid')}
                className={cn(
                    'p-2 transition-all',
                    view === 'grid' ? 'bg-[rgba(16,179,125,0.12)] text-[#10b37d]' : 'text-obsidian-500 hover:text-obsidian-300'
                )}
                title="Grid view"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            </button>
            <button
                onClick={() => onChange('list')}
                className={cn(
                    'p-2 transition-all',
                    view === 'list' ? 'bg-[rgba(16,179,125,0.12)] text-[#10b37d]' : 'text-obsidian-500 hover:text-obsidian-300'
                )}
                title="List view"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
            </button>
        </div>
    );
}

export function DashboardTypeSelector({ className, view: externalView }: { className?: string; view?: 'grid' | 'list' }) {
    const pathname = usePathname();
    const viewMode = externalView ?? 'grid';

    if (viewMode === 'list') {
        return (
            <div className={cn("space-y-1.5", className)}>
                {dashboardModules.map((mod) => {
                    const isActive = pathname === mod.href;
                    return (
                        <Link
                            key={mod.id}
                            href={mod.href}
                            className={cn(
                                "relative flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-normal ease-out-expo group",
                                isActive ? "shadow-md" : "hover:bg-[var(--card-bg-hover)]"
                            )}
                            style={{
                                backgroundColor: isActive ? mod.bgColor : 'transparent',
                                borderColor: isActive ? mod.borderColor : 'transparent',
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                                style={{
                                    backgroundColor: `${mod.color}12`,
                                    border: `1px solid ${mod.color}25`,
                                    boxShadow: isActive ? `0 0 12px ${mod.color}20` : undefined,
                                }}
                            >
                                <ModuleIcon id={mod.id} color={mod.color} size={15} />
                            </div>
                            <span
                                className={cn("text-sm font-bold transition-colors", isActive ? "" : "text-obsidian-300 group-hover:text-obsidian-100")}
                                style={{ color: isActive ? mod.color : undefined }}
                            >
                                {mod.label}
                            </span>
                            <span className="text-[10px] text-obsidian-500">{mod.description}</span>
                            {mod.badge && (
                                <span className="ml-auto text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-obsidian-700/60 text-obsidian-400 border border-obsidian-600/30">
                                    {mod.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3", className)}>
            {dashboardModules.map((mod) => {
                const isActive = pathname === mod.href;
                return (
                    <Link
                        key={mod.id}
                        href={mod.href}
                        className={cn(
                            "relative aspect-square flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-normal ease-out-expo group",
                            isActive
                                ? "shadow-lg"
                                : "hover:scale-[1.02] hover:shadow-md"
                        )}
                        style={{
                            backgroundColor: isActive ? mod.bgColor : 'var(--card-bg)',
                            borderColor: isActive ? mod.borderColor : 'var(--border-subtle)',
                            boxShadow: isActive ? `0 0 24px ${mod.color}15` : undefined,
                        }}
                    >
                        {mod.badge && (
                            <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-obsidian-700/60 text-obsidian-400 border border-obsidian-600/30">
                                {mod.badge}
                            </span>
                        )}
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all duration-fast"
                            style={{
                                backgroundColor: `${mod.color}12`,
                                border: `1px solid ${mod.color}25`,
                                boxShadow: isActive ? `0 0 16px ${mod.color}30` : undefined,
                            }}
                        >
                            <ModuleIcon id={mod.id} color={mod.color} size={18} />
                        </div>
                        <span 
                            className={cn(
                                "text-[13px] font-bold transition-colors duration-fast text-center leading-tight",
                                isActive ? "" : "text-obsidian-300 group-hover:text-obsidian-100"
                            )}
                            style={{ color: isActive ? mod.color : undefined }}
                        >
                            {mod.label}
                        </span>
                        <span className="text-[10px] text-obsidian-500 mt-0.5">{mod.description}</span>
                    </Link>
                );
            })}
        </div>
    );
}

export { ModuleIcon };
