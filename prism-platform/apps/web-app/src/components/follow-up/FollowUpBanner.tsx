'use client';

import React from 'react';
import type { FailedQuestion } from '../../types/follow-up';

// ──────────────────────────────────────────
// FollowUpBanner — Widget-style post-submission alert
// ──────────────────────────────────────────

interface Props {
  failedQuestions: FailedQuestion[];
  onCreateFollowUp: () => void;
  creating?: boolean;
}

export function FollowUpBanner({ failedQuestions, onCreateFollowUp, creating }: Props) {
  if (failedQuestions.length === 0) return null;

  return (
    <div className="widget p-6 space-y-5 border-[rgba(13,140,99,0.15)]"
      style={{ boxShadow: '0 0 0 1px rgba(13,140,99,0.1), 0 0 30px rgba(13,140,99,0.04), 0 8px 32px rgba(0,0,0,0.3)' }}>
      
      {/* Header row */}
      <div className="flex items-start gap-4">
        {/* Animated warning icon */}
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(13,140,99,0.15)] to-[rgba(16,179,125,0.08)]">
          <svg className="h-6 w-6 text-[#10b37d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
            <span className="font-mono text-[10px] font-bold text-white">{failedQuestions.length}</span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-base font-bold text-obsidian-100">
            Follow-Up Required
          </h3>
          <p className="mt-1.5 text-sm text-obsidian-400 leading-relaxed">
            <span className="font-mono font-bold text-[#10b37d]">{failedQuestions.length}</span>{' '}
            {failedQuestions.length === 1 ? 'item' : 'items'} failed in this submission.
            Create a follow-up checklist to track corrective action.
          </p>
        </div>
      </div>

      {/* Failed items preview — card grid */}
      <div className="grid gap-2">
        {failedQuestions.slice(0, 4).map((fq) => (
          <div
            key={fq.questionId}
            className="flex items-center gap-3 rounded-xl bg-obsidian-800/40 border border-white/[0.04] px-4 py-3"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]" />
            <span className="text-sm text-obsidian-300 truncate flex-1">{fq.questionText}</span>
            <span className="text-xs font-mono text-red-400/70 shrink-0">{fq.originalAnswer}</span>
          </div>
        ))}
        {failedQuestions.length > 4 && (
          <p className="text-xs text-obsidian-500 pl-2">
            + {failedQuestions.length - 4} more items
          </p>
        )}
      </div>

      {/* CTA button */}
      <button
        onClick={onCreateFollowUp}
        disabled={creating}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl
          bg-gradient-to-r from-[#0d8c63] to-[#10b37d]
          px-6 py-3 text-sm font-semibold text-white
          shadow-[0_4px_20px_rgba(13,140,99,0.3)]
          hover:shadow-[0_6px_28px_rgba(13,140,99,0.4)]
          hover:from-[#087a56] hover:to-[#0d8c63]
          active:scale-[0.98]
          transition-all duration-normal ease-out-expo
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Creating Follow-Up...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Follow-Up Checklist
          </>
        )}
      </button>
    </div>
  );
}
