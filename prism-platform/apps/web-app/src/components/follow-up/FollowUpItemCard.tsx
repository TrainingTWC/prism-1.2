'use client';

import React, { useState } from 'react';
import type { FollowUpItemDetail, FollowUpItemStatus } from '../../types/follow-up';

// ──────────────────────────────────────────
// FollowUpItemCard — Premium widget style
// ──────────────────────────────────────────

interface Props {
  item: FollowUpItemDetail;
  index: number;
  onUpdate: (itemId: string, field: string, value: string) => void;
  onStatusChange: (itemId: string, status: FollowUpItemStatus) => void;
  readOnly?: boolean;
}

const STATUS_CONFIG: Record<FollowUpItemStatus, { label: string; color: string; dotColor: string; glowBg: string }> = {
  OPEN: { label: 'Open', color: 'text-red-400', dotColor: '#F87171', glowBg: 'rgba(248,113,113,0.1)' },
  STORE_RESPONDED: { label: 'Store Responded', color: 'text-amber-400', dotColor: '#FBBF24', glowBg: 'rgba(251,191,36,0.1)' },
  RCA_SUBMITTED: { label: 'RCA Submitted', color: 'text-blue-400', dotColor: '#60A5FA', glowBg: 'rgba(96,165,250,0.1)' },
  CAPA_SUBMITTED: { label: 'CAPA Submitted', color: 'text-indigo-400', dotColor: '#818CF8', glowBg: 'rgba(129,140,248,0.1)' },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-400', dotColor: '#34D399', glowBg: 'rgba(52,211,153,0.1)' },
  VERIFIED: { label: 'Verified', color: 'text-green-400', dotColor: '#4ADE80', glowBg: 'rgba(74,222,128,0.1)' },
};

// Step progress indicator
const STEPS: FollowUpItemStatus[] = ['OPEN', 'STORE_RESPONDED', 'RCA_SUBMITTED', 'CAPA_SUBMITTED', 'RESOLVED', 'VERIFIED'];

