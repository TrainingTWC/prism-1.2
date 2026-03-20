'use client';

import React from 'react';

interface Props {
  questionId: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number | null;
  max?: number | null;
  required?: boolean;
  error?: string;
}

export function NumberQuestion({
  questionId,
  value,
  onChange,
  min,
  max,
  required,
  error,
}: Props) {
  return (
    <div className="space-y-1">
      <input
        id={questionId}
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === '' ? null : parseFloat(raw));
        }}
        min={min ?? undefined}
        max={max ?? undefined}
        required={required}
        className={`w-full max-w-xs rounded-lg bg-obsidian-800/60 border px-4 py-3 text-sm text-obsidian-100
          placeholder:text-obsidian-500 focus:outline-none focus:ring-2 focus:ring-[#0d8c63]/40
          transition-colors ${
            error ? 'border-red-500' : 'border-obsidian-600/30 hover:border-obsidian-600/40'
          }`}
        placeholder="Enter a number"
      />
      {(min != null || max != null) && (
        <p className="text-xs text-obsidian-500">
          {min != null && `Min: ${min}`}
          {min != null && max != null && ' · '}
          {max != null && `Max: ${max}`}
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
