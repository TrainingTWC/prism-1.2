'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
} from '../../../lib/programs-api';
import type {
  Program,
  ProgramSection,
  ProgramQuestion,
  ProgramType,
  ProgramStatus,
  QuestionType,
  CreateQuestionInput,
  ScoringConfig,
} from '../../../types';

// ── Constants ──

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'TEXT', label: 'Text', icon: 'T' },
  { value: 'NUMBER', label: 'Number', icon: '#' },
  { value: 'YES_NO', label: 'Yes / No', icon: '✓' },
  { value: 'DROPDOWN', label: 'Dropdown', icon: '▾' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', icon: '◉' },
  { value: 'RATING_SCALE', label: 'Rating Scale', icon: '★' },
  { value: 'IMAGE_UPLOAD', label: 'Image Upload', icon: '📷' },
  { value: 'FILE_UPLOAD', label: 'File Upload', icon: '📎' },
  { value: 'SIGNATURE', label: 'Signature', icon: '✍' },
];

const TYPE_LABELS: Record<ProgramType, string> = {
  QA_AUDIT: 'QA Audit',
  TRAINING_ASSESSMENT: 'Training Assessment',
  CAMPUS_HIRING: 'Campus Hiring',
  COMPLIANCE_INSPECTION: 'Compliance Inspection',
  OPERATIONAL_SURVEY: 'Operational Survey',
  COMPETITION_SCORING: 'Competition Scoring',
  CUSTOM: 'Custom',
};

