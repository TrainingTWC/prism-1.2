'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
    /** User's name to greet, or null if still loading */
    userName?: string | null;
    /** When true, the splash begins its exit animation */
    onComplete: () => void;
    /** How long (ms) to hold the greeting before exit. Default 1200 */
    holdMs?: number;
}

/* ── Prism Logo (PNG from /public/logo.png) ── */

/* ── Individual letter for parallax stagger ── */
const LETTERS = ['P', 'R', 'I', 'S', 'M'];

export function SplashScreen({ userName, onComplete, holdMs = 1200 }: SplashScreenProps) {
    const [phase, setPhase] = useState<'brightening' | 'greeting' | 'exiting'>('brightening');

    useEffect(() => {
        // Phase 1: Logo brightens (0 → 1.4s)
        const t1 = setTimeout(() => setPhase('greeting'), 1400);
        return () => clearTimeout(t1);
    }, []);

    useEffect(() => {
        if (phase !== 'greeting') return;
        // Phase 2: Hold greeting, then exit
        const t = setTimeout(() => setPhase('exiting'), holdMs);
        return () => clearTimeout(t);
    }, [phase, holdMs]);

    useEffect(() => {
        if (phase !== 'exiting') return;
        // Phase 3: After exit animation completes, call onComplete
        const t = setTimeout(onComplete, 800);
        return () => clearTimeout(t);
    }, [phase, onComplete]);

    const greetingText = userName
        ? `Welcome back, ${userName.split(' ')[0]}`
        : 'Welcome to Prism';

    return (
        <AnimatePresence>
            {phase !== 'exiting' ? (
                <motion.div
                    key="splash"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-primary)] overflow-hidden"
                    exit={{ x: '-100vw', opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
                >
                    {/* Ambient glow that blooms with the logo */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2, ease: 'easeOut' }}
                    >
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[80px]"
                            style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.15), rgba(59,130,246,0.08), transparent)' }}
                        />
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-[300px] h-[300px] rounded-full blur-[60px]"
                            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.10), transparent)' }}
                        />
                    </motion.div>

                    <div className="relative flex flex-col items-center">
                        {/* ── Logo: starts dim, brightens up with glow ── */}
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0.08, scale: 0.85, filter: 'brightness(0.2)' }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                filter: 'brightness(1.1)',
                            }}
                            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {/* Glow ring behind logo */}
                            <motion.div
                                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/40 via-blue-400/30 to-cyan-400/40 blur-xl"
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: [0, 0.8, 0.5], scale: [0.6, 1.3, 1.1] }}
                                transition={{ duration: 1.8, ease: 'easeOut', times: [0, 0.6, 1] }}
                            />
                            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center">
                                <img src="/logo.png" alt="Prism" className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-2xl" />
                            </div>
                        </motion.div>

                        {/* ── PRISM text: Parallax sideways stagger ── */}
                        <div className="flex items-center gap-[2px] mt-7 overflow-hidden">
                            {LETTERS.map((letter, i) => (
                                <motion.span
                                    key={letter}
                                    className="text-4xl md:text-5xl font-black tracking-[0.18em] bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent select-none"
                                    initial={{ x: 80 + i * 30, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{
                                        duration: 0.9,
                                        delay: 0.5 + i * 0.08,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    {letter}
                                </motion.span>
                            ))}
                        </div>

                        {/* ── Tagline ── */}
                        <motion.p
                            className="text-[11px] md:text-xs text-[var(--text-muted)] mt-2 tracking-[0.25em] uppercase"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1.1 }}
                        >
                            Powered by Third Wave Coffee
                        </motion.p>

                        {/* ── Greeting: fades in during greeting phase ── */}
                        <AnimatePresence>
                            {phase === 'greeting' && (
                                <motion.div
                                    className="mt-10 flex flex-col items-center"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                >
                                    <p className="text-lg md:text-xl font-semibold text-[var(--text-primary)]">
                                        {greetingText}
                                    </p>
                                    {/* Loading bar */}
                                    <div className="mt-4 w-40 h-[3px] rounded-full bg-[var(--border-subtle)] overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-400"
                                            initial={{ width: '0%' }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: holdMs / 1000 * 0.9, ease: 'easeInOut' }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            ) : (
                /* Exit: the whole screen slides left and fades */
                <motion.div
                    key="splash-exit"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-primary)] overflow-hidden"
                    initial={{ x: 0, opacity: 1 }}
                    animate={{ x: '-100vw', opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
                >
                    {/* Ambient */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[80px]"
                            style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.15), rgba(59,130,246,0.08), transparent)' }}
                        />
                    </div>
                    <div className="relative flex flex-col items-center">
                        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center">
                            <img src="/logo.png" alt="Prism" className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-2xl" />
                        </div>
                        <div className="flex items-center gap-[2px] mt-7">
                            {LETTERS.map((letter) => (
                                <span
                                    key={letter}
                                    className="text-4xl md:text-5xl font-black tracking-[0.18em] bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent select-none"
                                >
                                    {letter}
                                </span>
                            ))}
                        </div>
                        <p className="text-lg md:text-xl font-semibold text-[var(--text-primary)] mt-10">
                            {greetingText}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
