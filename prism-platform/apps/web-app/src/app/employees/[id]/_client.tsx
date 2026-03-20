'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getEmployeeIntelligence } from '../../../lib/entity-intelligence';
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
import { UserIcon, StoreIcon, ClipboardListIcon, ArrowRightIcon } from '../../../components/icons';
import type { TrendDirection } from '../../../types/entity-intelligence';

const TREND_COLOR: Record<TrendDirection, string> = { up: '#22C55E', down: '#EF4444', flat: '#A1A1AE' };
const TREND_ARROW: Record<TrendDirection, string> = { up: 'Ôåæ', down: 'Ôåô', flat: 'ÔåÆ' };

const TASK_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)' },
  in_progress: { label: 'In Progress', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  completed: { label: 'Done', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  overdue: { label: 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
};

export default function EmployeeIntelligencePage({ params }: { params: { id: string } }) {
  const [timeRange, setTimeRange] = useState('90d');
  const data = getEmployeeIntelligence(params.id);
  const ps = data.performanceScore;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-center gap-2 text-xs text-obsidian-400">
        <Link href="/employees" className="hover:text-obsidian-200 transition-colors">Employees</Link>
        <span>/</span>
        <span className="text-obsidian-200">{data.employeeName}</span>
      </div>

      {/* Header */}
      <div className="widget p-4 md:p-7 animate-fadeInUp stagger-1">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0d8c63]/20 to-[#F97316]/10 flex items-center justify-center">
                <UserIcon size={20} className="text-[#F97316]" />
              </div>
              <div>
                <span className="text-overline">Employee Intelligence</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-obsidian-50">{data.employeeName}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge-pill" style={{ color: '#A1A1AE', background: 'rgba(161,161,174,0.08)' }}>
                {data.empId}
              </span>
              <span className="badge-pill" style={{ color: '#A1A1AE', background: 'rgba(161,161,174,0.08)' }}>
                {data.designation} ┬À {data.department}
              </span>
              {data.storeName && (
                <span className="badge-pill" style={{ color: '#3B82F6', background: 'rgba(59,130,246,0.08)' }}>
                  <StoreIcon size={11} /> {data.storeName}
                </span>
              )}
              <RiskBadge level={ps.riskLevel} />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <CircularProgress value={ps.overall} size={80} strokeWidth={6}
              color={ps.overall >= 85 ? '#22C55E' : ps.overall >= 70 ? '#F97316' : '#EF4444'} />
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-obsidian-400 mb-1">Performance</div>
              <ScoreDisplay value={ps.overall} size="lg" />
              <TrendBadge trend={ps.trend} delta={ps.trendDelta} className="mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp stagger-2">
        <EntityScoreCard label="Total Submissions" value={data.stats.totalSubmissions}
          visual={<SparkBars data={[5, 7, 6, 8, 9, 7, 10, 8]} color="#F97316" />} />
        <EntityScoreCard label="Avg Score" value={`${data.stats.avgScore}%`}
          visual={<CircularProgress value={data.stats.avgScore} size={48} strokeWidth={4} color="#22C55E" />} />
        <EntityScoreCard label="Tasks Completed" value={data.stats.tasksCompleted}
          visual={<SparkBars data={[3, 4, 5, 4, 6, 5]} color="#22C55E" />} />
        <EntityScoreCard label="Programs Active" value={data.stats.programsActive}
          visual={<SparkBars data={[2, 3, 3, 3]} color="#3B82F6" />} />
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
              <span className="w-24 text-xs text-obsidian-400 truncate">{series.label}</span>
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

      {/* Program Involvement + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="widget p-6 animate-fadeInUp stagger-4">
          <SectionHeader title="Program Involvement" />
          <div className="space-y-3">
            {data.programInvolvement.map((prog) => (
              <div key={prog.programId} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                <ClipboardListIcon size={14} className="text-obsidian-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-obsidian-200">{prog.programName}</div>
                  <div className="text-xs text-obsidian-400">{prog.totalSubmissions} submissions</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold" style={{ color: prog.score >= 85 ? '#22C55E' : prog.score >= 70 ? '#F97316' : '#EF4444' }}>
                    {prog.score}
                  </span>
                  <span className="text-xs" style={{ color: TREND_COLOR[prog.trend] }}>{TREND_ARROW[prog.trend]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="widget p-6 animate-fadeInUp stagger-4">
          <SectionHeader title="Assigned Tasks" action={
            <span className="badge-pill" style={{ color: '#FBBF24', background: 'rgba(251,191,36,0.08)' }}>
              {data.stats.tasksOpen} open
            </span>
          } />
          <div className="space-y-2">
            {data.assignedTasks.map((task) => {
              const statusCfg = TASK_STATUS[task.status] ?? TASK_STATUS.open;
              return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: statusCfg.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-obsidian-200 truncate">{task.title}</div>
                    <div className="text-xs text-obsidian-400 mt-0.5">Due {new Date(task.dueDate).toLocaleDateString()}</div>
                  </div>
                  <span className="badge-pill text-[10px]" style={{ color: statusCfg.color, background: statusCfg.bg }}>{statusCfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submissions */}
      <div className="widget p-6 animate-fadeInUp">
        <SectionHeader title="Recent Submissions" action={
          <Link href={`/employees/${params.id}/submissions`} className="text-xs text-[#F97316] font-medium flex items-center gap-1 hover:text-[#34d399] transition-colors">
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
            { key: 'submittedAt', label: 'Date', mono: true, render: (r) => (
              <span className="font-mono text-obsidian-400">{new Date(r.submittedAt as string).toLocaleDateString()}</span>
            )},
          ]}
          data={data.recentSubmissions}
        />
      </div>

      {/* Comparison */}
      <div className="widget p-6 animate-fadeInUp">
        <SectionHeader title="Peer Comparison" />
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
  );
}