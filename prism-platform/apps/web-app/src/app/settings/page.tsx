'use client';

import React, { useState } from 'react';
import { PageHeader, GlassPanel } from '@prism/ui';
import { useAuth } from '@/lib/auth-context';
import { ROLE_CONFIG } from '@prism/auth';

export default function SettingsPage() {
    const { user, role, logout, changePassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);

    const roleConfig = role ? ROLE_CONFIG[role] : null;
    const displayName = user?.name || user?.empId || 'User';
    const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess(false);

        if (newPassword !== confirmPassword) {
            setPwError('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setPwError('Password must be at least 6 characters');
            return;
        }

        setPwLoading(true);
        const result = await changePassword(currentPassword, newPassword);
        setPwLoading(false);

        if (result.success) {
            setPwSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPwSuccess(false), 4000);
        } else {
            setPwError(result.error || 'Failed to change password');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader overline="Configuration" title="Settings" subtitle="Your profile and preferences" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Card */}
                <GlassPanel title="Profile" className="p-6">
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div
                                className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg flex-shrink-0"
                                style={{ backgroundColor: roleConfig?.color || '#64748B', boxShadow: `0 4px 14px ${roleConfig?.color || '#64748B'}30` }}
                            >
                                {initials}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">{displayName}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span
                                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: `${roleConfig?.color}20`, color: roleConfig?.color }}
                                    >
                                        {roleConfig?.label || role}
                                    </span>
                                    <span className="text-xs text-[var(--text-muted)]">{user?.empId}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {user?.department && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Department</p>
                                    <p className="text-sm text-[var(--text-primary)] font-medium">{user.department}</p>
                                </div>
                            )}
                            {user?.designation && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Designation</p>
                                    <p className="text-sm text-[var(--text-primary)] font-medium">{user.designation}</p>
                                </div>
                            )}
                            {user?.storeName && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Store</p>
                                    <p className="text-sm text-[var(--text-primary)] font-medium">{user.storeName}</p>
                                </div>
                            )}
                            {user?.email && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Email</p>
                                    <p className="text-sm text-[var(--text-primary)] font-medium truncate">{user.email}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={logout}
                            className="w-full mt-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </GlassPanel>

                {/* Change Password Card */}
                <GlassPanel title="Change Password" className="p-6">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-1 focus:ring-[#10b37d]/40 focus:border-[#10b37d]/40 outline-none transition-all"
                                placeholder="Enter current password"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-1 focus:ring-[#10b37d]/40 focus:border-[#10b37d]/40 outline-none transition-all"
                                placeholder="Minimum 6 characters"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-1 focus:ring-[#10b37d]/40 focus:border-[#10b37d]/40 outline-none transition-all"
                                placeholder="Re-enter new password"
                            />
                        </div>

                        {pwError && (
                            <div className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium">
                                {pwError}
                            </div>
                        )}
                        {pwSuccess && (
                            <div className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                                Password changed successfully!
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={pwLoading}
                            className="w-full px-4 py-2.5 rounded-lg bg-[#10b37d] text-white text-sm font-semibold hover:bg-[#0d8c63] transition-colors disabled:opacity-50"
                        >
                            {pwLoading ? 'Changing...' : 'Update Password'}
                        </button>
                    </form>
                </GlassPanel>

                {/* Notification Preferences */}
                <GlassPanel title="Notification Preferences" className="p-6">
                    <div className="space-y-4">
                        {['Push Notifications', 'Email Digests', 'Critical Alerts'].map(pref => (
                            <div key={pref} className="flex justify-between items-center py-2">
                                <span className="text-[var(--text-secondary)] font-medium text-sm">{pref}</span>
                                <div className="h-5 w-10 bg-gradient-to-r from-[#0d8c63] to-[#10b37d] rounded-full flex items-center px-1 cursor-pointer">
                                    <div className="h-3 w-3 bg-white rounded-full ml-auto shadow-sm" />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassPanel>

                {/* Session Info */}
                <GlassPanel title="Session Info" className="p-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-[var(--text-muted)]">Employee ID</span>
                            <span className="text-xs font-mono text-[var(--text-primary)]">{user?.empId || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-[var(--text-muted)]">Role</span>
                            <span className="text-xs font-medium" style={{ color: roleConfig?.color }}>{roleConfig?.label || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-[var(--text-muted)]">Session Duration</span>
                            <span className="text-xs text-[var(--text-primary)]">24 hours</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-[var(--text-muted)]">Company</span>
                            <span className="text-xs text-[var(--text-primary)]">HBPL</span>
                        </div>
                    </div>
                </GlassPanel>
            </div>
        </div>
    );
}