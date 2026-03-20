'use client';

import React from 'react';
import { PageHeader } from '@prism/ui';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeSlots = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const mockSchedule: Record<string, Record<string, string>> = {
    'Mon': { '9:00': 'Rajesh - Store #001', '11:00': 'Meena - Store #003', '14:00': 'Suresh - Store #005' },
    'Tue': { '10:00': 'Rajesh - Store #002', '13:00': 'Meena - Store #004' },
    'Wed': { '9:00': 'Suresh - Store #001', '15:00': 'Rajesh - Store #006' },
    'Thu': { '11:00': 'Meena - Store #002', '14:00': 'Suresh - Store #003' },
    'Fri': { '9:00': 'Rajesh - Store #004', '11:00': 'Meena - Store #005', '16:00': 'Suresh - Store #006' },
};

export default function TrainerCalendarDashboardPage() {
    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                overline="Dashboard"
                title="Trainer Calendar" 
                subtitle="Monthly trainer scheduling, session planning, and availability tracking"
            />

            {/* Note: No DashboardFilters per spec §17.10 */}

            {/* Month Navigation */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-obsidian-600/30 backdrop-blur-xl">
                <button className="text-obsidian-400 hover:text-obsidian-200 transition-colors duration-fast">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h3 className="text-lg font-bold text-obsidian-100">January 2025</h3>
                <button className="text-obsidian-400 hover:text-obsidian-200 transition-colors duration-fast">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] backdrop-blur-xl overflow-hidden">
                {/* Header Row */}
                <div className="overflow-x-auto">
                <div className="grid grid-cols-8 border-b border-obsidian-600/20 min-w-[640px]">
                    <div className="p-3 text-[10px] font-bold uppercase tracking-wider text-obsidian-500 border-r border-obsidian-600/20">Time</div>
                    {daysOfWeek.map((day) => (
                        <div key={day} className="p-3 text-[10px] font-bold uppercase tracking-wider text-obsidian-400 text-center border-r border-obsidian-600/10 last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>
                </div>
                
                {/* Time Rows */}
                <div className="overflow-x-auto">
                {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-8 border-b border-obsidian-600/10 last:border-b-0 hover:bg-obsidian-700/10 transition-colors duration-fast min-w-[640px]">
                        <div className="p-3 text-xs text-obsidian-400 font-mono border-r border-obsidian-600/20">{time}</div>
                        {daysOfWeek.map((day) => {
                            const session = mockSchedule[day]?.[time];
                            return (
                                <div key={day} className="p-2 border-r border-obsidian-600/10 last:border-r-0 min-h-[48px]">
                                    {session && (
                                        <div className="px-2 py-1.5 rounded-lg bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.15)] text-[10px] text-[#A855F7] font-medium cursor-pointer hover:bg-[rgba(168,85,247,0.15)] transition-colors duration-fast">
                                            {session}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            </div>

            {/* Trainer Legend */}
            <div className="flex items-center gap-4 px-4 flex-wrap">
                {['Rajesh Kumar', 'Meena Patel', 'Suresh Nair'].map((trainer, i) => (
                    <div key={trainer} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#A855F7', '#3B82F6', '#22C55E'][i] }} />
                        <span className="text-xs text-obsidian-400">{trainer}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
