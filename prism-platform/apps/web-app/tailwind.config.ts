import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: 'var(--obsidian-950)',
          900: 'var(--obsidian-900)',
          800: 'var(--obsidian-800)',
          700: 'var(--obsidian-700)',
          600: 'var(--obsidian-600)',
          400: 'var(--obsidian-400)',
          300: 'var(--obsidian-300)',
          200: 'var(--obsidian-200)',
          100: 'var(--obsidian-100)',
          50: 'var(--obsidian-50)',
        },
        ember: {
          600: '#087a56',
          500: '#0d8c63',
          400: '#10b37d',
          300: '#34d399',
          200: '#FDBA74',
          100: '#FFF7ED',
        },
        // Aliases for convenience
        background: '#09090B',
        foreground: '#E4E4E9',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#EAB308',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['"JetBrains Mono"', 'var(--font-jb)', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'var(--font-jb)', '"SF Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        'panel': '16px',
        'card': '12px',
        'element': '8px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-smooth': 'cubic-bezier(0.65, 0, 0.35, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        'instant': '80ms',
        'fast': '150ms',
        'normal': '280ms',
        'slow': '450ms',
        'dramatic': '700ms',
      },
      boxShadow: {
        'ember-glow': '0 4px 14px rgba(13, 140, 99, 0.25)',
        'ember-soft': '0 0 24px rgba(13, 140, 99, 0.06)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        glass: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
