'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChecklistRenderer, AuditHeader } from '@/components/checklist';
import { fetchProgramById } from '@/lib/submission-api';
import { useAuth } from '@/lib/auth-context';
import type { ProgramDetail } from '@/types/checklist';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export default function ExecuteProgramPage({ params }: { params: { programId: string } }) {
  const { user } = useAuth();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // ── Audit selection state ──
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const auditReady = selectedStoreId !== '' && selectedEmployeeId !== '';

  const loadProgram = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProgramById(params.programId);
      setProgram(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  }, [params.programId]);

  useEffect(() => { loadProgram(); }, [loadProgram]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
        <div className="h-4 w-32 rounded-lg bg-obsidian-700/30 animate-pulse" />
        <div className="glass rounded-xl p-6 space-y-4 animate-pulse">
          <div className="h-6 w-2/3 rounded-lg bg-obsidian-700/30" />
          <div className="h-4 w-1/2 rounded-lg bg-obsidian-700/20" />
        </div>
        <div className="glass rounded-xl p-4 animate-pulse">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-1 h-2 rounded-full bg-obsidian-700/30" />
            ))}
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-5 space-y-3 animate-pulse">
            <div className="h-5 w-3/4 rounded-lg bg-obsidian-700/20" />
            <div className="h-10 rounded-xl bg-obsidian-700/10" />
          </div>
        ))}
      </div>
    );
  }

  // ── Error ──
  if (error || !program) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
          </svg>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-obsidian-100">Unable to Load Checklist</h2>
          <p className="text-sm text-obsidian-400 max-w-sm">{error || 'Checklist not found'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadProgram} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-obsidian-600/30 bg-obsidian-800/60 text-obsidian-200 hover:border-obsidian-600/50 transition-colors">
            Retry
          </button>
          <Link href="/checklists" className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#0d8c63] to-[#F97316] text-white hover:from-[#087a56] hover:to-[#0d8c63] transition-colors">
            Back to Checklists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      {/* Breadcrumb */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center gap-2 text-xs text-obsidian-500">
          <Link href="/checklists" className="hover:text-obsidian-300 transition-colors">Checklists</Link>
          <span>/</span>
          <span className="text-obsidian-300">{program.name}</span>
        </div>
      </div>

      {/* ── Audit Header: Store + Employee Selection ── */}
      <div className="max-w-3xl mx-auto mb-6 relative z-40">
        <AuditHeader
          companyId={COMPANY_ID}
          auditor={{ id: user?.id ?? '', name: user?.name ?? 'Unknown', empId: user?.empId ?? 'AP001' }}
          onSelectionComplete={({ storeId, employeeId }) => {
            setSelectedStoreId(storeId);
            setSelectedEmployeeId(employeeId);
          }}
        />
      </div>

      {/* Submission Error Banner */}
      {submissionError && (
        <div className="max-w-3xl mx-auto mb-4">
          <div className="glass rounded-xl border border-red-500/20 p-4 flex items-center justify-between">
            <p className="text-sm text-red-400">{submissionError}</p>
            <button onClick={() => setSubmissionError(null)} className="text-xs text-red-400/60 underline">Dismiss</button>
          </div>
        </div>
      )}

      {/* Dynamic Checklist Renderer — only shown when store + employee are selected */}
      {auditReady ? (
        <ChecklistRenderer
          program={program}
          employeeId={selectedEmployeeId}
          storeId={selectedStoreId}
          onComplete={(submissionId) => {
            void submissionId;
          }}
          onError={(message) => setSubmissionError(message)}
        />
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-xl border border-obsidian-600/15 p-8 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-obsidian-800/60 mx-auto">
              <svg className="w-6 h-6 text-obsidian-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 3h1a2.251 2.251 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <p className="text-sm text-obsidian-300 font-medium">Select a store and employee above to begin</p>
            <p className="text-xs text-obsidian-500">The checklist questions will appear once both selections are made.</p>
          </div>
        </div>
      )}
    </div>
  );
}
