'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getRegionIntelligence } from '../../../lib/entity-intelligence';
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
import { GlobeIcon, StoreIcon, AlertTriangleIcon } from '../../../components/icons';
import type { TrendDirection } from '../../../types/entity-intelligence';

const TREND_COLOR: Record<TrendDirection, string> = { up: '#22C55E', down: '#EF4444', flat: '#A1A1AE' };
const TREND_ARROW: Record<TrendDirection, string> = { up: '↑', down: '↓', flat: '→' };

export default function RegionIntelligencePage({ params }: { params: { id: string } }) {
  const [timeRange, setTimeRange] = useState('90d');
  const data = getRegionIntelligence(params.id);
  const ps = data.performanceScore;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-center gap-2 text-xs text-obsidian-400">
        <Link href="/regions" className="hover:text-obsidian-200 transition-colors">Regions</Link>
        <span>/</span>
        <span className="text-obsidian-200">{data.regionName}</span>
      </div>

      {/* Header */}
      <div className="widget p-4 md:p-7 animate-fadeInUp stagger-1">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0d8c63]/20 to-[#F97316]/10 flex items-center justify-center">
                <GlobeIcon size={20} className="text-[#F97316]" />
              </div>
              <div>
                <span className="text-overline">Region Intelligence</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-obsidian-50">{data.regionName}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge-pill" style={{ color: '#3B82F6', background: 'rgba(59,130,246,0.08)' }}>
                {ps.storeCount} stores
              </span>
              {ps.riskStores > 0 && (
                <span className="badge-pill" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}>
                  <AlertTriangleIcon size={11} /> {ps.riskStores} at risk
                </span>
              )}
              <RiskBadge level={ps.riskLevel} />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <CircularProgress value={ps.overall} size={80} strokeWidth={6}
              color={ps.overall >= 85 ? '#22C55E' : ps.overall >= 70 ? '#F97316' : '#EF4444'} />
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-obsidian-400 mb-1">Regional Score</div>
              <ScoreDisplay value={ps.overall} size="lg" />
              <TrendBadge trend={ps.trend} delta={ps.trendDelta} className="mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp stagger-2">
        <EntityScoreCard label="Total Stores" value={data.stats.totalStores}
          visual={<SparkBars data={[5, 6, 7, 6, 8, 7, 9]} color="#3B82F6" />} />
        <EntityScoreCard label="Avg Score" value={`${data.stats.avgScore}%`}
          visual={<CircularProgress value={data.stats.avgScore} size={48} strokeWidth={4} color="#22C55E" />} />
        <EntityScoreCard label="Open Tasks" value={data.stats.openTaskCount}
          visual={<SparkBars data={[8, 10, 7, 9, 6, 8]} color="#FBBF24" />} />
        <EntityScoreCard label="Submissions" value={data.stats.totalSubmissions}
          visual={<SparkBars data={[30, 35, 28, 40, 38, 42, 36]} color="#F97316" />} />
      </div>

      {/* Trend */}
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

      {/* Top + Risk Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="widget p-6 animate-fadeInUp stagger-4">
          <SectionHeader title="Top Performing Stores" action={
            <span className="badge-pill" style={{ color: '#22C55E', background: 'rgba(34,197,94,0.08)' }}>
              {data.topStores.length} stores
            </span>
          } />
          <div className="space-y-2">
            {data.topStores.map((store, i) => (
              <Link key={store.storeId} href={`/stores/${store.storeId}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all">
                <span className="font-mono text-xs text-obsidian-500 w-5">#{i + 1}</span>
                <StoreIcon size={14} className="text-obsidian-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-obsidian-200 truncate">{store.storeName}</div>
                  <div className="text-xs text-obsidian-400">{store.city}</div>
                </div>
                <span className="font-mono text-sm font-bold text-[#22C55E]">{store.healthScore}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="widget p-6 animate-fadeInUp stagger-4">
          <SectionHeader title="Risk Stores" action={
            data.riskStores.length > 0 ? (
              <span className="badge-pill" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}>
                {data.riskStores.length} at risk
              </span>
            ) : undefined
          } />
          {data.riskStores.length === 0 ? (
            <div className="text-center py-8 text-obsidian-400 text-sm">No stores at risk</div>
          ) : (
            <div className="space-y-2">
              {data.riskStores.map((store) => (
                <Link key={store.storeId} href={`/stores/${store.storeId}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/[0.02] border border-red-500/[0.06] hover:bg-red-500/[0.04] transition-all">
                  <AlertTriangleIcon size={14} className="text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-obsidian-200 truncate">{store.storeName}</div>
                    <div className="text-xs text-obsidian-400">{store.city}</div>
                  </div>
                  <RiskBadge level={store.riskLevel} />
                  <span className="font-mono text-sm font-bold text-red-400">{store.healthScore}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Program Breakdown */}
      <div className="widget p-6 animate-fadeInUp">
        <SectionHeader title="Program Breakdown" />
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
          data={data.programBreakdown}
        />
      </div>

      {/* Comparison */}
      <div className="widget p-6 animate-fadeInUp">
        <SectionHeader title="Regional Comparison" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.comparison.map((entry) => (
            <Link key={entry.entityId} href={`/regions/${entry.entityId}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all">
              <span className="font-mono text-xs text-obsidian-500 w-5">#{entry.rank}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-obsidian-200 truncate">{entry.entityName}</span>
              </div>
              <span className="font-mono text-sm font-bold" style={{ color: entry.score >= 85 ? '#22C55E' : entry.score >= 70 ? '#F97316' : '#EF4444' }}>
                {entry.score}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
