'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@prism/ui';
import { DashboardStatCards } from '@/components/dashboard/dashboard-stat-cards';
import { DashboardInfoPanel } from '@/components/dashboard/dashboard-panels';

const stats = [
    { label: 'In Pipeline', value: '67', trend: { value: 14.2, isPositive: true }, color: '#10b37d' },
    { label: 'Promoted This Quarter', value: '12', trend: { value: 8.0, isPositive: true }, color: '#10b37d' },
    { label: 'Avg Readiness Score', value: '73.5%', trend: { value: 5.6, isPositive: true }, color: '#10b37d' },
    { label: 'Target Fill Rate', value: '84%', trend: { value: 2.3, isPositive: true }, color: '#10b37d' },
];

export default function BenchPlanningDashboardPage() {
    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard"
                title="Bench Planning" 
                subtitle="Barista → Shift Manager promotion tracking and readiness assessment"
            />

            <DashboardStatCards stats={stats} />

            {/* Sub-Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboards/bench-planning" className="block">
                    <div className="rounded-2xl border border-[rgba(16,179,125,0.2)] bg-[rgba(16,179,125,0.04)] p-6 hover:bg-[rgba(16,179,125,0.08)] transition-all duration-normal ease-out-expo group cursor-pointer">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-3 h-3 rounded-full bg-[#10b37d]" />
                            <h3 className="text-base font-bold text-obsidian-100 group-hover:text-[#10b37d] transition-colors">Barista → Shift Manager</h3>
                        </div>
                        <p className="text-xs text-obsidian-400">Single assessment form for barista to SM promotion tracking</p>
                    </div>
                </Link>
                <Link href="/dashboards/bench-planning-sm-asm" className="block">
                    <div className="rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.04)] p-6 hover:bg-[rgba(245,158,11,0.08)] transition-all duration-normal ease-out-expo group cursor-pointer">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                            <h3 className="text-base font-bold text-obsidian-100 group-hover:text-[#F59E0B] transition-colors">SM → ASM</h3>
                        </div>
                        <p className="text-xs text-obsidian-400">Shift Manager to Assistant Store Manager promotion pipeline</p>
                    </div>
                </Link>
            </div>

            <DashboardInfoPanel title="Bench Planning Dashboard">
                <div className="space-y-3">
                    <p className="text-sm text-obsidian-300">
                        Barista → Shift Manager promotion tracking pipeline with readiness scores, 
                        assessment completions, and target timeline monitoring.
                    </p>
                    {/* Pipeline stages */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        {[
                            { stage: 'Assessment', count: 45, color: '#3B82F6' },
                            { stage: 'Training', count: 32, color: '#10b37d' },
                            { stage: 'Evaluation', count: 18, color: '#A855F7' },
                            { stage: 'Ready', count: 12, color: '#22C55E' },
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
