# Prism Platform — Design System (Accurate Audit)

> **Last audited:** 2026-03-16
> **Source of truth:** `apps/web-app/` codebase — globals.css, tailwind.config.ts, layout.tsx, @prism/ui components, page patterns.

---

## 1. Design Philosophy — What Actually Ships

The app presents as a **dark-mode-first operational intelligence dashboard** with an emerald-green accent. Despite the original spec naming the accent "Ember" (copper-orange), the production codebase maps the `--ember-*` CSS variable names to **green/emerald values** (#087a56 → #34d399). The visual identity is:

- **Deep obsidian blacks** as the canvas
- **Emerald green (#10b37d)** as the single dominant accent
- **JetBrains Mono** as the universal typeface (headings AND body)
- **Glassmorphism** (backdrop-blur + translucent surfaces) as the primary card treatment
- **Light theme** supported via `html.light` class toggle

### Actual Aesthetic DNA

| Element | Implementation |
|---|---|
| Base canvas | Near-black (#09090B) with subtle radial emerald glows |
| Cards | Translucent panels with `backdrop-filter: blur(16px)`, 20px border-radius |
| Accent | Emerald green exclusively — buttons, active nav, focus rings, sparklines |
| Typography | Monospace-first (JetBrains Mono everywhere, even body text) |
| Motion | Easing via `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out), 150–450ms |
| Hierarchy | Weight-driven (400–800) + uppercase tracking for labels |

---

## 2. Colour System — Actual Values

### 2.1 Obsidian Scale (Dark Theme — `:root`)

| CSS Variable | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--obsidian-950` | `#09090B` | `obsidian-950` | App background (deepest) |
| `--obsidian-900` | `#0C0C0F` | `obsidian-900` | Sidebar / fixed chrome |
| `--obsidian-800` | `#141418` | `obsidian-800` | Card surface / elevated layer |
| `--obsidian-700` | `#1C1C22` | `obsidian-700` | Hover states, skeleton loading |
| `--obsidian-600` | `#27272F` | `obsidian-600` | Borders, dividers, scrollbar thumb |
| `--obsidian-400` | `#52525E` | `obsidian-400` | Muted text, placeholders, label text |
| `--obsidian-300` | `#7A7A88` | `obsidian-300` | Secondary body text, subtitles |
| `--obsidian-200` | `#A1A1AE` | `obsidian-200` | Primary body text |
| `--obsidian-100` | `#E4E4E9` | `obsidian-100` | Primary headings, high-contrast text |
| `--obsidian-50`  | `#FAFAFA` | `obsidian-50`  | Maximum contrast, KPI values |

### 2.2 Obsidian Scale (Light Theme — `html.light`)

| CSS Variable | Light Hex | Usage |
|---|---|---|
| `--obsidian-950` | `#F8F9FA` | App background |
| `--obsidian-900` | `#F1F3F5` | Sidebar / chrome |
| `--obsidian-800` | `#E9ECEF` | Card surfaces |
| `--obsidian-700` | `#DEE2E6` | Hover states |
| `--obsidian-600` | `#CED4DA` | Borders |
| `--obsidian-400` | `#868E96` | Muted text |
| `--obsidian-300` | `#6C757D` | Secondary text |
| `--obsidian-200` | `#4A4A5A` | Primary body text |
| `--obsidian-100` | `#1A1A2E` | Headings |
| `--obsidian-50`  | `#0D0D1A` | Max contrast |

### 2.3 Ember Scale (ACTUALLY Green — Not Orange)

> **Critical discrepancy:** The CSS variable names say "ember" but the values are emerald green.

| CSS Variable | Hex | Tailwind Class | Actual Colour |
|---|---|---|---|
| `--ember-600` | `#087a56` | `ember-600` | Dark emerald (pressed state) |
| `--ember-500` | `#0d8c63` | `ember-500` | Primary accent green |
| `--ember-400` | `#10b37d` | `ember-400` | Hover accent, chart strokes, active nav |
| `--ember-300` | `#34d399` | `ember-300` | Lighter green (highlights, tags) |
| `--ember-200` | `#FDBA74` | `ember-200` | Orange (only leftover from original spec) |
| `--ember-100` | `#FFF7ED` | `ember-100` | Warm tinted surface (unused in practice) |

**Hardcoded accent throughout the codebase:** `#10b37d` — this hex appears directly in Tailwind classes, inline styles, and component defaults everywhere. It serves as the single accent color for:
- Active sidebar links: `bg-[#10b37d]/10 text-[#10b37d]`
- Focus rings: `focus:ring-[#10b37d]/30`
- Buttons: `bg-gradient-to-r from-[#0d8c63] to-[#10b37d]`
- Glow effects, selection highlight, icon hover states
- Sparkline fills, progress rings, chart bars

### 2.4 Semantic Colours

| Token | Hex | Usage |
|---|---|---|
| `--semantic-success` | `#22C55E` | Success badges, positive trends, pass states |
| `--semantic-danger` | `#EF4444` | Fail states, destructive actions, critical alerts |
| `--semantic-warning` | `#EAB308` | Warning indicators, threshold alerts |
| `--semantic-info` | `#3B82F6` | Informational badges, links |

### 2.5 Theme Tokens (CSS Custom Properties)

#### Dark Mode (`:root` default)

| Token | Value | Purpose |
|---|---|---|
| `--bg-primary` | `#09090B` | Body background |
| `--bg-secondary` | `#0C0C0F` | Secondary surfaces |
| `--bg-tertiary` | `#141418` | Tertiary surfaces |
| `--bg-surface` | `rgba(20, 20, 24, 0.85)` | Glass panel background |
| `--bg-surface-hover` | `rgba(28, 28, 34, 0.65)` | Glass panel hover |
| `--text-primary` | `#E4E4E9` | Headlines, strong text |
| `--text-secondary` | `#A1A1AE` | Body text |
| `--text-tertiary` | `#7A7A88` | De-emphasized text |
| `--text-muted` | `#52525E` | Placeholders, disabled text |
| `--border-primary` | `rgba(39, 39, 47, 0.6)` | Card borders |
| `--border-subtle` | `rgba(39, 39, 47, 0.3)` | Subtle separators |
| `--glass-bg` | `rgba(20, 20, 24, 0.85)` | Glassmorphism fill |
| `--glass-border` | `rgba(39, 39, 47, 0.6)` | Glassmorphism border |
| `--card-bg` | `rgba(20, 20, 24, 0.5)` | Card background |
| `--card-bg-hover` | `rgba(28, 28, 34, 0.65)` | Card hover background |
| `--input-bg` | `rgba(20, 20, 24, 0.6)` | Input field background |
| `--sidebar-bg` | `rgba(12, 12, 15, 0.95)` | Sidebar background |
| `--sidebar-border` | `rgba(255, 255, 255, 0.04)` | Sidebar right border |
| `--glass-blur` | `16px` | Blur radius for glass |

#### Light Mode (`html.light`)

| Token | Value |
|---|---|
| `--bg-primary` | `#F8F9FA` |
| `--bg-secondary` | `#FFFFFF` |
| `--bg-tertiary` | `#F1F3F5` |
| `--bg-surface` | `rgba(255, 255, 255, 0.9)` |
| `--bg-surface-hover` | `rgba(241, 243, 245, 0.9)` |
| `--text-primary` | `#1A1A2E` |
| `--text-secondary` | `#4A4A5A` |
| `--text-tertiary` | `#7A7A88` |
| `--text-muted` | `#A1A1AE` |
| `--border-primary` | `rgba(0, 0, 0, 0.08)` |
| `--border-subtle` | `rgba(0, 0, 0, 0.04)` |
| `--glass-bg` | `rgba(255, 255, 255, 0.85)` |
| `--glass-border` | `rgba(0, 0, 0, 0.08)` |
| `--card-bg` | `rgba(255, 255, 255, 0.7)` |
| `--card-bg-hover` | `rgba(241, 243, 245, 0.9)` |
| `--input-bg` | `rgba(241, 243, 245, 0.8)` |
| `--sidebar-bg` | `rgba(255, 255, 255, 0.95)` |
| `--sidebar-border` | `rgba(0, 0, 0, 0.06)` |

---

## 3. Typography

### 3.1 Font Stack

The app uses **JetBrains Mono** as a universal typeface for BOTH headings and body text. Loaded via:
- Google Fonts CDN (`@import url(...)` in globals.css)
- Next.js `next/font/google` (`JetBrains_Mono` in layout.tsx, exposed as `--font-jb` CSS variable)

**Tailwind config:**
```
fontFamily: {
  sans: ['"JetBrains Mono"', 'var(--font-jb)', 'system-ui', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'var(--font-jb)', '"SF Mono"', '"Fira Code"', 'monospace'],
}
```

> **Note:** Even `font-sans` maps to JetBrains Mono. The body tag in globals.css also references `'Inter', system-ui` as a fallback but this is overridden by the HTML/body class which applies `jetbrainsMono.className`.

### 3.2 Weight Hierarchy (Observed in Components)

| Weight | Usage | Example |
|---|---|---|
| `800` / `font-extrabold` | Page titles (PageHeader h1) | `text-[32px] font-extrabold` |
| `700` / `font-bold` | Section titles, card titles, nav labels, KPI values | `font-bold tracking-tight` |
| `600` / `font-semibold` | Stat labels, filter labels, buttons, nav items | `text-[13px] font-medium` → sidebar actually uses `font-semibold` for labels |
| `500` / `font-medium` | Links, table cells, body emphasis | `font-medium` |
| `400` / `font-normal` | Subtitles, descriptions, body text | `font-normal` |

### 3.3 Text Size Scale (Actual Usage)

| Size | Usage |
|---|---|
| `text-[96px]` / `text-[72px]` | Home page hero "PRISM INTELLIGENCE" |
| `text-[32px]` | PageHeader title |
| `text-5xl` / `text-4xl` | ScoreDisplay KPI xl/lg |
| `text-3xl` | EntityScoreCard value |
| `text-2xl` | Page subtitles, ScoreDisplay md |
| `text-xl` | ScoreDisplay sm |
| `text-lg` | Logo "PRISM" text, section heads |
| `text-base` | GlassPanel titles, ChartContainer titles |
| `text-sm` | Body text, input fields, descriptions |
| `text-xs` | Badge text, trend labels, timestamps |
| `text-[13px]` | Sidebar nav items |
| `text-[12px]` | Sidebar labels (uppercase) |
| `text-[11px]` | StatCard titles, overline labels (uppercase) |
| `text-[10px]` | Overline labels, FilterItem labels, admin section headers |
| `text-[8px]` | Dashboard module badges |

### 3.4 Special Typography Classes

**`.text-overline`** (globals.css):
```css
font-size: 10px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.12em;
color: var(--ember-400);  /* #10b37d green */
```

**`.font-mono-value`** (globals.css):
```css
font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
font-variant-numeric: tabular-nums;
```

**`.text-gradient-ember`** (globals.css):
```css
background: linear-gradient(135deg, #0d8c63, #10b37d, #34d399);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## 4. Motion & Animation

### 4.1 Easing Functions

| CSS Variable / Tailwind | Value | Usage |
|---|---|---|
| `--ease-out-expo` / `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Primary easing for all transitions |
| `--ease-in-out` / `ease-in-out-smooth` | `cubic-bezier(0.65, 0, 0.35, 1)` | Smooth in-out for modals |
| `--ease-spring` / `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Springy overshoots (buttons) |

### 4.2 Duration Tokens

| CSS Variable / Tailwind | Value | Usage |
|---|---|---|
| `--duration-instant` / `duration-instant` | `80ms` | Micro-interactions |
| `--duration-fast` / `duration-fast` | `150ms` | Hover color changes, opacity |
| `--duration-normal` / `duration-normal` | `280ms` | Standard transitions |
| `--duration-slow` / `duration-slow` | `450ms` | Page fade-ins |
| `--duration-dramatic` / `duration-dramatic` | `700ms` | Circular progress ring stroke |

### 4.3 Keyframe Animations

**`fadeInUp`** — page content entry:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fadeInUp { animation: fadeInUp 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
```

**Stagger classes:** `.stagger-1` (0ms) → `.stagger-5` (240ms) in 60ms increments.

**`skeleton-pulse`** — loading placeholders:
```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.04; }
  50%      { opacity: 0.08; }
}
.skeleton { animation: skeleton-pulse 1.5s ease-in-out infinite; background-color: var(--obsidian-700); border-radius: 12px; }
```

---

## 5. Surface System (Glass & Cards)

### 5.1 `.glass` — Primary Panel Surface

```css
background: var(--glass-bg);                          /* rgba(20,20,24,0.85) */
backdrop-filter: blur(16px) saturate(1.2);
border: 1px solid var(--glass-border);                /* rgba(39,39,47,0.6) */
border-radius: 20px;
box-shadow:
  0 0 0 0.5px rgba(255,255,255,0.04),                /* outer ring */
  0 4px 24px rgba(0,0,0,0.35),                        /* elevation */
  inset 0 1px 0 rgba(255,255,255,0.03);               /* top highlight */
```

### 5.2 `.glass-interactive` — Hoverable Glass

Same as `.glass` plus:
- `transition: all 280ms cubic-bezier(0.16, 1, 0.3, 1);`
- **Hover:** darker bg (`rgba(28,28,34,0.92)`), green border tint (`rgba(13,140,99,0.18)`), 8px deeper shadow, `translateY(-2px)` lift

### 5.3 `.widget` — Premium Card Surface

```css
background: linear-gradient(135deg, rgba(20,20,24,0.9) 0%, rgba(16,16,20,0.85) 100%);
backdrop-filter: blur(20px) saturate(1.3);
border: 1px solid rgba(255,255,255,0.06);
border-radius: 24px;
box-shadow:
  0 0 0 0.5px rgba(255,255,255,0.03),
  0 8px 32px rgba(0,0,0,0.3),
  inset 0 1px 0 rgba(255,255,255,0.04),
  inset 0 -1px 0 rgba(0,0,0,0.1);
transition: all 320ms cubic-bezier(0.16, 1, 0.3, 1);
```
- **Hover:** brighter top highlight, deeper shadow, `translateY(-2px)` lift

### 5.4 Glow Rings

| Class | Color | Shadow |
|---|---|---|
| `.glow-ember` | Green | `0 0 0 1px rgba(13,140,99,0.12), 0 0 20px rgba(13,140,99,0.06)` |
| `.glow-success` | Green | `0 0 0 1px rgba(34,197,94,0.12), 0 0 20px rgba(34,197,94,0.06)` |

### 5.5 Tailwind Box Shadow Tokens

| Tailwind class | Value |
|---|---|
| `shadow-ember-glow` | `0 4px 14px rgba(13, 140, 99, 0.25)` |
| `shadow-ember-soft` | `0 0 24px rgba(13, 140, 99, 0.06)` |
| `shadow-card` | `0 2px 8px rgba(0, 0, 0, 0.4)` |
| `shadow-card-hover` | `0 4px 16px rgba(0, 0, 0, 0.5)` |

### 5.6 Border Radius Tokens

| Tailwind class | Value | Usage |
|---|---|---|
| `rounded-panel` | `16px` | Outer panels |
| `rounded-card` | `12px` | Inner cards, filter bars |
| `rounded-element` | `8px` | Buttons, inputs |
| Native `rounded-2xl` | `16px` | Frequently used directly |
| Native `rounded-lg` | `8px` | Sidebar items, inputs |
| CSS `.glass` / `.widget` | `20px` / `24px` | Glass & widget cards |

---

## 6. Layout Architecture

### 6.1 Shell Structure (`MainLayout`)

```
┌─────────────────────────────────────────────────────────────────┐
│ ThemeProvider → AuthProvider                                     │
│ ┌────────┬──────────────────────────────────────────────────┐   │
│ │        │  Topbar (fixed top, left-offset 256px, h=56px)   │   │
│ │ Sidebar│  ┌──────────────────────────────────────────────┐│   │
│ │ (fixed │  │ Search          │ Theme │ Bell │ User        ││   │
│ │  left, │  └──────────────────────────────────────────────┘│   │
│ │  w=256)│  ┌──────────────────────────────────────────────┐│   │
│ │        │  │                                              ││   │
│ │        │  │  <main> (mt-56, p-32, max-1600px centered)   ││   │
│ │        │  │                                              ││   │
│ │        │  │  {children}                                  ││   │
│ │        │  │                                              ││   │
│ │        │  └──────────────────────────────────────────────┘│   │
│ │        │  ┌──────────────────────────────────────────────┐│   │
│ │        │  │ Footer (border-t, © 2026, opacity-50)        ││   │
│ │        │  └──────────────────────────────────────────────┘│   │
│ └────────┴──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Ambient Background:** Two fixed radial gradient blurs (emerald at 4% and 3% opacity) positioned top-left and bottom-right under all content.

**Key measurements:**
- Sidebar width: `w-64` (256px), collapses to `w-[68px]`
- Topbar height: `h-14` (56px)
- Content: `mt-14 p-8`, max-width: `max-w-[1600px] mx-auto`
- Footer: `py-6 px-10`, `border-t border-obsidian-600/15 opacity-50`

### 6.2 Sidebar (`sidebar.tsx`)

**Structure:**
1. **Logo area** — 8×8 rounded-lg image + "PRISM" bold text (`text-lg font-bold tracking-tight`)
2. **Search input** — within sidebar, appears when expanded
3. **Main nav** — 5 items in a vertical stack
4. **Admin section** — separated by `border-t`, with "Admin" overline label, 5 items
5. **Collapse toggle** — bottom of sidebar

**Navigation items:**

| Group | Name | Route | Icon |
|---|---|---|---|
| Main | Home | `/` | `HomeIcon` |
| Main | Intelligence | `/ai-insights` | `SparklesIcon` |
| Main | Dashboard | `/dashboards` | `LayoutGrid` |
| Main | Reports | `/reports` | `BarChartIcon` |
| Main | Checklist | `/checklists` | `ClipboardListIcon` |
| Admin | Module Builder | `/admin` | `BrainIcon` |
| Admin | Checklist Builder | `/programs` | `ChecklistIcon` |
| Admin | Knowledge Base | `/knowledge-base` | `BookOpenIcon` |
| Admin | Emp Master | `/employees` | `UserIcon` |
| Admin | Store Master | `/stores` | `StoreIcon` |

**Active state:** `bg-[#10b37d]/10 text-[#10b37d]` — green tinted background + green text
**Hover state:** `bg-[var(--card-bg-hover)] text-[var(--text-primary)]`
**Item styling:** `text-[13px] font-medium`, labels are `text-[12px] font-semibold uppercase tracking-wide`
**Admin header:** `text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]`

### 6.3 Topbar (`topbar.tsx`)

**Structure:** Fixed header, `h-14`, glass background with backdrop-blur

| Zone | Content |
|---|---|
| Left | Search input (`max-w-xl`, "Search Prism..." placeholder) |
| Right | Theme toggle (sun/moon SVGs) → Bell notification (with green dot indicator) → User info (name + role + avatar circle) |

**Theme toggle:** Calls `toggleTheme()` from ThemeContext. Sun icon for dark mode, moon icon for light mode.
**Notification bell:** Green dot badge (`h-2 w-2 rounded-full bg-[#10b37d]`)
**User section:** Separated by left border. Shows "Admin User" / "Global Admin" text + default avatar circle.

---

## 7. @prism/ui — Shared Component Library

Located at `packages/ui/src/`. Exports:

### 7.1 `PageHeader`

**Props:** `title`, `subtitle?`, `overline?`, `actions?`, `breadcrumbs?`, `className?`

**Rendering:**
- Overline: uses `.text-overline` (10px, bold, uppercase, green)
- Title: `text-[32px] font-extrabold tracking-tight text-obsidian-100`
- Subtitle: `text-sm font-normal text-obsidian-300 max-w-2xl`
- Actions: flex row, gap-3, aligned to right on desktop
- Divider: gradient line `from-[#0d8c63]/30 via-[#0d8c63]/10 to-transparent`

### 7.2 `StatCard`

**Props:** `title`, `value`, `subtitle?`, `icon?`, `trend?` (`{ value, isPositive }` | `'up'` | `'down'` | `'neutral'`), `status?`, `className?`, `visual?`

**Rendering:**
- Uses `.widget` surface (24px radius, gradient bg, blur)
- Title: `text-[11px] font-semibold uppercase tracking-widest text-obsidian-400`
- Value: `text-4xl font-bold tracking-tight text-obsidian-50 font-mono-value`
- Trend badge: colored pill (`bg-[rgba(13,140,99,0.08)] text-[#10b37d]` for positive, red for negative)
- Visual slot: for sparklines, progress rings, etc.

### 7.3 `GlassPanel`

**Props:** `children`, `className?`, `padding?` (`'sm'` | `'md'` | `'lg'` | `'none'`), `title?`, `variant?` (`'glass'` | `'solid'` | `'widget'`), `actions?`

**Rendering:**
- `glass` variant → applies `.glass` class (20px radius, blur, translucent)
- `solid` variant → `bg-obsidian-800 border border-obsidian-600/50 rounded-[20px]`
- `widget` variant → applies `.widget` class (24px radius, gradient, blur)
- Padding: sm=16px, md=24px, lg=32px, none=0
- Title: `text-base font-semibold text-obsidian-100`

### 7.4 `FilterBar`

**Props:** `children?`, `className?`, `onSearch?`, `onClear?`, `showClear?`, `placeholder?`

**Rendering:**
- Surface: `.glass rounded-card p-4 flex flex-wrap items-center gap-4`
- Search input: `bg-obsidian-800 border border-obsidian-600/50 rounded-card` with search icon
- Focus: `focus:border-[#0d8c63]/40`
- Filter children render in `flex gap-3`

### 7.5 `FilterItem`

**Props:** `label?`, `children`, `className?`

**Rendering:**
- Label: `text-[10px] font-bold uppercase tracking-[0.12em] text-obsidian-400`

### 7.6 `TableView<T>`

**Props:** `data: T[]`, `columns: { header, accessor, className?, mono? }[]`, `onRowClick?`, `isLoading?`, `className?`

**Rendering:**
- Header row: `text-[10px] font-bold uppercase tracking-[0.12em] text-obsidian-400`, `border-b border-obsidian-600/30`
- Data rows: `text-obsidian-200`, hover → `text-obsidian-100`
- Clickable rows: `hover:bg-[rgba(13,140,99,0.03)]` (very subtle green tint)
- Loading: 5 skeleton rows with `.skeleton` animation
- Empty: "No data available" centered text
- Mono columns: `font-mono text-[11px]`

### 7.7 `ChartContainer`

**Props:** `title?`, `subtitle?`, `children` (Recharts element), `className?`, `height?` (default 300)

**Rendering:**
- Title: `text-base font-semibold tracking-tight text-obsidian-100`
- Subtitle: `text-xs text-obsidian-400`
- Wraps children in recharts `ResponsiveContainer`

### 7.8 `cn()` Utility

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

---

## 8. Intelligence Shared Components

Located at `apps/web-app/src/components/intelligence/shared.tsx`. Used by entity intelligence pages.

### 8.1 `CircularProgress`

SVG-based ring. Props: `value` (0-100), `size` (default 64), `strokeWidth` (5), `color` (#10b37d), `label?`
- Track: `rgba(39,39,47,0.5)` stroke
- Fill: animated via `stroke-dashoffset` with 700ms expo transition
- Center: mono bold label showing percentage

### 8.2 `SparkBars`

Mini bar chart. Props: `data: number[]`, `color` (#10b37d), `height` (32)
- Bars: gradient fill from color to 40% opacity variant
- Rounded top: `rounded-t-sm`
- Progressive opacity per bar (newer = more opaque)

### 8.3 `Sparkline`

SVG polyline + gradient fill. Props: `data: TrendPoint[]`, `color`, `width` (120), `height` (32)
- Area fill with linear gradient (20% → 0% opacity)
- Smooth line with rounded caps

### 8.4 `TrendBadge`

Pill badge. Props: `trend` (`'up'` | `'down'` | `'flat'`), `delta?`
- Up: `↑` green (#22C55E on rgba(34,197,94,0.08))
- Down: `↓` red (#EF4444 on rgba(239,68,68,0.08))
- Flat: `→` grey (#A1A1AE)
- Uses `.badge-pill` class

### 8.5 `RiskBadge`

Pill badge with dot. Props: `level` (`'low'` | `'medium'` | `'high'` | `'critical'`)
- Low: green, Medium: yellow, High: green (note: seems like a bug—intentionally uses #10b37d), Critical: red
- Dot + label in `.badge-pill`

### 8.6 `ScoreDisplay`

Large KPI number. Props: `value`, `size` (`'sm'`|`'md'`|`'lg'`|`'xl'`), `color?`
- Auto-colors: ≥85 green, ≥70 ember-green, <70 red
- Font: `font-mono font-bold`

### 8.7 `TimeRangeSelector`

Pill-toggle group. Options: 30D, 90D, 6M, 1Y
- Active pill: `bg-[rgba(13,140,99,0.12)] text-[#10b37d]` with inset border
- Inactive: `text-obsidian-400 hover:text-obsidian-200`
- Container: `rounded-xl bg-white/[0.03] p-1 border border-white/[0.04]`

### 8.8 `EntityScoreCard`

Widget card for KPIs. Props: `label`, `value`, `icon?`, `trend?`, `delta?`, `visual?`
- Surface: `.widget p-5`
- Label: `text-[11px] font-semibold uppercase tracking-widest text-obsidian-400`
- Value: `font-mono text-3xl font-bold text-obsidian-50`
- Optional `TrendBadge` next to value

### 8.9 `DataTable<T>`

Simple data table. Props: `columns`, `data`, `onRowClick?`
- Header: `text-[10px] font-bold uppercase tracking-widest text-obsidian-400`, `border-b border-white/[0.04]`
- Rows: `border-b border-white/[0.02]`, hover `bg-white/[0.02]`

### 8.10 `SectionHeader`

Section title + optional action. Title: `text-sm font-bold uppercase tracking-widest text-obsidian-300`

---

## 9. Dashboard Module Registry

Defined in `components/dashboard/dashboard-type-selector.tsx`:

| ID | Label | Route | Color | Description |
|---|---|---|---|---|
| `hr` | HR | `/dashboards/hr` | `#3B82F6` | Employee Surveys |
| `operations` | Operations | `/dashboards/operations` | `#10b37d` | Checklists |
| `training` | Training | `/dashboards/training` | `#A855F7` | Audits |
| `qa` | QA | `/dashboards/qa` | `#EF4444` | Assessments |
| `finance` | Finance | `/dashboards/finance` | `#22C55E` | Reports |
| `shlp` | SHLP | `/dashboards/shlp` | `#10B981` | Certification |
| `campus-hiring` | Campus Hiring | `/dashboards/campus-hiring` | `#6366F1` | Assessment Results |
| `trainer-calendar` | Trainer Calendar | `/dashboards/trainer-calendar` | `#A855F7` | Scheduling |
| `bench-planning` | Bench Planning | `/dashboards/bench-planning` | `#10b37d` | Barista → SM |
| `consolidated` | Consolidated | `/dashboards/consolidated` | `#64748B` | Cross-Dept View (Editor badge) |

Dashboard selector cards: `rounded-2xl`, colored dot indicator, `text-sm font-bold`, `hover:scale-[1.02]`. Active state: colored bg tint + glow shadow.

---

## 10. Icon System

All icons are custom inline SVGs defined in `components/icons/index.tsx`. Each accepts `{ size?: number, className?: string }`.

**Exported Icons (37 total):**

| Icon | Visual | Used In |
|---|---|---|
| `HomeIcon` | House | Sidebar nav |
| `LayoutGrid` | 4-square grid | Sidebar nav (Dashboard) |
| `StoreIcon` | Storefront | Sidebar nav (Store Master) |
| `ChecklistIcon` | Checkbox in square | Sidebar nav (Checklist Builder) |
| `UsersIcon` | Two people | General |
| `BarChartIcon` | 3 vertical bars | Sidebar nav (Reports) |
| `SettingsIcon` | Gear cog | General |
| `BellIcon` | Bell | Topbar notifications |
| `FollowUpIcon` | Circle with check + time | General |
| `GlobeIcon` | Globe with latitude | General |
| `UserIcon` | Single person | Sidebar nav (Emp Master) |
| `BrainIcon` | Brain outline | Sidebar nav (Module Builder) |
| `ClipboardListIcon` | Clipboard with lines | Sidebar nav (Checklist) |
| `MapPinIcon` | Map pin | Store pages |
| `TrendingUpIcon` | Arrow trending upward | Trend indicators |
| `HRIcon` | Two people (same as Users) | Dashboard module |
| `OperationsIcon` | Gear cog (same as Settings) | Dashboard module |
| `TrainingIcon` | Graduation cap | Dashboard module |
| `QAIcon` | Checkbox in square | Dashboard module |
| `FinanceIcon` | Dollar sign | Dashboard module |
| `SHLPIcon` | Shield with check | Dashboard module |
| `CampusIcon` | Graduation cap + dot | Dashboard module |
| `CalendarIcon` | Calendar | Dashboard module |
| `BenchIcon` | Bar chart + baseline | Dashboard module |
| `ConsolidatedIcon` | 4-square grid + center dot | Dashboard module |
| `BrewIcon` | Coffee mug | Dashboard module |
| `ShieldIcon` | Shield outline | Topbar/general |
| `FileJsonIcon` | File with braces | General |
| `SparklesIcon` | 4-point stars | Sidebar nav (Intelligence) |
| `ChevronDownIcon` | Down chevron | Dropdowns |
| `LogOutIcon` | Arrow leaving door | Account |
| `SearchIcon` | Magnifying glass | General |
| `FormIcon` | Document with lines | General |
| `AlertTriangleIcon` | Warning triangle | Alerts |
| `TargetIcon` | Concentric circles (bullseye) | Goals |
| `ClockIcon` | Clock face | Timestamps |
| `ArrowRightIcon` | Right arrow | Navigation links |
| `ImageIcon` | Image frame | File uploads |
| `BookOpenIcon` | Open book | Sidebar nav (Knowledge Base) |

**Stroke style:** All `fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"` (Lucide-style).

---

## 11. Global CSS Utilities

### 11.1 Badge Pill

```css
.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
}
```

### 11.2 Circular Progress (CSS-only)

```css
.circular-progress {
  --size: 60px;
  --stroke: 5px;
  width: var(--size); height: var(--size);
  border-radius: 50%;
  /* Uses conic-gradient with --progress custom property */
  /* mask: radial-gradient for ring cutout */
}
```

### 11.3 Sparkline Bars (CSS)

```css
.sparkline-bars { display: flex; align-items: flex-end; gap: 3px; height: 32px; }
.sparkline-bars .bar {
  flex: 1; border-radius: 3px 3px 0 0;
  background: linear-gradient(180deg, rgba(16,179,125,0.8), rgba(13,140,99,0.4));
  transition: height 500ms cubic-bezier(0.16,1,0.3,1);
}
```

### 11.4 Focus Ring

```css
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(13, 140, 99, 0.25);
}
```

### 11.5 Selection & Scrollbar

```css
::selection { background: rgba(13, 140, 99, 0.25); }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--obsidian-600); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--obsidian-400); }
```

---

## 12. Page Patterns

### 12.1 Home Page (`/`)

- Hero: centered vertically, "PRISM" in 72-96px `text-primary`, "INTELLIGENCE" in 72-96px `#10b37d`
- Tagline: uppercase tracking-wide, muted text
- Nav cards: 3-column grid (`sm:grid-cols-3 gap-5 max-w-4xl`)
  - Card: `rounded-2xl border p-6`, `hover:scale-[1.02]`
  - Hover: green border tint (`rgba(16,179,125,0.3)`) + glow shadow
  - Each has: icon (12×12 rounded-xl green container) → title (sm bold uppercase) → description (xs muted) → action link (green, animated gap)

### 12.2 Intelligence Hub (`/ai-insights`)

- Chat interface with message history
- Suggested prompt pills
- API: `POST /api/intelligence/chat` with `{ message, history }`
- Messages: user (right-aligned) and assistant (left-aligned)

### 12.3 Data Pages (Employees, Stores)

Standard pattern:
```
<PageHeader overline="..." title="..." subtitle="..." />
<StatCard grid> (4 columns: Total, Active, Categories, Coverage)
<FilterBar onSearch={...} placeholder="..." />
<GlassPanel padding="none">
  <TableView data={...} columns={...} isLoading={...} onRowClick={...} />
</GlassPanel>
<p> Showing X of Y items </p>
```

**Status badges (inline):** Dot + text, green for active (`rgba(16,179,125,0.08)` bg), red for inactive.

### 12.4 Checklists Page (`/checklists`)

- Programs organized into folders (Brew League, Bench Planning, QA, Operations, Training, HR, Finance, Compliance)
- Each folder has: icon, label, color, regex-based program matching
- Type colors: QA=#10b37d, Training=#A855F7, Compliance=#22C55E, Competition=#EAB308, Custom=#3B82F6

### 12.5 Programs Page (`/programs`)

Entity intelligence style:
- Uses `EntityScoreCard` for KPI grid + `SparkBars` / `CircularProgress` visuals
- Widget cards for each program
- Type color map: Checklist=#3B82F6, Audit=#8B5CF6, Training=#10b37d, Inspection=#22C55E, Task=#FBBF24

### 12.6 Knowledge Base (`/knowledge-base`)

- Category filter pills with per-category colors
- Card grid for entries
- Modal editor for create/edit
- Categories: SOP_PROCEDURE (#10b37d), SCORING_GRADING (#3b82f6), COMPANY_POLICY (#8b5cf6), BRAND_STANDARD (#f59e0b), TRAINING_MATERIAL (#ec4899), REGIONAL_GUIDELINE (#06b6d4), PRODUCT_LAUNCH (#f97316), GENERAL (#6b7280)

### 12.7 Dashboards Page (`/dashboards`)

- Module selector grid (2-5 columns responsive)
- Each module: `rounded-2xl`, colored dot, label, description
- Optional "Editor" badge for restricted dashboards

### 12.8 Reports Page (`/reports`)

- Uses `PageHeader` with actions (PDF export button)
- `GlassPanel` + `ChartContainer` wrapping Recharts `BarChart`
- Chart styling: `CartesianGrid stroke="rgba(228,228,233,0.04)"`, tooltip with dark glass bg

---

## 13. Providers & Context

### 13.1 ThemeProvider (`lib/theme-context.tsx`)

- Stores: `'dark' | 'light'`
- Persists to `localStorage` key: `prism-theme`
- Toggles `html` class between `dark` and `light`
- Default: `'dark'`

### 13.2 AuthProvider (`lib/auth-context.tsx`)

- Mock user: `Karan Singh`, role `editor`
- Exposes: `user`, `role`, `isEditor`, `isAdmin`, `isUser`, `canEdit`, `setRole`
- Role hierarchy: `editor` > `admin` > `user`

### 13.3 Provider Nesting Order

```
<ThemeProvider>
  <AuthProvider>
    <MainLayout>
      <Sidebar />
      <Topbar />
      <main>{children}</main>
    </MainLayout>
  </AuthProvider>
</ThemeProvider>
```

---

## 14. API Client (`lib/api.ts`)

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiClient<T>(endpoint: string, options?: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<T>
```

- Default method: `GET`
- Auto JSON serialization of body
- Handles 204 (empty response)
- Throws on non-ok status

---

## 15. Tailwind Configuration Summary

**Content paths:** `./src/**/*.{ts,tsx}`, `../../packages/ui/src/**/*.{ts,tsx}`

**Extended theme:**
- Colors: `obsidian` (10 shades via CSS vars), `ember` (6 shades, hardcoded hex), semantic aliases
- Fonts: `sans` and `mono` both → JetBrains Mono
- Border radius: `panel` (16px), `card` (12px), `element` (8px)
- Timing: `out-expo`, `in-out-smooth`, `spring`
- Durations: `instant` (80ms) → `dramatic` (700ms)
- Shadows: `ember-glow`, `ember-soft`, `card`, `card-hover`
- Backdrop blur: `glass` (16px)

**Plugins:** None.

---

## 16. Design Tokens Export (`packages/ui/src/styles/tokens.ts`)

> **Note:** This file is OUTDATED and NOT used by the actual app. It declares different colors (indigo primary, cyan secondary) that don't match globals.css.

```typescript
export const colors = {
  background: '#0F172A',     // slate-900 — NOT what the app uses
  primary: { DEFAULT: '#6366F1' },  // indigo — NOT used
  secondary: { DEFAULT: '#22D3EE' }, // cyan — NOT used
  // ...
};
export const typography = { fontFamily: { sans: ['Inter', ...] } }; // NOT what the app uses
```

This file should be treated as stale/legacy. The real design tokens live in `globals.css` CSS custom properties.

---

## 17. Key Design Observations & Discrepancies

1. **Ember ≠ Orange:** The `--ember-*` variable names suggest orange/copper but values are green (#087a56 → #34d399). Only `--ember-200` (#FDBA74) retains the original orange. The entire accent system is emerald green.

2. **Monospace everywhere:** The spec mentions Inter/system-ui but JetBrains Mono is loaded on both `<html>` and `<body>` via className and CSS. Every element renders in monospace.

3. **tokens.ts is dead code:** `packages/ui/src/styles/tokens.ts` defines an entirely different color scheme (indigo primary, Inter font) that doesn't match the live app. Should be removed or updated.

4. **Hardcoded hex over variables:** Many components use `#10b37d` directly instead of `var(--ember-400)` or Tailwind's `ember-400`. This makes the accent color harder to change globally.

5. **Two search bars:** Both the sidebar and topbar contain search inputs. The sidebar search says "Search intelligence..." and the topbar says "Search Prism...". Neither appears to be wired to the same functionality.

6. **Light theme support exists** but may have visual issues since many component styles use hardcoded `rgba(13,140,99,...)` for the accent that won't adapt to light backgrounds.

7. **Status badge pattern is duplicated:** Both employees and stores pages create inline status badges with identical styling rather than using a shared component.

8. **Widget vs Glass inconsistency:** Some pages use `.widget` class, others use `GlassPanel` component. The visual result is similar but border-radius differs (20px vs 24px).