function StepIndicator({ current }: { current: FollowUpItemStatus }) {
  const currentIdx = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i <= currentIdx ? 16 : 8,
              background: i <= currentIdx
                ? STATUS_CONFIG[step].dotColor
                : 'rgba(39,39,47,0.5)',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function FollowUpItemCard({ item, index, onUpdate, onStatusChange, readOnly }: Props) {
  const [expanded, setExpanded] = useState(item.status === 'OPEN');
  const statusCfg = STATUS_CONFIG[item.status];

  return (
    <div className="widget overflow-hidden transition-all duration-300">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-6 text-left group"
      >
        {/* Index pill */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: `linear-gradient(135deg, ${statusCfg.dotColor}20, ${statusCfg.dotColor}08)` }}>
          <span className="font-mono text-sm font-bold" style={{ color: statusCfg.dotColor }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Question text */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-[15px] font-semibold text-obsidian-100 group-hover:text-obsidian-50 transition-colors truncate">
            {item.originalQuestion.text}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-obsidian-500">
              Answer: <span className="font-mono text-red-400 font-medium">{item.originalAnswer ?? '—'}</span>
            </span>
            <StepIndicator current={item.status} />
          </div>
        </div>

        {/* Status badge */}
        <span
          className="shrink-0 badge-pill text-[10px] uppercase tracking-wider"
          style={{ color: statusCfg.dotColor, background: statusCfg.glowBg }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusCfg.dotColor }} />
          {statusCfg.label}
        </span>

        {/* Expand icon */}
        <svg
          className={`h-4 w-4 shrink-0 text-obsidian-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-white/[0.04] px-6 pb-6 pt-5 space-y-5">
          {/* Issue Description */}
          <FieldSection label="Issue Description" iconPath="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" color="#F87171">
            <p className="text-sm text-obsidian-300 leading-relaxed">{item.issueDescription}</p>
          </FieldSection>

          {/* Store Response */}
          <FieldSection label="Store Response" iconPath="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" color="#FBBF24">
            <EditableField
              value={item.storeResponse ?? ''}
              placeholder="Store team has not responded yet..."
              readOnly={readOnly}
              onChange={(v) => onUpdate(item.id, 'storeResponse', v)}
            />
          </FieldSection>

          {/* Root Cause Analysis */}
          <FieldSection label="Root Cause Analysis (RCA)" iconPath="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" color="#60A5FA">
            <EditableField
              value={item.rootCauseAnalysis ?? ''}
              placeholder="Describe the root cause of this issue..."
              readOnly={readOnly}
              onChange={(v) => onUpdate(item.id, 'rootCauseAnalysis', v)}
            />
          </FieldSection>

          {/* Corrective Action */}
          <FieldSection label="Corrective Action" iconPath="M11.42 15.17l-5.384-3.19.008-.008m0 0l5.376-3.182m-5.376 3.182V17.5m0-5.5L7.5 8.757m9.92 6.413l-5.384 3.19m5.384-3.19v4.243m0-4.243L16.5 15.243M6.046 12l5.376 3.182m0 0L16.5 12" color="#818CF8">
            <EditableField
              value={item.correctiveAction ?? ''}
              placeholder="What corrective action will be taken..."
              readOnly={readOnly}
              onChange={(v) => onUpdate(item.id, 'correctiveAction', v)}
            />
          </FieldSection>

          {/* Preventive Action */}
          <FieldSection label="Preventive Action" iconPath="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" color="#A78BFA">
            <EditableField
              value={item.preventiveAction ?? ''}
              placeholder="Steps to prevent recurrence..."
              readOnly={readOnly}
              onChange={(v) => onUpdate(item.id, 'preventiveAction', v)}
            />
          </FieldSection>

          {/* Resolution Notes */}
          <FieldSection label="Resolution Notes" iconPath="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" color="#34D399">
            <EditableField
              value={item.resolutionNotes ?? ''}
              placeholder="Summary of resolution..."
              readOnly={readOnly}
              onChange={(v) => onUpdate(item.id, 'resolutionNotes', v)}
            />
          </FieldSection>

          {/* Verification */}
          {(item.status === 'RESOLVED' || item.status === 'VERIFIED') && (
            <FieldSection label="Follow-Up Verification" iconPath="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="#4ADE80">
              {item.verifiedAt ? (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/10 px-4 py-3">
                  <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <span className="text-emerald-400 font-medium">Verified</span>
                    <span className="text-obsidian-400"> on {new Date(item.verifiedAt).toLocaleDateString()}</span>
                    {item.verificationNotes && (
                      <p className="mt-1 text-obsidian-400">{item.verificationNotes}</p>
                    )}
                  </div>
                </div>
              ) : (
                <EditableField
                  value={item.verificationNotes ?? ''}
                  placeholder="Verification notes..."
                  readOnly={readOnly}
                  onChange={(v) => onUpdate(item.id, 'verificationNotes', v)}
                />
              )}
            </FieldSection>
          )}

          {/* Status actions */}
          {!readOnly && item.status !== 'VERIFIED' && (
            <div className="pt-3 flex items-center gap-3 border-t border-white/[0.04]">
              {item.status === 'OPEN' && (
                <ActionButton label="Mark Store Responded" onClick={() => onStatusChange(item.id, 'STORE_RESPONDED')} />
              )}
              {item.status === 'STORE_RESPONDED' && (
                <ActionButton label="Submit RCA" onClick={() => onStatusChange(item.id, 'RCA_SUBMITTED')} />
              )}
              {item.status === 'RCA_SUBMITTED' && (
                <ActionButton label="Submit CAPA" onClick={() => onStatusChange(item.id, 'CAPA_SUBMITTED')} />
              )}
              {item.status === 'CAPA_SUBMITTED' && (
                <ActionButton label="Mark Resolved" onClick={() => onStatusChange(item.id, 'RESOLVED')} primary />
              )}
              {item.status === 'RESOLVED' && (
                <ActionButton label="Verify" onClick={() => onStatusChange(item.id, 'VERIFIED')} primary />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function FieldSection({
  label,
  iconPath,
  color,
  children,
}: {
  label: string;
  iconPath: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <svg className="h-3.5 w-3.5" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
        <span className="text-xs font-semibold text-obsidian-400 uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  );
}

function EditableField({
  value,
  placeholder,
  readOnly,
  onChange,
}: {
  value: string;
  placeholder: string;
  readOnly?: boolean;
  onChange: (val: string) => void;
}) {
  if (readOnly) {
    return (
      <p className="text-sm text-obsidian-300 leading-relaxed">
        {value || <span className="text-obsidian-600 italic">Not provided</span>}
      </p>
    );
  }

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-2xl bg-obsidian-800/40 border border-white/[0.06] px-4 py-3
        text-sm text-obsidian-100 placeholder:text-obsidian-600 leading-relaxed
        focus:outline-none focus:ring-2 focus:ring-[#0d8c63]/25 focus:border-[#0d8c63]/20 resize-y
        transition-all duration-normal"
    />
  );
}

function ActionButton({
  label,
  onClick,
  primary,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? 'inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0d8c63] to-[#10b37d] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(13,140,99,0.25)] hover:shadow-[0_6px_24px_rgba(13,140,99,0.35)] hover:from-[#087a56] hover:to-[#0d8c63] active:scale-[0.98] transition-all duration-normal ease-out-expo'
          : 'inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-obsidian-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-obsidian-100 active:scale-[0.98] transition-all duration-normal ease-out-expo'
      }
    >
      {label}
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}
