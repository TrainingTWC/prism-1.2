'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { listPrograms, createProgram, deleteProgram, activateProgram, archiveProgram } from '../../lib/programs-api';
import type { ProgramListItem, ProgramType, ProgramStatus, CreateProgramInput } from '../../types';

// ── Constants ──

const PROGRAM_TYPES: { value: ProgramType; label: string }[] = [
  { value: 'QA_AUDIT', label: 'QA Audit' },
  { value: 'TRAINING_ASSESSMENT', label: 'Training Assessment' },
  { value: 'CAMPUS_HIRING', label: 'Campus Hiring' },
  { value: 'COMPLIANCE_INSPECTION', label: 'Compliance Inspection' },
  { value: 'OPERATIONAL_SURVEY', label: 'Operational Survey' },
  { value: 'COMPETITION_SCORING', label: 'Competition Scoring' },
  { value: 'CUSTOM', label: 'Custom' },
];

const STATUS_CONFIG: Record<ProgramStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  ACTIVE: { label: 'Active', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  ARCHIVED: { label: 'Archived', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
};

const TYPE_LABEL: Record<ProgramType, string> = {
  QA_AUDIT: 'QA Audit',
  TRAINING_ASSESSMENT: 'Training',
  CAMPUS_HIRING: 'Campus Hiring',
  COMPLIANCE_INSPECTION: 'Compliance',
  OPERATIONAL_SURVEY: 'Survey',
  COMPETITION_SCORING: 'Competition',
  CUSTOM: 'Custom',
};

// TODO: Replace with auth context / env var
const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export default function ProgramListPage() {
  const [programs, setPrograms] = useState<ProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | ''>('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPrograms({
        companyId: COMPANY_ID,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
        page: pagination.page,
        limit: 20,
      });
      setPrograms(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, pagination.page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Create program ──
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ProgramType>('CUSTOM');
  const [newDept, setNewDept] = useState('');

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const input: CreateProgramInput = {
        companyId: COMPANY_ID,
        name: newName.trim(),
        type: newType,
        department: newDept.trim() || undefined,
      };
      await createProgram(input);
      setShowCreate(false);
      setNewName('');
      setNewType('CUSTOM');
      setNewDept('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create program');
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusAction(id: string, action: 'activate' | 'archive' | 'delete') {
    try {
      if (action === 'activate') await activateProgram(id);
      else if (action === 'archive') await archiveProgram(id);
      else if (action === 'delete') {
        if (!confirm('Delete this program? This cannot be undone.')) return;
        await deleteProgram(id);
      }
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} program`);
    }
  }

  const totalQuestions = (p: ProgramListItem) =>
    p.sections.reduce((sum, s) => sum + (s._count?.questions ?? 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fadeInUp">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Programs</h1>
          <p className="text-sm text-foreground/40 mt-1">
            Create and manage checklists, audits, assessments, and surveys
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          New Program
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
          {(['', 'DRAFT', 'ACTIVE', 'ARCHIVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground/40 hover:text-foreground/70 hover:bg-white/[0.04]'
              }`}
            >
              {s === '' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground/20">
              <path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <p className="text-foreground/40 text-sm">No programs found. Create your first program to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {programs.map((p) => {
            const statusCfg = STATUS_CONFIG[p.status];
            return (
              <div key={p.id} className="widget px-5 py-4 flex items-center gap-4 group animate-fadeInUp">
                {/* Type icon */}
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${statusCfg.bg}` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={statusCfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/programs/${p.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-foreground/40">
                    <span className="badge" style={{ color: statusCfg.color, background: statusCfg.bg }}>
                      {statusCfg.label}
                    </span>
                    <span>{TYPE_LABEL[p.type]}</span>
                    {p.department && <><span>·</span><span>{p.department}</span></>}
                    <span>·</span>
                    <span>{p.sections.length} sections</span>
                    <span>·</span>
                    <span>{totalQuestions(p)} questions</span>
                    <span>·</span>
                    <span>v{p.version}</span>
                    {p._count?.submissions ? (
                      <><span>·</span><span>{p._count.submissions} submissions</span></>
                    ) : null}
                  </div>
                </div>

                {/* Feature flags */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {p.scoringEnabled && <FeatureFlag label="Scoring" />}
                  {p.offlineEnabled && <FeatureFlag label="Offline" />}
                  {p.imageUploadEnabled && <FeatureFlag label="Images" />}
                  {p.geoLocationEnabled && <FeatureFlag label="Geo" />}
                  {p.signatureEnabled && <FeatureFlag label="Signature" />}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/programs/${p.id}`} className="btn-icon" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                  </Link>
                  {p.status === 'DRAFT' && (
                    <button onClick={() => handleStatusAction(p.id, 'activate')} className="btn-icon" title="Activate">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><path d="m5 12 5 5L20 7" /></svg>
                    </button>
                  )}
                  {p.status === 'ACTIVE' && (
                    <button onClick={() => handleStatusAction(p.id, 'archive')} className="btn-icon" title="Archive">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></svg>
                    </button>
                  )}
                  {p.status === 'DRAFT' && (
                    <button onClick={() => handleStatusAction(p.id, 'delete')} className="btn-icon" title="Delete">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm text-foreground/40">
          <span>{pagination.total} programs total</span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="btn-secondary text-xs disabled:opacity-30"
            >
              Previous
            </button>
            <span className="flex items-center px-3 text-xs">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="btn-secondary text-xs disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeInUp"
          onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg glass rounded-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">New Program</h2>
              <button onClick={() => setShowCreate(false)} className="btn-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/50 mb-1.5 uppercase tracking-wider">Program Name *</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="e.g. Monthly QA Audit" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/50 mb-1.5 uppercase tracking-wider">Type</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value as ProgramType)} className="input">
                    {PROGRAM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/50 mb-1.5 uppercase tracking-wider">Department</label>
                  <input value={newDept} onChange={(e) => setNewDept(e.target.value)} className="input" placeholder="e.g. Operations" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={!newName.trim() || creating} className="btn-primary">
                {creating ? 'Creating...' : 'Create Program'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureFlag({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}>
      {label}
    </span>
  );
}
