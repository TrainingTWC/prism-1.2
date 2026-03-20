'use client';

import React from 'react';
import { PageHeader, FilterBar, TableView, GlassPanel, StatCard } from '@prism/ui';

const mockTasks = [
    { id: 'T-982', title: 'Replace damaged floor tile', priority: 'High', status: 'In Progress', assigned: 'Store Manager' },
    { id: 'T-985', title: 'Update emergency exit sign', priority: 'Medium', status: 'Open', assigned: 'Safety Officer' },
    { id: 'T-1002', title: 'Restock cleaning supplies', priority: 'Low', status: 'Completed', assigned: 'Lead Associate' },
    { id: 'T-1024', title: 'Fix broken cooler gasket', priority: 'Critical', status: 'Open', assigned: 'Maintenance' },
];

const columns = [
    { header: 'Task ID', accessor: 'id' as const, mono: true },
    { header: 'Title', accessor: 'title' as const },
    { header: 'Priority', accessor: 'priority' as const },
    { header: 'Status', accessor: 'status' as const },
    { header: 'Assigned To', accessor: 'assigned' as const },
];

export default function TasksPage() {
    return (
        <div className="space-y-6">
            <PageHeader 
                overline="Action Center"
                title="Action Items & Tasks" 
                subtitle="Track corrective actions generated from operational audits"
                actions={
                    <button className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#0d8c63] to-[#10b37d] text-white rounded-element shadow-lg shadow-[#0d8c63]/20 hover:-translate-y-px active:scale-[0.98] transition-all duration-normal ease-out-expo">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="font-bold text-sm">Escalate Critical</span>
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <StatCard title="Open Tasks" value="42" />
                <StatCard title="Overdue" value="12" />
                <StatCard title="Resolved (24h)" value="18" />
                <StatCard title="Avg Resolution" value="3.4 days" />
            </div>

            <FilterBar onSearch={() => {}} />

            <GlassPanel className="overflow-hidden" padding="none">
                <TableView 
                    data={mockTasks}
                    columns={columns}
                />
            </GlassPanel>
        </div>
    );
}