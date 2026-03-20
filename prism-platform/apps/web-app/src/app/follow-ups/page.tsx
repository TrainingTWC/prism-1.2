'use client';

import React, { useState } from 'react';
import type { FollowUpDetail, FollowUpStatus } from '../../types/follow-up';

// ──────────────────────────────────────────
// Follow-Ups List Page — Data UI Mega Kit Style
// ──────────────────────────────────────────

const STATUS_CONFIG: Record<FollowUpStatus, { label: string; color: string; dotColor: string; glowColor: string }> = {
  OPEN: { label: 'Open', color: 'text-red-400', dotColor: '#F87171', glowColor: 'rgba(248,113,113,0.15)' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400', dotColor: '#FBBF24', glowColor: 'rgba(251,191,36,0.15)' },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-400', dotColor: '#34D399', glowColor: 'rgba(52,211,153,0.15)' },
  VERIFIED: { label: 'Verified', color: 'text-green-400', dotColor: '#4ADE80', glowColor: 'rgba(74,222,128,0.15)' },
  CLOSED: { label: 'Closed', color: 'text-obsidian-400', dotColor: '#52525E', glowColor: 'rgba(82,82,94,0.15)' },
};

// ── Circular Progress Ring ──
function CircularProgress({ value, size = 64, strokeWidth = 5, color = '#10b37d', label }: {
  value: number; size?: number; strokeWidth?: number; color?: string; label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(39,39,47,0.5)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-sm font-bold" style={{ color }}>{label ?? `${value}%`}</span>
      </div>
    </div>
  );
}

// ── Mini Sparkline Bars ──
function SparkBars({ data, color = '#10b37d' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm min-w-[4px]"
          style={{
            height: `${Math.max((v / max) * 100, 8)}%`,
            background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`,
            opacity: 0.5 + (i / data.length) * 0.5,
          }} />
      ))}
    </div>
  );
}

// ── Mock data ──
const mockFollowUps: FollowUpDetail[] = [
  {
    id: 'fu-001',
    companyId: 'c-1',
    originalSubmissionId: 'sub-001',
    programId: 'prog-001',
    storeId: 'st-001',
    assignedToId: 'emp-002',
    createdById: 'emp-001',
    status: 'OPEN',
    title: 'Follow-Up: Daily Store Opening — Downtown Flagship',
    dueDate: '2026-03-20',
    completedAt: null,
    verifiedAt: null,
    verifiedById: null,
    notes: null,
    createdAt: '2026-03-13T10:30:00Z',
    updatedAt: '2026-03-13T10:30:00Z',
    items: [
      {
        id: 'fi-001',
        followUpId: 'fu-001',
        originalQuestionId: 'q-001',
        originalResponseId: 'r-001',
        issueDescription: '[Safety & Operations] "Floor cleanliness - free of debris/liquid?" — Response: No',
        originalAnswer: 'No',
        storeResponse: null,
        rootCauseAnalysis: null,
        correctiveAction: null,
        preventiveAction: null,
        status: 'OPEN',
        resolutionNotes: null,
        resolvedAt: null,
        verificationNotes: null,
        verifiedAt: null,
        verifiedById: null,
        evidenceUrls: [],
        createdAt: '2026-03-13T10:30:00Z',
        updatedAt: '2026-03-13T10:30:00Z',
        originalQuestion: { id: 'q-001', text: 'Floor cleanliness - free of debris/liquid?', questionType: 'YES_NO', sectionId: 's-001' },
      },
      {
        id: 'fi-002',
        followUpId: 'fu-001',
        originalQuestionId: 'q-002',
        originalResponseId: 'r-002',
        issueDescription: '[Safety & Operations] "Primary register area secured?" — Response: No',
        originalAnswer: 'No',
        storeResponse: 'Cash drawer hinge was broken',
        rootCauseAnalysis: 'Worn out hinge due to high traffic',
        correctiveAction: null,
        preventiveAction: null,
        status: 'RCA_SUBMITTED',
        resolutionNotes: null,
        resolvedAt: null,
        verificationNotes: null,
        verifiedAt: null,
        verifiedById: null,
        evidenceUrls: [],
        createdAt: '2026-03-13T10:30:00Z',
        updatedAt: '2026-03-13T11:00:00Z',
        originalQuestion: { id: 'q-002', text: 'Primary register area (cash drawer) secured?', questionType: 'YES_NO', sectionId: 's-001' },
      },
    ],
    store: { id: 'st-001', storeName: 'Downtown Flagship', storeCode: 'S-001' },
    assignedTo: { id: 'emp-002', name: 'Sarah Chen', email: 'sarah@prism.com' },
    createdBy: { id: 'emp-001', name: 'John Doe' },
    program: { id: 'prog-001', name: 'Daily Store Opening' },
    originalSubmission: { id: 'sub-001', submittedAt: '2026-03-13T09:45:00Z', score: 72, percentage: 72 },
  },
  {
    id: 'fu-002',
    companyId: 'c-1',
    originalSubmissionId: 'sub-002',
    programId: 'prog-002',
    storeId: 'st-003',
    assignedToId: 'emp-004',
    createdById: 'emp-001',
    status: 'IN_PROGRESS',
    title: 'Follow-Up: Health & Safety Inspection — Eastside Mall',
    dueDate: '2026-03-18',
    completedAt: null,
    verifiedAt: null,
    verifiedById: null,
    notes: null,
    createdAt: '2026-03-11T14:00:00Z',
    updatedAt: '2026-03-12T16:30:00Z',
    items: [
      {
        id: 'fi-003',
        followUpId: 'fu-002',
        originalQuestionId: 'q-010',
        originalResponseId: 'r-010',
        issueDescription: '[Fire Safety] "Emergency exits unobstructed?" — Response: No',
        originalAnswer: 'No',
        storeResponse: 'Delivery boxes were blocking east exit',
        rootCauseAnalysis: 'No designated staging area for deliveries',
        correctiveAction: 'Cleared all exits, designated staging zone',
        preventiveAction: 'Daily exit walkthrough added to opening procedure',
        status: 'RESOLVED',
        resolutionNotes: 'All exits verified clear, staging area marked with tape',
        resolvedAt: '2026-03-12T16:30:00Z',
        verificationNotes: null,
        verifiedAt: null,
        verifiedById: null,
        evidenceUrls: [],
        createdAt: '2026-03-11T14:00:00Z',
        updatedAt: '2026-03-12T16:30:00Z',
        originalQuestion: { id: 'q-010', text: 'Emergency exits unobstructed?', questionType: 'YES_NO', sectionId: 's-003' },
      },
    ],
    store: { id: 'st-003', storeName: 'Eastside Mall', storeCode: 'S-003' },
    assignedTo: { id: 'emp-004', name: 'Mike Johnson', email: 'mike@prism.com' },
    createdBy: { id: 'emp-001', name: 'John Doe' },
    program: { id: 'prog-002', name: 'Health & Safety Inspection' },
    originalSubmission: { id: 'sub-002', submittedAt: '2026-03-11T13:00:00Z', score: 85, percentage: 85 },
  },
  {
    id: 'fu-003',
    companyId: 'c-1',
    originalSubmissionId: 'sub-003',
    programId: 'prog-001',
    storeId: 'st-005',
    assignedToId: 'emp-002',
    createdById: 'emp-003',
    status: 'VERIFIED',
    title: 'Follow-Up: Daily Store Opening — Westfield Plaza',
    dueDate: '2026-03-10',
    completedAt: '2026-03-09T15:00:00Z',
    verifiedAt: '2026-03-10T10:00:00Z',
    verifiedById: 'emp-001',
    notes: null,
    createdAt: '2026-03-06T09:00:00Z',
    updatedAt: '2026-03-10T10:00:00Z',
    items: [
      {
        id: 'fi-005',
        followUpId: 'fu-003',
        originalQuestionId: 'q-005',
        originalResponseId: 'r-005',
        issueDescription: '[Brand Standards] "Signage and displays current?" — Response: No',
        originalAnswer: 'No',
        storeResponse: 'Holiday campaign signage still displayed',
        rootCauseAnalysis: 'No sign changeover schedule communicated',
        correctiveAction: 'Replaced with Q1 campaign materials',
        preventiveAction: 'Marketing calendar sync with store ops',
        status: 'VERIFIED',
        resolutionNotes: 'All signage updated and verified',
        resolvedAt: '2026-03-09T15:00:00Z',
        verificationNotes: 'Confirmed on-site — all signage is current',
        verifiedAt: '2026-03-10T10:00:00Z',
        verifiedById: 'emp-001',
        evidenceUrls: [],
        createdAt: '2026-03-06T09:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z',
        originalQuestion: { id: 'q-005', text: 'Signage and displays current?', questionType: 'YES_NO', sectionId: 's-002' },
      },
    ],
    store: { id: 'st-005', storeName: 'Westfield Plaza', storeCode: 'S-005' },
    assignedTo: { id: 'emp-002', name: 'Sarah Chen', email: 'sarah@prism.com' },
    createdBy: { id: 'emp-003', name: 'Lisa Wang' },
    program: { id: 'prog-001', name: 'Daily Store Opening' },
    originalSubmission: { id: 'sub-003', submittedAt: '2026-03-06T08:30:00Z', score: 90, percentage: 90 },
  },
];

export default function FollowUpsPage() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = mockFollowUps.filter((fu) => {
    if (filter !== 'all' && fu.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        fu.title.toLowerCase().includes(q) ||
        fu.store.storeName.toLowerCase().includes(q) ||
        fu.assignedTo.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCount = mockFollowUps.filter((f) => f.status === 'OPEN').length;
  const inProgressCount = mockFollowUps.filter((f) => f.status === 'IN_PROGRESS').length;
  const totalItems = mockFollowUps.reduce((acc, fu) => acc + fu.items.length, 0);
  const resolvedItems = mockFollowUps.reduce(
    (acc, fu) => acc + fu.items.filter((i) => i.status === 'RESOLVED' || i.status === 'VERIFIED').length, 0,
  );
  const overallPct = totalItems > 0 ? Math.round((resolvedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* ── Page Header ── */}
      <div className="space-y-1">
        <span className="text-overline">Corrective Action</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-obsidian-100">Follow-Up Checklists</h1>
        <p className="text-sm text-obsidian-400 max-w-xl">
          Track and resolve failed inspection items with full RCA, CAPA, and verification lifecycle.
        </p>
        <div className="h-px w-full bg-gradient-to-r from-[#0d8c63]/30 via-[#0d8c63]/10 to-transparent mt-3" />
      </div>

      {/* ── KPI Widget Grid (mega-kit style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Widget: Total Follow-Ups — with sparkline */}
        <div className="widget p-6 space-y-4 animate-fadeInUp stagger-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-obsidian-400">Total</span>
            <div className="h-7 w-7 rounded-lg bg-[rgba(16,179,125,0.08)] flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-[#10b37d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-4xl font-bold text-obsidian-50 tracking-tight">{mockFollowUps.length}</p>
              <p className="text-[11px] text-obsidian-500 mt-1">follow-ups total</p>
            </div>
            <div className="w-24">
              <SparkBars data={[3, 5, 2, 7, 4, 6, 3]} color="#10b37d" />
            </div>
          </div>
        </div>

        {/* Widget: Open — with pulsing dot */}
        <div className="widget p-6 space-y-4 animate-fadeInUp stagger-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-obsidian-400">Open</span>
            <div className="relative h-3 w-3">
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
              <span className="relative block h-3 w-3 rounded-full bg-red-400" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-4xl font-bold text-red-400 tracking-tight">{openCount}</p>
              <p className="text-[11px] text-obsidian-500 mt-1">need attention</p>
            </div>
            <div className="w-16">
              <SparkBars data={[2, 1, 3, 1, 2]} color="#F87171" />
            </div>
          </div>
        </div>

        {/* Widget: In Progress — with mini bar chart */}
        <div className="widget p-6 space-y-4 animate-fadeInUp stagger-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-obsidian-400">In Progress</span>
            <div className="h-7 w-7 rounded-lg bg-[rgba(251,191,36,0.08)] flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-4xl font-bold text-amber-400 tracking-tight">{inProgressCount}</p>
              <p className="text-[11px] text-obsidian-500 mt-1">being addressed</p>
            </div>
            <div className="w-16">
              <SparkBars data={[1, 3, 2, 4, 2]} color="#FBBF24" />
            </div>
          </div>
        </div>

        {/* Widget: Resolution Rate — with circular progress */}
        <div className="widget p-6 space-y-4 animate-fadeInUp stagger-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-obsidian-400">Resolution</span>
            <div className="h-7 w-7 rounded-lg bg-[rgba(52,211,153,0.08)] flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-4xl font-bold text-emerald-400 tracking-tight">{overallPct}%</p>
              <p className="text-[11px] text-obsidian-500 mt-1">{resolvedItems}/{totalItems} items</p>
            </div>
            <CircularProgress value={overallPct} size={56} strokeWidth={4} color="#34D399" />
          </div>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="widget p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-obsidian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by store, program, assignee..."
              className="w-full rounded-2xl bg-obsidian-800/50 border border-white/[0.06] pl-10 pr-4 py-2.5
                text-sm text-obsidian-100 placeholder:text-obsidian-500
                focus:outline-none focus:ring-2 focus:ring-[#0d8c63]/30 focus:border-[#0d8c63]/20
                transition-all duration-normal"
            />
          </div>

          {/* Status filter chips */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-normal ${
                  filter === s
                    ? 'bg-[rgba(13,140,99,0.12)] text-[#10b37d] shadow-[inset_0_0_0_1px_rgba(13,140,99,0.25)]'
                    : 'text-obsidian-400 hover:text-obsidian-200 hover:bg-white/[0.04]'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Follow-Up Cards ── */}
      <div className="space-y-4">
        {filtered.map((fu, idx) => {
          const cfg = STATUS_CONFIG[fu.status];
          const itemResolved = fu.items.filter(
            (i) => i.status === 'RESOLVED' || i.status === 'VERIFIED',
          ).length;
          const pct = fu.items.length > 0 ? Math.round((itemResolved / fu.items.length) * 100) : 0;
          const isOverdue = fu.dueDate && new Date(fu.dueDate) < new Date() && fu.status !== 'VERIFIED' && fu.status !== 'CLOSED';

          return (
            <a
              key={fu.id}
              href={`/follow-ups/${fu.id}`}
              className={`block glass-interactive p-6 group animate-fadeInUp stagger-${Math.min(idx + 1, 5)}`}
            >
              <div className="flex items-start gap-5">
                {/* Circular progress ring */}
                <div className="shrink-0 hidden sm:block">
                  <CircularProgress
                    value={pct}
                    size={52}
                    strokeWidth={4}
                    color={pct === 100 ? '#34D399' : '#10b37d'}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-obsidian-100 group-hover:text-[#10b37d] transition-colors duration-fast truncate">
                        {fu.title}
                      </h3>
                      <p className="text-xs text-obsidian-500 mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72" />
                          </svg>
                          {fu.store.storeName}
                        </span>
                        <span className="text-obsidian-600">•</span>
                        <span>{fu.program.name}</span>
                      </p>
                    </div>

                    {/* Status pill */}
                    <span
                      className="shrink-0 badge-pill"
                      style={{ color: cfg.dotColor, background: cfg.glowColor }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dotColor }} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Meta chips row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-obsidian-400">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span className="text-obsidian-300">{fu.assignedTo.name}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-obsidian-400">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <span className="font-mono text-obsidian-300">{fu.items.length} items</span>
                    </span>
                    {fu.dueDate && (
                      <span className={`inline-flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-obsidian-400'}`}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span className={`font-mono ${isOverdue ? 'text-red-400 font-semibold' : 'text-obsidian-300'}`}>
                          {new Date(fu.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {isOverdue && ' (overdue)'}
                        </span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-obsidian-400">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                      <span className="font-mono text-[#10b37d]">{fu.originalSubmission.percentage ?? '—'}%</span>
                    </span>
                  </div>

                  {/* Progress bar — thicker, more premium */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-obsidian-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: pct === 100
                            ? 'linear-gradient(90deg, #059669, #34D399)'
                            : 'linear-gradient(90deg, #0d8c63, #10b37d, #34d399)',
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-obsidian-400 shrink-0 w-8 text-right">{pct}%</span>
                  </div>
                </div>

                {/* Arrow */}
                <svg className="h-5 w-5 shrink-0 text-obsidian-600 group-hover:text-[#10b37d] transition-all duration-normal group-hover:translate-x-1 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </a>
          );
        })}

        {filtered.length === 0 && (
          <div className="widget p-16 text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-obsidian-800/60 flex items-center justify-center">
              <svg className="h-6 w-6 text-obsidian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-sm text-obsidian-400">No follow-ups match your criteria</p>
            <p className="text-xs text-obsidian-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
