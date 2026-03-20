'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  legacyName: string;
  legacyIcon: string;
}

/**
 * Replaces hardcoded legacy checklist pages with a notice that directs
 * users to the new dynamic, API-driven checklist system.
 */
export function ChecklistMigrated({ legacyName, legacyIcon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 max-w-lg mx-auto text-center">
      {/* Icon */}
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[rgba(13,140,99,0.08)] border border-[#0d8c63]/15">
          <span className="text-3xl">{legacyIcon}</span>
        </div>
        <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-obsidian-100">{legacyName} Upgraded</h2>
        <p className="text-sm text-obsidian-400 leading-relaxed">
          This checklist is now <span className="text-[#10b37d] font-semibold">dynamic and editable</span>. 
          Programs are managed via the Admin Panel and loaded from the server in real-time — 
          with auto-save, offline mode, scoring, and follow-up detection.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/checklists"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#0d8c63] to-[#10b37d] text-white hover:from-[#087a56] hover:to-[#0d8c63] transition-colors shadow-lg shadow-[#0d8c63]/10"
        >
          View Active Checklists
        </Link>
      </div>

      {/* Note */}
      <p className="text-[11px] text-obsidian-600 mt-4">
        If you had a bookmark to this page, please update it to the new dynamic URL.
      </p>
    </div>
  );
}
