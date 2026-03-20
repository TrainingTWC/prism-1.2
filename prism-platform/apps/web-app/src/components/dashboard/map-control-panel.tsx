'use client';

import React, { useMemo } from 'react';
import type { MapScope, ScopeData, EmployeeData, StoreScore } from '@/hooks/use-map-analytics';
import type { MapStore } from '@/hooks/use-store-map-data';

/* ── Score color scale ── */
function scoreColor(score: number | null): string {
  if (score == null) return '#6B7280';
  if (score >= 85) return '#22C55E';
  if (score >= 70) return '#EAB308';
  if (score >= 50) return '#F97316';
  return '#EF4444';
}

export interface DrillBreadcrumb {
  label: string;
  scope: MapScope;
  scopeValue?: string;
}

export interface MapFilters {
  region: string;
  am: string;
  trainer: string;
  store: string;
}

interface MapControlPanelProps {
  breadcrumbs: DrillBreadcrumb[];
  onBreadcrumbClick: (crumb: DrillBreadcrumb) => void;
  scopeData: ScopeData | null;
  employeeData: EmployeeData | null;
  loading: boolean;
  totalStores: number;
  stores: MapStore[];
  storeScores: StoreScore[];
  filters: MapFilters;
  onFilterChange: (filters: MapFilters) => void;
}

