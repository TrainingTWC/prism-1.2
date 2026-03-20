'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getManagerIntelligence } from '../../../lib/entity-intelligence';
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
import { UsersIcon, StoreIcon, ArrowRightIcon } from '../../../components/icons';
import type { TrendDirection } from '../../../types/entity-intelligence';

const TREND_COLOR: Record<TrendDirection, string> = { up: '#22C55E', down: '#EF4444', flat: '#A1A1AE' };
const TREND_ARROW: Record<TrendDirection, string> = { up: 'Ôåæ', down: 'Ôåô', flat: 'ÔåÆ' };

export default function ManagerIntelligencePage({ params }: { params: { id: string } }) {
  const [timeRange, setTimeRange] = useState('90d');
  const data = getManagerIntelligence(params.id);
  const es = data.effectivenessScore;

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-obsidian-400">
        <Link href="/managers" className="hover:text-obsidian-200 transition-colors">Managers</Link>
        <span>/</span>
        <span className="text-obsidian-200">{data.managerName}</span>
      </div>

      {/* Header Widget */}
      <div className="widget p-4 md:p-7 animate-fadeInUp stagger-1">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0d8c63]/20 to-[#F97316]/10 flex items-center justify-center">
                <UsersIcon size={20} className="text-[#F97316]" />
              </div>
              <div>
                <span className="text-overline">Manager Intelligence</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-obsidian-50">{data.managerName}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge-pill" style={{ color: '#A1A1AE', background: 'rgba(161,161,174,0.08)' }}>
                {data.designation}
              </span>
              <span className="badge-pill" style={{ color: '#A1A1AE', background: 'rgba(161,161,174,0.08)' }}>
                {data.department}
              </span>
              <span className="badge-pill" style={{ color: '#3B82F6', background: 'rgba(59,130,246,0.08)' }}>
                {es.storesManaged} stores
              </span>
              <RiskBadge level={es.riskLevel} />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <CircularProgress value={es.overall} size={80} strokeWidth={6}
              color={es.overall >= 85 ? '#22C55E' : es.overall >= 70 ? '#F97316' : '#EF4444'} />
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-obsidian-400 mb-1">Effectiveness</div>
              <ScoreDisplay value={es.overall} size="lg" />
              <TrendBadge trend={es.trend} delta={es.trendDelta} className="mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp stagger-2">
        <EntityScoreCard label="Total Stores" value={data.stats.totalStores}
          visual={<SparkBars data={[3, 4, 5, 4, 5]} color="#3B82F6" />} />
        <EntityScoreCard label="Avg Store Health" value={`${data.stats.avgStoreHealth}%`}
          visual={<CircularProgress value={data.stats.avgStoreHealth} size={48} strokeWidth={4} color="#22C55E" />} />
        <EntityScoreCard label="Open Tasks" value={data.stats.openTaskCount}
          visual={<SparkBars data={[5, 8, 6, 7, 4, 6]} color="#FBBF24" />} />
        <EntityScoreCard label="Submissions" value={data.stats.totalSubmissions}
          visual={<SparkBars data={[8, 10, 9, 12, 11, 14, 10]} color="#F97316" />} />
      </div>

      {/* Performance Trend */}
      <div className="widget p-6 animate-fadeInUp stagger-3">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader title="Effectiveness Trend" />
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
        <div className="flex flex-col gap-4">
          {data.performanceTrend.map((series, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-32 text-xs text-obsidian-400 truncate">{series.label}</span>
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

      {/* Store Distribution */}
      <div className="widget p-6 animate-fadeInUp stagger-4">
        <SectionHeader title="Store Distribution" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.stores.map((store) => (
            <Link key={store.storeId} href={`/stores/${store.storeId}`}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] hover:border-white/[0.06] transition-all group">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] flex items-center justify-center">
                <StoreIcon size={16} className="text-obsidian-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-obsidian-200 truncate">{store.storeName}</div>
                <div className="text-xs text-obsidian-400">{store.city} ┬À {store.openTasks} tasks</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold" style={{ color: store.healthScore >= 85 ? '#22C55E' : store.healthScore >= 70 ? '#F97316' : '#EF4444' }}>
                  {store.healthScore}
                </span>
                <span className="text-xs" style={{ color: TREND_COLOR[store.trend] }}>{TREND_ARROW[store.trend]}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Submissions + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="widget p-6 animate-fadeInUp">
          <SectionHeader title="Recent Submissions" action={
            <Link href={`/managers/${params.id}/submissions`} className="text-xs text-[#F97316] font-medium flex items-center gap-1 hover:text-[#34d399] transition-colors">
              View All <ArrowRightIcon size={12} />
            </Link>
          } />
          <DataTable
            columns={[
              { key: 'programName', label: 'Program' },
              { key: 'storeName', label: 'Store' },
              { key: 'score', label: 'Score', mono: true, render: (r) => (
                <span className="font-mono" style={{ color: (r.score as number) >= 85 ? '#22C55E' : (r.score as number) >= 70 ? '#F97316' : '#EF4444' }}>
                  {r.score as number}%
                </span>
              )},
            ]}
            data={data.recentSubmissions.slice(0, 5)}
          />
        </div>

        <div className="widget p-6 animate-fadeInUp">
          <SectionHeader title="Comparison" />
          <div className="space-y-2">
            {data.comparison.map((entry) => (
              <div key={entry.entityId} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                <span className="font-mono text-xs text-obsidian-500 w-5">#{entry.rank}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-obsidian-200 truncate">{entry.entityName}</span>
                    {entry.entityId === params.id && (
                      <span className="badge-pill text-[9px]" style={{ color: '#F97316', background: 'rgba(16,179,125,0.08)' }}>You</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
    </div>
  );
}