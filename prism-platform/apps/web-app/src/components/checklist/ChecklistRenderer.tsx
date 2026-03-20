'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ProgramDetail,
  ResponseInput,
  OfflineDraft,
} from '../../types/checklist';
import type { FailedQuestion } from '../../types/follow-up';
import { SectionRenderer } from './SectionRenderer';
import { TsaGroupRenderer } from './TsaGroupRenderer';
import { GeoCapture } from './GeoCapture';
import { FollowUpBanner } from '../follow-up/FollowUpBanner';
import { validateChecklist } from '../../lib/checklist-validation';
import { detectFailedQuestions } from '../../lib/follow-up-detection';
import { createFollowUp } from '../../lib/follow-up-api';
import {
  saveDraftOffline,
  addToSyncQueue,
  isOnline,
  onOnlineChange,
} from '../../lib/offline-store';
import {
  createSubmission,
  saveDraft as saveDraftApi,
  submitFinal as submitFinalApi,
  uploadImage,
} from '../../lib/submission-api';

// ── Props ──

interface Props {
  program: ProgramDetail;
  employeeId: string;
  storeId: string;
  /** Optional existing draft to resume */
  existingDraftId?: string;
  existingResponses?: ResponseInput[];
  onComplete?: (submissionId: string) => void;
  onError?: (message: string) => void;
}

// ── Helpers ──

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const AUTOSAVE_INTERVAL = 15_000; // 15 seconds

// ════════════════════════════════════════════════════════════════
//  ChecklistRenderer
// ════════════════════════════════════════════════════════════════

