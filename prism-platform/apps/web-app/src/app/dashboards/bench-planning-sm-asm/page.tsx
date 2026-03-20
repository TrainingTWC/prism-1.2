'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { DashboardInfoPanel } from '@/components/dashboard/dashboard-panels';

const stats = [
    { label: 'In Pipeline', value: '23', trend: { value: 6.5, isPositive: true }, color: '#F59E0B' },
    { label: 'Promoted This Quarter', value: '5', trend: { value: 25.0, isPositive: true }, color: '#F59E0B' },
    { label: 'Avg Readiness Score', value: '81.2%', trend: { value: 3.8, isPositive: true }, color: '#F59E0B' },
    { label: 'Target Fill Rate', value: '72%', trend: { value: 4.1, isPositive: true }, color: '#F59E0B' },
];

export default function BenchPlanningSMASMPage() {
    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard"
                title="Bench Planning — SM → ASM" 
                subtitle="Shift Manager to Assistant Store Manager promotion tracking"
            />

            <DashboardStatCards stats={stats} />

            <DashboardInfoPanel title="SM → ASM Promotion Pipeline">
                <div className="space-y-3">
                    <p className="text-sm text-obsidian-300">
                        Shift Manager to ASM promotion tracking with leadership assessments 
                        and management readiness evaluation.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        {[
                            { stage: 'Assessment', count: 15, color: '#3B82F6' },
                            { stage: 'Review', count: 8, color: '#A855F7' },
                            { stage: 'Promoted', count: 5, color: '#22C55E' },
                        ].map((s) => (
                            <div key={s.stage} className="rounded-xl p-4 border border-obsidian-600/20 bg-obsidian-700/15 text-center">
                                <p className="text-2xl font-bold font-mono text-obsidian-50">{s.count}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: s.color }}>{s.stage}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </DashboardInfoPanel>
        </div>
    );
}
