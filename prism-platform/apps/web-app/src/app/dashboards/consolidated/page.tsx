'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { DashboardInfoPanel } from '@/components/dashboard/dashboard-panels';
import { useConsolidatedData } from '@/hooks/use-dashboard-data';
import { LoadingBar } from '@/components/dashboard/dashboard-data-widgets';

const PROGRAM_COLORS: Record<string, string> = {
    'Training Assessment': '#A855F7',
    'HR Connect Survey': '#3B82F6',
    'SHLP Assessment': '#10B981',
    'Operations Audit': '#10b37d',
    'Campus Hiring Assessment': '#6366F1',
};

export default function ConsolidatedDashboardPage() {
    const { data, loading } = useConsolidatedData();

    const stats = data ? [
        { label: 'Total Submissions', value: data.totalSubmissions.toLocaleString(), color: '#64748B' },
        { label: 'Active Programs', value: String(data.totalPrograms), color: '#64748B' },
        { label: 'Overall Avg Score', value: `${data.overallAvgScore}%`, color: '#64748B' },
        { label: 'Data Points', value: data.totalSubmissions > 1000 ? `${(data.totalSubmissions * 28).toLocaleString()}+` : String(data.totalSubmissions * 28), color: '#64748B' },
    ] : [
        { label: 'Total Submissions', value: '\u2014', color: '#64748B' },
        { label: 'Active Programs', value: '\u2014', color: '#64748B' },
        { label: 'Overall Avg Score', value: '\u2014', color: '#64748B' },
        { label: 'Data Points', value: '\u2014', color: '#64748B' },
    ];

    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard · Editor Only"
                title="Consolidated View" 
                subtitle="Cross-department aggregated analytics and 4P framework analysis"
            />

            {/* Editor-only badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(100,116,139,0.08)] border border-[rgba(100,116,139,0.2)] w-fit">
                <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs font-semibold text-[#64748B]">This view is restricted to Editor role</span>
            </div>

            <DashboardStatCards stats={stats} />

            {loading && <LoadingBar />}

            {data && data.programs.length > 0 && (
                <DashboardInfoPanel title="Program Performance">
                    <p className="text-sm text-obsidian-300 mb-4">Real-time aggregated view across all active programs</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {data.programs.filter(p => p.totalSubmissions > 0).map((p) => {
                            const color = PROGRAM_COLORS[p.name] || '#64748B';
                            return (
                                <div key={p.name} className="rounded-xl p-4 border border-obsidian-600/20 bg-obsidian-700/15">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                        <span className="text-sm font-semibold text-obsidian-200">{p.name}</span>
                                    </div>
                                    <p className="text-xl font-bold font-mono text-obsidian-50">{p.avgScore}%</p>
                                    <p className="text-[10px] text-obsidian-400 mt-1">{p.totalSubmissions.toLocaleString()} submissions</p>
                                    <div className="mt-2 h-1.5 rounded-full bg-obsidian-700/40 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${p.avgScore}%`, backgroundColor: color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DashboardInfoPanel>
            )}
        </div>
    );
}