export function ChecklistRenderer({
  program,
  employeeId,
  storeId,
  existingDraftId,
  existingResponses,
  onComplete,
  onError,
}: Props) {
  // ── State ──
  const [responses, setResponses] = useState<Map<string, ResponseInput>>(() => {
    const map = new Map<string, ResponseInput>();
    if (existingResponses) {
      for (const r of existingResponses) {
        map.set(r.questionId, r);
      }
    }
    return map;
  });

  const [submissionId, setSubmissionId] = useState<string | null>(existingDraftId ?? null);
  const [localDraftId] = useState(() => existingDraftId ?? generateId());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [online, setOnline] = useState(() => isOnline());
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [geoLat, setGeoLat] = useState<number | undefined>();
  const [geoLng, setGeoLng] = useState<number | undefined>();
  const [failedQuestions, setFailedQuestions] = useState<FailedQuestion[]>([]);
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);
  const [followUpCreated, setFollowUpCreated] = useState(false);

  // ── Employee list for per-section employee selector (TSA / Audit) ──
  const [sectionEmployees, setSectionEmployees] = useState<{ id: string; name: string; empId: string }[]>([]);
  useEffect(() => {
    const needsEmployees =
      program.type === 'TRAINING_ASSESSMENT' ||
      program.type === 'QA_AUDIT' ||
      program.type === 'COMPLIANCE_INSPECTION';
    if (!needsEmployees) return;
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    (async () => {
      try {
        const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
        const res = await fetch(`${API}/api/employees?companyId=${COMPANY_ID}&active=true`);
        const json = await res.json();
        const list = (json.data ?? []).map((e: any) => ({ id: e.id, name: e.name, empId: e.empId }));
        setSectionEmployees(list);
      } catch { /* ignore */ }
    })();
  }, [program.type]);

  const autosaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(new Date().toISOString());

  // ── Online/offline listener ──
  useEffect(() => {
    return onOnlineChange(setOnline);
  }, []);

  // ── Response updater ──
  const handleResponseChange = useCallback(
    (questionId: string, response: ResponseInput) => {
      setResponses((prev) => {
        const next = new Map(prev);
        next.set(questionId, { ...response, questionId });
        return next;
      });
      // Clear error when user answers
      setErrors((prev) => {
        if (prev.has(questionId)) {
          const next = new Map(prev);
          next.delete(questionId);
          return next;
        }
        return prev;
      });
    },
    [],
  );

  // ── Get all responses as array ──
  const getResponseArray = useCallback((): ResponseInput[] => {
    return Array.from(responses.values());
  }, [responses]);

  // ── Save to IndexedDB ──
  const saveLocalDraft = useCallback(async () => {
    const draft: OfflineDraft = {
      id: localDraftId,
      programId: program.id,
      employeeId,
      storeId,
      responses: getResponseArray(),
      geoLat,
      geoLng,
      deviceId: navigator.userAgent.slice(0, 100),
      startedAt: startedAt.current,
      updatedAt: new Date().toISOString(),
      synced: false,
    };
    await saveDraftOffline(draft);
  }, [localDraftId, program.id, employeeId, storeId, getResponseArray, geoLat, geoLng]);

  // ── Save draft to server ──
  const saveServerDraft = useCallback(async () => {
    if (!online) return;

    setSaving(true);
    try {
      // Create server submission if we don't have one
      if (!submissionId) {
        const sub = await createSubmission({
          programId: program.id,
          employeeId,
          storeId,
          geoLat,
          geoLng,
          isOffline: false,
        });
        setSubmissionId(sub.id);
        await saveDraftApi(sub.id, {
          responses: getResponseArray(),
          geoLat,
          geoLng,
        });
      } else {
        await saveDraftApi(submissionId, {
          responses: getResponseArray(),
          geoLat,
          geoLng,
        });
      }
    } catch (err: any) {
      onError?.(err.message ?? 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }, [online, submissionId, program.id, employeeId, storeId, geoLat, geoLng, getResponseArray, onError]);

  // ── Autosave ──
  useEffect(() => {
    autosaveTimer.current = setInterval(async () => {
      await saveLocalDraft();
      if (online) {
        await saveServerDraft();
      }
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
    };
  }, [saveLocalDraft, saveServerDraft, online]);

  // ── File upload handler ──
  const handleUpload = useCallback(
    async (file: File): Promise<string> => {
      // Convert to base64 data URL as a reliable local fallback
      const toDataUrl = (): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('File read failed'));
          reader.readAsDataURL(file);
        });

      if (!online) {
        return toDataUrl();
      }

      try {
        return await uploadImage(file);
      } catch {
        // Server upload unavailable — fall back to local data URL
        return toDataUrl();
      }
    },
    [online],
  );

  // ── Geo capture ──
  const handleGeoCapture = useCallback((geo: { lat: number; lng: number }) => {
    setGeoLat(geo.lat);
    setGeoLng(geo.lng);
  }, []);

  // ── Navigation ──
  // (unused — all sections visible at once)

  // ── Validate current section ──
  // (unused — all-at-once validation in handleSubmit)

  // ── Submit ──
  const handleSubmit = async () => {
    // Validate all sections
    const allErrors = validateChecklist(program.sections, getResponseArray());
    if (allErrors.length > 0) {
      const errMap = new Map<string, string>();
      for (const e of allErrors) {
        errMap.set(e.questionId, e.message);
      }
      setErrors(errMap);

      // Scroll to first question with an error
      const firstErrorId = allErrors[0]?.questionId;
      if (firstErrorId) {
        const el = document.getElementById(`q-${firstErrorId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      onError?.(`Please fix ${allErrors.length} error(s) before submitting`);
      return;
    }

    setSubmitting(true);

    try {
      if (online) {
        // Online submit
        let sid = submissionId;
        if (!sid) {
          const sub = await createSubmission({
            programId: program.id,
            employeeId,
            storeId,
            geoLat,
            geoLng,
          });
          sid = sub.id;
          setSubmissionId(sid);
        }

        await submitFinalApi(sid, {
          responses: getResponseArray(),
          geoLat,
          geoLng,
        });

        // ── Detect failed responses for follow-up ──
        const failed = detectFailedQuestions(program, getResponseArray());
        if (failed.length > 0) {
          setFailedQuestions(failed);
        }

        setSubmitted(true);
        onComplete?.(sid);
      } else {
        // Offline: queue for sync
        const syncItem = {
          id: localDraftId,
          programId: program.id,
          employeeId,
          storeId,
          responses: getResponseArray(),
          geoLat,
          geoLng,
          deviceId: navigator.userAgent.slice(0, 100),
          startedAt: startedAt.current,
          submittedAt: new Date().toISOString(),
        };
        await addToSyncQueue(syncItem);
        await saveLocalDraft();

        // ── Detect failed responses for follow-up (offline too) ──
        const failed = detectFailedQuestions(program, getResponseArray());
        if (failed.length > 0) {
          setFailedQuestions(failed);
        }

        setSubmitted(true);
        onComplete?.(localDraftId);
      }
    } catch (err: any) {
      onError?.(err.message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Follow-up creation handler ──
  const handleCreateFollowUp = useCallback(async () => {
    if (failedQuestions.length === 0 || !submissionId) return;
    setCreatingFollowUp(true);
    try {
      await createFollowUp({
        originalSubmissionId: submissionId,
        programId: program.id,
        storeId,
        companyId: program.companyId,
        assignedToId: employeeId, // In production, this would be the Area Manager
        createdById: employeeId,
        title: `Follow-Up: ${program.name}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: failedQuestions.map((fq) => ({
          originalQuestionId: fq.questionId,
          originalResponseId: fq.responseId,
          issueDescription: fq.issueDescription,
          originalAnswer: fq.originalAnswer,
        })),
      });
      setFollowUpCreated(true);
    } catch (err: any) {
      onError?.(err.message ?? 'Failed to create follow-up');
    } finally {
      setCreatingFollowUp(false);
    }
  }, [failedQuestions, submissionId, program, storeId, employeeId, onError]);

  // ── Render ──

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-12">
        {/* Success message */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-obsidian-100">
            {online ? 'Submission Complete!' : 'Saved for Sync'}
          </h2>
          <p className="text-sm text-obsidian-400 text-center max-w-sm">
            {online
              ? 'Your responses have been submitted and scored.'
              : 'Your responses are saved locally and will sync when you\'re back online.'}
          </p>
        </div>

        {/* Follow-up banner — shown when failures detected */}
        {failedQuestions.length > 0 && !followUpCreated && (
          <FollowUpBanner
            failedQuestions={failedQuestions}
            onCreateFollowUp={handleCreateFollowUp}
            creating={creatingFollowUp}
          />
        )}

        {/* Confirmation after follow-up created */}
        {followUpCreated && (
          <div className="glass rounded-xl border border-emerald-500/20 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-obsidian-100">Follow-Up Checklist Created</p>
                <p className="text-xs text-obsidian-400 mt-0.5">
                  {failedQuestions.length} item{failedQuestions.length !== 1 ? 's' : ''} assigned for corrective action.{' '}
                  <a href="/follow-ups" className="text-[#10b37d] hover:underline">
                    View Follow-Ups →
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const totalQuestions = program.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Array.from(responses.keys()).filter((k) => !k.startsWith('_section_')).length;

  // Enable section-level remarks & image for audit/training programs
  const sectionExtras = program.type === 'TRAINING_ASSESSMENT'
    || program.type === 'QA_AUDIT'
    || program.type === 'COMPLIANCE_INSPECTION';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-obsidian-100">{program.name}</h1>
            {program.description && (
              <p className="mt-1 text-sm text-obsidian-400">{program.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Online indicator */}
            <span
              className={`flex items-center gap-1.5 text-xs ${
                online ? 'text-green-400' : 'text-amber-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  online ? 'bg-green-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
              {online ? 'Online' : 'Offline'}
            </span>

            {/* Saving indicator */}
            {saving && (
              <span className="flex items-center gap-1 text-xs text-obsidian-500">
                <div className="h-3 w-3 animate-spin rounded-full border border-obsidian-600/30 border-t-[#0d8c63]" />
                Saving
              </span>
            )}
          </div>
        </div>

        {/* Progress summary */}
        <div className="mt-4 pt-4 border-t border-obsidian-600/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-obsidian-500">Progress</span>
            <span className="text-xs text-obsidian-400">{answeredCount} / {totalQuestions} answered</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-obsidian-700/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0d8c63] to-[#10b37d] transition-all duration-300"
              style={{ width: totalQuestions > 0 ? `${(answeredCount / totalQuestions) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Geo capture */}
        {program.geoLocationEnabled && (
          <div className="mt-4 pt-4 border-t border-obsidian-600/20">
            <GeoCapture onCapture={handleGeoCapture} autoCapture />
          </div>
        )}
      </div>

      {/* ── ALL SECTIONS (with TSA grouping) ── */}
      {(() => {
        // Detect TSA sections and group them by category (Food, Coffee, CX)
        const TSA_PREFIXES = ['TSA - Food', 'TSA - Coffee', 'TSA - CX'] as const;

        const isTsaSection = (title: string) =>
          TSA_PREFIXES.some((p) => title.startsWith(p));

        const getTsaGroup = (title: string) =>
          TSA_PREFIXES.find((p) => title.startsWith(p)) ?? null;

        // Build ordered render items: either a single section or a TSA group
        type RenderItem =
          | { type: 'section'; section: typeof program.sections[0]; index: number }
          | { type: 'tsaGroup'; label: string; sections: typeof program.sections; indices: number[] };

        const items: RenderItem[] = [];
        const renderedGroups = new Set<string>();

        program.sections.forEach((s, i) => {
          if (isTsaSection(s.title)) {
            const group = getTsaGroup(s.title)!;
            if (!renderedGroups.has(group)) {
              renderedGroups.add(group);
              // Collect all sections for this group
              const groupSections = program.sections
                .map((sec, idx) => ({ sec, idx }))
                .filter(({ sec }) => sec.title.startsWith(group));
              items.push({
                type: 'tsaGroup',
                label: group,
                sections: groupSections.map((g) => g.sec),
                indices: groupSections.map((g) => g.idx),
              });
            }
            // Skip — already grouped
          } else {
            items.push({ type: 'section', section: s, index: i });
          }
        });

        return items.map((item) => {
          if (item.type === 'tsaGroup') {
            return (
              <TsaGroupRenderer
                key={item.label}
                groupLabel={item.label}
                sections={item.sections}
                sectionIndices={item.indices}
                totalSections={program.sections.length}
                responses={responses}
                onChange={handleResponseChange}
                onUpload={handleUpload}
                errors={errors}
                employees={sectionEmployees}
              />
            );
          }
          return (
            <SectionRenderer
              key={item.section.id}
              section={item.section}
              sectionIndex={item.index}
              totalSections={program.sections.length}
              responses={responses}
              onChange={handleResponseChange}
              onUpload={handleUpload}
              errors={errors}
              showSectionRemarks={sectionExtras}
              showSectionImage={sectionExtras}
              showEmployeeSelector={false}
              employees={[]}
            />
          );
        });
      })()}

      {/* Bottom bar — Save & Submit */}
      <div className="flex items-center justify-between glass rounded-xl p-4 sticky bottom-4">
        <button
          type="button"
          onClick={async () => {
            await saveLocalDraft();
            if (online) saveServerDraft();
          }}
          className="flex items-center gap-2 rounded-lg border border-obsidian-600/30 bg-obsidian-800/60
            px-4 py-2.5 text-sm text-obsidian-400 hover:border-obsidian-600/40 hover:text-obsidian-200
            transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          Save Draft
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0d8c63] to-[#10b37d] px-6 py-2.5
            text-sm font-medium text-white hover:from-[#087a56] hover:to-[#0d8c63]
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Submitting...
            </>
          ) : (
            <>
              Submit
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