export function MapControlPanel({
  breadcrumbs,
  onBreadcrumbClick,
  scopeData,
  employeeData,
  loading,
  totalStores,
  stores,
  storeScores,
  filters,
  onFilterChange,
}: MapControlPanelProps) {
  /* ── Build filter options from stores ── */
  const regionOptions = useMemo(() => Array.from(new Set(stores.map(s => s.region?.name).filter(Boolean) as string[])).sort(), [stores]);
  const amOptions = useMemo(() => {
    let filtered = stores;
    if (filters.region) filtered = filtered.filter(s => s.region?.name === filters.region);
    return Array.from(new Set(filtered.map(s => s.amName).filter(Boolean) as string[])).sort();
  }, [stores, filters.region]);
  const trainerOptions = useMemo(() => {
    let filtered = stores;
    if (filters.region) filtered = filtered.filter(s => s.region?.name === filters.region);
    if (filters.am) filtered = filtered.filter(s => s.amName === filters.am);
    return Array.from(new Set(filtered.map(s => s.trainer1Name).filter(Boolean) as string[])).sort();
  }, [stores, filters.region, filters.am]);
  const storeOptions = useMemo(() => {
    let filtered = stores;
    if (filters.region) filtered = filtered.filter(s => s.region?.name === filters.region);
    if (filters.am) filtered = filtered.filter(s => s.amName === filters.am);
    if (filters.trainer) filtered = filtered.filter(s => s.trainer1Name === filters.trainer);
    return filtered.map(s => ({ id: s.id, label: `${s.storeCode} — ${s.storeName}` })).sort((a, b) => a.label.localeCompare(b.label));
  }, [stores, filters.region, filters.am, filters.trainer]);

  /* ── AI Insights (computed from storeScores + scopeData) ── */
  const insights = useMemo(() => {
    const result: { icon: string; text: string; severity: 'info' | 'warn' | 'success' | 'danger' }[] = [];
    if (!storeScores.length && !scopeData) return result;

    // Score-based insights
    const scored = storeScores.filter(s => s.avgScore != null);
    if (scored.length > 0) {
      const avg = scored.reduce((a, b) => a + b.avgScore!, 0) / scored.length;
      const belowThreshold = scored.filter(s => s.avgScore! < 50);
      const excellent = scored.filter(s => s.avgScore! >= 85);

      if (belowThreshold.length > 0) {
        result.push({
          icon: '⚠',
          text: `${belowThreshold.length} store${belowThreshold.length > 1 ? 's' : ''} scoring below 50% — needs immediate attention`,
          severity: 'danger',
        });
      }
      if (excellent.length > 0) {
        result.push({
          icon: '★',
          text: `${excellent.length} store${excellent.length > 1 ? 's' : ''} scoring 85%+ — top performers`,
          severity: 'success',
        });
      }

      // Regional disparity
      const byRegion = new Map<string, number[]>();
      scored.forEach(s => {
        const r = s.regionName || 'Unknown';
        if (!byRegion.has(r)) byRegion.set(r, []);
        byRegion.get(r)!.push(s.avgScore!);
      });
      const regAvgs = Array.from(byRegion.entries()).map(([r, scores]) => ({
        region: r,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
      }));
      if (regAvgs.length >= 2) {
        const sorted = [...regAvgs].sort((a, b) => a.avg - b.avg);
        const gap = sorted[sorted.length - 1].avg - sorted[0].avg;
        if (gap > 15) {
          result.push({
            icon: '↕',
            text: `${gap.toFixed(0)}% gap between ${sorted[sorted.length - 1].region} (${sorted[sorted.length - 1].avg.toFixed(0)}%) and ${sorted[0].region} (${sorted[0].avg.toFixed(0)}%)`,
            severity: 'warn',
          });
        }
      }

      // Trainer performance variance
      const byTrainer = new Map<string, number[]>();
      scored.filter(s => s.trainerName).forEach(s => {
        if (!byTrainer.has(s.trainerName!)) byTrainer.set(s.trainerName!, []);
        byTrainer.get(s.trainerName!)!.push(s.avgScore!);
      });
      const trainerAvgs = Array.from(byTrainer.entries()).map(([t, scores]) => ({
        trainer: t,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length,
      })).filter(t => t.count >= 3);
      if (trainerAvgs.length >= 2) {
        const best = trainerAvgs.reduce((a, b) => a.avg > b.avg ? a : b);
        const worst = trainerAvgs.reduce((a, b) => a.avg < b.avg ? a : b);
        if (best.avg - worst.avg > 10) {
          result.push({
            icon: '👤',
            text: `Trainer variance: ${best.trainer} (${best.avg.toFixed(0)}%) vs ${worst.trainer} (${worst.avg.toFixed(0)}%)`,
            severity: 'info',
          });
        }
      }

      // Stores without submissions
      const scoredIds = new Set(scored.map(s => s.storeId));
      const unscored = stores.filter(s => !scoredIds.has(s.id)).length;
      if (unscored > 0) {
        result.push({
          icon: '○',
          text: `${unscored} store${unscored > 1 ? 's' : ''} with no audit submissions yet`,
          severity: 'info',
        });
      }

      // Overall average
      result.push({
        icon: '◉',
        text: `Overall average: ${avg.toFixed(1)}% across ${scored.length} stores`,
        severity: avg >= 70 ? 'success' : avg >= 50 ? 'warn' : 'danger',
      });
    }

    // Program insights from scopeData
    if (scopeData && scopeData.programs.length >= 2) {
      const sorted = [...scopeData.programs].sort((a, b) => a.avgScore - b.avgScore);
      const weakest = sorted[0];
      if (weakest.avgScore < 70) {
        result.push({
          icon: '▼',
          text: `${weakest.programName} has the lowest score (${weakest.avgScore.toFixed(1)}%) — review needed`,
          severity: 'warn',
        });
      }
    }

    return result;
  }, [storeScores, scopeData, stores]);

  const hasActiveFilters = filters.region || filters.am || filters.trainer || filters.store;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-[var(--border-subtle)]">
        <h2 className="text-sm font-bold text-[var(--text-primary)] font-mono">Map Analytics</h2>
        <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
          Filter and drill down into store performance
        </p>
      </div>

      {/* ── Breadcrumbs ── */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-1 flex-wrap">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[10px] text-[var(--text-muted)] font-mono">›</span>}
              <button
                onClick={() => onBreadcrumbClick(crumb)}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                  i === breadcrumbs.length - 1
                    ? 'text-[var(--accent)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* ── Filters ── */}
        <div>
          <div className="flex items-center justify-between">
            <SectionLabel>Filters</SectionLabel>
            {hasActiveFilters && (
              <button
                onClick={() => onFilterChange({ region: '', am: '', trainer: '', store: '' })}
                className="text-[9px] font-mono text-[var(--accent)] hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="mt-2 space-y-2">
            <FilterSelect
              label="Region"
              value={filters.region}
              options={regionOptions}
              onChange={v => onFilterChange({ ...filters, region: v, am: '', trainer: '', store: '' })}
            />
            <FilterSelect
              label="AM"
              value={filters.am}
              options={amOptions}
              onChange={v => onFilterChange({ ...filters, am: v, trainer: '', store: '' })}
            />
            <FilterSelect
              label="Trainer"
              value={filters.trainer}
              options={trainerOptions}
              onChange={v => onFilterChange({ ...filters, trainer: v, store: '' })}
            />
            <FilterSelect
              label="Store"
              value={filters.store}
              options={storeOptions.map(s => s.label)}
              values={storeOptions.map(s => s.id)}
              onChange={v => onFilterChange({ ...filters, store: v })}
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-4 justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <span className="text-[10px] text-[var(--text-muted)] font-mono">Loading…</span>
          </div>
        )}

        {/* ── Top stat cards ── */}
        {scopeData && (
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Avg Score"
              value={scopeData.overallAvgScore != null ? `${scopeData.overallAvgScore.toFixed(1)}%` : '—'}
              color={scoreColor(scopeData.overallAvgScore)}
            />
            <StatCard label="Submissions" value={String(scopeData.totalSubmissions)} color="#3B82F6" />
            <StatCard label="Stores" value={String(totalStores)} color="#A855F7" />
            <StatCard
              label="Employees"
              value={employeeData ? String(employeeData.total) : '—'}
              color="#EAB308"
            />
          </div>
        )}

        {/* ── AI Insights ── */}
        {insights.length > 0 && (
          <div>
            <SectionLabel>AI Insights</SectionLabel>
            <div className="mt-2 space-y-1.5">
              {insights.map((insight, i) => (
                <InsightCard key={i} icon={insight.icon} text={insight.text} severity={insight.severity} />
              ))}
            </div>
          </div>
        )}

        {/* ── Program scores ── */}
        {scopeData && scopeData.programs.length > 0 && (
          <div>
            <SectionLabel>Program Scores</SectionLabel>
            <div className="space-y-2 mt-2">
              {scopeData.programs.map(p => (
                <ProgramCard key={p.programId} program={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── Employee breakdown ── */}
        {employeeData && employeeData.byDesignation.length > 0 && (
          <div>
            <SectionLabel>Employee Breakdown</SectionLabel>
            <div className="mt-2 space-y-1">
              {employeeData.byDesignation.map(d => (
                <div key={d.designation} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate flex-1">
                    {d.designation}
                  </span>
                  <span className="text-[10px] text-[var(--text-primary)] font-mono font-bold tabular-nums">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Score legend ── */}
        <div>
          <SectionLabel>Score Legend</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {[
              { label: '≥ 85%', color: '#22C55E' },
              { label: '≥ 70%', color: '#EAB308' },
              { label: '≥ 50%', color: '#F97316' },
              { label: '< 50%', color: '#EF4444' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--card-bg)] p-2.5">
      <p className="text-[10px] text-[var(--text-muted)] font-mono">{label}</p>
      <p className="text-lg font-bold font-mono mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-[var(--text-muted)] font-mono uppercase tracking-wider">
      {children}
    </p>
  );
}

function ProgramCard({ program }: { program: ScopeData['programs'][0] }) {
  const sc = scoreColor(program.avgScore);
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--card-bg)] p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-[var(--text-primary)] font-mono truncate">
            {program.programName}
          </p>
          {program.department && (
            <p className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">{program.department}</p>
          )}
        </div>
        <span className="text-sm font-bold font-mono flex-shrink-0" style={{ color: sc }}>
          {program.avgScore.toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-[9px] text-[var(--text-tertiary)] font-mono">
          {program.totalSubmissions} submissions
        </span>
        <span className="text-[9px] text-[var(--text-tertiary)] font-mono">
          {program.storeCount} stores
        </span>
      </div>
      {/* Score bar */}
      <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(program.avgScore, 100)}%`, backgroundColor: sc }}
        />
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, values, onChange }: {
  label: string;
  value: string;
  options: string[];
  values?: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-wider block mb-0.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-[11px] font-mono rounded-md border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-primary)] px-2 py-1.5 outline-none focus:border-[var(--accent)] transition-colors appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236B7280'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
      >
        <option value="">All {label}s</option>
        {options.map((opt, i) => (
          <option key={opt} value={values ? values[i] : opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function InsightCard({ icon, text, severity }: { icon: string; text: string; severity: 'info' | 'warn' | 'success' | 'danger' }) {
  const borderColors = {
    info: 'border-blue-500/30',
    warn: 'border-yellow-500/30',
    success: 'border-emerald-500/30',
    danger: 'border-red-500/30',
  };
  const bgColors = {
    info: 'bg-blue-500/5',
    warn: 'bg-yellow-500/5',
    success: 'bg-emerald-500/5',
    danger: 'bg-red-500/5',
  };
  return (
    <div className={`rounded-lg border ${borderColors[severity]} ${bgColors[severity]} px-2.5 py-2 flex gap-2 items-start`}>
      <span className="text-xs flex-shrink-0 mt-px">{icon}</span>
      <span className="text-[10px] text-[var(--text-secondary)] font-mono leading-relaxed">{text}</span>
    </div>
  );
}
