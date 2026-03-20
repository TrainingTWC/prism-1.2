'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { DashboardChartPanel, DashboardInfoPanel } from '@/components/dashboard/dashboard-panels';
import { useDashboardData, useFilterOptions } from '@/hooks/use-dashboard-data';
import { ScoreDistributionChart, RegionCards, StoreScoreBars, RankList, SubmissionTable, MonthlyTrendPills, LoadingBar } from '@/components/dashboard/dashboard-data-widgets';

export default function SHLPDashboardPage() {
    const { data, loading, applyFilters } = useDashboardData('shlp');
    const filterOptions = useFilterOptions();

    const stats = data ? [
        { label: 'Total Assessments', value: data.stats.totalSubmissions.toLocaleString(), color: '#10B981' },
        { label: 'Employees Assessed', value: String(data.stats.uniqueAuditors), color: '#10B981' },
        { label: 'Avg Score', value: `${data.stats.avgScore}%`, color: '#10B981' },
        { label: 'Unique Stores', value: String(data.stats.uniqueStores), color: '#10B981' },
    ] : [
        { label: 'Total Assessments', value: '\u2014', color: '#10B981' },
        { label: 'Employees Assessed', value: '\u2014', color: '#10B981' },
        { label: 'Avg Score', value: '\u2014', color: '#10B981' },
        { label: 'Unique Stores', value: '\u2014', color: '#10B981' },
    ];

    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard"
                title="SHLP Certification" 
                subtitle="Store Health & Learning Program — 36-question assessment tracking"
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
                    <MonthlyTrendPills trend={data.monthlyTrend} color="#10B981" />
                </DashboardInfoPanel>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data && data.scoreDistribution.length > 0 && (
                    <DashboardChartPanel title="Score Distribution" subtitle="SHLP certification score ranges">
                        <ScoreDistributionChart data={data.scoreDistribution} color="#10B981" />
                    </DashboardChartPanel>
                )}
                {data && data.regionScores.length > 0 && (
                    <DashboardChartPanel title="Region Performance" subtitle="SHLP scores by region">
                        <RegionCards regions={data.regionScores} color="#10B981" />
                    </DashboardChartPanel>
                )}
            </div>

            {data && data.storeScores.length > 0 && (
                <DashboardChartPanel title="Store Performance" subtitle="Average SHLP score per store">
                    <StoreScoreBars stores={data.storeScores} color="#10B981" />
                </DashboardChartPanel>
            )}

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
                <DashboardInfoPanel title="Recent SHLP Submissions">
                    <SubmissionTable submissions={data.recentSubmissions} />
                </DashboardInfoPanel>
            )}
        </div>
    );
}
