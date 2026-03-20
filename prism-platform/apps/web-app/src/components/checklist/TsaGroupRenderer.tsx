'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ProgramSection, ResponseInput } from '../../types/checklist';
import { QuestionRenderer } from './QuestionRenderer';
import { isQuestionVisible } from '../../lib/checklist-validation';

// ── Props ──

interface Props {
  /** e.g. "TSA - Coffee", "TSA - Food", "TSA - CX" */
  groupLabel: string;
  /** The sub-sections that belong to this group */
  sections: ProgramSection[];
  /** Global section indices for numbering (e.g. [5,6,7]) */
  sectionIndices: number[];
  totalSections: number;
  responses: Map<string, ResponseInput>;
  onChange: (questionId: string, response: ResponseInput) => void;
  onUpload: (file: File) => Promise<string>;
  errors: Map<string, string>;
  /** Employee list for the per-group dropdown */
  employees?: { id: string; name: string; empId: string }[];
}

export function TsaGroupRenderer({
  groupLabel,
  sections,
  sectionIndices: _si,
  totalSections: _ts,
  responses,
  onChange,
  onUpload,
  errors,
  employees = [],
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // ── Employee selector state ──
  const employeeSyntheticId = `_tsa_employee_${groupLabel.replace(/\s+/g, '_').toLowerCase()}`;
  const selectedEmployeeId = responses.get(employeeSyntheticId)?.answer ?? '';
  const [empSearch, setEmpSearch] = useState('');
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const empRef = useRef<HTMLDivElement>(null);

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

  // ── Progress across ALL sub-sections ──
  const allQuestions = sections.flatMap((s) =>
    s.questions.filter((q) => isQuestionVisible(q, responses)),
  );
  const answeredCount = allQuestions.filter((q) => {
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

  const allAnswered = answeredCount === allQuestions.length && allQuestions.length > 0;

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* ── Group header — clickable to collapse/expand ── */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-obsidian-800/20 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Group icon */}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
            bg-[rgba(13,140,99,0.12)] border border-[rgba(13,140,99,0.2)]">
            <svg className="h-4 w-4 text-[#10b37d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 3h1a2.251 2.251 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-obsidian-100 truncate">{groupLabel}</h3>
            {!collapsed && (
              <p className="mt-0.5 text-xs text-obsidian-400">
                {sections.length} sub-section{sections.length !== 1 ? 's' : ''} &middot; {allQuestions.length} questions
              </p>
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
            {answeredCount}/{allQuestions.length}
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

      {/* ── Collapsible content ── */}
      {!collapsed && (
        <div className="px-6 pb-6 space-y-6">
          <div className="h-px bg-obsidian-600/20" />

          {/* ── Employee Name dropdown ── */}
          {employees.length > 0 && (
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

          {/* ── Sub-sections with their questions ── */}
          {sections.map((section, idx) => {
            const visibleQuestions = section.questions.filter((q) =>
              isQuestionVisible(q, responses),
            );

            if (visibleQuestions.length === 0) return null;

            // Strip the "TSA - Category: " prefix from sub-section titles
            const subTitle = section.title.replace(/^TSA\s*-\s*\w+:\s*/, '');

            return (
              <div key={section.id} className="space-y-4">
                {/* Sub-section header */}
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full
                    bg-obsidian-800/60 text-[10px] font-bold text-obsidian-400 border border-obsidian-600/20">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-obsidian-200">{subTitle}</h4>
                  <span className="text-[10px] text-obsidian-500">
                    ({visibleQuestions.length} question{visibleQuestions.length !== 1 ? 's' : ''})
                  </span>
                </div>

                {/* Questions */}
                <div className="space-y-6 pl-7">
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
                </div>

                {/* Divider between sub-sections */}
                {idx < sections.length - 1 && (
                  <div className="h-px bg-obsidian-600/15 ml-7" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
