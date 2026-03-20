'use client';

import React from 'react';
import type { QuestionOption } from '../../../types/checklist';

/** Normalise an option that may be a plain string or {label,value} object */
function norm(opt: QuestionOption | string): { label: string; value: string } {
  if (typeof opt === 'string') return { label: opt, value: opt };
  return { label: opt.label ?? opt.value ?? String(opt), value: opt.value ?? opt.label ?? String(opt) };
}

interface Props {
  questionId: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: (QuestionOption | string)[];
  required?: boolean;
  error?: string;
}

export function MultipleChoiceQuestion({
  value,
  onChange,
  options,
  error,
}: Props) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="space-y-2">
      {options.map((raw) => {
        const opt = norm(raw);
        const checked = value.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer
              transition-all ${
                checked
                  ? 'bg-[rgba(13,140,99,0.12)] border-[#0d8c63] text-obsidian-100'
                  : 'bg-obsidian-800/60 border-obsidian-600/30 text-obsidian-300 hover:border-obsidian-600/40'
              }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.value)}
              className="sr-only"
            />
            <span
              className={`flex h-5 w-5 items-center justify-center rounded border
                transition-colors ${
                  checked
                    ? 'bg-[#0d8c63] border-[#0d8c63]'
                    : 'border-obsidian-600/40 bg-transparent'
                }`}
            >
              {checked && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-sm">{opt.label}</span>
          </label>
        );
      })}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
