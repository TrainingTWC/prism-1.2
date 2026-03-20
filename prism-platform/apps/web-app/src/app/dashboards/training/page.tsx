'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { DashboardChartPanel, DashboardInfoPanel } from '@/components/dashboard/dashboard-panels';
import { useDashboardData, useFilterOptions } from '@/hooks/use-dashboard-data';
import { ScoreDistributionChart, RankList, SubmissionTable, LoadingBar } from '@/components/dashboard/dashboard-data-widgets';

export default function TrainingDashboardPage() {
    const { data, loading, applyFilters } = useDashboardData('training');
    const filterOptions = useFilterOptions();

    const stats = data ? [
        { label: 'Total Audits', value: data.stats.totalSubmissions.toLocaleString(), color: '#A855F7' },
        { label: 'Unique Stores', value: String(data.stats.uniqueStores), color: '#A855F7' },
        { label: 'Trainers Active', value: String(data.stats.uniqueAuditors), color: '#A855F7' },
        { label: 'Average Score', value: `${data.stats.avgScore}%`, color: '#A855F7' },
    ] : [
        { label: 'Total Audits', value: '—', color: '#A855F7' },
        { label: 'Unique Stores', value: '—', color: '#A855F7' },
        { label: 'Trainers Active', value: '—', color: '#A855F7' },
        { label: 'Average Score', value: '—', color: '#A855F7' },
    ];

    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard"
                title="Training Audits" 
                subtitle="Training audit analytics with multi-month trends and health metrics"
            />

            <DashboardFilters 
                regions={filterOptions.regions}
                stores={filterOptions.stores}
                onFilterChange={applyFilters}
            />
            <DashboardStatCards stats={stats} />

            {loading && <LoadingBar />}

            {/* Monthly Trend */}
            {data && data.monthlyTrend.length > 0 && (
                <DashboardInfoPanel title="Monthly Score Trend">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {data.monthlyTrend.map(t => (
                            <div key={t.month} className="rounded-xl bg-[rgba(168,85,247,0.06)] p-4 border border-[rgba(168,85,247,0.15)] text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7] mb-1">{t.month}</p>
                                <p className="text-xl font-bold font-mono text-obsidian-50">{t.avgScore}%</p>
                                <p className="text-[10px] text-obsidian-400">{t.count} audits</p>
                            </div>
                        ))}
                    </div>
                </DashboardInfoPanel>
            )}

            {/* Store Performance */}
            {data && data.storeScores.length > 0 && (
                <DashboardChartPanel title="Store Performance" subtitle="Average training score per store">
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {data.storeScores.map((s, i) => (
                            <div key={s.storeId} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-obsidian-700/15 border border-obsidian-600/10 hover:bg-obsidian-700/25 transition-colors">
                                <span className="text-xs text-obsidian-500 w-6 text-right font-mono">{i + 1}</span>
                                <span className="text-sm text-obsidian-200 font-medium flex-1 truncate">{s.storeName}</span>
                                <span className="text-[10px] text-obsidian-400">{s.count} audits</span>
                                <div className="w-24 h-2 rounded-full bg-obsidian-700/40 overflow-hidden">
                                    <div className="h-full rounded-full bg-[#A855F7]" style={{ width: `${Math.min(s.avgScore, 100)}%` }} />
                                </div>
                                <span className="text-sm font-bold font-mono text-obsidian-100 w-14 text-right">{s.avgScore}%</span>
                            </div>
                        ))}
                    </div>
                </DashboardChartPanel>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data && data.regionScores.length > 0 && (
                    <DashboardChartPanel title="Region Performance" subtitle="Training performance by region">
                        <div className="space-y-3">
                            {data.regionScores.map(r => (
                                <div key={r.region} className="rounded-xl bg-obsidian-700/15 p-4 border border-obsidian-600/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-obsidian-200">{r.region}</span>
                                        <span className="text-lg font-bold font-mono text-obsidian-50">{r.avgScore}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-obsidian-700/40 overflow-hidden">
                                        <div className="h-full rounded-full bg-[#A855F7]" style={{ width: `${Math.min(r.avgScore, 100)}%` }} />
                                    </div>
                                    <p className="text-[10px] text-obsidian-400 mt-1">{r.count} audits · {r.storeCount} stores</p>
                                </div>
                            ))}
                        </div>
                    </DashboardChartPanel>
                )}
                {data && data.scoreDistribution.length > 0 && (
                    <DashboardChartPanel title="Score Distribution" subtitle="Training score histogram">
                        <ScoreDistributionChart data={data.scoreDistribution} color="#A855F7" />
                    </DashboardChartPanel>
                )}
            </div>

            {data && (data.topStores.length > 0 || data.bottomStores.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardInfoPanel title="Top Performing Stores">
                        <RankList stores={data.topStores} colorClass="text-[#22C55E]" />
                    </DashboardInfoPanel>
                    <DashboardInfoPanel title="Needs Improvement">
                        <RankList stores={data.bottomStores} colorClass="text-[#EF4444]" />
                    </DashboardInfoPanel>
                </div>
            )}

            {data && data.recentSubmissions.length > 0 && (
                <DashboardInfoPanel title="Recent Submissions">
                    <SubmissionTable submissions={data.recentSubmissions} />
                </DashboardInfoPanel>
            )}
        </div>
    );
}
