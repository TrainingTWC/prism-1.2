'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { getProgramList } from '../../lib/entity-intelligence';
import {
  CircularProgress,
  SparkBars,
  TrendBadge,
  RiskBadge,
  EntityScoreCard,
} from '../../components/intelligence/shared';
import { ArrowRightIcon } from '../../components/icons';

const TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  Checklist: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  Audit: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  Training: { color: '#10b37d', bg: 'rgba(16,179,125,0.08)' },
  Inspection: { color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  Task: { color: '#FBBF24', bg: 'rgba(251,191,36,0.08)' },
};

export default function ProgramsPage() {
  const [search, setSearch] = useState('');
  const programs = getProgramList();

  const filtered = useMemo(() => {
    if (!search) return programs;
    const q = search.toLowerCase();
    return programs.filter((p) => p.name.toLowerCase().includes(q));
  }, [programs, search]);

  const avgScore = Math.round(programs.reduce((s, p) => s + p.score, 0) / programs.length);
  const highPerformers = programs.filter((p) => p.score >= 85).length;
  const needsAttention = programs.filter((p) => p.riskLevel === 'high' || p.riskLevel === 'critical').length;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <span className="text-overline">Entity Intelligence</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-obsidian-50">Programs</h1>
          <p className="text-sm text-obsidian-400 mt-1">Monitor performance metrics across all operational programs</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#0d8c63] to-[#10b37d] text-white rounded-2xl shadow-lg shadow-[#0d8c63]/20 hover:-translate-y-px active:scale-[0.98] transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          <span className="font-bold text-sm">Create Program</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp stagger-1">
        <EntityScoreCard label="Total Programs" value={programs.length}
          visual={<SparkBars data={[4, 5, 5, 6, 6, 7]} color="#10b37d" />} />
        <EntityScoreCard label="Avg Performance" value={`${avgScore}%`}
          visual={<CircularProgress value={avgScore} size={48} strokeWidth={4} color="#22C55E" />} />
        <EntityScoreCard label="High Performers" value={highPerformers}
          visual={<SparkBars data={[2, 3, 3, 4, 4]} color="#22C55E" />} />
        <EntityScoreCard label="Needs Attention" value={needsAttention}
          visual={<SparkBars data={[1, 2, 1, 2, 3]} color="#EF4444" />} />
      </div>

      {/* Search */}
      <div className="widget p-4 animate-fadeInUp stagger-2">
        <input
          type="text"
          placeholder="Search programs by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-obsidian-200 placeholder-obsidian-500 outline-none"
        />
      </div>

      {/* Program Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fadeInUp stagger-3">
        {filtered.map((program) => {
          const typeCfg = TYPE_COLOR[program.subtitle ?? ''] ?? TYPE_COLOR.Task;
          return (
            <Link key={program.id} href={`/programs/${program.id}`}
              className="widget p-5 group hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CircularProgress value={program.score} size={44} strokeWidth={4}
                    color={program.score >= 85 ? '#22C55E' : program.score >= 70 ? '#10b37d' : '#EF4444'} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-obsidian-100 truncate">{program.name}</div>
                    {program.subtitle && (
                      <span className="badge-pill text-[10px] mt-1" style={{ color: typeCfg.color, background: typeCfg.bg }}>{program.subtitle}</span>
                    )}
                  </div>
                </div>
                <ArrowRightIcon size={14} className="text-obsidian-600 group-hover:text-[#10b37d] transition-colors flex-shrink-0 mt-1" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <TrendBadge trend={program.trend} />
                <RiskBadge level={program.riskLevel} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}