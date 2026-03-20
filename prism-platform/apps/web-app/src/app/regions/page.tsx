'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getRegionList } from '../../lib/entity-intelligence';
import {
  CircularProgress,
  SparkBars,
  TrendBadge,
  RiskBadge,
  EntityScoreCard,
} from '../../components/intelligence/shared';
import { GlobeIcon, ArrowRightIcon } from '../../components/icons';

export default function RegionsListPage() {
  const [search, setSearch] = useState('');
  const regions = getRegionList();
  const filtered = regions.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const avgScore = Math.round(regions.reduce((s, r) => s + r.score, 0) / regions.length);

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="space-y-1">
        <span className="text-overline">Entity Intelligence</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-obsidian-100">Regions</h1>
        <div className="h-0.5 w-16 rounded-full bg-gradient-to-r from-[#0d8c63] to-transparent mt-2" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp stagger-2">
        <EntityScoreCard label="Total Regions" value={regions.length}
          visual={<SparkBars data={[4, 5, 5, 4, 5]} color="#10b37d" />} />
        <EntityScoreCard label="Avg Performance" value={`${avgScore}%`}
          visual={<CircularProgress value={avgScore} size={48} strokeWidth={4} />} />
        <EntityScoreCard label="At Risk" value={regions.filter((r) => r.riskLevel === 'medium' || r.riskLevel === 'high').length}
          visual={<SparkBars data={[1, 2, 1, 2]} color="#FBBF24" />} />
        <EntityScoreCard label="Top Performer" value={regions.sort((a, b) => b.score - a.score)[0]?.name ?? '—'} />
      </div>

      <div className="widget p-4 animate-fadeInUp stagger-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search regions..." className="w-full bg-transparent text-sm text-obsidian-200 placeholder:text-obsidian-500 outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeInUp stagger-4">
        {filtered.map((region) => (
          <Link key={region.id} href={`/regions/${region.id}`} className="glass-interactive p-5 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0d8c63]/20 to-[#10b37d]/10 flex items-center justify-center">
                  <GlobeIcon size={18} className="text-[#10b37d]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-obsidian-100 group-hover:text-obsidian-50 transition-colors">{region.name}</h3>
                  <p className="text-xs text-obsidian-400 mt-0.5">{region.subtitle}</p>
                </div>
              </div>
              <CircularProgress value={region.score} size={48} strokeWidth={4}
                color={region.score >= 85 ? '#22C55E' : region.score >= 70 ? '#10b37d' : '#EF4444'} />
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <TrendBadge trend={region.trend} />
                <RiskBadge level={region.riskLevel} />
              </div>
              <ArrowRightIcon size={14} className="text-obsidian-500 group-hover:text-[#10b37d] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
