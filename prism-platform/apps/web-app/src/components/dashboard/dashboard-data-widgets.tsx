'use client';

import React from 'react';

// ── Loading Bar ──
export function LoadingBar() {
    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-obsidian-700/20 border border-obsidian-600/20">
            <div className="w-4 h-4 border-2 border-[#10b37d] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-obsidian-400">Loading dashboard data...</span>
        </div>
    );
}

// ── Score Distribution Chart ──
export function ScoreDistributionChart({ data, color }: { data: { range: string; count: number }[]; color: string }) {
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="flex items-end gap-3 h-[220px] px-4 pt-4">
            {data.map(d => (
                <div key={d.range} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-xs font-mono font-bold text-obsidian-100">{d.count}</span>
                    <div
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                            height: `${Math.max((d.count / max) * 160, 4)}px`,
                            backgroundColor: `${color}25`,
                            border: `1px solid ${color}40`,
                        }}
                    />
                    <span className="text-[10px] text-obsidian-400 whitespace-nowrap">{d.range}%</span>
                </div>
            ))}
        </div>
    );
}

// ── Rank List (Top / Bottom Stores) ──
export function RankList({ stores, colorClass }: { stores: { storeName: string; avgScore: number; count: number }[]; colorClass: string }) {
    return (
        <div className="space-y-2">
            {stores.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-obsidian-700/15 border border-obsidian-600/10">
                    <span className="text-xs font-bold text-obsidian-500 w-5 text-right">#{i + 1}</span>
                    <span className="text-sm text-obsidian-200 flex-1 truncate">{s.storeName}</span>
                    <span className={`text-sm font-bold font-mono ${colorClass}`}>{s.avgScore}%</span>
                    <span className="text-[10px] text-obsidian-500">{s.count} audits</span>
                </div>
            ))}
            {stores.length === 0 && (
                <p className="text-xs text-obsidian-500 text-center py-4">No data available</p>
            )}
        </div>
    );
}

// ── Region Cards ──
export function RegionCards({ regions, color }: { regions: { region: string; avgScore: number; count: number; storeCount: number }[]; color: string }) {
    return (
        <div className="space-y-3">
            {regions.map(r => (
                <div key={r.region} className="rounded-xl bg-obsidian-700/15 p-4 border border-obsidian-600/10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-obsidian-200">{r.region}</span>
                        <span className="text-lg font-bold font-mono text-obsidian-50">{r.avgScore}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-obsidian-700/40 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(r.avgScore, 100)}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-[10px] text-obsidian-400 mt-1">{r.count} submissions · {r.storeCount} stores</p>
                </div>
            ))}
            {regions.length === 0 && (
                <p className="text-xs text-obsidian-500 text-center py-4">No region data available</p>
            )}
        </div>
    );
}

// ── Store Score Bars ──
export function StoreScoreBars({ stores, color }: { stores: { storeId: string; storeName: string; avgScore: number; count: number }[]; color: string }) {
    return (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {stores.map((s, i) => (
                <div key={s.storeId} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-obsidian-700/15 border border-obsidian-600/10 hover:bg-obsidian-700/25 transition-colors">
                    <span className="text-xs text-obsidian-500 w-6 text-right font-mono">{i + 1}</span>
                    <span className="text-sm text-obsidian-200 font-medium flex-1 truncate">{s.storeName}</span>
                    <span className="text-[10px] text-obsidian-400">{s.count}</span>
                    <div className="w-24 h-2 rounded-full bg-obsidian-700/40 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(s.avgScore, 100)}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-sm font-bold font-mono text-obsidian-100 w-14 text-right">{s.avgScore}%</span>
                </div>
            ))}
        </div>
    );
}

// ── Monthly Trend Pills ──
export function MonthlyTrendPills({ trend, color }: { trend: { month: string; avgScore: number; count: number }[]; color: string }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {trend.map(t => (
                <div key={t.month} className="rounded-xl p-4 border text-center"
                    style={{ backgroundColor: `${color}08`, borderColor: `${color}20` }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>{t.month}</p>
                    <p className="text-xl font-bold font-mono text-obsidian-50">{t.avgScore}%</p>
                    <p className="text-[10px] text-obsidian-400">{t.count} submissions</p>
                </div>
            ))}
        </div>
    );
}

// ── Submission Table ──
export function SubmissionTable({ submissions }: { submissions: Array<{
    id: string;
    percentage: number | null;
    submittedAt: string | null;
    status: string;
    employee: { name: string; empId: string };
    store: { storeName: string; storeCode: string; region?: { name: string } };
}> }) {
    return (
        <div className="space-y-1">
            <div className="grid grid-cols-5 gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-obsidian-400">
                <span>Employee</span>
                <span>Store</span>
                <span>Score</span>
                <span>Region</span>
                <span>Date</span>
            </div>
            {submissions.map(sub => (
                <div key={sub.id} className="grid grid-cols-5 gap-3 px-4 py-3 rounded-xl bg-obsidian-700/15 border border-obsidian-600/10 hover:bg-obsidian-700/25 transition-colors">
                    <span className="text-sm text-obsidian-200 font-medium truncate">{sub.employee.name}</span>
                    <span className="text-sm text-obsidian-300 truncate">{sub.store.storeName}</span>
                    <span className={`text-sm font-mono font-bold ${(sub.percentage || 0) >= 70 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                        {sub.percentage != null ? `${Math.round(sub.percentage)}%` : '—'}
                    </span>
                    <span className="text-xs text-obsidian-400">{sub.store.region?.name || '—'}</span>
                    <span className="text-xs text-obsidian-400 font-mono">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-IN') : '—'}
                    </span>
                </div>
            ))}
        </div>
    );
}
