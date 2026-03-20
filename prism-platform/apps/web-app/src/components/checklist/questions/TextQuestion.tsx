'use client';

import React from 'react';

interface Props {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number | null;
  maxLength?: number | null;
  required?: boolean;
  error?: string;
}

export function TextQuestion({
  questionId,
  value,
  onChange,
  placeholder = 'Enter your answer...',
  minLength,
  maxLength,
  required,
  error,
}: Props) {
  return (
    <div className="space-y-1">
      <textarea
        id={questionId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength ?? undefined}
        maxLength={maxLength ?? undefined}
        rows={3}
        className={`w-full rounded-lg bg-obsidian-800/60 border px-4 py-3 text-sm text-obsidian-100
          placeholder:text-obsidian-500 focus:outline-none focus:ring-2 focus:ring-[#0d8c63]/40
          transition-colors resize-y ${
            error ? 'border-red-500' : 'border-obsidian-600/30 hover:border-obsidian-600/40'
          }`}
      />
      {maxLength && (
        <p className="text-xs text-obsidian-500 text-right">
          {value.length}/{maxLength}
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
