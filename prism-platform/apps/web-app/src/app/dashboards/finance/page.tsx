'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { DashboardInfoPanel } from '@/components/dashboard/dashboard-panels';
import { useFilterOptions } from '@/hooks/use-dashboard-data';

/* Finance program has no imported submission data yet */
const stats = [
    { label: 'Total Audits', value: '\u2014', color: '#22C55E' },
    { label: 'Unique Stores', value: '\u2014', color: '#22C55E' },
    { label: 'Finance Officers', value: '\u2014', color: '#22C55E' },
    { label: 'Average Score', value: '\u2014', color: '#22C55E' },
];

export default function FinanceDashboardPage() {
    const filterOptions = useFilterOptions();

    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard"
                title="Finance Reports" 
                subtitle="Finance audit data, expenditure tracking, and compliance"
            />

            <DashboardFilters
                regions={filterOptions.regions}
                stores={filterOptions.stores}
            />
            <DashboardStatCards stats={stats} />

            <DashboardInfoPanel title="Finance Audit Data">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.15)] flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-sm text-obsidian-300">No finance audit data imported yet.</p>
                    <p className="text-xs text-obsidian-500 mt-1">Data will appear here once finance audits are submitted through the checklists.</p>
                </div>
            </DashboardInfoPanel>
        </div>
    );
}
