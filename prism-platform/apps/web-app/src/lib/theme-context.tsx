'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');

    // On mount, read saved theme from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('prism-theme') as Theme | null;
        if (saved === 'light' || saved === 'dark') {
            setThemeState(saved);
            applyTheme(saved);
        }
    }, []);

    const applyTheme = (t: Theme) => {
        const html = document.documentElement;
        if (t === 'light') {
            html.classList.remove('dark');
            html.classList.add('light');
        } else {
            html.classList.remove('light');
            html.classList.add('dark');
        }
    };

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        localStorage.setItem('prism-theme', t);
        applyTheme(t);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
    return ctx;
}
