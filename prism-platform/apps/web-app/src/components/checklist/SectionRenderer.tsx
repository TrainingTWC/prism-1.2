'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { ProgramSection, ResponseInput } from '../../types/checklist';
import { QuestionRenderer } from './QuestionRenderer';
import { isQuestionVisible } from '../../lib/checklist-validation';
import { ImageAnnotationEditor } from './ImageAnnotationEditor';

interface Props {
  section: ProgramSection;
  sectionIndex: number;
  totalSections: number;
  responses: Map<string, ResponseInput>;
  onChange: (questionId: string, response: ResponseInput) => void;
  onUpload: (file: File) => Promise<string>;
  errors: Map<string, string>;
  /** Show a Remarks textarea at the bottom of the section */
  showSectionRemarks?: boolean;
  /** Show an image upload/capture zone at the bottom of the section */
  showSectionImage?: boolean;
  /** Show a per-section employee dropdown (TSA / Audit) */
  showEmployeeSelector?: boolean;
  /** Employee list to populate the per-section dropdown */
  employees?: { id: string; name: string; empId: string }[];
}

// ── Section-level image upload with multi-image support + preview + edit + annotate ──
interface SectionImageItem {
  id: string;
  url: string;
  originalUrl: string;
}

let _secImgCounter = 0;
const secUid = () => `simg_${Date.now()}_${++_secImgCounter}`;

