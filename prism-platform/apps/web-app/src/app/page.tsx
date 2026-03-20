'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import type { AppPermission } from '@prism/auth';

interface NavCardItem {
    title: string;
    href: string;
    gradient?: string;
    description?: string;
    action?: string;
    icon: React.ReactNode;
    /** If set, only users with this permission see the item */
    requiredPermission?: AppPermission;
}

/* ── Quick Access Cards (Spotify-style 2-col grid on mobile) ── */
const quickAccess: NavCardItem[] = [
    {
        title: 'AI Intelligence',
        href: '/ai-insights',
        gradient: 'from-emerald-600/20 to-emerald-900/10',
        requiredPermission: 'dashboard',
        icon: (
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
        ),
    },
    {
        title: 'Dashboards',
        href: '/dashboards',
        gradient: 'from-blue-600/20 to-blue-900/10',
        requiredPermission: 'dashboard',
        icon: (
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 16l4-8 4 5 5-9" />
            </svg>
        ),
    },
    {
        title: 'Checklists',
        href: '/checklists',
        gradient: 'from-amber-600/20 to-amber-900/10',
        icon: (
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 14l2 2 4-4" />
            </svg>
        ),
    },
    {
        title: 'Reports',
        href: '/reports',
        gradient: 'from-purple-600/20 to-purple-900/10',
        requiredPermission: 'dashboard',
        icon: (
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" x2="12" y1="20" y2="10" />
                <line x1="18" x2="18" y1="20" y2="4" />
                <line x1="6" x2="6" y1="20" y2="16" />
            </svg>
        ),
    },
];

/* ── Full Navigation Cards Data (desktop) ── */
const navCards: NavCardItem[] = [
    {
        title: 'AI Intelligence',
        description: 'Ask Prism to analyze store health, manager performance, and operational risks in real-time.',
        action: 'ASK PRISM',
        href: '/ai-insights',
        requiredPermission: 'dashboard',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
        ),
    },
    {
        title: 'Dashboards',
        description: 'Access real-time telemetry, operational health scores, and global performance metrics.',
        action: 'VIEW ANALYTICS',
        href: '/dashboards',
        requiredPermission: 'dashboard',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 16l4-8 4 5 5-9" />
            </svg>
        ),
    },
    {
        title: 'Checklists',
        description: 'Execute field operations, submit store audits, and manage compliance workflows.',
        action: 'OPEN MODULES',
        href: '/checklists',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 14l2 2 4-4" />
            </svg>
        ),
    },
];

