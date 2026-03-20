'use client';

import React, { useRef, useState, useCallback } from 'react';

interface Props {
  questionId: string;
  value: string | null;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  required?: boolean;
  error?: string;
}

export function FileUploadQuestion({
  questionId,
  value,
  onChange,
  onUpload,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setFileName(file.name);
      try {
        const url = await onUpload(file);
        onChange(url);
      } catch {
        setFileName(null);
      } finally {
        setUploading(false);
      }
    },
    [onUpload, onChange],
  );

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer
          transition-colors ${
            error
              ? 'border-red-500 bg-red-500/5'
              : 'border-obsidian-600/30 bg-obsidian-800/60 hover:border-[rgba(13,140,99,0.4)]'
          }`}
      >
        {uploading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0d8c63] border-t-transparent" />
        ) : (
          <svg className="h-5 w-5 text-obsidian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
        )}
        <span className="text-sm text-obsidian-400">
          {uploading
            ? 'Uploading...'
            : value
            ? fileName || 'File uploaded'
            : 'Click to upload a file'}
        </span>
        <input
          ref={inputRef}
          id={questionId}
          type="file"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {value && !uploading && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            setFileName(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Remove file
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
