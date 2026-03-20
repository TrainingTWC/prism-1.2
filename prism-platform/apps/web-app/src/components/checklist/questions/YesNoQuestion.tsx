'use client';

import React from 'react';

interface Props {
  questionId: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  required?: boolean;
  error?: string;
}

export function YesNoQuestion({ value, onChange, error }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 rounded-lg border px-6 py-3 text-sm font-medium transition-all
            ${
              value === true
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'bg-obsidian-800/60 border-obsidian-600/30 text-obsidian-400 hover:border-obsidian-600/40'
            }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 rounded-lg border px-6 py-3 text-sm font-medium transition-all
            ${
              value === false
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-obsidian-800/60 border-obsidian-600/30 text-obsidian-400 hover:border-obsidian-600/40'
            }`}
        >
          No
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
