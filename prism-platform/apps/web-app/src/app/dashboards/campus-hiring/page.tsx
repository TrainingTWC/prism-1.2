'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { DashboardChartPanel, DashboardInfoPanel } from '@/components/dashboard/dashboard-panels';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { ScoreDistributionChart, StoreScoreBars, MonthlyTrendPills, SubmissionTable, LoadingBar } from '@/components/dashboard/dashboard-data-widgets';

export default function CampusHiringDashboardPage() {
    const { data, loading } = useDashboardData('campus-hiring');

    const stats = data ? [
        { label: 'Candidates Evaluated', value: data.stats.totalSubmissions.toLocaleString(), color: '#6366F1' },
        { label: 'Avg Psychometric Score', value: `${data.stats.avgScore}%`, color: '#6366F1' },
        { label: 'Unique Stores', value: String(data.stats.uniqueStores), color: '#6366F1' },
        { label: 'Unique Auditors', value: String(data.stats.uniqueAuditors), color: '#6366F1' },
    ] : [
        { label: 'Candidates Evaluated', value: '\u2014', color: '#6366F1' },
        { label: 'Avg Psychometric Score', value: '\u2014', color: '#6366F1' },
        { label: 'Unique Stores', value: '\u2014', color: '#6366F1' },
        { label: 'Unique Auditors', value: '\u2014', color: '#6366F1' },
    ];

    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard"
                title="Campus Hiring" 
                subtitle="Psychometric assessment results, candidate evaluation, and category breakdown"
            />

            <DashboardStatCards stats={stats} />

            {loading && <LoadingBar />}

            {data && data.monthlyTrend.length > 0 && (
                <DashboardInfoPanel title="Monthly Assessment Trend">
                    <MonthlyTrendPills trend={data.monthlyTrend} color="#6366F1" />
                </DashboardInfoPanel>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data && data.scoreDistribution.length > 0 && (
                    <DashboardChartPanel title="Score Distribution" subtitle="Campus hiring psychometric score ranges">
                        <ScoreDistributionChart data={data.scoreDistribution} color="#6366F1" />
                    </DashboardChartPanel>
                )}
                {data && data.storeScores.length > 0 && (
                    <DashboardChartPanel title="Campus / Location Performance" subtitle="Average score per campus or location">
                        <StoreScoreBars stores={data.storeScores.slice(0, 15)} color="#6366F1" />
                    </DashboardChartPanel>
                )}
            </div>

            {data && data.recentSubmissions.length > 0 && (
                <DashboardInfoPanel title="Recent Candidate Assessments">
                    <SubmissionTable submissions={data.recentSubmissions} />
                </DashboardInfoPanel>
            )}
        </div>
    );
}
