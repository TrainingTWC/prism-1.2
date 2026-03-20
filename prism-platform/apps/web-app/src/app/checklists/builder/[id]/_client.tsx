'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  getProgram,
  updateProgram,
  activateProgram,
  archiveProgram,
  createVersion,
  createSection,
  updateSection,
  deleteSection,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
} from '@/lib/programs-api';
import type { CreateQuestionInput } from '@/lib/programs-api';
import type { ProgramDetail, ProgramSection, ProgramQuestion, QuestionType } from '@/types/checklist';

// ÔöÇÔöÇ Constants ÔöÇÔöÇ

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'TEXT', label: 'Text', icon: 'T' },
  { value: 'NUMBER', label: 'Number', icon: '#' },
  { value: 'YES_NO', label: 'Yes / No', icon: 'Ô£ô' },
  { value: 'DROPDOWN', label: 'Dropdown', icon: 'Ôû¥' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', icon: 'Ôùë' },
  { value: 'RATING_SCALE', label: 'Rating Scale', icon: 'Ôÿà' },
  { value: 'IMAGE_UPLOAD', label: 'Image Upload', icon: '­ƒôÀ' },
  { value: 'FILE_UPLOAD', label: 'File Upload', icon: '­ƒôÄ' },
  { value: 'SIGNATURE', label: 'Signature', icon: 'Ô£ì' },
];

const TYPE_LABELS: Record<string, string> = {
  QA_AUDIT: 'QA Audit',
  TRAINING_ASSESSMENT: 'Training Assessment',
  CAMPUS_HIRING: 'Campus Hiring',
  COMPLIANCE_INSPECTION: 'Compliance Inspection',
  OPERATIONAL_SURVEY: 'Operational Survey',
  COMPETITION_SCORING: 'Competition Scoring',
  CUSTOM: 'Custom',
};

