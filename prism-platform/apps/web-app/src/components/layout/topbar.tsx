'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon } from '../icons';
import { useTheme } from '@/lib/theme-context';
import { useSidebar } from '@/lib/sidebar-context';
import { useAuth } from '@/lib/auth-context';
import { ROLE_CONFIG } from '@prism/auth';
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from './sidebar';
import { assetPath } from '@/lib/constants';
import { GlobalSearch } from './global-search';

const spring = { type: 'spring' as const, bounce: 0, duration: 0.4 };

export function Topbar() {
    const { theme, toggleTheme } = useTheme();
    const { collapsed, isMobile } = useSidebar();
    const { user, role, logout } = useAuth();
    const sidebarWidth = isMobile ? 0 : (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    const displayName = user?.name || user?.empId || 'User';
    const roleLabel = role ? ROLE_CONFIG[role]?.label : '';
    const roleColor = role ? ROLE_CONFIG[role]?.color : '#64748B';
    const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    /* ── Mobile: Spotify-style slim header ── */
    if (isMobile) {
        return (
            <header className="fixed top-0 left-0 right-0 z-30 bg-[var(--sidebar-bg)]">
                <div className="flex h-12 items-center justify-between px-4">
                    {/* Left: Logo + Brand */}
                    <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                            <img
                                src={assetPath('/logo.png')}
                                alt="Logo"
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                        <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                            PRISM
                        </span>
                    </div>

                    {/* Right: Search + Theme + Bell + Avatar */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                            className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] active:bg-[var(--card-bg-hover)] transition-colors"
                        >
                            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] active:bg-[var(--card-bg-hover)] transition-colors"
                        >
                            {theme === 'dark' ? (
                                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                </svg>
                            ) : (
                                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                </svg>
                            )}
                        </button>
                        <button className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] active:bg-[var(--card-bg-hover)] transition-colors relative">
                            <BellIcon size={18} />
                            <span className="absolute top-1.5 right-1.5 block h-1.5 w-1.5 rounded-full bg-[#10b37d]"></span>
                        </button>
                        <div
                            className="h-7 w-7 ml-0.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: roleColor }}
                        >
                            {initials}
                        </div>
                    </div>
                </div>

                {/* Expandable search bar */}
                <AnimatePresence>
                    {mobileSearchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-b border-[var(--border-subtle)]"
                        >
                            <div className="px-4 pb-3">
                                <GlobalSearch isMobile />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        );
    }

    /* ── Desktop: original topbar ── */
    return (
        <motion.header
            animate={{ left: sidebarWidth }}
            transition={spring}
            className="fixed top-0 right-0 z-30 h-14 border-b border-[var(--border-subtle)] bg-[var(--glass-bg)] backdrop-blur-xl will-change-[left]"
        >
            <div className="flex h-full items-center justify-between px-4 md:px-6">
                {/* Left: Search Bar */}
                <div className="flex items-center gap-3 flex-1 max-w-xl">
                    <GlobalSearch />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 ml-6">
                    {/* Light / Dark toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)] rounded-lg transition-all group"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5 group-hover:text-[#10b37d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 group-hover:text-[#10b37d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                            </svg>
                        )}
                    </button>

                    {/* Bell */}
                    <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)] rounded-lg transition-all relative group">
                        <BellIcon size={20} className="group-hover:text-[#10b37d] transition-colors" />
                        <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#10b37d] border-2 border-[var(--glass-bg)]"></span>
                    </button>

                    {/* User Info */}
                    <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-[var(--border-subtle)]">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{displayName}</p>
                            <p className="text-[10px] leading-tight font-medium" style={{ color: roleColor }}>{roleLabel}{user?.empId ? ` · ${user.empId}` : ''}</p>
                        </div>
                        <button
                            onClick={logout}
                            title="Sign out"
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-offset-1 hover:ring-offset-[var(--bg-primary)] transition-all cursor-pointer"
                            style={{ backgroundColor: roleColor, ['--tw-ring-color' as string]: roleColor }}
                        >
                            {initials}
                        </button>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}