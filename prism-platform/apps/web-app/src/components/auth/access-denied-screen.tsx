'use client';

import React from 'react';
import { motion } from 'framer-motion';

const spring = { type: 'spring' as const, bounce: 0, duration: 0.5 };

export function AccessDeniedScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring}
                className="text-center space-y-6 p-8 max-w-lg"
            >
                {/* Warning icon */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-red-600/10 animate-ping" />
                    <div className="relative w-full h-full flex items-center justify-center rounded-full bg-red-600/20 border-2 border-red-500/40">
                        <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-red-500 tracking-widest mb-3">
                        ACCESS DENIED
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm md:text-base max-w-md mx-auto">
                        No employee ID was found. Access to Prism requires a valid{' '}
                        <code className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded text-xs font-bold">?EMPID=</code>{' '}
                        parameter in the URL.
                    </p>
                </div>

                {/* Example */}
                <div className="max-w-sm mx-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-4 text-sm text-[var(--text-secondary)] font-mono">
                    <span className="text-[var(--text-muted)]">https://prism.app/</span>
                    <span className="text-emerald-400 font-bold">?EMPID=H541</span>
                </div>

                {/* Info box */}
                <div className="max-w-sm mx-auto rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300/70">
                    If you believe this is an error, contact your administrator or try accessing through the link shared with you.
                </div>
            </motion.div>
        </div>
    );
}
