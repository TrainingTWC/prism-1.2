// ──────────────────────────────────────────
// Entity Intelligence — Shared UI Components
// ──────────────────────────────────────────
// Reusable visualization primitives used
// across all entity intelligence pages.
// ──────────────────────────────────────────

'use client';

import React from 'react';
import type { TrendDirection, RiskLevel, TrendPoint } from '../../types/entity-intelligence';

// ── Circular Progress Ring (SVG) ──

export function CircularProgress({
  value,
  size = 64,
  strokeWidth = 5,
  color = '#10b37d',
  label,
  className = '',
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(39,39,47,0.5)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-sm font-bold" style={{ color }}>{label ?? `${value}%`}</span>
      </div>
    </div>
  );
}

// ── Mini Spark Bars ──

export function SparkBars({
  data,
  color = '#10b37d',
  height = 32,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm min-w-[4px]"
          style={{
            height: `${Math.max((v / max) * 100, 8)}%`,
            background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`,
            opacity: 0.5 + (i / data.length) * 0.5,
          }} />
      ))}
    </div>
  );
}

// ── Mini Sparkline ──

export function Sparkline({
  data,
  color = '#10b37d',
  width = 120,
  height = 32,
}: {
  data: TrendPoint[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${padding},${height} ${points} ${width - padding},${height}`}
        fill={`url(#spark-fill-${color.replace('#', '')})`}
      />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Trend Badge ──

const TREND_CONFIG: Record<TrendDirection, { icon: string; color: string; bg: string }> = {
  up: { icon: '↑', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  down: { icon: '↓', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  flat: { icon: '→', color: '#A1A1AE', bg: 'rgba(161,161,174,0.08)' },
};

export function TrendBadge({
  trend,
  delta,
  className = '',
}: {
  trend: TrendDirection;
  delta?: number;
  className?: string;
}) {
  const cfg = TREND_CONFIG[trend];
  return (
    <span
      className={`badge-pill ${className}`}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="text-xs">{cfg.icon}</span>
      {delta !== undefined && <span className="font-mono text-[11px]">{delta > 0 ? '+' : ''}{delta}%</span>}
    </span>
  );
}

// ── Risk Badge ──

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; dotColor: string; bg: string }> = {
  low: { label: 'Low Risk', color: '#22C55E', dotColor: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  medium: { label: 'Medium', color: '#EAB308', dotColor: '#EAB308', bg: 'rgba(234,179,8,0.08)' },
  high: { label: 'High Risk', color: '#10b37d', dotColor: '#10b37d', bg: 'rgba(16,179,125,0.08)' },
  critical: { label: 'Critical', color: '#EF4444', dotColor: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
};

export function RiskBadge({
  level,
  className = '',
}: {
  level: RiskLevel;
  className?: string;
}) {
  const cfg = RISK_CONFIG[level];
  return (
    <span className={`badge-pill ${className}`} style={{ color: cfg.color, background: cfg.bg }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dotColor }} />
      {cfg.label}
    </span>
  );
}

// ── Score Display (large KPI number) ──

export function ScoreDisplay({
  value,
  size = 'lg',
  color,
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };
  const resolvedColor = color ?? (value >= 85 ? '#22C55E' : value >= 70 ? '#10b37d' : '#EF4444');
  return (
    <span className={`font-mono font-bold ${sizes[size]}`} style={{ color: resolvedColor }}>
      {value}
    </span>
  );
}

// ── Time Range Selector ──

export function TimeRangeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (range: string) => void;
}) {
  const ranges = [
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: '6m', label: '6M' },
    { key: '1y', label: '1Y' },
  ];
  return (
    <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/[0.04]">
      {ranges.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-fast ${
            value === r.key
              ? 'bg-[rgba(13,140,99,0.12)] text-[#10b37d] shadow-[inset_0_0_0_1px_rgba(13,140,99,0.15)]'
              : 'text-obsidian-400 hover:text-obsidian-200 hover:bg-white/[0.03]'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

// ── Entity Score Card ──

export function EntityScoreCard({
  label,
  value,
  icon,
  trend,
  delta,
  visual,
  className = '',
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: TrendDirection;
  delta?: number;
  visual?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`widget p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-obsidian-400">{icon}</span>}
            <span className="text-[11px] font-semibold uppercase tracking-widest text-obsidian-400">{label}</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-mono text-3xl font-bold text-obsidian-50">{value}</span>
            {trend && <TrendBadge trend={trend} delta={delta} />}
          </div>
        </div>
        {visual && <div className="flex-shrink-0">{visual}</div>}
      </div>
    </div>
  );
}

// ── Simple Data Table ──

export function DataTable<T extends object>({
  columns,
  data,
  onRowClick,
}: {
  columns: { key: string; label: string; mono?: boolean; render?: (row: T) => React.ReactNode }[];
  data: T[];
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.04]">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-obsidian-400">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-white/[0.02] transition-colors duration-fast ${
                onRowClick ? 'cursor-pointer hover:bg-white/[0.02]' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 ${col.mono ? 'font-mono text-obsidian-300' : 'text-obsidian-200'}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Section header ──

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold uppercase tracking-widest text-obsidian-300">{title}</h3>
      {action}
    </div>
  );
}