const STATUS_CONFIG: Record<string, { label: string; text: string; bg: string; border: string }> = {
  DRAFT:    { label: 'Draft',    text: 'text-amber-400',    bg: 'bg-amber-500/10',    border: 'border-amber-500/20' },
  ACTIVE:   { label: 'Active',   text: 'text-emerald-400',  bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20' },
  ARCHIVED: { label: 'Archived', text: 'text-obsidian-400', bg: 'bg-obsidian-500/10', border: 'border-obsidian-500/20' },
};

export default function ProgramBuilderPage({ params }: { params: { id: string } }) {
  const { canEdit } = useAuth();
  const router = useRouter();

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const isDraft = program?.status === 'DRAFT';

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchProg = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProgram(params.id);
      setProgram(data);
      setExpandedSections(new Set(data.sections.map((s: ProgramSection) => s.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load program');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchProg(); }, [fetchProg]);

  // ÔöÇÔöÇ Program settings update ÔöÇÔöÇ
  async function handleUpdateProgram(updates: Record<string, unknown>) {
    if (!program || !isDraft) return;
    setSaving(true);
    try {
      const updated = await updateProgram(program.id, updates);
      setProgram(updated);
      showToast('Program updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  // ÔöÇÔöÇ Lifecycle ÔöÇÔöÇ
  async function handleActivate() {
    if (!program) return;
    try {
      const updated = await activateProgram(program.id);
      setProgram(updated);
      showToast('Program activated!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed ÔÇö ensure 1+ section with 1+ question');
    }
  }

  async function handleArchive() {
    if (!program) return;
    try {
      const updated = await archiveProgram(program.id);
      setProgram(updated);
      showToast('Program archived');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive');
    }
  }

  async function handleNewVersion() {
    if (!program) return;
    try {
      const newProg = await createVersion(program.id);
      showToast('New version created ÔÇö redirecting...');
      router.push(`/checklists/builder/${newProg.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version');
    }
  }

  // ÔöÇÔöÇ Sections ÔöÇÔöÇ
  async function handleAddSection() {
    if (!program || !isDraft) return;
    setSaving(true);
    try {
      await createSection(program.id, {
        title: `Section ${program.sections.length + 1}`,
        order: program.sections.length,
      });
      await fetchProg();
      showToast('Section added');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add section');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSection(sectionId: string, updates: { title?: string; description?: string; weight?: number }) {
    if (!isDraft) return;
    setSaving(true);
    try {
      await updateSection(sectionId, updates);
      await fetchProg();
      showToast('Section updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update section');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!isDraft || !confirm('Delete this section and all its questions?')) return;
    setSaving(true);
    try {
      await deleteSection(sectionId);
      await fetchProg();
      showToast('Section deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete section');
    } finally {
      setSaving(false);
    }
  }

  // ÔöÇÔöÇ Questions ÔöÇÔöÇ
  async function handleAddQuestion(sectionId: string, input: CreateQuestionInput) {
    if (!isDraft) return;
    setSaving(true);
    try {
      await createQuestion(sectionId, input);
      await fetchProg();
      setAddingToSection(null);
      showToast('Question added');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateQuestion(questionId: string, updates: Partial<CreateQuestionInput>) {
    if (!isDraft) return;
    setSaving(true);
    try {
      await updateQuestion(questionId, updates);
      await fetchProg();
      setEditingQuestion(null);
      showToast('Question updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!isDraft || !confirm('Delete this question?')) return;
    setSaving(true);
    try {
      await deleteQuestion(questionId);
      await fetchProg();
      showToast('Question deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicateQuestion(questionId: string) {
    if (!isDraft) return;
    setSaving(true);
    try {
      await duplicateQuestion(questionId);
      await fetchProg();
      showToast('Question duplicated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate question');
    } finally {
      setSaving(false);
    }
  }

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ÔöÇÔöÇ Loading / Error ÔöÇÔöÇ
  if (loading) {
    return (
      <div className="p-2 max-w-5xl mx-auto space-y-6">
        <div className="h-6 w-48 rounded-lg bg-obsidian-700/30 animate-pulse" />
        <div className="h-32 rounded-2xl bg-obsidian-700/15 animate-pulse" />
        <div className="h-64 rounded-2xl bg-obsidian-700/15 animate-pulse" />
      </div>
    );
  }

  if (error && !program) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
          </svg>
        </div>
        <p className="text-obsidian-400 text-sm">{error}</p>
        <button onClick={fetchProg} className="px-4 py-2 rounded-xl bg-obsidian-800/60 border border-obsidian-600/30 text-sm text-obsidian-300 hover:text-obsidian-100 transition-colors">Retry</button>
      </div>
    );
  }

  if (!program) return null;

  const statusCfg = STATUS_CONFIG[program.status] ?? STATUS_CONFIG.DRAFT;
  const totalQuestions = program.sections.reduce((sum: number, s: ProgramSection) => sum + s.questions.length, 0);

  return (
    <div className="max-w-5xl mx-auto animate-fadeInUp">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-obsidian-500 mb-6">
        <Link href="/checklists" className="hover:text-obsidian-300 transition-colors">Checklists</Link>
        <span>/</span>
        <span className="text-obsidian-300">{program.name}</span>
      </div>

      {/* Error bar */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="underline text-xs ml-3">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] backdrop-blur-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${statusCfg.text} ${statusCfg.bg} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
              <span className="text-xs text-obsidian-500 font-mono">v{program.version}</span>
              <span className="text-xs text-obsidian-500">{TYPE_LABELS[program.type] ?? program.type}</span>
            </div>
            {isDraft && canEdit ? (
              <input
                defaultValue={program.name}
                onBlur={(e) => { if (e.target.value !== program.name) handleUpdateProgram({ name: e.target.value }); }}
                className="text-xl font-bold text-obsidian-100 bg-transparent outline-none border-b border-transparent hover:border-obsidian-600/30 focus:border-[#0d8c63]/40 transition-colors w-full"
              />
            ) : (
              <h1 className="text-xl font-bold text-obsidian-100">{program.name}</h1>
            )}
            {isDraft && canEdit ? (
              <textarea
                defaultValue={program.description ?? ''}
                placeholder="Add a description..."
                onBlur={(e) => handleUpdateProgram({ description: e.target.value })}
                className="mt-2 text-sm text-obsidian-400 bg-transparent outline-none border-b border-transparent hover:border-obsidian-600/30 focus:border-[#0d8c63]/40 transition-colors w-full resize-none"
                rows={2}
              />
            ) : program.description ? (
              <p className="mt-2 text-sm text-obsidian-400">{program.description}</p>
            ) : null}
          </div>

          {/* Stats + Actions */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-4 text-xs text-obsidian-500">
              <span>{program.sections.length} sections</span>
              <span>{totalQuestions} questions</span>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className="px-3 py-1.5 rounded-xl bg-obsidian-800/60 border border-obsidian-600/30 text-xs text-obsidian-300 hover:text-obsidian-100 transition-colors flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                  Settings
                </button>
                {isDraft && (
                  <button onClick={handleActivate} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 5 5L20 7" /></svg>
                    Activate
                  </button>
                )}
                {program.status === 'ACTIVE' && (
                  <>
                    <button onClick={handleNewVersion} className="px-3 py-1.5 rounded-xl bg-[#0d8c63]/10 border border-[#0d8c63]/20 text-xs text-[#F97316] font-bold hover:bg-[#0d8c63]/20 transition-colors flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
                      New Version
                    </button>
                    <button onClick={handleArchive} className="px-3 py-1.5 rounded-xl bg-obsidian-800/60 border border-obsidian-600/30 text-xs text-obsidian-400 hover:text-obsidian-200 transition-colors">Archive</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && isDraft && canEdit && (
        <SettingsPanel program={program} onUpdate={handleUpdateProgram} onClose={() => setShowSettings(false)} />
      )}

      {/* Sections + Questions */}
      <div className="space-y-4">
        {program.sections
          .sort((a: ProgramSection, b: ProgramSection) => a.order - b.order)
          .map((section: ProgramSection, si: number) => (
            <SectionCard
              key={section.id}
              section={section}
              index={si}
              isDraft={isDraft && canEdit}
              expanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              onUpdate={(u) => handleUpdateSection(section.id, u)}
              onDelete={() => handleDeleteSection(section.id)}
              editingQuestion={editingQuestion}
              onEditQuestion={setEditingQuestion}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onDuplicateQuestion={handleDuplicateQuestion}
              addingQuestion={addingToSection === section.id}
              onStartAddQuestion={() => setAddingToSection(section.id)}
              onCancelAddQuestion={() => setAddingToSection(null)}
              onAddQuestion={(input) => handleAddQuestion(section.id, input)}
              saving={saving}
            />
          ))}

        {/* Add Section */}
        {isDraft && canEdit && (
          <button onClick={handleAddSection} disabled={saving}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-obsidian-600/20 text-obsidian-500 text-sm font-medium hover:border-[#0d8c63]/30 hover:text-[#F97316]/60 transition-all">
            + Add Section
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#0d8c63] text-white text-sm font-semibold shadow-xl shadow-[#0d8c63]/20 animate-fadeInUp">
          {toast}
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-obsidian-800/80 backdrop-blur-md border border-obsidian-600/30 text-xs text-obsidian-400">
          <div className="h-3 w-3 border-2 border-[#0d8c63] border-t-transparent rounded-full animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  Settings Panel
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

function SettingsPanel({
  program,
  onUpdate,
  onClose,
}: {
  program: ProgramDetail;
  onUpdate: (u: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const featureToggles: { key: string; label: string; description: string }[] = [
    { key: 'scoringEnabled', label: 'Scoring', description: 'Enable weighted scoring for questions' },
    { key: 'offlineEnabled', label: 'Offline Mode', description: 'Allow submissions without internet' },
    { key: 'imageUploadEnabled', label: 'Image Upload', description: 'Enable photo capture on questions' },
    { key: 'geoLocationEnabled', label: 'Geo-location', description: 'Capture GPS coordinates on submit' },
    { key: 'signatureEnabled', label: 'Digital Signature', description: 'Require signature on submission' },
  ];

  return (
    <div className="rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] backdrop-blur-xl p-6 mb-6 animate-fadeInUp">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-obsidian-200 uppercase tracking-wider">Program Settings</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-obsidian-700/50 text-obsidian-400 hover:text-obsidian-200 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </div>

      {/* Program Type */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-obsidian-500 mb-1.5 uppercase tracking-wider">Type</label>
          <select
            value={program.type}
            onChange={(e) => onUpdate({ type: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none focus:ring-1 focus:ring-[#0d8c63]/20"
          >
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-obsidian-500 mb-1.5 uppercase tracking-wider">Department</label>
          <input
            defaultValue={(program as unknown as Record<string, string>).department ?? ''}
            onBlur={(e) => onUpdate({ department: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none focus:ring-1 focus:ring-[#0d8c63]/20"
            placeholder="e.g. Operations"
          />
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-3">
        {featureToggles.map((ft) => {
          const on = (program as unknown as Record<string, unknown>)[ft.key] === true;
          return (
            <div key={ft.key} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-obsidian-800/30 transition-colors">
              <div>
                <div className="text-sm text-obsidian-200 font-medium">{ft.label}</div>
                <div className="text-xs text-obsidian-500">{ft.description}</div>
              </div>
              <button
                onClick={() => onUpdate({ [ft.key]: !on })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-[#0d8c63]' : 'bg-obsidian-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Scoring Config */}
      {program.scoringEnabled && (
        <div className="mt-5 pt-5 border-t border-obsidian-600/20">
          <h4 className="text-xs font-bold text-obsidian-500 mb-3 uppercase tracking-wider">Scoring Configuration</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-obsidian-500 mb-1">Passing Score</label>
              <input
                type="number"
                defaultValue={70}
                onBlur={(e) => onUpdate({ scoringConfig: { passingScore: +e.target.value } })}
                className="w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-obsidian-500 mb-1">Max Score</label>
              <input
                type="number"
                defaultValue={100}
                onBlur={(e) => onUpdate({ scoringConfig: { maxScore: +e.target.value } })}
                className="w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-obsidian-500 mb-1">Display</label>
              <select
                defaultValue="percentage"
                onChange={(e) => onUpdate({ scoringConfig: { scoreDisplay: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none"
              >
                <option value="percentage">Percentage</option>
                <option value="points">Points</option>
                <option value="grade">Grade</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  Section Card
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

function SectionCard({
  section,
  index,
  isDraft,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  editingQuestion,
  onEditQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  addingQuestion,
  onStartAddQuestion,
  onCancelAddQuestion,
  onAddQuestion,
  saving,
}: {
  section: ProgramSection;
  index: number;
  isDraft: boolean;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (u: { title?: string; description?: string; weight?: number }) => void;
  onDelete: () => void;
  editingQuestion: string | null;
  onEditQuestion: (id: string | null) => void;
  onUpdateQuestion: (id: string, u: Partial<CreateQuestionInput>) => void;
  onDeleteQuestion: (id: string) => void;
  onDuplicateQuestion: (id: string) => void;
  addingQuestion: boolean;
  onStartAddQuestion: () => void;
  onCancelAddQuestion: () => void;
  onAddQuestion: (input: CreateQuestionInput) => void;
  saving: boolean;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(section.title);

  return (
    <div className="rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] backdrop-blur-xl overflow-hidden animate-fadeInUp">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-obsidian-800/30 transition-colors"
        onClick={onToggle}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-obsidian-500 transition-transform ${expanded ? 'rotate-90' : ''}`}>
          <path d="m9 18 6-6-6-6" />
        </svg>

        <span className="h-7 w-7 rounded-lg bg-[#0d8c63]/10 flex items-center justify-center text-xs font-bold text-[#F97316] flex-shrink-0">
          {index + 1}
        </span>

        {editingTitle && isDraft ? (
          <input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={() => { setEditingTitle(false); if (titleValue !== section.title) onUpdate({ title: titleValue }); }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className="flex-1 text-sm font-semibold text-obsidian-100 bg-transparent outline-none border-b border-[#0d8c63]/40"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`flex-1 text-sm font-semibold text-obsidian-200 ${isDraft ? 'cursor-text hover:text-[#F97316]' : ''}`}
            onClick={(e) => { if (isDraft) { e.stopPropagation(); setEditingTitle(true); } }}
          >
            {section.title}
          </span>
        )}

        <span className="text-xs text-obsidian-500 font-mono">
          {section.questions.length}q ┬À w{section.weight}
        </span>

        {isDraft && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-obsidian-500 hover:text-red-400 transition-colors" title="Delete section">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Questions */}
      {expanded && (
        <div className="border-t border-obsidian-600/15">
          {section.questions
            .sort((a: ProgramQuestion, b: ProgramQuestion) => a.order - b.order)
            .map((q: ProgramQuestion, qi: number) => (
              <QuestionRow
                key={q.id}
                question={q}
                index={qi}
                isDraft={isDraft}
                isEditing={editingQuestion === q.id}
                onEdit={() => onEditQuestion(editingQuestion === q.id ? null : q.id)}
                onUpdate={(u) => onUpdateQuestion(q.id, u)}
                onDelete={() => onDeleteQuestion(q.id)}
                onDuplicate={() => onDuplicateQuestion(q.id)}
                saving={saving}
              />
            ))}

          {isDraft && !addingQuestion && (
            <button onClick={onStartAddQuestion}
              className="w-full py-3 text-xs text-obsidian-500 hover:text-[#F97316]/60 hover:bg-obsidian-800/20 transition-colors">
              + Add Question
            </button>
          )}

          {addingQuestion && (
            <NewQuestionForm
              onSubmit={onAddQuestion}
              onCancel={onCancelAddQuestion}
              saving={saving}
              order={section.questions.length}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  Question Row
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

function QuestionRow({
  question,
  index,
  isDraft,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onDuplicate,
  saving,
}: {
  question: ProgramQuestion;
  index: number;
  isDraft: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (u: Partial<CreateQuestionInput>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  saving: boolean;
}) {
  const typeInfo = QUESTION_TYPES.find((t) => t.value === question.questionType) ?? { icon: '?', label: question.questionType };

  return (
    <div className="border-b border-obsidian-600/10 last:border-0">
      <div
        className="flex items-center gap-3 px-5 py-3 hover:bg-obsidian-800/20 transition-colors cursor-pointer group"
        onClick={onEdit}
      >
        <span className="text-[10px] font-mono text-obsidian-600 w-5 text-right">{index + 1}</span>

        <span className="h-7 w-7 rounded-lg bg-obsidian-700/40 flex items-center justify-center text-xs flex-shrink-0"
          title={typeInfo.label}>
          {typeInfo.icon}
        </span>

        <span className="flex-1 text-sm text-obsidian-300 truncate">{question.text}</span>

        <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
          {question.required && (
            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold">REQ</span>
          )}
          {question.scoringEnabled && (
            <span className="px-1.5 py-0.5 rounded bg-[#0d8c63]/10 text-[#F97316] font-bold">w{question.weight}</span>
          )}
          {question.allowImages && (
            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold">IMG</span>
          )}
          <span className="px-1.5 py-0.5 rounded bg-obsidian-700/30 text-obsidian-500 font-mono">{typeInfo.label}</span>
        </div>

        {isDraft && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-obsidian-700/40 text-obsidian-500 hover:text-obsidian-200 transition-colors" title="Duplicate">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-obsidian-500 hover:text-red-400 transition-colors" title="Delete">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isEditing && isDraft && (
        <QuestionEditor question={question} onUpdate={onUpdate} saving={saving} />
      )}
    </div>
  );
}

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  Question Editor (inline)
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

function QuestionEditor({
  question,
  onUpdate,
  saving,
}: {
  question: ProgramQuestion;
  onUpdate: (u: Partial<CreateQuestionInput>) => void;
  saving: boolean;
}) {
  const [text, setText] = useState(question.text);
  const [description, setDescription] = useState(question.description ?? '');
  const [questionType, setQuestionType] = useState<QuestionType>(question.questionType);
  const [weight, setWeight] = useState(question.weight);
  const [required, setRequired] = useState(question.required);
  const [scoringEnabled, setScoringEnabled] = useState(question.scoringEnabled);
  const [allowImages, setAllowImages] = useState(question.allowImages);
  const [allowComments, setAllowComments] = useState(question.allowComments);
  const [options, setOptions] = useState<string[]>((question.options as unknown as string[]) ?? []);
  const [newOption, setNewOption] = useState('');

  const needsOptions = ['DROPDOWN', 'MULTIPLE_CHOICE'].includes(questionType);

  function handleSave() {
    const updates: Partial<CreateQuestionInput> = {};
    if (text !== question.text) updates.text = text;
    if (description !== (question.description ?? '')) updates.description = description;
    if (questionType !== question.questionType) updates.questionType = questionType;
    if (weight !== question.weight) updates.weight = weight;
    if (required !== question.required) updates.required = required;
    if (scoringEnabled !== question.scoringEnabled) updates.scoringEnabled = scoringEnabled;
    if (allowImages !== question.allowImages) updates.allowImages = allowImages;
    if (allowComments !== question.allowComments) updates.allowComments = allowComments;
    if (JSON.stringify(options) !== JSON.stringify(question.options)) updates.options = options;

    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
  }

  function addOption() {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  }

  function removeOption(i: number) {
    setOptions(options.filter((_, idx) => idx !== i));
  }

  return (
    <div className="px-5 pb-5 pt-2 bg-obsidian-800/20 border-t border-obsidian-600/15 animate-fadeInUp">
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-obsidian-500 mb-1 uppercase tracking-wider">Question Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none focus:ring-1 focus:ring-[#0d8c63]/20"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-obsidian-500 mb-1 uppercase tracking-wider">Description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none focus:ring-1 focus:ring-[#0d8c63]/20"
            placeholder="Help text for respondents..."
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-obsidian-500 mb-1 uppercase tracking-wider">Type</label>
            <select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)} className="w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none">
              {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-obsidian-500 mb-1 uppercase tracking-wider">Weight</label>
            <input type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none text-center" min={0} step={0.5} />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-xs text-obsidian-400 cursor-pointer">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="accent-[#0d8c63]" />
              Required
            </label>
            <label className="flex items-center gap-2 text-xs text-obsidian-400 cursor-pointer">
              <input type="checkbox" checked={scoringEnabled} onChange={(e) => setScoringEnabled(e.target.checked)} className="accent-[#0d8c63]" />
              Scoring
            </label>
          </div>
        </div>

        {needsOptions && (
          <div>
            <label className="block text-[10px] font-bold text-obsidian-500 mb-1 uppercase tracking-wider">Options</label>
            <div className="space-y-1.5">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-obsidian-500 w-5 text-right">{i + 1}.</span>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none"
                  />
                  <button onClick={() => removeOption(i)} className="p-1 rounded hover:bg-red-500/10 text-obsidian-500 hover:text-red-400 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-xs text-obsidian-500 w-5 text-right">+</span>
                <input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addOption(); }}
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none"
                  placeholder="Add option..."
                />
                <button onClick={addOption} className="p-1 rounded hover:bg-[#0d8c63]/10 text-obsidian-500 hover:text-[#F97316] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 text-xs text-obsidian-400 cursor-pointer">
            <input type="checkbox" checked={allowImages} onChange={(e) => setAllowImages(e.target.checked)} className="accent-[#0d8c63]" />
            Allow Images
          </label>
          <label className="flex items-center gap-2 text-xs text-obsidian-400 cursor-pointer">
            <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} className="accent-[#0d8c63]" />
            Allow Comments
          </label>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving || !text.trim()} className="px-4 py-2 rounded-xl bg-[#0d8c63] hover:bg-[#0d9e6f] disabled:opacity-40 text-white text-xs font-bold transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
//  New Question Form
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

function NewQuestionForm({
  onSubmit,
  onCancel,
  saving,
  order,
}: {
  onSubmit: (input: CreateQuestionInput) => void;
  onCancel: () => void;
  saving: boolean;
  order: number;
}) {
  const [text, setText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('YES_NO');
  const [required, setRequired] = useState(false);
  const [weight, setWeight] = useState(1);

  function handleSubmit() {
    if (!text.trim()) return;
    onSubmit({
      questionType,
      text: text.trim(),
      order,
      weight,
      required,
      scoringEnabled: true,
    });
  }

  return (
    <div className="px-5 py-4 bg-[#0d8c63]/[0.03] border-t border-[#0d8c63]/10 animate-fadeInUp">
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-obsidian-500 mb-1 uppercase tracking-wider">New Question</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none focus:ring-1 focus:ring-[#0d8c63]/20" rows={2} placeholder="Enter your question..." autoFocus />
        </div>
        <div className="flex items-center gap-3">
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)} className="px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none w-auto">
            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} className="w-20 px-3 py-2 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/30 text-obsidian-200 outline-none text-center" min={0} step={0.5} />
          <label className="flex items-center gap-2 text-xs text-obsidian-400 cursor-pointer">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="accent-[#0d8c63]" />
            Required
          </label>
          <div className="flex-1" />
          <button onClick={onCancel} className="px-3 py-1.5 rounded-xl bg-obsidian-800/60 border border-obsidian-600/30 text-xs text-obsidian-400 hover:text-obsidian-200 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !text.trim()} className="px-4 py-1.5 rounded-xl bg-[#0d8c63] hover:bg-[#0d9e6f] disabled:opacity-40 text-white text-xs font-bold transition-colors">Add</button>
        </div>
      </div>
    </div>
  );
}