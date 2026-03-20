'use client';

import React, { useState, useCallback } from 'react';
import type {
  FollowUpDetail,
  FollowUpItemStatus,
  UpdateFollowUpItemInput,
} from '../../types/follow-up';
import { FollowUpItemCard } from './FollowUpItemCard';
import {
  updateFollowUpItem,
  updateFollowUpStatus,
} from '../../lib/follow-up-api';

// ──────────────────────────────────────────
// FollowUpRenderer — Premium widget layout
// ──────────────────────────────────────────

interface Props {
  followUp: FollowUpDetail;
  onUpdate?: (updated: FollowUpDetail) => void;
  readOnly?: boolean;
}

const HEADER_STATUS: Record<string, { label: string; color: string; dotColor: string; glowBg: string }> = {
  OPEN: { label: 'Open', color: 'text-red-400', dotColor: '#F87171', glowBg: 'rgba(248,113,113,0.1)' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400', dotColor: '#FBBF24', glowBg: 'rgba(251,191,36,0.1)' },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-400', dotColor: '#34D399', glowBg: 'rgba(52,211,153,0.1)' },
  VERIFIED: { label: 'Verified', color: 'text-green-400', dotColor: '#4ADE80', glowBg: 'rgba(74,222,128,0.1)' },
  CLOSED: { label: 'Closed', color: 'text-obsidian-400', dotColor: '#52525E', glowBg: 'rgba(82,82,94,0.1)' },
};

// ── Circular Progress Ring ──
function CircularProgress({ value, size = 72, strokeWidth = 5, color = '#10b37d' }: {
  value: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(39,39,47,0.4)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-lg font-bold" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
}

export function FollowUpRenderer({ followUp: initialData, onUpdate, readOnly }: Props) {
  const [followUp, setFollowUp] = useState(initialData);
  const [saving, setSaving] = useState(false);

  const statusCfg = HEADER_STATUS[followUp.status] ?? HEADER_STATUS.OPEN;
  const resolvedCount = followUp.items.filter(
    (i) => i.status === 'RESOLVED' || i.status === 'VERIFIED',
  ).length;
  const progressPct = followUp.items.length > 0
    ? Math.round((resolvedCount / followUp.items.length) * 100)
    : 0;

  const handleItemFieldUpdate = useCallback(
    async (itemId: string, field: string, value: string) => {
      setSaving(true);
      try {
        const payload: UpdateFollowUpItemInput = { [field]: value };
        const updated = await updateFollowUpItem(followUp.id, itemId, payload);
        setFollowUp(updated);
        onUpdate?.(updated);
      } catch {
        setFollowUp((prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === itemId ? { ...i, [field]: value } : i,
          ),
        }));
      } finally {
        setSaving(false);
      }
    },
    [followUp.id, onUpdate],
  );

  const handleItemStatusChange = useCallback(
    async (itemId: string, status: FollowUpItemStatus) => {
      setSaving(true);
      try {
        const payload: UpdateFollowUpItemInput = { status };
        const updated = await updateFollowUpItem(followUp.id, itemId, payload);
        setFollowUp(updated);
        onUpdate?.(updated);
      } catch {
        setFollowUp((prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === itemId ? { ...i, status } : i,
          ),
        }));
      } finally {
        setSaving(false);
      }
    },
    [followUp.id, onUpdate],
  );

  const handleCompleteFollowUp = useCallback(async () => {
    setSaving(true);
    try {
      const allVerified = followUp.items.every((i) => i.status === 'VERIFIED');
      const newStatus = allVerified ? 'VERIFIED' : 'RESOLVED';
      const updated = await updateFollowUpStatus(followUp.id, newStatus);
      setFollowUp(updated);
      onUpdate?.(updated);
    } catch {
      // noop
    } finally {
      setSaving(false);
    }
  }, [followUp, onUpdate]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeInUp">
      {/* ── Header Widget ── */}
      <div className="widget p-7 space-y-6">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <span className="text-overline">Follow-Up Checklist</span>
            <h1 className="text-2xl font-bold text-obsidian-50 tracking-tight">{followUp.title}</h1>
            <p className="text-sm text-obsidian-400 flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-obsidian-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72" />
              </svg>
              {followUp.store.storeName}
              {followUp.store.storeCode && (
                <span className="text-obsidian-500">[{followUp.store.storeCode}]</span>
              )}
              <span className="text-obsidian-600">•</span>
              {followUp.program.name}
            </p>
          </div>

          {/* Status + circular progress */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <CircularProgress
              value={progressPct}
              size={64}
              strokeWidth={4}
              color={progressPct === 100 ? '#34D399' : '#10b37d'}
            />
            <span
              className="badge-pill text-[10px] uppercase tracking-wider"
              style={{ color: statusCfg.dotColor, background: statusCfg.glowBg }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusCfg.dotColor }} />
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap items-center gap-3">
          <MetaChip icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" label="Assigned" value={followUp.assignedTo.name} />
          <MetaChip icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" label="Created by" value={followUp.createdBy.name} />
          {followUp.dueDate && (
            <MetaChip icon="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" label="Due" value={new Date(followUp.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
          )}
          <MetaChip icon="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" label="Score" value={followUp.originalSubmission.percentage != null ? `${followUp.originalSubmission.percentage}%` : '—'} accent />
        </div>

        {/* Progress bar */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-xs">
            <span className="text-obsidian-400">Resolution Progress</span>
            <span className="font-mono font-semibold text-obsidian-300">{resolvedCount} / {followUp.items.length}</span>
          </div>
          <div className="h-2.5 rounded-full bg-obsidian-800/60 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? 'linear-gradient(90deg, #059669, #34D399)'
                  : 'linear-gradient(90deg, #0d8c63, #10b37d, #34d399)',
              }}
            />
          </div>
        </div>

        {/* Saving indicator */}
        {saving && (
          <div className="flex items-center gap-2.5 text-xs text-obsidian-500">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-obsidian-600/30 border-t-[#10b37d]" />
            Saving changes...
          </div>
        )}
      </div>

      {/* ── Items ── */}
      <div className="space-y-4">
        {followUp.items.map((item, idx) => (
          <FollowUpItemCard
            key={item.id}
            item={item}
            index={idx}
            onUpdate={handleItemFieldUpdate}
            onStatusChange={handleItemStatusChange}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* ── Complete action ── */}
      {!readOnly && resolvedCount === followUp.items.length && followUp.status !== 'VERIFIED' && followUp.status !== 'CLOSED' && (
        <div className="widget p-8 text-center space-y-5">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5">
            <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-obsidian-100">All Items Resolved</h3>
            <p className="text-sm text-obsidian-400 mt-1.5">
              Every follow-up item has been addressed. Complete this follow-up to close it out.
            </p>
          </div>
          <button
            onClick={handleCompleteFollowUp}
            disabled={saving}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500
              px-7 py-3 text-sm font-semibold text-white
              shadow-[0_4px_20px_rgba(16,185,129,0.25)]
              hover:shadow-[0_6px_28px_rgba(16,185,129,0.35)]
              hover:from-emerald-700 hover:to-emerald-600
              active:scale-[0.98]
              transition-all duration-normal ease-out-expo disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Complete Follow-Up
          </button>
        </div>
      )}

      {/* ── Link to original submission ── */}
      <div className="text-center pb-8">
        <a
          href={`/submissions/${followUp.originalSubmissionId}`}
          className="inline-flex items-center gap-2 text-xs text-obsidian-500 hover:text-[#10b37d] transition-colors duration-normal"
        >
          View Original Submission
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ── Metadata chip sub-component ──
function MetaChip({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2">
      <svg className="h-3.5 w-3.5 text-obsidian-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      <span className="text-[11px] text-obsidian-500">{label}:</span>
      <span className={`text-[11px] font-semibold ${accent ? 'font-mono text-[#10b37d]' : 'text-obsidian-300'}`}>{value}</span>
    </div>
  );
}
