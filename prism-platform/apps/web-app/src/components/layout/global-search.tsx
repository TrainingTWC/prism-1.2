'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@prism/ui';
import { useAuth } from '@/lib/auth-context';
import type { AppPermission, DashboardSlug } from '@prism/auth';

/* ── Searchable items ─────────────────────────────────── */

interface SearchItem {
    label: string;
    href: string;
    category: string;
    keywords: string[];
    icon?: string; // emoji or symbol
    color?: string;
    /** Required permission to see this item (null = everyone) */
    requiredPermission?: AppPermission;
    /** Required dashboard slug for dashboard items */
    requiredDashboard?: DashboardSlug;
    /** Only admin/editor can see */
    adminOnly?: boolean;
}

const SEARCH_ITEMS: SearchItem[] = [
    // ── Pages ──
    { label: 'Home', href: '/', category: 'Pages', keywords: ['home', 'main', 'landing'], icon: '🏠' },
    { label: 'Intelligence Hub', href: '/ai-insights', category: 'Pages', keywords: ['ai', 'intelligence', 'insights', 'chat', 'gemini', 'ask'], icon: '✨' },
    { label: 'Reports', href: '/reports', category: 'Pages', keywords: ['reports', 'analytics', 'data', 'export'], icon: '📊' },
    { label: 'Checklists', href: '/checklists', category: 'Pages', keywords: ['checklists', 'programs', 'forms', 'audit', 'execute'], icon: '📋' },
    { label: 'Follow-Ups', href: '/follow-ups', category: 'Pages', keywords: ['follow', 'ups', 'tasks', 'pending', 'action'], icon: '🔔' },
    { label: 'Tasks', href: '/tasks', category: 'Pages', keywords: ['tasks', 'todo', 'actions', 'assigned'], icon: '✅' },
    { label: 'Settings', href: '/settings', category: 'Pages', keywords: ['settings', 'preferences', 'config', 'profile', 'password'], icon: '⚙️' },

    // ── Dashboards ──
    { label: 'HR Dashboard', href: '/dashboards/hr', category: 'Dashboards', keywords: ['hr', 'human', 'resources', 'employee', 'surveys'], icon: '👥', color: '#3B82F6', requiredDashboard: 'hr-dashboard' },
    { label: 'Operations Dashboard', href: '/dashboards/operations', category: 'Dashboards', keywords: ['operations', 'ops', 'checklists', 'audit'], icon: '⚙️', color: '#10b37d', requiredDashboard: 'operations-dashboard' },
    { label: 'Training Dashboard', href: '/dashboards/training', category: 'Dashboards', keywords: ['training', 'audits', 'learning', 'trainer'], icon: '📖', color: '#A855F7', requiredDashboard: 'training-dashboard' },
    { label: 'QA Dashboard', href: '/dashboards/qa', category: 'Dashboards', keywords: ['qa', 'quality', 'assurance', 'assessment'], icon: '✓', color: '#EF4444', requiredDashboard: 'qa-dashboard' },
    { label: 'Finance Dashboard', href: '/dashboards/finance', category: 'Dashboards', keywords: ['finance', 'money', 'expenditure', 'reports'], icon: '💰', color: '#22C55E', requiredDashboard: 'finance-dashboard' },
    { label: 'SHLP Dashboard', href: '/dashboards/shlp', category: 'Dashboards', keywords: ['shlp', 'store', 'health', 'learning', 'certification'], icon: '🛡️', color: '#10B981', requiredDashboard: 'shlp-dashboard' },
    { label: 'Campus Hiring Dashboard', href: '/dashboards/campus-hiring', category: 'Dashboards', keywords: ['campus', 'hiring', 'recruitment', 'psychometric', 'candidates'], icon: '🎓', color: '#6366F1', requiredDashboard: 'campus-hiring-dashboard' },
    { label: 'Trainer Calendar', href: '/dashboards/trainer-calendar', category: 'Dashboards', keywords: ['trainer', 'calendar', 'schedule', 'sessions'], icon: '📅', color: '#A855F7', requiredDashboard: 'trainer-calendar-dashboard' },
    { label: 'Bench Planning Dashboard', href: '/dashboards/bench-planning', category: 'Dashboards', keywords: ['bench', 'planning', 'promotion', 'barista', 'shift', 'manager', 'pipeline'], icon: '📈', color: '#10b37d', requiredDashboard: 'bench-planning-dashboard' },
    { label: 'Consolidated Dashboard', href: '/dashboards/consolidated', category: 'Dashboards', keywords: ['consolidated', 'cross', 'department', 'all', 'overview', 'editor'], icon: '🔲', color: '#64748B', requiredDashboard: 'consolidated-dashboard' },

    // ── Admin ──
    { label: 'Checklist Builder', href: '/programs', category: 'Admin', keywords: ['builder', 'checklist', 'programs', 'create', 'edit', 'sections', 'questions'], icon: '🔧', adminOnly: true },
    { label: 'Knowledge Base', href: '/knowledge-base', category: 'Admin', keywords: ['knowledge', 'base', 'documents', 'upload', 'rag'], icon: '📚', adminOnly: true },
    { label: 'Employee Master', href: '/employees', category: 'Admin', keywords: ['employee', 'master', 'staff', 'people', 'emp'], icon: '👤', adminOnly: true },
    { label: 'Store Master', href: '/stores', category: 'Admin', keywords: ['store', 'master', 'locations', 'outlets', 'branches'], icon: '🏪', adminOnly: true },
    { label: 'Admin Panel', href: '/admin', category: 'Admin', keywords: ['admin', 'panel', 'management', 'system'], icon: '🔐', adminOnly: true },

    // ── Checklist modules ──
    { label: 'HR Checklist', href: '/checklists/hr', category: 'Checklists', keywords: ['hr', 'checklist', 'survey'], icon: '📝', requiredPermission: 'hr' },
    { label: 'Operations Checklist', href: '/checklists/operations', category: 'Checklists', keywords: ['operations', 'checklist', 'audit'], icon: '📝', requiredPermission: 'operations' },
    { label: 'Training Checklist', href: '/checklists/training', category: 'Checklists', keywords: ['training', 'checklist'], icon: '📝', requiredPermission: 'training' },
    { label: 'QA Checklist', href: '/checklists/qa', category: 'Checklists', keywords: ['qa', 'checklist', 'quality'], icon: '📝', requiredPermission: 'qa' },
    { label: 'Finance Checklist', href: '/checklists/finance', category: 'Checklists', keywords: ['finance', 'checklist'], icon: '📝', requiredPermission: 'finance' },
    { label: 'SHLP Checklist', href: '/checklists/shlp', category: 'Checklists', keywords: ['shlp', 'checklist'], icon: '📝', requiredPermission: 'shlp' },
    { label: 'Campus Hiring Checklist', href: '/checklists/campus-hiring', category: 'Checklists', keywords: ['campus', 'hiring', 'checklist'], icon: '📝', requiredPermission: 'campus-hiring' },
    { label: 'Brew League', href: '/checklists/brew-league', category: 'Checklists', keywords: ['brew', 'league', 'competition', 'barista'], icon: '☕', requiredPermission: 'brew-league' },
];

