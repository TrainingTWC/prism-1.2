'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@prism/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/lib/sidebar-context';
import { useAuth } from '@/lib/auth-context';
import { moduleToDashboardSlug } from '@prism/auth';
import type { AppPermission } from '@prism/auth';
import { dashboardModules } from '@/components/dashboard/dashboard-type-selector';
import { 
    HomeIcon,
    LayoutGrid, 
    StoreIcon, 
    ChecklistIcon, 
    BarChartIcon, 
    UserIcon,
    ClipboardListIcon,
    SparklesIcon,
    BookOpenIcon,
} from '../icons';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    requiredPermission?: AppPermission;
}

const SIDEBAR_EXPANDED = 256; // 16rem = w-64
const SIDEBAR_COLLAPSED = 68;

const spring = { type: 'spring' as const, bounce: 0, duration: 0.4 };

const mainNav: NavItem[] = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Intelligence', href: '/ai-insights', icon: SparklesIcon, requiredPermission: 'dashboard' },
    { name: 'Dashboard', href: '/dashboards', icon: LayoutGrid, requiredPermission: 'dashboard' },
    { name: 'Reports', href: '/reports', icon: BarChartIcon, requiredPermission: 'dashboard' },
    { name: 'Checklist', href: '/checklists', icon: ClipboardListIcon },
];

const adminNav: NavItem[] = [
    { name: 'Checklist Builder', href: '/programs', icon: ChecklistIcon },
    { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpenIcon },
    { name: 'Emp Master', href: '/employees', icon: UserIcon },
    { name: 'Store Master', href: '/stores', icon: StoreIcon },
];

export { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED };

