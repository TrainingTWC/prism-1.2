'use client';

import React from 'react';
import type { RatingScaleConfig } from '../../../types/checklist';

interface Props {
  questionId: string;
  value: number | null;
  onChange: (value: number) => void;
  config: RatingScaleConfig;
  required?: boolean;
  error?: string;
}

export function RatingScaleQuestion({
  value,
  onChange,
  config,
  error,
}: Props) {
  const { min, max, step = 1, labels } = config;
  const steps: number[] = [];
  for (let i = min; i <= max; i += step) {
    steps.push(i);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {steps.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex flex-col items-center justify-center rounded-lg border
              min-w-[48px] px-3 py-2 text-sm font-medium transition-all ${
                value === n
                  ? 'bg-[rgba(13,140,99,0.15)] border-[#0d8c63] text-[#10b37d]'
                  : 'bg-obsidian-800/60 border-obsidian-600/30 text-obsidian-400 hover:border-obsidian-600/40'
              }`}
          >
            <span>{n}</span>
            {labels?.[String(n)] && (
              <span className="text-[10px] text-obsidian-500 mt-0.5">
                {labels[String(n)]}
              </span>
            )}
          </button>
        ))}
      </div>
      {labels && (
        <div className="flex justify-between text-xs text-obsidian-500">
          <span>{labels[String(min)] || min}</span>
          <span>{labels[String(max)] || max}</span>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