/* ── Fuzzy match ──────────────────────────────────────── */

function matchScore(item: SearchItem, query: string): number {
    const q = query.toLowerCase().trim();
    if (!q) return 0;

    const label = item.label.toLowerCase();
    const cat = item.category.toLowerCase();

    // Exact label match
    if (label === q) return 100;
    // Label starts with query
    if (label.startsWith(q)) return 90;
    // Label contains query
    if (label.includes(q)) return 80;
    // Category match
    if (cat.includes(q)) return 60;
    // Keywords match
    const words = q.split(/\s+/);
    const allKeywords = item.keywords.join(' ');
    const keywordHits = words.filter(w => allKeywords.includes(w)).length;
    if (keywordHits === words.length) return 70;
    if (keywordHits > 0) return 40 + (keywordHits / words.length) * 20;

    // Initials match (e.g., "bp" matches "Bench Planning")
    const initials = item.label.split(/\s+/).map(w => w[0]?.toLowerCase()).join('');
    if (initials.startsWith(q)) return 50;

    return 0;
}

/* ── Component ────────────────────────────────────────── */

export function GlobalSearch({ isMobile = false }: { isMobile?: boolean }) {
    const router = useRouter();
    const { canAccess, canViewDashboard, isAdmin, isEditor } = useAuth();
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Filter items by role permissions
    const accessibleItems = useMemo(() => {
        return SEARCH_ITEMS.filter((item) => {
            if (item.adminOnly && !isAdmin && !isEditor) return false;
            if (item.requiredPermission && !canAccess(item.requiredPermission)) return false;
            if (item.requiredDashboard && !canViewDashboard(item.requiredDashboard)) return false;
            return true;
        });
    }, [canAccess, canViewDashboard, isAdmin, isEditor]);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        return accessibleItems
            .map(item => ({ item, score: matchScore(item, query) }))
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(r => r.item);
    }, [query, accessibleItems]);

    // Group results by category
    const grouped = useMemo(() => {
        const map = new Map<string, SearchItem[]>();
        for (const item of results) {
            const arr = map.get(item.category) ?? [];
            arr.push(item);
            map.set(item.category, arr);
        }
        return Array.from(map.entries());
    }, [results]);

    // Flat list for keyboard navigation
    const flatResults = results;

    const navigate = useCallback((href: string) => {
        setQuery('');
        setOpen(false);
        router.push(href);
    }, [router]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
            e.preventDefault();
            navigate(flatResults[selectedIndex].href);
        } else if (e.key === 'Escape') {
            setQuery('');
            setOpen(false);
            inputRef.current?.blur();
        }
    }, [flatResults, selectedIndex, navigate]);

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Scroll selected item into view
    useEffect(() => {
        if (resultsRef.current) {
            const el = resultsRef.current.querySelector(`[data-idx="${selectedIndex}"]`);
            el?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-search-container]')) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Cmd+K / Ctrl+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setOpen(true);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const showResults = open && query.trim().length > 0;

    return (
        <div className="relative flex-1" data-search-container>
            {/* Input */}
            <div className="relative group">
                {!isMobile && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[#10b37d] transition-colors" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                        </svg>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "block w-full text-sm text-[var(--text-primary)] border border-[var(--border-subtle)] bg-[var(--input-bg)] focus:ring-1 focus:ring-[#10b37d]/30 focus:border-[#10b37d]/40 outline-none placeholder-[var(--text-muted)] transition-all",
                        isMobile
                            ? "py-2.5 px-4 rounded-full"
                            : "py-2 pl-10 pr-16 rounded-lg"
                    )}
                    placeholder="Search Prism..."
                />
                {/* Keyboard shortcut badge */}
                {!isMobile && !query && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded">
                            <span className="text-[9px]">⌘</span>K
                        </kbd>
                    </div>
                )}
            </div>

            {/* Results dropdown */}
            <AnimatePresence>
                {showResults && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                            "absolute z-[100] mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] shadow-2xl overflow-hidden",
                            isMobile ? "left-0 right-0" : "min-w-[360px]"
                        )}
                    >
                        <div ref={resultsRef} className="max-h-[360px] overflow-y-auto py-1.5">
                            {flatResults.length === 0 ? (
                                <div className="flex flex-col items-center py-8 text-center">
                                    <svg className="w-8 h-8 text-[var(--text-muted)] mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                    </svg>
                                    <p className="text-xs text-[var(--text-muted)]">No results for &ldquo;{query}&rdquo;</p>
                                </div>
                            ) : (
                                <>
                                    {grouped.map(([category, items]) => (
                                        <div key={category}>
                                            <div className="px-3 pt-2 pb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                                    {category}
                                                </span>
                                            </div>
                                            {items.map((item) => {
                                                const flatIdx = flatResults.indexOf(item);
                                                const isSelected = flatIdx === selectedIndex;
                                                return (
                                                    <button
                                                        key={item.href}
                                                        data-idx={flatIdx}
                                                        onClick={() => navigate(item.href)}
                                                        onMouseEnter={() => setSelectedIndex(flatIdx)}
                                                        className={cn(
                                                            "flex items-center gap-3 w-full px-3 py-2 text-left transition-colors",
                                                            isSelected
                                                                ? "bg-[#10b37d]/10"
                                                                : "hover:bg-[var(--card-bg-hover)]"
                                                        )}
                                                    >
                                                        <span className="text-base w-6 text-center flex-shrink-0">{item.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn(
                                                                "text-sm font-medium truncate",
                                                                isSelected ? "text-[#10b37d]" : "text-[var(--text-primary)]"
                                                            )}>
                                                                {item.label}
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                                                            {item.href}
                                                        </span>
                                                        {isSelected && (
                                                            <kbd className="text-[10px] text-[var(--text-muted)] border border-[var(--border-subtle)] rounded px-1 py-0.5 flex-shrink-0">
                                                                ↵
                                                            </kbd>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                        {/* Footer */}
                        <div className="border-t border-[var(--border-subtle)] px-3 py-1.5 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><kbd className="border border-[var(--border-subtle)] rounded px-1 py-0.5">↑↓</kbd> Navigate</span>
                            <span className="flex items-center gap-1"><kbd className="border border-[var(--border-subtle)] rounded px-1 py-0.5">↵</kbd> Open</span>
                            <span className="flex items-center gap-1"><kbd className="border border-[var(--border-subtle)] rounded px-1 py-0.5">Esc</kbd> Close</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
