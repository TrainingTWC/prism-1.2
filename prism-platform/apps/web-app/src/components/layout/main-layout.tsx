'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from './sidebar';
import { Topbar } from './topbar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context';
import { ChatProvider } from '@/lib/chat-context';
import { FloatingChat } from '@/components/chat/floating-chat';
import { LoginScreen } from '@/components/auth/login-screen';
import { AccessDeniedScreen } from '@/components/auth/access-denied-screen';
import { SplashScreen } from '@/components/auth/splash-screen';

const spring = { type: 'spring' as const, bounce: 0, duration: 0.4 };

function LayoutInner({ children }: { children: React.ReactNode }) {
    const { collapsed, isMobile } = useSidebar();
    const { isAuthenticated, isLoading, empId, user, employeeInfo } = useAuth();
    const sidebarWidth = isMobile ? 0 : (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED);

    // Splash: plays once per browser session (sessionStorage clears when tab/window closes)
    // Start false on both server & client to avoid hydration mismatch, then sync from sessionStorage
    const [splashDone, setSplashDone] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (sessionStorage.getItem('prism-splash-done') === '1') {
            setSplashDone(true);
        }
        setHydrated(true);
    }, []);

    const handleSplashComplete = useCallback(() => {
        setSplashDone(true);
        sessionStorage.setItem('prism-splash-done', '1');
    }, []);

    // Before hydration: render nothing (tiny flash, avoids mismatch)
    if (!hydrated) {
        return null;
    }

    // ── Splash gate: show on first visit of this browser session ──
    if (!splashDone) {
        const splashName = user?.name || employeeInfo?.name || empId || null;
        return <SplashScreen userName={splashName} onComplete={handleSplashComplete} />;
    }

    // ── Auth gate (splash already done) ──

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!empId) {
        return <AccessDeniedScreen />;
    }

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    return (
        <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)] selection:bg-[rgba(13,140,99,0.2)] transition-colors duration-normal">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[rgba(13,140,99,0.04)] blur-[140px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-[rgba(13,140,99,0.03)] blur-[120px]" />
            </div>

            {/* Desktop sidebar only */}
            {!isMobile && <Sidebar />}
            
            <motion.div
                animate={{ marginLeft: sidebarWidth }}
                transition={spring}
                className="flex-1 flex flex-col relative z-10 will-change-[margin-left] max-md:!ml-0"
            >
                <Topbar />
                
                {/* mt-12 for mobile slim header, mt-14 for desktop topbar; pb-20 for bottom nav on mobile */}
                <main className={`flex-1 ${isMobile ? 'mt-12 pb-20' : 'mt-14'} p-4 md:p-8 min-h-screen overflow-x-hidden`}>
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
                
                {/* Footer — hidden on mobile */}
                {!isMobile && (
                    <footer className="mt-auto py-6 px-10 border-t border-obsidian-600/15 opacity-50 flex flex-row justify-between items-center gap-2 text-xs text-obsidian-500">
                        <p>© 2026 Prism Platform v1.2. All rights reserved.</p>
                        <div className="flex gap-6">
                            <span className="hover:text-[#10b37d] cursor-pointer transition-colors duration-fast">Documentation</span>
                            <span className="hover:text-[#10b37d] cursor-pointer transition-colors duration-fast">System Status</span>
                        </div>
                    </footer>
                )}
            </motion.div>

            {/* Spotify-style bottom tab bar — mobile only */}
            {isMobile && <MobileBottomNav />}
            
            <FloatingChat />
        </div>
    );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
        <AuthProvider>
        <SidebarProvider>
        <ChatProvider>
            <LayoutInner>{children}</LayoutInner>
        </ChatProvider>
        </SidebarProvider>
        </AuthProvider>
        </ThemeProvider>
    );
}