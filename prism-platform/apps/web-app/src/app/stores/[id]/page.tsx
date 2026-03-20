'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchStoreIntelligence } from '../../../lib/entity-api';
import {
  CircularProgress,
  SparkBars,
  Sparkline,
  TrendBadge,
  RiskBadge,
  ScoreDisplay,
  TimeRangeSelector,
  EntityScoreCard,
  DataTable,
  SectionHeader,
} from '../../../components/intelligence/shared';
import { StoreIcon, MapPinIcon, UserIcon, AlertTriangleIcon, ArrowRightIcon, ImageIcon } from '../../../components/icons';
import type { StoreIntelligence, TrendDirection, TimeRange } from '../../../types/entity-intelligence';

// ── Status color configs ──
const TASK_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)' },
  in_progress: { label: 'In Progress', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  completed: { label: 'Done', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  overdue: { label: 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
};

const PRIORITY: Record<string, { color: string }> = {
  low: { color: '#A1A1AE' },
  medium: { color: '#FBBF24' },
  high: { color: '#F97316' },
  critical: { color: '#EF4444' },
};

const TREND_ARROW: Record<TrendDirection, string> = { up: '↑', down: '↓', flat: '→' };
const TREND_COLOR: Record<TrendDirection, string> = { up: '#22C55E', down: '#EF4444', flat: '#A1A1AE' };

// ── Loading skeleton ──
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className}`} />;
}

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-56 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function StoreIntelligencePage({ params }: { params: { id: string } }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const [data, setData] = useState<StoreIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStoreIntelligence(params.id, timeRange);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load store intelligence');
    } finally {
      setLoading(false);
    }
  }, [params.id, timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <PageSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangleIcon size={24} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-obsidian-100">Failed to load intelligence</h2>
        <p className="text-sm text-obsidian-400">{error}</p>
        <button onClick={loadData} className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.06] text-sm text-obsidian-200 hover:bg-white/[0.10] transition-colors">
          Retry
        </button>
      </div>
    );
  }
  if (!data) return null;

  const hs = data.healthScore;

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-obsidian-400">
        <Link href="/stores" className="hover:text-obsidian-200 transition-colors">Stores</Link>
        <span>/</span>
        <span className="text-obsidian-200">{data.storeName}</span>
      </div>

      {/* ── Header Widget ── */}
      <div className="widget p-4 md:p-7 animate-fadeInUp stagger-1">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0d8c63]/20 to-[#F97316]/10 flex items-center justify-center">
                <StoreIcon size={20} className="text-[#F97316]" />
              </div>
              <div>
                <span className="text-overline">Store Intelligence</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-obsidian-50">{data.storeName}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge-pill" style={{ color: '#A1A1AE', background: 'rgba(161,161,174,0.08)' }}>
                <MapPinIcon size={12} /> {data.city}, {data.region}
              </span>
              {data.managerName && (
                <span className="badge-pill" style={{ color: '#A1A1AE', background: 'rgba(161,161,174,0.08)' }}>
                  <UserIcon size={12} /> {data.managerName}
                </span>
              )}
              {data.storeCode && (
                <span className="badge-pill" style={{ color: '#A1A1AE', background: 'rgba(161,161,174,0.08)' }}>
                  {data.storeCode}
                </span>
              )}
              <RiskBadge level={hs.riskLevel} />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <CircularProgress value={hs.overall} size={80} strokeWidth={6} color={hs.overall >= 85 ? '#22C55E' : hs.overall >= 70 ? '#F97316' : '#EF4444'} />
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-obsidian-400 mb-1">Health Score</div>
              <ScoreDisplay value={hs.overall} size="lg" />
              <TrendBadge trend={hs.trend} delta={hs.trendDelta} className="mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp stagger-2">
        <EntityScoreCard label="Total Submissions" value={data.stats.totalSubmissions}
          visual={<SparkBars data={[4, 6, 5, 8, 7, 9, 6, 8, 10, 7, 9, 11]} color="#F97316" />} />
        <EntityScoreCard label="This Month" value={data.stats.thisMonth}
          visual={<SparkBars data={[2, 3, 4, 2, 5, 3, 4, 6]} color="#3B82F6" />} />
        <EntityScoreCard label="Open Tasks" value={data.stats.openTaskCount}
          visual={<CircularProgress value={100 - (data.stats.overdueTaskCount / Math.max(data.stats.openTaskCount, 1)) * 100} size={48} strokeWidth={4} color="#FBBF24" />} />
        <EntityScoreCard label="Avg Score" value={`${data.stats.avgScore}%`}
          trend={hs.trend} delta={hs.trendDelta} />
      </div>

      {/* ── Time Range + Trend Chart ── */}
      <div className="widget p-6 animate-fadeInUp stagger-3">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader title="Performance Trend" />
          <TimeRangeSelector value={timeRange} onChange={(v) => setTimeRange(v as TimeRange)} />
        </div>
        <div className="flex flex-col gap-4">
          {data.performanceTrend.map((series, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-24 text-xs text-obsidian-400 truncate">{series.label}</span>
              <div className="flex-1">
                <Sparkline data={series.data} color={series.color ?? '#F97316'} width={600} height={40} />
              </div>
              <span className="font-mono text-sm text-obsidian-200 w-12 text-right">
                {series.data[series.data.length - 1]?.value.toFixed(0)}
              </span>
            </div>
          ))}
          {data.performanceTrend.length === 0 && (
            <div className="text-center py-8 text-obsidian-400 text-sm">No trend data available for this period</div>
          )}
        </div>
      </div>

      {/* ── Score Breakdown + Program Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Breakdown */}
        <div className="widget p-6 animate-fadeInUp stagger-4">
          <SectionHeader title="Health Score Breakdown" />
          <div className="space-y-4">
            {hs.breakdown.map((b) => (
              <div key={b.programId}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-obsidian-200">{b.programName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-obsidian-100">{b.score}</span>
                    <span className="text-xs" style={{ color: TREND_COLOR[b.trend] }}>{TREND_ARROW[b.trend]}</span>
                    <span className="text-[10px] text-obsidian-500 font-mono">{(b.weight * 100).toFixed(0)}%w</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-slow"
                    style={{
                      width: `${b.score}%`,
                      background: b.score >= 85 ? 'linear-gradient(90deg, #22C55E, #4ADE80)' : b.score >= 70 ? 'linear-gradient(90deg, #0d8c63, #F97316)' : 'linear-gradient(90deg, #EF4444, #F87171)',
                    }} />
                </div>
              </div>
            ))}
            {hs.breakdown.length === 0 && (
              <div className="text-center py-6 text-obsidian-400 text-sm">No program data available</div>
            )}
          </div>
        </div>

        {/* Program Performance Table */}
        <div className="widget p-6 animate-fadeInUp stagger-4">
          <SectionHeader title="Program Performance" />
          <DataTable
            columns={[
              { key: 'programName', label: 'Program' },
              { key: 'score', label: 'Score', mono: true, render: (r) => (
                <span className="font-mono" style={{ color: (r.score as number) >= 85 ? '#22C55E' : (r.score as number) >= 70 ? '#F97316' : '#EF4444' }}>
                  {r.score as number}
                </span>
              )},
              { key: 'trend', label: 'Trend', render: (r) => (
                <span style={{ color: TREND_COLOR[r.trend as TrendDirection] }}>{TREND_ARROW[r.trend as TrendDirection]}</span>
              )},
              { key: 'totalSubmissions', label: 'Submissions', mono: true },
            ]}
            data={data.programPerformance}
          />
        </div>
      </div>

      {/* ── Recent Submissions ── */}
      <div className="widget p-6 animate-fadeInUp stagger-5">
        <SectionHeader title="Recent Submissions" action={
          <Link href={`/stores/${params.id}/submissions`} className="text-xs text-[#F97316] hover:text-[#34d399] transition-colors font-medium flex items-center gap-1">
            View All <ArrowRightIcon size={12} />
          </Link>
        } />
        <DataTable
          columns={[
            { key: 'programName', label: 'Program' },
            { key: 'submittedBy', label: 'Auditor' },
            { key: 'score', label: 'Score', mono: true, render: (r) => (
              <span className="font-mono" style={{ color: (r.score as number) >= 85 ? '#22C55E' : (r.score as number) >= 70 ? '#F97316' : '#EF4444' }}>
                {r.score as number}%
              </span>
            )},
            { key: 'submittedAt', label: 'Date', mono: true, render: (r) => (
              <span className="font-mono text-obsidian-400">{new Date(r.submittedAt as string).toLocaleDateString()}</span>
            )},
            { key: 'status', label: 'Status', render: (r) => {
              const s = r.status as string;
              const cfg = { reviewed: { label: 'Reviewed', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' }, submitted: { label: 'Submitted', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' }, pending: { label: 'Pending', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)' } };
              const c = cfg[s as keyof typeof cfg] ?? cfg.pending;
              return <span className="badge-pill" style={{ color: c.color, background: c.bg }}>{c.label}</span>;
            }},
          ]}
          data={data.recentSubmissions}
        />
      </div>

      {/* ── Open Tasks + Recurring Issues ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Tasks */}
        <div className="widget p-6 animate-fadeInUp">
          <SectionHeader title="Open Tasks" action={
            <span className="badge-pill" style={{ color: '#FBBF24', background: 'rgba(251,191,36,0.08)' }}>
              {data.openTasks.filter((t) => t.status !== 'completed').length} active
            </span>
          } />
          <div className="space-y-2">
            {data.openTasks.filter((t) => t.status !== 'completed').map((task) => {
              const statusCfg = TASK_STATUS[task.status] ?? TASK_STATUS.open;
              return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: PRIORITY[task.priority]?.color ?? '#A1A1AE' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-obsidian-200 truncate">{task.title}</div>
                    <div className="text-xs text-obsidian-400 flex items-center gap-2 mt-0.5">
                      <span>{task.assignedTo}</span>
                      <span>·</span>
                      <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="badge-pill text-[10px]" style={{ color: statusCfg.color, background: statusCfg.bg }}>{statusCfg.label}</span>
                </div>
              );
            })}
            {data.openTasks.length === 0 && (
              <div className="text-center py-6 text-obsidian-400 text-sm">No open tasks</div>
            )}
          </div>
        </div>

        {/* Recurring Issues */}
        <div className="widget p-6 animate-fadeInUp">
          <SectionHeader title="Recurring Issues" action={
            <span className="badge-pill" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}>
              {data.recurringIssues.length} tracked
            </span>
          } />
          <div className="space-y-2">
            {data.recurringIssues.map((issue) => {
              const sevColor = { low: '#A1A1AE', medium: '#FBBF24', high: '#F97316', critical: '#EF4444' }[issue.severity];
              return (
                <div key={issue.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <span style={{ color: sevColor }}><AlertTriangleIcon size={14} className="flex-shrink-0" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-obsidian-200 truncate">{issue.description}</div>
                    <div className="text-xs text-obsidian-400 mt-0.5">{issue.category} · {issue.frequency} occurrences</div>
                  </div>
                  <span className="badge-pill text-[10px]" style={{ color: sevColor, background: `${sevColor}14` }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: sevColor }} />
                    {issue.severity}
                  </span>
                </div>
              );
            })}
            {data.recurringIssues.length === 0 && (
              <div className="text-center py-6 text-obsidian-400 text-sm">No recurring issues detected</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Evidence Gallery ── */}
      <div className="widget p-6 animate-fadeInUp">
        <SectionHeader title="Evidence Gallery" action={
          <span className="badge-pill" style={{ color: '#A1A1AE', background: 'rgba(161,161,174,0.08)' }}>
            <ImageIcon size={12} /> {data.evidenceGallery.length} photos
          </span>
        } />
        {data.evidenceGallery.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {data.evidenceGallery.map((item) => (
              <button
                key={item.id}
                onClick={() => setLightboxUrl(item.imageUrl)}
                className="group relative aspect-square rounded-xl overflow-hidden border border-white/[0.04] hover:border-[#F97316]/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
              >
                <img
                  src={item.imageUrl}
                  alt={item.caption}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="text-[10px] font-medium text-white truncate">{item.caption}</div>
                    <div className="text-[9px] text-white/60 truncate">{item.programName} · {item.uploadedBy}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/[0.03] flex items-center justify-center">
              <ImageIcon size={20} className="text-obsidian-500" />
            </div>
            <p className="text-sm text-obsidian-400">No evidence photos for this period</p>
          </div>
        )}
      </div>

      {/* ── Lightbox Overlay ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeInUp"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-6 right-6 h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
          <img
            src={lightboxUrl}
            alt="Evidence"
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Comparison ── */}
      <div className="widget p-6 animate-fadeInUp">
        <SectionHeader title="Store Comparison" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.comparison.slice(0, 8).map((entry) => (
            <Link key={entry.entityId} href={`/stores/${entry.entityId}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                entry.entityId === data.storeId
                  ? 'bg-[#F97316]/[0.06] border-[#F97316]/20'
                  : 'bg-white/[0.02] border-white/[0.03] hover:bg-white/[0.04] hover:border-white/[0.06]'
              }`}
            >
              <span className="font-mono text-xs text-obsidian-400 w-5">#{entry.rank}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${entry.entityId === data.storeId ? 'text-[#F97316] font-semibold' : 'text-obsidian-200'}`}>
                  {entry.entityName}
                </div>
              </div>
              <span className="font-mono text-sm font-bold" style={{ color: entry.score >= 85 ? '#22C55E' : entry.score >= 70 ? '#F97316' : '#EF4444' }}>
                {entry.score}
              </span>
            </Link>
          ))}
          {data.comparison.length === 0 && (
            <div className="col-span-full text-center py-6 text-obsidian-400 text-sm">No peer stores for comparison</div>
          )}
        </div>
      </div>
    </div>
  );
}
