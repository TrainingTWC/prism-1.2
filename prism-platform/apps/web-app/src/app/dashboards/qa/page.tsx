'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { DashboardInfoPanel } from '@/components/dashboard/dashboard-panels';
import { useFilterOptions } from '@/hooks/use-dashboard-data';

/* QA program is not yet in the imported data, so show placeholder stats with a note */
const stats = [
    { label: 'Total Assessments', value: '—', color: '#EF4444' },
    { label: 'Unique Stores', value: '—', color: '#EF4444' },
    { label: 'QA Auditors', value: '—', color: '#EF4444' },
    { label: 'Average Score', value: '—', color: '#EF4444' },
];

export default function QADashboardPage() {
    const filterOptions = useFilterOptions();

    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard"
                title="QA Assessments" 
                subtitle="Quality assurance audit scores, auditor performance, and section analysis"
            />

            <DashboardFilters
                regions={filterOptions.regions}
                stores={filterOptions.stores}
            />
            <DashboardStatCards stats={stats} />

            <DashboardInfoPanel title="QA Assessment Data">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                    <p className="text-sm text-obsidian-300">No QA assessment data imported yet.</p>
                    <p className="text-xs text-obsidian-500 mt-1">Data will appear here once QA audits are submitted through the checklists.</p>
                </div>
            </DashboardInfoPanel>
        </div>
    );
}
