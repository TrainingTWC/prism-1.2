'use client';

import React from 'react';
import { PageHeader, GlassPanel, StatCard, ChartContainer } from '@prism/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const reportData = [
    { name: 'North', score: 92 },
    { name: 'South', score: 85 },
    { name: 'East', score: 88 },
    { name: 'West', score: 94 },
    { name: 'Central', score: 82 },
];

const tooltipStyle = {
    backgroundColor: 'rgba(20,20,24,0.95)',
    border: '1px solid rgba(228,228,233,0.08)',
    borderRadius: '8px',
    color: '#E4E4E9',
};

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <PageHeader 
                overline="Analytics"
                title="Analytics & Strategic Reports" 
                subtitle="Deep-dive into organizational compliance and metadata patterns"
                actions={
                    <button className="px-4 py-2.5 border border-obsidian-600/40 hover:bg-obsidian-700/40 text-obsidian-200 rounded-element transition-all duration-fast text-sm font-semibold">
                        Generate PDF Report
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassPanel title="Regional Performance Benchmarking" className="p-6">
                    <ChartContainer height={300}>
                        <BarChart data={reportData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(228,228,233,0.04)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="score" fill="#10b37d" radius={[4, 4, 0, 0]} barSize={36} />
                        </BarChart>
                    </ChartContainer>
                </GlassPanel>

                <GlassPanel title="Operational Drift Analysis" className="p-6">
                    <div className="space-y-4">
                        <div className="p-4 rounded-element bg-[rgba(13,140,99,0.05)] border border-[rgba(13,140,99,0.12)]">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#10b37d]">Top Non-Compliance Insight</h4>
                            <p className="text-obsidian-200 mt-2 text-sm leading-relaxed">Inventory reconciliation accuracy has decreased by 12% in the Southern region due to delayed store closings.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard title="Total Audits" value="4,240" />
                            <StatCard title="Data Points" value="1.2M" />
                        </div>
                    </div>
                </GlassPanel>
            </div>
        </div>
    );
}