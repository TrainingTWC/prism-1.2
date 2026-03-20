'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';

const leaderboard = [
    { rank: 1, name: 'Aarav Patel', store: 'Store #001', amScore: 4.8, regionScore: 4.7, total: 9.5 },
    { rank: 2, name: 'Meera Singh', store: 'Store #003', amScore: 4.6, regionScore: 4.5, total: 9.1 },
    { rank: 3, name: 'Rohan Kumar', store: 'Store #007', amScore: 4.4, regionScore: 4.4, total: 8.8 },
    { rank: 4, name: 'Priya Sharma', store: 'Store #012', amScore: 4.3, regionScore: 4.2, total: 8.5 },
    { rank: 5, name: 'Vikram Reddy', store: 'Store #005', amScore: 4.1, regionScore: 4.3, total: 8.4 },
];

const stats = [
    { label: 'Total Participants', value: '48', color: 'text-amber-400' },
    { label: 'AM Rounds Complete', value: '42', color: 'text-blue-400' },
    { label: 'Region Rounds Complete', value: '18', color: 'text-purple-400' },
    { label: 'Avg Score', value: '4.2 / 5', color: 'text-emerald-400' },
];

export default function BrewLeagueDashboardPage() {
    return (
        <div className="space-y-8">
            <PageHeader title="Brew League Dashboard" subtitle="Performance analytics and leaderboards" />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] p-5">
                        <div className="text-xs text-obsidian-400 mb-1">{s.label}</div>
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Leaderboard */}
            <div className="rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] p-6">
                <h3 className="text-base font-bold text-obsidian-100 mb-4">Leaderboard</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-obsidian-600/30">
                                <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">Rank</th>
                                <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">Name</th>
                                <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">Store</th>
                                <th className="text-right py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">AM Score</th>
                                <th className="text-right py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">Region Score</th>
                                <th className="text-right py-3 px-3 text-xs font-bold uppercase tracking-wider text-obsidian-400">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((row) => (
                                <tr key={row.rank} className="border-b border-obsidian-600/10 hover:bg-obsidian-800/30">
                                    <td className="py-3 px-3">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                            row.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                                            row.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                                            row.rank === 3 ? 'bg-emerald-700/20 text-emerald-400' :
                                            'bg-obsidian-700/30 text-obsidian-400'
                                        }`}>
                                            {row.rank}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-obsidian-200 font-medium">{row.name}</td>
                                    <td className="py-3 px-3 text-obsidian-400">{row.store}</td>
                                    <td className="py-3 px-3 text-right text-obsidian-300">{row.amScore}</td>
                                    <td className="py-3 px-3 text-right text-obsidian-300">{row.regionScore}</td>
                                    <td className="py-3 px-3 text-right font-bold text-amber-400">{row.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Score Distribution Placeholder */}
            <div className="rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] p-6">
                <h3 className="text-base font-bold text-obsidian-100 mb-4">Score Distribution</h3>
                <div className="h-48 flex items-center justify-center text-obsidian-500 text-sm">
                    Chart placeholder — Score distribution across all participants
                </div>
            </div>
        </div>
    );
}
