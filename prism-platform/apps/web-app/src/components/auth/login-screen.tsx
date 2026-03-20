'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import type { EmployeeLookup } from '@/lib/auth-context';
import { ROLE_CONFIG, departmentToRole, isAutoLoginDesignation } from '@prism/auth';
import type { UserRole } from '@prism/auth';

const spring = { type: 'spring' as const, bounce: 0, duration: 0.4 };

function getRoleBadge(employeeInfo: EmployeeLookup | null): { role: UserRole; label: string; color: string } {
    if (!employeeInfo) return { role: 'store', label: 'Store Team', color: '#F59E0B' };
    const dbRoleName = employeeInfo.role?.name;
    const role = departmentToRole(employeeInfo.department, dbRoleName);
    const config = ROLE_CONFIG[role];
    return { role, label: config.label, color: config.color };
}

export function LoginScreen() {
    const { empId, employeeInfo, employeeFetchDone, login } = useAuth();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const badge = getRoleBadge(employeeInfo);

    // Auto-login employees: H541 or store-mapping designations
    const isAutoLogin = empId
        ? empId.toUpperCase() === 'H541' || isAutoLoginDesignation(employeeInfo?.designation)
        : false;

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(password);
        if (!result.success) {
            setError(result.error || 'Authentication failed');
            setLoading(false);
        }
        // On success, auth context updates → LayoutInner re-renders → login overlay disappears
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]">
            <div className="w-full max-w-md mx-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                    className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-xl p-8 md:p-10 shadow-2xl"
                >
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5">
                            <img src="/logo.png" alt="Prism" className="w-20 h-20 object-contain drop-shadow-lg" />
                        </div>
                        <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            PRISM
                        </h1>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">Powered by Third Wave Coffee</p>
                    </div>

                    {/* Employee Info Card */}
                    <AnimatePresence mode="wait">
                        {employeeFetchDone ? (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-4 mb-6"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div
                                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                        style={{ background: `linear-gradient(135deg, ${badge.color}, ${badge.color}99)` }}
                                    >
                                        {employeeInfo
                                            ? employeeInfo.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                                            : empId?.slice(0, 2) || '??'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                                                {employeeInfo?.name || empId}
                                            </h3>
                                            <span
                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white flex-shrink-0"
                                                style={{ backgroundColor: badge.color }}
                                            >
                                                {badge.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] text-[var(--text-muted)]">
                                                ID: {empId}
                                            </span>
                                            {employeeInfo?.department && (
                                                <>
                                                    <span className="text-[var(--text-muted)]">·</span>
                                                    <span className="text-[11px] text-[var(--text-muted)]">
                                                        {employeeInfo.department}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {employeeInfo?.designation && (
                                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                                                {employeeInfo.designation}
                                                {employeeInfo.store && ` · ${employeeInfo.store.storeName}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-4 mb-6"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-[var(--card-bg-hover)] animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-32 rounded bg-[var(--card-bg-hover)] animate-pulse" />
                                        <div className="h-2 w-20 rounded bg-[var(--card-bg-hover)] animate-pulse" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Auto-login indicator */}
                    {isAutoLogin && employeeFetchDone ? (
                        <div className="space-y-5">
                            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-green-400 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-green-400">Signing you in automatically...</span>
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)]">
                                    Your role is identified as <span className="font-bold text-[var(--text-primary)]">{badge.label}</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                    /* Login Form */
                    <form onSubmit={handleSignIn} className="space-y-5">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your department password"
                                    autoFocus
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 outline-none pr-12 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Alert */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-2 text-sm text-red-400">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                        </svg>
                                        {error}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-sm hover:shadow-[0_4px_24px_rgba(147,51,234,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    )}

                    {/* Session Info */}
                    <div className="mt-5 rounded-xl border border-blue-500/10 bg-blue-500/5 p-3 text-[11px] text-[var(--text-muted)] text-center">
                        Your session will remain active for <span className="text-blue-400 font-semibold">24 hours</span> after signing in.
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
