'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getManagerList } from '../../lib/entity-intelligence';
import {
  CircularProgress,
  SparkBars,
  TrendBadge,
  RiskBadge,
  EntityScoreCard,
} from '../../components/intelligence/shared';
import { UsersIcon, ArrowRightIcon } from '../../components/icons';

export default function ManagersListPage() {
  const [search, setSearch] = useState('');
  const managers = getManagerList();
  const filtered = managers.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const avgScore = Math.round(managers.reduce((s, m) => s + m.score, 0) / managers.length);

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-overline">Entity Intelligence</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-obsidian-100">Managers</h1>
        <div className="h-0.5 w-16 rounded-full bg-gradient-to-r from-[#0d8c63] to-transparent mt-2" />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp stagger-2">
        <EntityScoreCard label="Total Managers" value={managers.length}
          visual={<SparkBars data={[3, 5, 4, 6, 5, 7, 6]} color="#10b37d" />} />
        <EntityScoreCard label="Avg Effectiveness" value={`${avgScore}%`}
          visual={<CircularProgress value={avgScore} size={48} strokeWidth={4} />} />
        <EntityScoreCard label="High Performers" value={managers.filter((m) => m.score >= 85).length}
          visual={<SparkBars data={[2, 3, 2, 4, 3, 4]} color="#22C55E" />} />
        <EntityScoreCard label="Needs Attention" value={managers.filter((m) => m.riskLevel === 'medium' || m.riskLevel === 'high').length}
          visual={<SparkBars data={[1, 2, 1, 2, 1]} color="#FBBF24" />} />
      </div>

      {/* Search */}
      <div className="widget p-4 animate-fadeInUp stagger-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search managers..."
          className="w-full bg-transparent text-sm text-obsidian-200 placeholder:text-obsidian-500 outline-none"
        />
      </div>

      {/* Manager Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeInUp stagger-4">
        {filtered.map((mgr) => (
          <Link key={mgr.id} href={`/managers/${mgr.id}`} className="glass-interactive p-5 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0d8c63]/20 to-[#10b37d]/10 flex items-center justify-center">
                  <UsersIcon size={18} className="text-[#10b37d]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-obsidian-100 group-hover:text-obsidian-50 transition-colors">{mgr.name}</h3>
                  <p className="text-xs text-obsidian-400 mt-0.5">{mgr.subtitle}</p>
                </div>
              </div>
              <CircularProgress value={mgr.score} size={48} strokeWidth={4}
                color={mgr.score >= 85 ? '#22C55E' : mgr.score >= 70 ? '#10b37d' : '#EF4444'} />
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <TrendBadge trend={mgr.trend} />
                <RiskBadge level={mgr.riskLevel} />
              </div>
              <ArrowRightIcon size={14} className="text-obsidian-500 group-hover:text-[#10b37d] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
