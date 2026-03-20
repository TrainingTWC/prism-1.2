'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { UserRole, AuthUser, AppPermission, DashboardSlug, AuthSession } from '@prism/auth';
import { ROLE_CONFIG, departmentToRole, isAutoLoginDesignation } from '@prism/auth';

// ──────────────────────────────────────────
// Auth Context — EMPID-driven, role-aware
// ──────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const SESSION_KEY = 'prism-session';
const EMPID_KEY = 'prism-empid';
const CUSTOM_PASSWORDS_KEY = 'prism-custom-passwords';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/* ── Employee lookup shape from API ── */
export interface EmployeeLookup {
    id: string;
    empId: string;
    name: string;
    email: string;
    department: string | null;
    designation: string | null;
    phone?: string | null;
    store?: { storeName: string; storeCode: string; region?: { name: string } | null } | null;
    role?: { id: string; name: string } | null;
}

/* ── Context value ── */
export interface AuthContextValue {
    user: AuthUser | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    permissions: AppPermission[];
    dashboardAccess: DashboardSlug[];
    empId: string | null;
    employeeInfo: EmployeeLookup | null;
    employeeFetchDone: boolean;
    canAccess: (permission: AppPermission) => boolean;
    canViewDashboard: (slug: DashboardSlug) => boolean;
    isEditor: boolean;
    isAdmin: boolean;
    canEdit: boolean;
    login: (password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [empId, setEmpId] = useState<string | null>(null);
    const [employeeInfo, setEmployeeInfo] = useState<EmployeeLookup | null>(null);
    const [employeeFetchDone, setEmployeeFetchDone] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ── 1. Read EMPID from URL or localStorage ──
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        // Case-insensitive: try EMPID, empid, Empid, etc.
        const urlEmpId = params.get('EMPID') || params.get('empid') || params.get('Empid') || params.get('EmpId');

        if (urlEmpId) {
            const normalized = urlEmpId.trim().toUpperCase();
            localStorage.setItem(EMPID_KEY, normalized);
            setEmpId(normalized);

            // If EMPID changed from the stored session's empId, clear old session
            try {
                const stored = localStorage.getItem(SESSION_KEY);
                if (stored) {
                    const old: AuthSession = JSON.parse(stored);
                    if (old.user.empId.toUpperCase() !== normalized) {
                        localStorage.removeItem(SESSION_KEY);
                    }
                }
            } catch { /* ignore */ }
        } else {
            const stored = localStorage.getItem(EMPID_KEY);
            if (stored) setEmpId(stored);
        }
    }, []);

    // ── 2. Load session from localStorage ──
    useEffect(() => {
        try {
            const stored = localStorage.getItem(SESSION_KEY);
            if (stored) {
                const parsed: AuthSession = JSON.parse(stored);
                if (new Date(parsed.expiresAt) > new Date()) {
                    setSession(parsed);
                } else {
                    localStorage.removeItem(SESSION_KEY);
                }
            }
        } catch {
            localStorage.removeItem(SESSION_KEY);
        }
        setIsLoading(false);
    }, []);

    // ── 3. Fetch employee info from API when empId is set ──
    useEffect(() => {
        if (!empId) {
            setEmployeeFetchDone(true);
            return;
        }
        // If already fetched for this empId, skip
        if (employeeInfo && employeeInfo.empId.toUpperCase() === empId) {
            setEmployeeFetchDone(true);
            return;
        }

        let cancelled = false;

        async function fetchEmployee() {
            try {
                const res = await fetch(`${API_URL}/api/employees?companyId=${COMPANY_ID}&active=true`);
                if (!res.ok) throw new Error('API unavailable');
                const { data } = await res.json();
                const match = (data as EmployeeLookup[]).find(
                    (e) => e.empId.toUpperCase() === empId,
                );
                if (!cancelled) {
                    if (match) {
                        setEmployeeInfo(match);
                    } else {
                        // Employee not in DB → treat as External (campus-hire candidate)
                        setEmployeeInfo({
                            id: '',
                            empId: empId!,
                            name: empId!,
                            email: `${empId!.toLowerCase()}@external.local`,
                            department: 'External',
                            designation: null,
                        });
                    }
                    setEmployeeFetchDone(true);
                }
            } catch {
                // API not available — continue without employee info
                if (!cancelled) {
                    setEmployeeInfo(null);
                    setEmployeeFetchDone(true);
                }
            }
        }

        fetchEmployee();
        return () => { cancelled = true; };
    }, [empId]); // eslint-disable-line

    // ── Auto-login for store-mapping roles (trainers, HRBPs, AMs, etc.) ──
    useEffect(() => {
        if (!empId || !employeeFetchDone || !employeeInfo) return;
        // Already has a valid session — skip
        if (session && new Date(session.expiresAt) > new Date()) return;

        // Check: is H541 (editor) or designation-based auto-login?
        const isH541 = empId.toUpperCase() === 'H541';
        const isAutoDesig = isAutoLoginDesignation(employeeInfo.designation);

        if (!isH541 && !isAutoDesig) return;

        // Derive role and auto-create session
        const dbRoleName = employeeInfo.role?.name;
        const role = departmentToRole(employeeInfo.department, dbRoleName, employeeInfo.designation, empId);
        const config = ROLE_CONFIG[role];

        const user: AuthUser = {
            id: employeeInfo.id || empId,
            email: employeeInfo.email || `${empId.toLowerCase()}@hbpl.local`,
            name: employeeInfo.name || empId,
            companyId: COMPANY_ID,
            roleId: employeeInfo.role?.id || '',
            role,
            empId,
            department: employeeInfo.department || undefined,
            designation: employeeInfo.designation || undefined,
            storeName: employeeInfo.store?.storeName || undefined,
        };

        const newSession: AuthSession = {
            user,
            permissions: config.permissions,
            dashboardAccess: config.dashboardAccess,
            expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        setSession(newSession);
    }, [empId, employeeFetchDone, employeeInfo, session]);

    // ── Login handler ──
    const login = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
        if (!empId) return { success: false, error: 'No Employee ID found' };

        let role: UserRole | null = null;

        // 1. Check custom password first (employee changed their password)
        const customPasswords: Record<string, { password: string; role: UserRole }> =
            JSON.parse(localStorage.getItem(CUSTOM_PASSWORDS_KEY) || '{}');

        if (customPasswords[empId] && customPasswords[empId].password === password) {
            role = customPasswords[empId].role;
        }

        // 2. If employee info available, derive role from department + designation + validate
        if (!role && employeeInfo) {
            // External employees (not in DB): only campus-hiring password is accepted
            if (employeeInfo.department === 'External') {
                if (ROLE_CONFIG['campus-hiring'].password === password) {
                    role = 'campus-hiring';
                }
                // No other passwords allowed for external employees
            } else {
                const dbRoleName = employeeInfo.role?.name;
                const derivedRole = departmentToRole(employeeInfo.department, dbRoleName, employeeInfo.designation, empId);

                // Check if password matches the derived role's default
                if (ROLE_CONFIG[derivedRole]?.password === password) {
                    role = derivedRole;
                }

                // Also check admin / editor passwords (elevated access)
                if (!role) {
                    if (ROLE_CONFIG.editor.password === password) role = 'editor';
                    else if (ROLE_CONFIG.admin.password === password) role = 'admin';
                }
            }
        }

        // 3. Fallback: check password against ALL roles (API down / no employee info)
        if (!role && (!employeeInfo || employeeInfo.department !== 'External')) {
            for (const [r, config] of Object.entries(ROLE_CONFIG)) {
                if (config.password === password) {
                    role = r as UserRole;
                    break;
                }
            }
        }

        if (!role) {
            return { success: false, error: 'Invalid password. Please try again.' };
        }

        const config = ROLE_CONFIG[role];
        const user: AuthUser = {
            id: employeeInfo?.id || empId,
            email: employeeInfo?.email || `${empId.toLowerCase()}@hbpl.local`,
            name: employeeInfo?.name || empId,
            companyId: COMPANY_ID,
            roleId: employeeInfo?.role?.id || '',
            role,
            empId,
            department: employeeInfo?.department || undefined,
            designation: employeeInfo?.designation || undefined,
            storeName: employeeInfo?.store?.storeName || undefined,
        };

        const newSession: AuthSession = {
            user,
            permissions: config.permissions,
            dashboardAccess: config.dashboardAccess,
            expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        setSession(newSession);

        return { success: true };
    }, [empId, employeeInfo]);

    // ── Logout handler ──
    const logout = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
    }, []);

    // ── Change password handler ──
    const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
        if (!session || !empId) return { success: false, error: 'Not authenticated' };

        const role = session.user.role;
        const customPasswords: Record<string, { password: string; role: UserRole }> =
            JSON.parse(localStorage.getItem(CUSTOM_PASSWORDS_KEY) || '{}');

        // Verify current password
        const currentValid =
            (customPasswords[empId]?.password === currentPassword) ||
            (ROLE_CONFIG[role]?.password === currentPassword);

        if (!currentValid) {
            return { success: false, error: 'Current password is incorrect' };
        }

        if (newPassword.length < 6) {
            return { success: false, error: 'New password must be at least 6 characters' };
        }

        // Store new password
        customPasswords[empId] = { password: newPassword, role };
        localStorage.setItem(CUSTOM_PASSWORDS_KEY, JSON.stringify(customPasswords));

        return { success: true };
    }, [session, empId]);

    // ── Computed values ──
    const value = useMemo<AuthContextValue>(() => {
        const role = session?.user.role ?? null;
        const permissions = session?.permissions ?? [];
        const dashboardAccess = session?.dashboardAccess ?? [];

        return {
            user: session?.user ?? null,
            role,
            isAuthenticated: !!session,
            isLoading,
            permissions,
            dashboardAccess,
            empId,
            employeeInfo,
            employeeFetchDone,
            canAccess: (perm: AppPermission) => permissions.includes(perm),
            canViewDashboard: (slug: DashboardSlug) => {
                if (dashboardAccess.includes('all')) return true;
                return dashboardAccess.includes(slug);
            },
            isEditor: role === 'editor',
            isAdmin: role === 'admin' || role === 'editor',
            canEdit: role === 'admin' || role === 'editor',
            login,
            logout,
            changePassword,
        };
    }, [session, isLoading, empId, employeeInfo, employeeFetchDone, login, logout, changePassword]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