export default function HomePage() {
    const { user, employeeInfo, empId, canAccess } = useAuth();
    const firstName = (user?.name || employeeInfo?.name || empId || '').split(' ')[0];
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // Filter cards by permission
    const visibleQuickAccess = quickAccess.filter(c => !c.requiredPermission || canAccess(c.requiredPermission));
    const visibleNavCards = navCards.filter(c => !c.requiredPermission || canAccess(c.requiredPermission));

    return (
        <>
            {/* ══════════ Mobile: Spotify-style Home ══════════ */}
            <div className="md:hidden flex flex-col gap-6 pt-4">
                {/* Greeting */}
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1">
                        {timeGreeting}{firstName ? `, ${firstName}` : ''}
                    </p>
                    <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
                        PRISM
                    </h1>
                </div>

                {/* Quick Access Grid — Spotify 2-col shortcut cards */}
                <div className="grid grid-cols-2 gap-2.5">
                    {visibleQuickAccess.map((item) => (
                        <Link key={item.title} href={item.href}>
                            <div className={`flex items-center gap-3 rounded-lg bg-gradient-to-r ${item.gradient} p-3 active:scale-[0.97] transition-transform`}>
                                <div className="w-10 h-10 rounded-md bg-[var(--card-bg)] flex items-center justify-center flex-shrink-0">
                                    {item.icon}
                                </div>
                                <span className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">
                                    {item.title}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Section: Intelligence Hub */}
                {canAccess('dashboard') && (
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">
                        Intelligence Hub
                    </h2>
                    <Link href="/ai-insights">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#10b37d]/20 via-[#0d8c63]/10 to-transparent border border-[#10b37d]/15 p-5 active:scale-[0.98] transition-transform">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(16,179,125,0.15)_0%,transparent_70%)] pointer-events-none" />
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#10b37d]/15 border border-[#10b37d]/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-[#10b37d]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[var(--text-primary)] mb-0.5">Ask Prism Anything</p>
                                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                        Analyze store health, performance and operational risks with AI
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-4 text-[#10b37d] text-[11px] font-bold tracking-wider">
                                OPEN INTELLIGENCE
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                </div>
                )}

                {/* Section: Recent Modules */}
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">
                        Jump back in
                    </h2>
                    <div className="flex flex-col gap-2">
                        {canAccess('dashboard') && (
                        <Link href="/dashboards" className="flex items-center gap-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-subtle)] p-3.5 active:scale-[0.98] transition-transform">
                            <div className="w-11 h-11 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M3 3v18h18" /><path d="M7 16l4-8 4 5 5-9" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-[var(--text-primary)] truncate">Dashboards</p>
                                <p className="text-[10px] text-[var(--text-muted)]">10 analytics modules</p>
                            </div>
                            <svg className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </Link>
                        )}
                        <Link href="/checklists" className="flex items-center gap-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-subtle)] p-3.5 active:scale-[0.98] transition-transform">
                            <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-[var(--text-primary)] truncate">Checklists</p>
                                <p className="text-[10px] text-[var(--text-muted)]">16 programs across 8 categories</p>
                            </div>
                            <svg className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </Link>
                        {canAccess('dashboard') && (
                        <Link href="/reports" className="flex items-center gap-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-subtle)] p-3.5 active:scale-[0.98] transition-transform">
                            <div className="w-11 h-11 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-[var(--text-primary)] truncate">Reports</p>
                                <p className="text-[10px] text-[var(--text-muted)]">Compliance & performance reports</p>
                            </div>
                            <svg className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════ Desktop: Original Layout ══════════ */}
            <div className="hidden md:flex flex-col items-start justify-center min-h-[calc(100vh-3.5rem)] px-4 sm:px-6 -mt-8">
                {/* ── Hero Section ── */}
                <div className="text-left mb-16 w-full max-w-4xl mx-auto">
                    <p className="text-sm font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                        {timeGreeting}{firstName ? `, ${firstName}` : ''}
                    </p>
                    <h1 className="text-[72px] md:text-[96px] font-black tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
                        PRISM
                    </h1>
                    <h2 className="text-[72px] md:text-[96px] font-black tracking-tight leading-none text-[#10b37d]">
                        Intelligence
                    </h2>
                    <p className="mt-6 text-base font-medium tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
                        Powering actionable insights for every store, every team, every mission.
                    </p>
                </div>

                {/* ── Navigation Cards ── */}
                <div className="grid grid-cols-3 gap-5 w-full max-w-4xl mx-auto">
                    {visibleNavCards.map((card) => (
                        <Link key={card.title} href={card.href} className="block group">
                            <div
                                className="relative overflow-hidden rounded-2xl border p-6 h-full transition-all duration-300 ease-out hover:scale-[1.02]"
                                style={{
                                    backgroundColor: 'var(--card-bg)',
                                    borderColor: 'var(--border-subtle)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(16,179,125,0.3)';
                                    e.currentTarget.style.boxShadow = '0 0 40px rgba(16,179,125,0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle,rgba(16,179,125,0.06)_0%,transparent_70%)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div
                                    className="flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-[#10b37d] border transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(16,179,125,0.15)]"
                                    style={{ backgroundColor: 'rgba(16,179,125,0.08)', borderColor: 'rgba(16,179,125,0.15)' }}
                                >
                                    {card.icon}
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>{card.title}</h3>
                                <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>{card.description}</p>
                                <div className="flex items-center gap-1.5 text-[#10b37d] text-xs font-bold tracking-wider group-hover:gap-2.5 transition-all duration-200">
                                    {card.action}
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}