function SectionImageUpload({
  sectionId,
  value,
  values,
  onChange,
  onMultiChange,
  onUpload,
}: {
  sectionId: string;
  value: string | null;
  values?: string[];
  onChange: (url: string) => void;
  onMultiChange?: (urls: string[]) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [uploading, setUploading] = useState(false);

  const initImages = (): SectionImageItem[] => {
    if (values && values.length > 0) {
      return values.filter(Boolean).map((u) => ({ id: secUid(), url: u, originalUrl: u }));
    }
    if (value) return [{ id: secUid(), url: value, originalUrl: value }];
    return [];
  };
  const [images, setImages] = useState<SectionImageItem[]>(initImages);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const emitChange = useCallback(
    (imgs: SectionImageItem[]) => {
      const urls = imgs.map((i) => i.url).filter(Boolean);
      onMultiChange?.(urls);
      onChange(urls[0] ?? '');
    },
    [onChange, onMultiChange],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      setUploading(true);
      const newItems: SectionImageItem[] = [];
      for (const file of files) {
        const localUrl = URL.createObjectURL(file);
        const item: SectionImageItem = { id: secUid(), url: localUrl, originalUrl: localUrl };
        try {
          const url = await onUpload(file);
          item.url = url;
          item.originalUrl = url;
        } catch { /* keep local blob */ }
        newItems.push(item);
      }
      setImages((prev) => {
        const updated = [...prev, ...newItems];
        emitChange(updated);
        return updated;
      });
      setUploading(false);
    },
    [onUpload, emitChange],
  );

  const removeImage = useCallback(
    (id: string) => {
      setImages((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        emitChange(updated);
        return updated;
      });
    },
    [emitChange],
  );

  const replaceImage = useCallback(
    async (id: string, file: File) => {
      setUploading(true);
      const localUrl = URL.createObjectURL(file);
      let finalUrl = localUrl;
      try { finalUrl = await onUpload(file); } catch { /* keep local */ }
      setImages((prev) => {
        const updated = prev.map((i) =>
          i.id === id ? { ...i, url: finalUrl, originalUrl: finalUrl } : i,
        );
        emitChange(updated);
        return updated;
      });
      setUploading(false);
    },
    [onUpload, emitChange],
  );

  const handleAnnotationSave = useCallback(
    (annotatedDataUrl: string) => {
      if (!editingId) return;
      setImages((prev) => {
        const updated = prev.map((i) =>
          i.id === editingId ? { ...i, url: annotatedDataUrl } : i,
        );
        emitChange(updated);
        return updated;
      });
      setEditingId(null);
    },
    [editingId, emitChange],
  );

  const editingItem = images.find((i) => i.id === editingId) ?? null;

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold text-obsidian-500 uppercase tracking-wider">
        Photo Evidence
      </label>

      {/* Hidden file input — accepts multiple */}
      <input
        ref={inputRef}
        id={`section-img-${sectionId}`}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) handleFiles(files);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />

      {/* ── Image grid ── */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => {
            const isExpanded = expandedId === img.id;
            return (
              <div
                key={img.id}
                className={`relative rounded-lg border border-obsidian-600/20 bg-obsidian-800/30 overflow-hidden group ${
                  isExpanded ? 'col-span-3' : ''
                }`}
              >
                {/* Hidden replace input per image */}
                <input
                  type="file" accept="image/*" capture="environment" className="sr-only"
                  ref={(el) => { if (el) replaceInputs.current.set(img.id, el); }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceImage(img.id, f); e.target.value = ''; }}
                />

                <button type="button" onClick={() => setExpandedId(isExpanded ? null : img.id)} className="block w-full">
                  <img src={img.url} alt="Section evidence" className={`w-full object-contain transition-all duration-200 ${isExpanded ? 'max-h-96' : 'max-h-28'}`} />
                </button>

                {/* Uploaded badge */}
                <div className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-green-500/20 backdrop-blur-sm border border-green-500/30 px-1 py-0.5">
                  <svg className="h-2 w-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[8px] font-semibold text-green-400">Uploaded</span>
                </div>

                {/* Action buttons on hover */}
                <div className="absolute bottom-0 inset-x-0 flex items-center gap-1 p-1 bg-gradient-to-t from-obsidian-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => replaceInputs.current.get(img.id)?.click()}
                    className="rounded border border-obsidian-600/30 bg-obsidian-800/80 px-1.5 py-0.5 text-[9px] text-obsidian-300 hover:text-obsidian-100">
                    Replace
                  </button>
                  <button type="button" onClick={() => setEditingId(img.id)}
                    className="rounded border border-[rgba(13,140,99,0.3)] bg-[rgba(13,140,99,0.15)] px-1.5 py-0.5 text-[9px] text-[#10b37d]">
                    Edit
                  </button>
                  <button type="button" onClick={() => removeImage(img.id)}
                    className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-400">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Uploading indicator */}
      {uploading && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-obsidian-600/40 bg-obsidian-800/40 px-4 py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0d8c63] border-t-transparent" />
          <span className="text-xs text-obsidian-400">Uploading...</span>
        </div>
      )}

      {/* Add more / empty state */}
      <div
        onClick={() => inputRef.current?.click()}
        className={`flex items-center gap-3 rounded-lg border border-dashed border-obsidian-600/40 bg-obsidian-800/40
          px-4 py-3 cursor-pointer hover:border-[rgba(13,140,99,0.4)] hover:bg-[rgba(13,140,99,0.03)] transition-colors`}
      >
        <svg className="h-5 w-5 text-obsidian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span className="text-xs text-obsidian-400">
          {images.length > 0 ? 'Add more photos' : 'Click to upload or take photos'}
        </span>
      </div>

      {/* Image count */}
      {images.length > 0 && (
        <p className="text-[9px] text-obsidian-500">{images.length} {images.length === 1 ? 'photo' : 'photos'}</p>
      )}

      {/* ── Annotation Editor Modal ── */}
      {editingId && editingItem && (
        <ImageAnnotationEditor
          imageSrc={editingItem.originalUrl || editingItem.url}
          onSave={(annotatedDataUrl) => handleAnnotationSave(annotatedDataUrl)}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

export function SectionRenderer({
  section,
  sectionIndex,
  totalSections,
  responses,
  onChange,
  onUpload,
  errors,
  showSectionRemarks = false,
  showSectionImage = false,
  showEmployeeSelector = false,
  employees = [],
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const visibleQuestions = section.questions.filter((q) =>
    isQuestionVisible(q, responses),
  );

  // Count answered questions for progress badge
  const answeredCount = visibleQuestions.filter((q) => {
    const r = responses.get(q.id);
    if (!r) return false;
    if (r.answer && r.answer.trim() !== '') return true;
    if (r.numericValue !== undefined && r.numericValue !== null) return true;
    if (r.booleanValue !== undefined && r.booleanValue !== null) return true;
    if (r.selectedOptions && r.selectedOptions.length > 0) return true;
    if (r.imageUrl && r.imageUrl.trim() !== '') return true;
    if (r.imageUrls && r.imageUrls.length > 0) return true;
    if (r.fileUrl && r.fileUrl.trim() !== '') return true;
    if (r.signatureUrl && r.signatureUrl.trim() !== '') return true;
    return false;
  }).length;

  // Synthetic IDs for section-level fields
  const remarksSyntheticId = `_section_remarks_${section.id}`;
  const imageSyntheticId = `_section_image_${section.id}`;
  const employeeSyntheticId = `_section_employee_${section.id}`;

  const remarksValue = responses.get(remarksSyntheticId)?.answer ?? '';
  const imageValue = responses.get(imageSyntheticId)?.imageUrl ?? null;
  const imageUrls = responses.get(imageSyntheticId)?.imageUrls;
  const selectedEmployeeId = responses.get(employeeSyntheticId)?.answer ?? '';

  // Employee search state
  const [empSearch, setEmpSearch] = useState('');
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const empRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (empRef.current && !empRef.current.contains(e.target as Node)) {
        setEmpDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredEmps = employees.filter((e) => {
    if (!empSearch) return true;
    const q = empSearch.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.empId.toLowerCase().includes(q);
  });

  const selectedEmpName = employees.find((e) => e.id === selectedEmployeeId)?.name ?? '';

  const allAnswered = answeredCount === visibleQuestions.length && visibleQuestions.length > 0;

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Section header — clickable to collapse/expand */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-obsidian-800/20 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full
            bg-[rgba(13,140,99,0.1)] text-xs font-bold text-[#10b37d]">
            {sectionIndex + 1}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-obsidian-100 truncate">{section.title}</h3>
            {section.description && !collapsed && (
              <p className="mt-0.5 text-sm text-obsidian-400">{section.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* Progress badge */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            allAnswered
              ? 'bg-green-500/15 text-green-400 border border-green-500/30'
              : answeredCount > 0
                ? 'bg-[rgba(13,140,99,0.1)] text-[#10b37d] border border-[rgba(13,140,99,0.2)]'
                : 'bg-obsidian-800/40 text-obsidian-500 border border-obsidian-600/20'
          }`}>
            {answeredCount}/{visibleQuestions.length}
          </span>
          {/* Section counter */}
          <span className="text-[10px] text-obsidian-500 hidden sm:inline">
            Section {sectionIndex + 1}/{totalSections}
          </span>
          {/* Chevron */}
          <svg
            className={`h-5 w-5 text-obsidian-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {/* Collapsible content */}
      {!collapsed && (
        <div className="px-6 pb-6 space-y-6">
          {/* Divider */}
          <div className="h-px bg-obsidian-600/20" />

          {/* Per-section Employee Selector (TSA / Audit) */}
          {showEmployeeSelector && employees.length > 0 && (
            <div ref={empRef} className="relative">
              <label className="block text-[10px] font-semibold text-obsidian-500 uppercase tracking-wider mb-1.5">
                Employee Name
              </label>
              <button
                type="button"
                onClick={() => setEmpDropdownOpen(!empDropdownOpen)}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  selectedEmployeeId
                    ? 'border-[#0d8c63]/30 bg-[rgba(13,140,99,0.05)] text-obsidian-100'
                    : 'border-obsidian-600/30 bg-obsidian-800/60 text-obsidian-400'
                }`}
              >
                <span className="truncate">
                  {selectedEmpName || 'Select employee...'}
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-obsidian-400 transition-transform duration-200 ${empDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {empDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-obsidian-600/30 bg-obsidian-900 shadow-xl max-h-60 overflow-hidden">
                  {/* Search input */}
                  <div className="p-2 border-b border-obsidian-600/20">
                    <input
                      type="text"
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      placeholder="Search by name or ID..."
                      className="w-full rounded-md bg-obsidian-800/60 border border-obsidian-600/30 px-2.5 py-1.5
                        text-xs text-obsidian-100 placeholder:text-obsidian-500 focus:outline-none
                        focus:ring-1 focus:ring-[#0d8c63]/40"
                      autoFocus
                    />
                  </div>
                  {/* Employee list */}
                  <div className="overflow-y-auto max-h-48">
                    {filteredEmps.length === 0 ? (
                      <p className="text-xs text-obsidian-500 text-center py-3">No employees found</p>
                    ) : (
                      filteredEmps.slice(0, 50).map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            onChange(employeeSyntheticId, {
                              questionId: employeeSyntheticId,
                              answer: emp.id,
                            });
                            setEmpDropdownOpen(false);
                            setEmpSearch('');
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-obsidian-800/60 transition-colors flex items-center justify-between ${
                            selectedEmployeeId === emp.id
                              ? 'bg-[rgba(13,140,99,0.08)] text-[#10b37d]'
                              : 'text-obsidian-200'
                          }`}
                        >
                          <span className="truncate">{emp.name}</span>
                          <span className="text-[10px] text-obsidian-500 ml-2 shrink-0">{emp.empId}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Questions */}
          <div className="space-y-8">
            {visibleQuestions.map((question) => {
              const resp = responses.get(question.id) ?? {
                questionId: question.id,
              };

              return (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  response={resp}
                  onChange={(updated) => onChange(question.id, updated)}
                  onUpload={onUpload}
                  error={errors.get(question.id)}
                />
              );
            })}

            {visibleQuestions.length === 0 && (
              <p className="text-sm text-obsidian-500 text-center py-4">
                No questions in this section
              </p>
            )}
          </div>

          {/* ── Section-level Remarks & Image ── */}
          {(showSectionRemarks || showSectionImage) && (
            <>
              <div className="h-px bg-obsidian-600/20" />
              <div className="space-y-4">
                {showSectionImage && (
                  <SectionImageUpload
                    sectionId={section.id}
                    value={imageValue}
                    values={imageUrls}
                    onChange={(url) =>
                      onChange(imageSyntheticId, {
                        questionId: imageSyntheticId,
                        imageUrl: url,
                      })
                    }
                    onMultiChange={(urls) =>
                      onChange(imageSyntheticId, {
                        questionId: imageSyntheticId,
                        imageUrl: urls[0] ?? '',
                        imageUrls: urls,
                      })
                    }
                    onUpload={onUpload}
                  />
                )}

                {showSectionRemarks && (
                  <div>
                    <label
                      htmlFor={`section-remarks-${section.id}`}
                      className="block text-[10px] font-semibold text-obsidian-500 uppercase tracking-wider mb-1.5"
                    >
                      Remarks
                    </label>
                    <textarea
                      id={`section-remarks-${section.id}`}
                      value={remarksValue}
                      onChange={(e) =>
                        onChange(remarksSyntheticId, {
                          questionId: remarksSyntheticId,
                          answer: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="Add remarks for this section..."
                      className="w-full rounded-lg bg-obsidian-800/60 border border-obsidian-600/30 px-3 py-2.5
                        text-sm text-obsidian-100 placeholder:text-obsidian-500 focus:outline-none
                        focus:ring-1 focus:ring-[#0d8c63]/40 resize-y"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