export function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggle, closeMobile, isMobile } = useSidebar();
    const { canViewDashboard, isAdmin, isEditor, canAccess } = useAuth();

    // Filter mainNav by permission
    const visibleMainNav = useMemo(() => {
        return mainNav.filter(item => !item.requiredPermission || canAccess(item.requiredPermission));
    }, [canAccess]);

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);

    // On mobile, sidebar is always "expanded" (full width labels visible)
    const showLabels = isMobile ? true : !collapsed;

    // Dashboard submenu
    const isDashboardRoute = pathname.startsWith('/dashboards');
    const [dashboardExpanded, setDashboardExpanded] = useState(isDashboardRoute);
    useEffect(() => {
        if (isDashboardRoute) setDashboardExpanded(true);
    }, [isDashboardRoute]);

    // Filter dashboard modules by role access
    const filteredDashboardModules = useMemo(() => {
        return dashboardModules.filter((mod) => canViewDashboard(moduleToDashboardSlug(mod.id)));
    }, [canViewDashboard]);

    // Filter admin nav — only Admin/Editor see admin tools
    const filteredAdminNav = useMemo(() => {
        if (isAdmin || isEditor) return adminNav;
        return [];
    }, [isAdmin, isEditor]);

    const NavLink = ({ item }: { item: NavItem }) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
            <Link
                href={item.href}
                onClick={() => { if (isMobile) closeMobile(); }}
                title={!showLabels ? item.name : undefined}
                className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-200 group overflow-hidden",
                    active
                        ? "bg-[#10b37d]/10 text-[#10b37d]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] hover:text-[var(--text-primary)]"
                )}
            >
                <Icon
                    size={18}
                    className={cn(
                        "flex-shrink-0 transition-colors",
                        active ? "text-[#10b37d]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                    )}
                />
                <motion.span
                    animate={{
                        width: showLabels ? 'auto' : 0,
                        opacity: showLabels ? 1 : 0,
                        marginLeft: showLabels ? 12 : 0,
                        x: showLabels ? 0 : -4,
                    }}
                    transition={spring}
                    className="truncate uppercase tracking-wide text-[12px] font-semibold whitespace-nowrap overflow-hidden"
                >
                    {item.name}
                </motion.span>
            </Link>
        );
    };

    /* ── Sidebar Content (shared between desktop & mobile) ── */
    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="flex items-center px-5 py-5 overflow-hidden">
                <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                                const span = document.createElement('span');
                                span.className = 'text-white font-bold text-sm';
                                span.textContent = 'P';
                                parent.appendChild(span);
                            }
                        }}
                    />
                </div>
                <motion.div
                    animate={{
                        width: showLabels ? 'auto' : 0,
                        opacity: showLabels ? 1 : 0,
                        marginLeft: showLabels ? 12 : 0,
                        x: showLabels ? 0 : -8,
                    }}
                    transition={spring}
                    className="overflow-hidden whitespace-nowrap"
                >
                    <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                        PRISM
                    </span>
                </motion.div>

                {/* Mobile close button */}
                {isMobile && (
                    <button
                        onClick={closeMobile}
                        className="ml-auto p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)] transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
                {visibleMainNav.map((item) => {
                    // Dashboard gets an expandable submenu
                    if (item.href === '/dashboards') {
                        return (
                            <div key="dashboard-section">
                                <Link
                                    href="/dashboards"
                                    onClick={(e) => {
                                        if (showLabels) {
                                            e.preventDefault();
                                            setDashboardExpanded(prev => !prev);
                                        }
                                        if (isMobile) closeMobile();
                                    }}
                                    title={!showLabels ? 'Dashboard' : undefined}
                                    className={cn(
                                        "flex items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-200 group overflow-hidden",
                                        isDashboardRoute
                                            ? "bg-[#10b37d]/10 text-[#10b37d]"
                                            : "text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] hover:text-[var(--text-primary)]"
                                    )}
                                >
                                    <LayoutGrid
                                        size={18}
                                        className={cn(
                                            "flex-shrink-0 transition-colors",
                                            isDashboardRoute ? "text-[#10b37d]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                                        )}
                                    />
                                    <motion.span
                                        animate={{
                                            width: showLabels ? 'auto' : 0,
                                            opacity: showLabels ? 1 : 0,
                                            marginLeft: showLabels ? 12 : 0,
                                            x: showLabels ? 0 : -4,
                                        }}
                                        transition={spring}
                                        className="flex-1 truncate uppercase tracking-wide text-[12px] font-semibold whitespace-nowrap overflow-hidden"
                                    >
                                        Dashboard
                                    </motion.span>
                                    {/* Expand chevron */}
                                    <motion.div
                                        animate={{
                                            width: showLabels ? 16 : 0,
                                            opacity: showLabels ? 0.5 : 0,
                                        }}
                                        transition={spring}
                                        className="overflow-hidden flex-shrink-0"
                                    >
                                        <motion.svg
                                            animate={{ rotate: dashboardExpanded ? 90 : 0 }}
                                            transition={spring}
                                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </motion.svg>
                                    </motion.div>
                                </Link>

                                {/* Dashboard modules submenu */}
                                <AnimatePresence initial={false}>
                                    {dashboardExpanded && showLabels && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ ...spring, opacity: { duration: 0.2 } }}
                                            className="overflow-hidden"
                                        >
                                            <div className="ml-5 mt-0.5 pl-3 border-l border-[var(--border-subtle)] space-y-0.5 py-0.5">
                                                {filteredDashboardModules.map((mod) => {
                                                    const isModActive = pathname === mod.href;
                                                    return (
                                                        <Link
                                                            key={mod.id}
                                                            href={mod.href}
                                                            className={cn(
                                                                "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[11px] font-medium transition-all duration-200 group/sub",
                                                                isModActive
                                                                    ? "bg-[var(--card-bg-hover)]"
                                                                    : "hover:bg-[var(--card-bg-hover)]"
                                                            )}
                                                        >
                                                            <div
                                                                className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all"
                                                                style={{
                                                                    backgroundColor: isModActive ? mod.color : 'var(--text-muted)',
                                                                    boxShadow: isModActive ? `0 0 6px ${mod.color}60` : undefined,
                                                                }}
                                                            />
                                                            <span
                                                                className={cn(
                                                                    "truncate transition-colors",
                                                                    isModActive
                                                                        ? "font-semibold"
                                                                        : "text-[var(--text-secondary)] group-hover/sub:text-[var(--text-primary)]"
                                                                )}
                                                                style={{ color: isModActive ? mod.color : undefined }}
                                                            >
                                                                {mod.label}
                                                            </span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    }
                    return <NavLink key={item.name} item={item} />;
                })}

                {/* Admin Section — only visible to admin/editor */}
                {filteredAdminNav.length > 0 && (
                <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]">
                    <motion.div
                        animate={{
                            height: showLabels ? 24 : 0,
                            opacity: showLabels ? 1 : 0,
                            paddingTop: showLabels ? 8 : 0,
                            paddingBottom: showLabels ? 8 : 0,
                        }}
                        transition={spring}
                        className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] overflow-hidden"
                    >
                        Admin
                    </motion.div>
                    {filteredAdminNav.map((item) => (
                        <NavLink key={item.name} item={item} />
                    ))}
                </div>
                )}
            </nav>

            {/* Collapse Toggle — only on desktop */}
            {!isMobile && (
                <motion.div
                    animate={{
                        paddingTop: collapsed ? 0 : 8,
                        paddingBottom: collapsed ? 0 : 16,
                    }}
                    transition={spring}
                    className="px-3"
                >
                    <button
                        onClick={toggle}
                        className="flex items-center w-full px-3 py-2.5 rounded-lg text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] transition-colors overflow-hidden"
                    >
                        <motion.svg
                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            animate={{ rotate: collapsed ? 180 : 0 }}
                            transition={spring}
                            className="flex-shrink-0"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </motion.svg>
                        <motion.span
                            animate={{
                                width: collapsed ? 0 : 'auto',
                                opacity: collapsed ? 0 : 1,
                                marginLeft: collapsed ? 0 : 8,
                                x: collapsed ? -4 : 0,
                            }}
                            transition={spring}
                            className="whitespace-nowrap overflow-hidden"
                        >
                            Collapse
                        </motion.span>
                    </button>
                </motion.div>
            )}
        </>
    );

    /* ── Mobile: no sidebar (bottom tab bar replaces it) ── */
    if (isMobile) {
        return null;
    }

    /* ── Desktop: original fixed sidebar ── */
    return (
        <motion.aside
            animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
            transition={spring}
            className="fixed left-0 top-0 z-40 h-screen border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] backdrop-blur-2xl hidden md:flex flex-col will-change-[width]"
        >
            {sidebarContent}
        </motion.aside>
    );
}