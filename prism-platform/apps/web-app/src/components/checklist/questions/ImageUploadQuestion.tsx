'use client';

import React, { useRef, useState, useCallback } from 'react';
import { ImageAnnotationEditor } from '../ImageAnnotationEditor';

interface ImageItem {
  id: string;
  url: string;
  originalUrl: string;
}

interface Props {
  questionId: string;
  /** Backward-compat single value */
  value: string | null;
  /** Multi-image values */
  values?: string[];
  onChange: (url: string) => void;
  onMultiChange?: (urls: string[]) => void;
  onUpload: (file: File) => Promise<string>;
  allowAnnotation?: boolean;
  onAnnotationChange?: (annotation: { shapes: unknown[]; notes: string }) => void;
  error?: string;
}

let _imgCounter = 0;
const uid = () => `img_${Date.now()}_${++_imgCounter}`;

export function ImageUploadQuestion({
  questionId,
  value,
  values,
  onChange,
  onMultiChange,
  onUpload,
  allowAnnotation,
  onAnnotationChange,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [uploading, setUploading] = useState(false);
  const [annotationNotes, setAnnotationNotes] = useState('');

  const initImages = (): ImageItem[] => {
    if (values && values.length > 0) {
      return values.filter(Boolean).map((u) => ({ id: uid(), url: u, originalUrl: u }));
    }
    if (value) return [{ id: uid(), url: value, originalUrl: value }];
    return [];
  };
  const [images, setImages] = useState<ImageItem[]>(initImages);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const emitChange = useCallback(
    (imgs: ImageItem[]) => {
      const urls = imgs.map((i) => i.url).filter(Boolean);
      onMultiChange?.(urls);
      onChange(urls[0] ?? '');
    },
    [onChange, onMultiChange],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      setUploading(true);
      const newItems: ImageItem[] = [];
      for (const file of files) {
        const localUrl = URL.createObjectURL(file);
        const item: ImageItem = { id: uid(), url: localUrl, originalUrl: localUrl };
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length) handleFiles(files);
    },
    [handleFiles],
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

  const handleAnnotationSave = useCallback(
    (annotatedDataUrl: string, shapes: unknown[]) => {
      if (!editingId) return;
      setImages((prev) => {
        const updated = prev.map((i) =>
          i.id === editingId ? { ...i, url: annotatedDataUrl } : i,
        );
        emitChange(updated);
        return updated;
      });
      onAnnotationChange?.({ shapes, notes: annotationNotes });
      setEditingId(null);
    },
    [editingId, emitChange, onAnnotationChange, annotationNotes],
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

  const editingItem = images.find((i) => i.id === editingId) ?? null;

  return (
    <div className="space-y-3">
      {/* Hidden file input — accepts multiple */}
      <input
        ref={inputRef}
        id={questionId}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => {
            const isExpanded = expandedId === img.id;
            return (
              <div
                key={img.id}
                className={`relative rounded-xl border border-obsidian-600/20 bg-obsidian-800/30 overflow-hidden group ${
                  isExpanded ? 'col-span-2 sm:col-span-3' : ''
                }`}
              >
                {/* Hidden replace input per image */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  ref={(el) => { if (el) replaceInputs.current.set(img.id, el); }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) replaceImage(img.id, f);
                    e.target.value = '';
                  }}
                />

                {/* Image thumbnail */}
                <button type="button" onClick={() => setExpandedId(isExpanded ? null : img.id)} className="block w-full">
                  <img
                    src={img.url}
                    alt="Uploaded evidence"
                    className={`w-full object-contain transition-all duration-200 ${isExpanded ? 'max-h-[500px]' : 'max-h-40'}`}
                  />
                </button>

                {/* Uploaded badge */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-green-500/20 backdrop-blur-sm border border-green-500/30 px-1.5 py-0.5">
                  <svg className="h-2.5 w-2.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[9px] font-semibold text-green-400">Uploaded</span>
                </div>

                {/* Expand/collapse */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : img.id)}
                  className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded bg-obsidian-900/60 backdrop-blur-sm border border-obsidian-600/30 text-obsidian-400 hover:text-obsidian-200 transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    {isExpanded ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    )}
                  </svg>
                </button>

                {/* Action buttons — visible on hover */}
                <div className="absolute bottom-0 inset-x-0 flex items-center gap-1 p-1.5 bg-gradient-to-t from-obsidian-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => replaceInputs.current.get(img.id)?.click()}
                    className="flex items-center gap-1 rounded-md border border-obsidian-600/30 bg-obsidian-800/80 px-2 py-1 text-[10px] font-medium text-obsidian-300 hover:text-obsidian-100 transition-colors"
                    title="Replace this image"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25" />
                    </svg>
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(img.id)}
                    className="flex items-center gap-1 rounded-md border border-[rgba(13,140,99,0.3)] bg-[rgba(13,140,99,0.15)] px-2 py-1 text-[10px] font-medium text-[#10b37d] hover:bg-[rgba(13,140,99,0.25)] transition-colors"
                    title="Annotate this image"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Remove this image"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Uploading indicator ── */}
      {uploading && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-obsidian-600/40 bg-obsidian-800/60 px-6 py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0d8c63] border-t-transparent" />
          <p className="text-sm text-obsidian-400">Uploading...</p>
        </div>
      )}

      {/* ── Add more / empty state ── */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
          images.length > 0
            ? 'px-4 py-4 border-obsidian-600/30 bg-obsidian-800/40 hover:border-[rgba(13,140,99,0.4)] hover:bg-[rgba(13,140,99,0.03)]'
            : error
              ? 'px-6 py-10 border-red-500 bg-red-500/5'
              : 'px-6 py-10 border-obsidian-600/40 bg-obsidian-800/60 hover:border-[rgba(13,140,99,0.4)] hover:bg-[rgba(13,140,99,0.03)]'
        }`}
      >
        <div className={`flex ${images.length > 0 ? 'flex-row' : 'flex-col'} items-center gap-3 text-obsidian-500`}>
          <div className={`flex items-center justify-center rounded-xl bg-obsidian-700/30 ${images.length > 0 ? 'h-8 w-8' : 'h-12 w-12'}`}>
            <svg className={images.length > 0 ? 'h-4 w-4' : 'h-6 w-6'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className={images.length > 0 ? '' : 'text-center'}>
            <p className={`font-medium ${images.length > 0 ? 'text-xs' : 'text-sm'}`}>
              {images.length > 0 ? 'Add more photos' : 'Click to upload or take photos'}
            </p>
            {images.length === 0 && (
              <p className="text-xs mt-0.5">Drag & drop · Multiple photos · PNG, JPG up to 10 MB each</p>
            )}
          </div>
        </div>
      </div>

      {/* Image count */}
      {images.length > 0 && (
        <p className="text-[10px] text-obsidian-500">{images.length} {images.length === 1 ? 'photo' : 'photos'} uploaded</p>
      )}

      {/* Annotation notes (text) */}
      {allowAnnotation && images.length > 0 && !uploading && (
        <div className="space-y-2">
          <label className="text-xs text-obsidian-500 font-medium">Annotation Notes</label>
          <textarea
            value={annotationNotes}
            onChange={(e) => {
              setAnnotationNotes(e.target.value);
              onAnnotationChange?.({ shapes: [], notes: e.target.value });
            }}
            rows={2}
            className="w-full rounded-lg bg-obsidian-800/60 border border-obsidian-600/30 px-3 py-2
              text-sm text-obsidian-100 placeholder:text-obsidian-500 focus:outline-none
              focus:ring-2 focus:ring-[#0d8c63]/40 resize-y"
            placeholder="Add notes about these images..."
          />
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* ── Annotation Editor Modal ── */}
      {editingId && editingItem && (
        <ImageAnnotationEditor
          imageSrc={editingItem.originalUrl || editingItem.url}
          onSave={handleAnnotationSave}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
