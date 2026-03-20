'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { DashboardChartPanel, DashboardInfoPanel } from '@/components/dashboard/dashboard-panels';
import { useDashboardData, useFilterOptions } from '@/hooks/use-dashboard-data';
import { ScoreDistributionChart, RegionCards, StoreScoreBars, RankList, SubmissionTable, MonthlyTrendPills, LoadingBar } from '@/components/dashboard/dashboard-data-widgets';

export default function OperationsDashboardPage() {
    const { data, loading, applyFilters } = useDashboardData('operations');
    const filterOptions = useFilterOptions();

    const stats = data ? [
        { label: 'Total Audits', value: data.stats.totalSubmissions.toLocaleString(), color: '#10b37d' },
        { label: 'Unique Stores', value: String(data.stats.uniqueStores), color: '#10b37d' },
        { label: 'Auditors Active', value: String(data.stats.uniqueAuditors), color: '#10b37d' },
        { label: 'Average Score', value: `${data.stats.avgScore}%`, color: '#10b37d' },
    ] : [
        { label: 'Total Audits', value: '—', color: '#10b37d' },
        { label: 'Unique Stores', value: '—', color: '#10b37d' },
        { label: 'Auditors Active', value: '—', color: '#10b37d' },
        { label: 'Average Score', value: '—', color: '#10b37d' },
    ];

    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard"
                title="Operations Checklists" 
                subtitle="Operations audit performance, regional metrics, and compliance tracking"
            />

            <DashboardFilters
                regions={filterOptions.regions}
                stores={filterOptions.stores}
                onFilterChange={applyFilters}
            />
            <DashboardStatCards stats={stats} />

            {loading && <LoadingBar />}

            {data && data.monthlyTrend.length > 0 && (
                <DashboardInfoPanel title="Monthly Score Trend">
                    <MonthlyTrendPills trend={data.monthlyTrend} color="#10b37d" />
                </DashboardInfoPanel>
            )}

            {data && data.regionScores.length > 0 && (
                <DashboardChartPanel title="Region Performance" subtitle="Operations scores by region">
                    <RegionCards regions={data.regionScores} color="#10b37d" />
                </DashboardChartPanel>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data && data.scoreDistribution.length > 0 && (
                    <DashboardChartPanel title="Score Distribution" subtitle="Operations score histogram">
                        <ScoreDistributionChart data={data.scoreDistribution} color="#10b37d" />
                    </DashboardChartPanel>
                )}
                {data && data.storeScores.length > 0 && (
                    <DashboardChartPanel title="Store Ranking" subtitle="Average operations score per store">
                        <StoreScoreBars stores={data.storeScores.slice(0, 15)} color="#10b37d" />
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
