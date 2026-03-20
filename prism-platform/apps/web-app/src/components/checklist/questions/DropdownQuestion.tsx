'use client';

import React from 'react';
import type { QuestionOption } from '../../../types/checklist';

interface Props {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
  options: (QuestionOption | string)[];
  required?: boolean;
  error?: string;
}

/** Normalise an option that may be a plain string or {label,value} object */
function normalise(opt: QuestionOption | string): { label: string; value: string } {
  if (typeof opt === 'string') return { label: opt, value: opt };
  return { label: opt.label ?? opt.value ?? String(opt), value: opt.value ?? opt.label ?? String(opt) };
}

const OPTION_COLORS: Record<string, { selected: string; text: string }> = {
  yes:            { selected: 'bg-green-500/20 border-green-500 text-green-400',   text: 'text-green-400' },
  compliant:      { selected: 'bg-green-500/20 border-green-500 text-green-400',   text: 'text-green-400' },
  no:             { selected: 'bg-red-500/20 border-red-500 text-red-400',         text: 'text-red-400' },
  'non-compliant':{ selected: 'bg-red-500/20 border-red-500 text-red-400',         text: 'text-red-400' },
  'n/a':          { selected: 'bg-obsidian-600/30 border-obsidian-400 text-obsidian-300', text: 'text-obsidian-300' },
  'partially compliant': { selected: 'bg-amber-500/20 border-amber-500 text-amber-400', text: 'text-amber-400' },
};

function getOptionStyle(label: string, isSelected: boolean): string {
  const key = (label ?? '').toLowerCase().trim();
  if (isSelected) {
    const c = OPTION_COLORS[key];
    return c ? c.selected : 'bg-[rgba(13,140,99,0.15)] border-[#0d8c63] text-[#10b37d]';
  }
  return 'bg-obsidian-800/60 border-obsidian-600/30 text-obsidian-400 hover:border-obsidian-600/50';
}

export function DropdownQuestion({
  value,
  onChange,
  options,
  error,
}: Props) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        {options.map((raw) => {
          const opt = normalise(raw);
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-lg border px-5 py-2.5 text-sm font-medium transition-all ${getOptionStyle(opt.label, isSelected)}`}
            >
              <span className="flex items-center gap-2">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected ? 'border-current' : 'border-obsidian-500/50'
                }`}>
                  {isSelected && <span className="h-2 w-2 rounded-full bg-current" />}
                </span>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

