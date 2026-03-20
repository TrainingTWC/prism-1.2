'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { DashboardChartPanel, DashboardInfoPanel } from '@/components/dashboard/dashboard-panels';
import { useDashboardData, useFilterOptions } from '@/hooks/use-dashboard-data';
import { ScoreDistributionChart, RegionCards, StoreScoreBars, RankList, SubmissionTable, MonthlyTrendPills, LoadingBar } from '@/components/dashboard/dashboard-data-widgets';

export default function HRDashboardPage() {
    const { data, loading, applyFilters } = useDashboardData('hr');
    const filterOptions = useFilterOptions();

    const stats = data ? [
        { label: 'Total Surveys', value: data.stats.totalSubmissions.toLocaleString(), color: '#3B82F6' },
        { label: 'Unique Stores', value: String(data.stats.uniqueStores), color: '#3B82F6' },
        { label: 'Employees Surveyed', value: String(data.stats.uniqueAuditors), color: '#3B82F6' },
        { label: 'Average Score', value: `${data.stats.avgScore}%`, color: '#3B82F6' },
    ] : [
        { label: 'Total Surveys', value: '—', color: '#3B82F6' },
        { label: 'Unique Stores', value: '—', color: '#3B82F6' },
        { label: 'Employees Surveyed', value: '—', color: '#3B82F6' },
        { label: 'Average Score', value: '—', color: '#3B82F6' },
    ];

    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard"
                title="HR Employee Surveys" 
                subtitle="HR audit analytics, employee survey scores, and personnel performance"
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
                    <MonthlyTrendPills trend={data.monthlyTrend} color="#3B82F6" />
                </DashboardInfoPanel>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data && data.scoreDistribution.length > 0 && (
                    <DashboardChartPanel title="Score Distribution" subtitle="Histogram of HR survey score ranges">
                        <ScoreDistributionChart data={data.scoreDistribution} color="#3B82F6" />
                    </DashboardChartPanel>
                )}
                {data && data.regionScores.length > 0 && (
                    <DashboardChartPanel title="Region Performance" subtitle="HR survey scores by region">
                        <RegionCards regions={data.regionScores} color="#3B82F6" />
                    </DashboardChartPanel>
                )}
            </div>

            {data && data.storeScores.length > 0 && (
                <DashboardChartPanel title="Store Performance" subtitle="Average HR survey score per store">
                    <StoreScoreBars stores={data.storeScores} color="#3B82F6" />
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
                <DashboardInfoPanel title="Recent Submissions">
                    <SubmissionTable submissions={data.recentSubmissions} />
                </DashboardInfoPanel>
            )}
        </div>
    );
}
