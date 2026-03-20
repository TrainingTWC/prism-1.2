'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import type { AppPermission } from '@prism/auth';
import {
    HomeIcon,
    SparklesIcon,
    LayoutGrid,
    ClipboardListIcon,
    ChecklistIcon,
    BookOpenIcon,
    UserIcon,
    StoreIcon,
    BarChartIcon,
} from '../icons';

const spring = { type: 'spring' as const, bounce: 0.15, duration: 0.45 };

interface TabItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    requiredPermission?: AppPermission;
}

const tabs: TabItem[] = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Intelligence', href: '/ai-insights', icon: SparklesIcon, requiredPermission: 'dashboard' },
    { name: 'Dashboards', href: '/dashboards', icon: LayoutGrid, requiredPermission: 'dashboard' },
    { name: 'Checklists', href: '/checklists', icon: ClipboardListIcon },
];

const libraryItems: TabItem[] = [
    { name: 'Reports', href: '/reports', icon: BarChartIcon },
    { name: 'Checklist Builder', href: '/programs', icon: ChecklistIcon },
    { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpenIcon },
    { name: 'Emp Master', href: '/employees', icon: UserIcon },
    { name: 'Store Master', href: '/stores', icon: StoreIcon },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const [sheetOpen, setSheetOpen] = useState(false);
    const { isAdmin, isEditor, canAccess } = useAuth();

    // Filter tabs by permission
    const visibleTabs = useMemo(() => {
        return tabs.filter(tab => !tab.requiredPermission || canAccess(tab.requiredPermission));
    }, [canAccess]);

    const isActive = useCallback(
        (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href)),
        [pathname],
    );

    // Filter library items — admin tools only visible to admin/editor, Reports needs dashboard
    const filteredLibrary = useMemo(() => {
        const items = isAdmin || isEditor ? libraryItems : libraryItems.filter(item => item.href === '/reports');
        // Also gate Reports behind dashboard permission
        return items.filter(item => item.href !== '/reports' || canAccess('dashboard'));
    }, [isAdmin, isEditor, canAccess]);

    // Check if any library item is currently active
    const isLibraryActive = filteredLibrary.some((item) => isActive(item.href));

    return (
        <>
            {/* ── Bottom Sheet (Library) ── */}
            <AnimatePresence>
                {sheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[90] bg-black/60"
                            onClick={() => setSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={spring}
                            className="fixed bottom-0 left-0 right-0 z-[91] rounded-t-3xl bg-[var(--sidebar-bg)] border-t border-[var(--border-subtle)] pb-safe"
                        >
                            {/* Handle bar */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-10 h-1 rounded-full bg-[var(--text-muted)] opacity-40" />
                            </div>

                            {/* Header */}
                            <div className="px-6 pb-3">
                                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                                    Your Library
                                </h3>
                                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                    Admin tools & more
                                </p>
                            </div>

                            {/* Items */}
                            <nav className="px-4 pb-6 space-y-0.5">
                                {filteredLibrary.map((item) => {
                                    const active = isActive(item.href);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSheetOpen(false)}
                                            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors ${
                                                active
                                                    ? 'bg-[#10b37d]/10 text-[#10b37d]'
                                                    : 'text-[var(--text-secondary)] active:bg-[var(--card-bg-hover)]'
                                            }`}
                                        >
                                            <Icon
                                                size={20}
                                                className={active ? 'text-[#10b37d]' : 'text-[var(--text-muted)]'}
                                            />
                                            <span className="text-[13px] font-semibold">{item.name}</span>
                                            <svg
                                                className="w-4 h-4 ml-auto text-[var(--text-muted)]"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                                />
                                            </svg>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Bottom Tab Bar ── */}
            <div className="fixed bottom-0 left-0 right-0 z-[80] md:hidden">
                {/* Blur backdrop */}
                <div className="absolute inset-0 bg-[var(--sidebar-bg)] border-t border-[var(--sidebar-border)]" />

                <nav className="relative flex items-stretch justify-around px-2 h-[4.25rem] pb-safe">
                    {visibleTabs.map((tab) => {
                        const active = isActive(tab.href);
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className="flex flex-col items-center justify-center flex-1 gap-0.5 relative"
                            >
                                {active && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute -top-px left-[20%] right-[20%] h-[2px] rounded-full bg-[#10b37d]"
                                        transition={spring}
                                    />
                                )}
                                <Icon
                                    size={22}
                                    className={`transition-colors duration-200 ${
                                        active ? 'text-[#10b37d]' : 'text-[var(--text-muted)]'
                                    }`}
                                />
                                <span
                                    className={`text-[10px] font-semibold transition-colors duration-200 ${
                                        active ? 'text-[#10b37d]' : 'text-[var(--text-muted)]'
                                    }`}
                                >
                                    {tab.name}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Library Tab (opens bottom sheet) */}
                    <button
                        onClick={() => setSheetOpen(true)}
                        className="flex flex-col items-center justify-center flex-1 gap-0.5 relative"
                    >
                        {isLibraryActive && (
                            <motion.div
                                layoutId="tab-indicator"
                                className="absolute -top-px left-[20%] right-[20%] h-[2px] rounded-full bg-[#10b37d]"
                                transition={spring}
                            />
                        )}
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            className={`transition-colors duration-200 ${
                                isLibraryActive || sheetOpen ? 'text-[#10b37d]' : 'text-[var(--text-muted)]'
                            }`}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                            />
                        </svg>
                        <span
                            className={`text-[10px] font-semibold transition-colors duration-200 ${
                                isLibraryActive || sheetOpen ? 'text-[#10b37d]' : 'text-[var(--text-muted)]'
                            }`}
                        >
                            Library
                        </span>
                    </button>
                </nav>
            </div>
        </>
    );
}