const STATUS_CONFIG: Record<ProgramStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  ACTIVE: { label: 'Active', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  ARCHIVED: { label: 'Archived', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
};

export default function ProgramBuilderPage({ params }: { params: { id: string } }) {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Expanded section state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  // Editing question panel
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  // New question target section
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  // Settings panel
  const [showSettings, setShowSettings] = useState(false);

  const isDraft = program?.status === 'DRAFT';

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchProgram = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProgram(params.id);
      setProgram(data);
      // Expand all sections by default
      setExpandedSections(new Set(data.sections.map((s) => s.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load program');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);

  // ── Program settings update ──
  async function handleUpdateProgram(updates: Partial<{
    name: string; description: string; type: ProgramType; department: string;
    scoringEnabled: boolean; offlineEnabled: boolean; imageUploadEnabled: boolean;
    geoLocationEnabled: boolean; signatureEnabled: boolean; scoringConfig: ScoringConfig;
  }>) {
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

  // ── Lifecycle ──
  async function handleActivate() {
    if (!program) return;
    try {
      const updated = await activateProgram(program.id);
      setProgram(updated);
      showToast('Program activated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed — ensure 1+ section with 1+ question');
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
      showToast('New version created — redirecting...');
      window.location.href = `/programs/${newProg.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version');
    }
  }

  // ── Sections ──
  async function handleAddSection() {
    if (!program || !isDraft) return;
    setSaving(true);
    try {
      await createSection(program.id, {
        title: `Section ${program.sections.length + 1}`,
        order: program.sections.length,
      });
      await fetchProgram();
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
      await fetchProgram();
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
      await fetchProgram();
      showToast('Section deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete section');
    } finally {
      setSaving(false);
    }
  }

  // ── Questions ──
  async function handleAddQuestion(sectionId: string, input: CreateQuestionInput) {
    if (!isDraft) return;
    setSaving(true);
    try {
      await createQuestion(sectionId, input);
      await fetchProgram();
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
      await fetchProgram();
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
      await fetchProgram();
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
      await fetchProgram();
      showToast('Question duplicated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate question');
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle section expand ──
  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── Loading / Error ──
  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-6 w-48 rounded-lg bg-white/[0.04] animate-pulse" />
        <div className="h-32 rounded-2xl bg-white/[0.03] animate-pulse" />
        <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (error && !program) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <div className="h-14 w-14 rounded-2xl bg-danger/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
          </svg>
        </div>
        <p className="text-foreground/50 text-sm">{error}</p>
        <button onClick={fetchProgram} className="btn-secondary text-sm">Retry</button>
      </div>
    );
  }

  if (!program) return null;

  const statusCfg = STATUS_CONFIG[program.status];
  const totalQuestions = program.sections.reduce((sum, s) => sum + s.questions.length, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fadeInUp">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-foreground/40 mb-6">
        <Link href="/programs" className="hover:text-foreground/70 transition-colors">Programs</Link>
        <span>/</span>
        <span className="text-foreground/70">{program.name}</span>
      </div>

      {/* ── Error bar ── */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="underline text-xs ml-3">Dismiss</button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="widget p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="badge" style={{ color: statusCfg.color, background: statusCfg.bg }}>
                {statusCfg.label}
              </span>
              <span className="text-xs text-foreground/30 font-mono">v{program.version}</span>
              <span className="text-xs text-foreground/30">{TYPE_LABELS[program.type]}</span>
              {program.department && <span className="text-xs text-foreground/30">· {program.department}</span>}
            </div>
            {isDraft ? (
              <input
                defaultValue={program.name}
                onBlur={(e) => { if (e.target.value !== program.name) handleUpdateProgram({ name: e.target.value }); }}
                className="text-xl font-bold text-foreground bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-primary transition-colors w-full"
              />
            ) : (
              <h1 className="text-xl font-bold text-foreground">{program.name}</h1>
            )}
            {isDraft ? (
              <textarea
                defaultValue={program.description ?? ''}
                placeholder="Add a description..."
                onBlur={(e) => handleUpdateProgram({ description: e.target.value })}
                className="mt-2 text-sm text-foreground/50 bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-primary transition-colors w-full resize-none"
                rows={2}
              />
            ) : program.description ? (
              <p className="mt-2 text-sm text-foreground/50">{program.description}</p>
            ) : null}
          </div>

          {/* Stats + Actions */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-4 text-xs text-foreground/40">
              <span>{program.sections.length} sections</span>
              <span>{totalQuestions} questions</span>
              {program._count?.submissions != null && <span>{program._count.submissions} submissions</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                Settings
              </button>
              {isDraft && (
                <button onClick={handleActivate} className="btn-success text-xs">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 5 5L20 7" /></svg>
                  Activate
                </button>
              )}
              {program.status === 'ACTIVE' && (
                <>
                  <button onClick={handleNewVersion} className="btn-primary text-xs">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
                    New Version
                  </button>
                  <button onClick={handleArchive} className="btn-secondary text-xs">Archive</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Settings Panel ── */}
      {showSettings && isDraft && (
        <SettingsPanel program={program} onUpdate={handleUpdateProgram} onClose={() => setShowSettings(false)} />
      )}

      {/* ── Sections + Questions ── */}
      <div className="space-y-4">
        {program.sections
          .sort((a, b) => a.order - b.order)
          .map((section, si) => (
            <SectionCard
              key={section.id}
              section={section}
              index={si}
              isDraft={isDraft}
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
        {isDraft && (
          <button onClick={handleAddSection} disabled={saving}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-white/[0.08] text-foreground/30 text-sm font-medium hover:border-primary/30 hover:text-primary/60 transition-all">
            + Add Section
          </button>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold shadow-xl animate-fadeInUp">
          {toast}
        </div>
      )}

      {/* ── Saving indicator ── */}
      {saving && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] backdrop-blur-md text-xs text-foreground/50">
          <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
//  Settings Panel
// ════════════════════════════════════════

function SettingsPanel({
  program,
  onUpdate,
  onClose,
}: {
  program: Program;
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
    <div className="widget p-6 mb-6 animate-fadeInUp">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Program Settings</h3>
        <button onClick={onClose} className="btn-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </div>

      {/* Program Type */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-foreground/40 mb-1.5 uppercase tracking-wider">Type</label>
          <select
            value={program.type}
            onChange={(e) => onUpdate({ type: e.target.value })}
            className="input"
          >
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground/40 mb-1.5 uppercase tracking-wider">Department</label>
          <input
            defaultValue={program.department ?? ''}
            onBlur={(e) => onUpdate({ department: e.target.value })}
            className="input"
            placeholder="e.g. Operations"
          />
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-3">
        {featureToggles.map((ft) => {
          const on = (program as unknown as Record<string, unknown>)[ft.key] === true;
          return (
            <div key={ft.key} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div>
                <div className="text-sm text-foreground/80 font-medium">{ft.label}</div>
                <div className="text-xs text-foreground/30">{ft.description}</div>
              </div>
              <button
                className="toggle"
                data-on={on.toString()}
                onClick={() => onUpdate({ [ft.key]: !on })}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Scoring Config */}
      {program.scoringEnabled && (
        <div className="mt-5 pt-5 border-t border-white/[0.06]">
          <h4 className="text-xs font-bold text-foreground/40 mb-3 uppercase tracking-wider">Scoring Configuration</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-foreground/30 mb-1">Passing Score</label>
              <input
                type="number"
                defaultValue={program.scoringConfig?.passingScore ?? 70}
                onBlur={(e) => onUpdate({ scoringConfig: { ...program.scoringConfig, passingScore: +e.target.value } })}
                className="input text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-foreground/30 mb-1">Max Score</label>
              <input
                type="number"
                defaultValue={program.scoringConfig?.maxScore ?? 100}
                onBlur={(e) => onUpdate({ scoringConfig: { ...program.scoringConfig, maxScore: +e.target.value } })}
                className="input text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-foreground/30 mb-1">Display</label>
              <select
                value={program.scoringConfig?.scoreDisplay ?? 'percentage'}
                onChange={(e) => onUpdate({ scoringConfig: { ...program.scoringConfig, scoreDisplay: e.target.value } })}
                className="input"
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

// ════════════════════════════════════════
//  Section Card
// ════════════════════════════════════════

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
    <div className="widget overflow-hidden animate-fadeInUp">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}>
        {/* Expand icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-foreground/30 transition-transform ${expanded ? 'rotate-90' : ''}`}>
          <path d="m9 18 6-6-6-6" />
        </svg>

        {/* Section number */}
        <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
          {index + 1}
        </span>

        {/* Title */}
        {editingTitle && isDraft ? (
          <input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={() => { setEditingTitle(false); if (titleValue !== section.title) onUpdate({ title: titleValue }); }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className="flex-1 text-sm font-semibold text-foreground bg-transparent outline-none border-b border-primary"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`flex-1 text-sm font-semibold text-foreground ${isDraft ? 'cursor-text hover:text-primary' : ''}`}
            onClick={(e) => { if (isDraft) { e.stopPropagation(); setEditingTitle(true); } }}
          >
            {section.title}
          </span>
        )}

        {/* Meta */}
        <span className="text-xs text-foreground/30 font-mono">
          {section.questions.length}q · w{section.weight}
        </span>

        {/* Actions */}
        {isDraft && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={onDelete} className="btn-icon" title="Delete section">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Questions */}
      {expanded && (
        <div className="border-t border-white/[0.04]">
          {section.questions
            .sort((a, b) => a.order - b.order)
            .map((q, qi) => (
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

          {/* Add question */}
          {isDraft && !addingQuestion && (
            <button onClick={onStartAddQuestion}
              className="w-full py-3 text-xs text-foreground/30 hover:text-primary/60 hover:bg-white/[0.02] transition-colors">
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

// ════════════════════════════════════════
//  Question Row
// ════════════════════════════════════════

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
    <div className="border-b border-white/[0.03] last:border-0">
      {/* Collapsed row */}
      <div
        className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer group"
        onClick={onEdit}
      >
        {/* Index */}
        <span className="text-[10px] font-mono text-foreground/20 w-5 text-right">{index + 1}</span>

        {/* Type icon */}
        <span className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs flex-shrink-0"
          title={typeInfo.label}>
          {typeInfo.icon}
        </span>

        {/* Text */}
        <span className="flex-1 text-sm text-foreground/70 truncate">{question.text}</span>

        {/* Badges */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
          {question.required && (
            <span className="px-1.5 py-0.5 rounded bg-danger/10 text-danger font-bold">REQ</span>
          )}
          {question.scoringEnabled && (
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">w{question.weight}</span>
          )}
          {question.allowImages && (
            <span className="px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-bold">IMG</span>
          )}
          <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-foreground/30 font-mono">{typeInfo.label}</span>
        </div>

        {/* Actions */}
        {isDraft && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={onDuplicate} className="btn-icon" title="Duplicate">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </button>
            <button onClick={onDelete} className="btn-icon" title="Delete">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Expanded Question Editor */}
      {isEditing && isDraft && (
        <QuestionEditor question={question} onUpdate={onUpdate} saving={saving} />
      )}
    </div>
  );
}

// ════════════════════════════════════════
//  Question Editor (inline)
// ════════════════════════════════════════

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
  const [options, setOptions] = useState<string[]>(question.options ?? []);
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
    <div className="px-5 pb-5 pt-2 bg-white/[0.01] border-t border-white/[0.04] animate-fadeInUp">
      <div className="space-y-4">
        {/* Question text */}
        <div>
          <label className="block text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">Question Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input"
            rows={2}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">Description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            placeholder="Help text for respondents..."
          />
        </div>

        {/* Type + Weight row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">Type</label>
            <select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)} className="input">
              {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">Weight</label>
            <input type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} className="input text-center" min={0} step={0.5} />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-xs text-foreground/60 cursor-pointer">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="accent-primary" />
              Required
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground/60 cursor-pointer">
              <input type="checkbox" checked={scoringEnabled} onChange={(e) => setScoringEnabled(e.target.checked)} className="accent-primary" />
              Scoring
            </label>
          </div>
        </div>

        {/* Options for dropdown / MC */}
        {needsOptions && (
          <div>
            <label className="block text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">Options</label>
            <div className="space-y-1.5">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-foreground/30 w-5 text-right">{i + 1}.</span>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    className="input flex-1"
                  />
                  <button onClick={() => removeOption(i)} className="btn-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/30 w-5 text-right">+</span>
                <input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addOption(); }}
                  className="input flex-1"
                  placeholder="Add option..."
                />
                <button onClick={addOption} className="btn-icon text-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media toggles */}
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 text-xs text-foreground/60 cursor-pointer">
            <input type="checkbox" checked={allowImages} onChange={(e) => setAllowImages(e.target.checked)} className="accent-primary" />
            Allow Images
          </label>
          <label className="flex items-center gap-2 text-xs text-foreground/60 cursor-pointer">
            <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} className="accent-primary" />
            Allow Comments
          </label>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving || !text.trim()} className="btn-primary text-xs">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  New Question Form
// ════════════════════════════════════════

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
    <div className="px-5 py-4 bg-primary/[0.03] border-t border-primary/10 animate-fadeInUp">
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">New Question</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="input" rows={2} placeholder="Enter your question..." autoFocus />
        </div>
        <div className="flex items-center gap-3">
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)} className="input w-auto">
            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} className="input w-20 text-center" min={0} step={0.5} />
          <label className="flex items-center gap-2 text-xs text-foreground/60 cursor-pointer">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="accent-primary" />
            Required
          </label>
          <div className="flex-1" />
          <button onClick={onCancel} className="btn-secondary text-xs">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !text.trim()} className="btn-primary text-xs">Add</button>
        </div>
      </div>
    </div>
  );
}
