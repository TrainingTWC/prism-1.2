'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getProgramIntelligence } from '../../../lib/entity-intelligence';
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
import { ClipboardListIcon, StoreIcon, GlobeIcon, ArrowRightIcon } from '../../../components/icons';

export default function ProgramIntelligencePage({ params }: { params: { id: string } }) {
  const [timeRange, setTimeRange] = useState('90d');
  const data = getProgramIntelligence(params.id);
  const m = data.metrics;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-center gap-2 text-xs text-obsidian-400">
        <Link href="/programs" className="hover:text-obsidian-200 transition-colors">Programs</Link>
        <span>/</span>
        <span className="text-obsidian-200">{data.programName}</span>
      </div>

      {/* Header */}
      <div className="widget p-4 md:p-7 animate-fadeInUp stagger-1">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0d8c63]/20 to-[#F97316]/10 flex items-center justify-center">
                <ClipboardListIcon size={20} className="text-[#F97316]" />
              </div>
              <div>
                <span className="text-overline">Program Intelligence</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-obsidian-50">{data.programName}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge-pill" style={{ color: '#3B82F6', background: 'rgba(59,130,246,0.08)' }}>
                {data.type}
              </span>
              <span className="badge-pill" style={{ color: '#A1A1AE', background: 'rgba(161,161,174,0.08)' }}>
                {data.department}
              </span>
              <RiskBadge level={m.riskLevel} />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <CircularProgress value={m.overall} size={80} strokeWidth={6}
              color={m.overall >= 85 ? '#22C55E' : m.overall >= 70 ? '#F97316' : '#EF4444'} />
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-obsidian-400 mb-1">Performance</div>
              <ScoreDisplay value={m.overall} size="lg" />
              <TrendBadge trend={m.trend} delta={m.trendDelta} className="mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp stagger-2">
        <EntityScoreCard label="Avg Score" value={`${m.avgScore}%`}
          visual={<CircularProgress value={m.avgScore} size={48} strokeWidth={4} color="#22C55E" />} />
        <EntityScoreCard label="Completion Rate" value={`${m.completionRate}%`}
          visual={<CircularProgress value={m.completionRate} size={48} strokeWidth={4} color="#3B82F6" />} />
        <EntityScoreCard label="Total Submissions" value={m.totalSubmissions}
          visual={<SparkBars data={[20, 25, 22, 28, 30, 27, 33]} color="#F97316" />} />
        <EntityScoreCard label="Active Stores" value={data.stats.uniqueStores}
          visual={<SparkBars data={[5, 6, 6, 7, 7, 8]} color="#8B5CF6" />} />
      </div>

      {/* Performance Trend */}
      <div className="widget p-6 animate-fadeInUp stagger-3">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader title="Performance Trend" />
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
        <div className="flex flex-col gap-4">
          {data.performanceTrend.map((series, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-28 text-xs text-obsidian-400 truncate">{series.label}</span>
              <div className="flex-1">
                <Sparkline data={series.data} color={series.color ?? '#F97316'} width={600} height={40} />
              </div>
              <span className="font-mono text-sm text-obsidian-200 w-12 text-right">
                {series.data[series.data.length - 1]?.value.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Store + Region Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Comparison */}
        <div className="widget p-6 animate-fadeInUp stagger-4">
          <SectionHeader title="Store Comparison" action={
            <span className="badge-pill text-[10px]" style={{ color: '#3B82F6', background: 'rgba(59,130,246,0.08)' }}>
              {data.storeComparison.length} stores
            </span>
          } />
          <div className="space-y-2">
            {data.storeComparison.map((store) => (
              <Link key={store.storeId} href={`/stores/${store.storeId}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors group">
                <StoreIcon size={14} className="text-obsidian-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-obsidian-200 truncate">{store.storeName}</div>
                  <div className="text-xs text-obsidian-400">{store.submissions} submissions</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${store.score}%`,
                      background: store.score >= 85 ? '#22C55E' : store.score >= 70 ? '#F97316' : '#EF4444',
                    }} />
                  </div>
                  <span className="font-mono text-xs font-bold text-obsidian-200 w-8 text-right">{store.score}</span>
                </div>
                <ArrowRightIcon size={12} className="text-obsidian-600 group-hover:text-[#F97316] transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Region Comparison */}
        <div className="widget p-6 animate-fadeInUp stagger-4">
          <SectionHeader title="Region Comparison" action={
            <span className="badge-pill text-[10px]" style={{ color: '#8B5CF6', background: 'rgba(139,92,246,0.08)' }}>
              {data.regionComparison.length} regions
            </span>
          } />
          <div className="space-y-2">
            {data.regionComparison.map((region) => (
              <Link key={region.regionId} href={`/regions/${region.regionId}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors group">
                <GlobeIcon size={14} className="text-obsidian-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-obsidian-200 truncate">{region.regionName}</div>
                  <div className="text-xs text-obsidian-400">{region.storeCount} stores</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${region.avgScore}%`,
                      background: region.avgScore >= 85 ? '#22C55E' : region.avgScore >= 70 ? '#F97316' : '#EF4444',
                    }} />
                  </div>
                  <span className="font-mono text-xs font-bold text-obsidian-200 w-8 text-right">{region.avgScore}</span>
                </div>
                <ArrowRightIcon size={12} className="text-obsidian-600 group-hover:text-[#F97316] transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="widget p-6 animate-fadeInUp">
        <SectionHeader title="Recent Submissions" action={
          <Link href={`/programs/${params.id}/submissions`} className="text-xs text-[#F97316] font-medium flex items-center gap-1 hover:text-[#34d399] transition-colors">
            View All <ArrowRightIcon size={12} />
          </Link>
        } />
        <DataTable
          columns={[
            { key: 'storeName', label: 'Store' },
            { key: 'submittedBy', label: 'Submitted By' },
            { key: 'score', label: 'Score', mono: true, render: (r) => (
              <span className="font-mono" style={{ color: (r.score as number) >= 85 ? '#22C55E' : (r.score as number) >= 70 ? '#F97316' : '#EF4444' }}>
                {r.score as number}%
              </span>
            )},
            { key: 'submittedAt', label: 'Date', mono: true, render: (r) => (
              <span className="font-mono text-obsidian-400">{new Date(r.submittedAt as string).toLocaleDateString()}</span>
            )},
          ]}
          data={data.recentSubmissions}
        />
      </div>

      {/* Program Comparison */}
      <div className="widget p-6 animate-fadeInUp">
        <SectionHeader title="Program Comparison" />
        <div className="space-y-2">
          {data.comparison.map((entry) => (
            <div key={entry.entityId} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <span className="font-mono text-xs text-obsidian-500 w-5">#{entry.rank}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-obsidian-200 truncate">{entry.entityName}</span>
                  {entry.entityId === params.id && (
                    <span className="badge-pill text-[9px]" style={{ color: '#F97316', background: 'rgba(16,179,125,0.08)' }}>Current</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendBadge trend={entry.trend} />
                <div className="w-20 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${entry.score}%`,
                    background: entry.score >= 85 ? '#22C55E' : entry.score >= 70 ? '#F97316' : '#EF4444',
                  }} />
                </div>
                <span className="font-mono text-xs font-bold text-obsidian-200 w-8 text-right">{entry.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
