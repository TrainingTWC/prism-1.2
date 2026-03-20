// ──────────────────────────────────────────
// Design Tokens — Prism Design System
// ──────────────────────────────────────────

export const colors = {
  background: '#0F172A',
  foreground: '#F8FAFC',
  primary: {
    DEFAULT: '#6366F1',
    foreground: '#FFFFFF',
  },
  secondary: {
    DEFAULT: '#22D3EE',
    foreground: '#0F172A',
  },
  success: '#22C55E',
  danger: '#EF4444',
  glass: {
    bg: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
    blur: '12px',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
  },
} as const;

export const spacing = {
  page: {
    paddingX: '1.5rem',
    paddingY: '2rem',
    maxWidth: '1440px',
  },
} as const;
