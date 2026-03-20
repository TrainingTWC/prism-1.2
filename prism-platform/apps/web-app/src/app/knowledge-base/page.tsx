'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../lib/api';

interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  hasEmbedding?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmbeddingStats {
  total: number;
  embedded: number;
  pending: number;
}

const CATEGORIES = [
  { value: 'SOP_PROCEDURE', label: 'SOPs & Procedures', color: '#10b37d' },
  { value: 'SCORING_GRADING', label: 'Scoring & Grading', color: '#3b82f6' },
  { value: 'COMPANY_POLICY', label: 'Company Policies', color: '#8b5cf6' },
  { value: 'BRAND_STANDARD', label: 'Brand Standards', color: '#f59e0b' },
  { value: 'TRAINING_MATERIAL', label: 'Training Materials', color: '#ec4899' },
  { value: 'REGIONAL_GUIDELINE', label: 'Regional Guidelines', color: '#06b6d4' },
  { value: 'PRODUCT_LAUNCH', label: 'Product Launch', color: '#f97316' },
  { value: 'GENERAL', label: 'General', color: '#6b7280' },
];

const getCategoryMeta = (value: string) =>
  CATEGORIES.find((c) => c.value === value) || { value, label: value, color: '#6b7280' };

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState('SOP_PROCEDURE');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterCategory
        ? `/api/knowledge?category=${filterCategory}&active=all`
        : '/api/knowledge?active=all';
      const res = await apiClient<{ data: KnowledgeEntry[] }>(url);
      setEntries(res.data || []);
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
      setToast({ message: 'Failed to load knowledge base', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient<{ data: EmbeddingStats }>('/api/knowledge/embeddings/stats');
      setEmbeddingStats(res.data);
    } catch {
      // Stats are optional, don't show error
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchStats();
  }, [fetchEntries, fetchStats]);

  const openNewEntry = () => {
    setEditingEntry(null);
    setFormCategory('SOP_PROCEDURE');
    setFormTitle('');
    setFormContent('');
    setFormTags('');
    setShowEditor(true);
  };

  const openEditEntry = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setFormCategory(entry.category);
    setFormTitle(entry.title);
    setFormContent(entry.content);
    setFormTags(entry.tags.join(', '));
    setShowEditor(true);
  };

  const saveEntry = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setSaving(true);
    try {
      const payload = {
        category: formCategory,
        title: formTitle.trim(),
        content: formContent.trim(),
        tags: formTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editingEntry) {
        await apiClient(`/api/knowledge/${editingEntry.id}`, {
          method: 'PUT',
          body: payload,
        });
        setToast({ message: 'Entry updated — embedding will refresh automatically', type: 'success' });
      } else {
        await apiClient('/api/knowledge', {
          method: 'POST',
          body: payload,
        });
        setToast({ message: 'Entry created — AI embedding generating...', type: 'success' });
      }

      setShowEditor(false);
      fetchEntries();
      fetchStats();
    } catch (err) {
      console.error('Failed to save:', err);
      setToast({ message: 'Failed to save entry. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this knowledge entry? The AI will no longer have access to it.')) return;
    try {
      await apiClient(`/api/knowledge/${id}`, { method: 'DELETE' });
      setToast({ message: 'Entry deleted', type: 'success' });
      fetchEntries();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete:', err);
      setToast({ message: 'Failed to delete entry', type: 'error' });
    }
  };

  const toggleActive = async (entry: KnowledgeEntry) => {
    try {
      await apiClient(`/api/knowledge/${entry.id}`, {
        method: 'PUT',
        body: { isActive: !entry.isActive },
      });
      fetchEntries();
    } catch (err) {
      console.error('Failed to toggle:', err);
      setToast({ message: 'Failed to toggle entry', type: 'error' });
    }
  };

  const runBackfill = async () => {
    setBackfilling(true);
    try {
      const res = await apiClient<{ data: { total: number; embedded: number; skipped: number; errors: string[] } }>(
        '/api/knowledge/embeddings/backfill',
        { method: 'POST' },
      );
      const d = res.data;
      setToast({
        message: `Embeddings: ${d.embedded} generated, ${d.skipped} skipped${d.errors.length > 0 ? `, ${d.errors.length} errors` : ''}`,
        type: d.errors.length > 0 ? 'error' : 'success',
      });
      fetchEntries();
      fetchStats();
    } catch (err) {
      console.error('Backfill failed:', err);
      setToast({ message: 'Embedding backfill failed', type: 'error' });
    } finally {
      setBackfilling(false);
    }
  };

  const grouped = entries.reduce<Record<string, KnowledgeEntry[]>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-7 h-7 text-[#10b37d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <div>
            <h1 className="text-xl font-black tracking-wider text-[var(--text-primary)] uppercase">Knowledge Base</h1>
            <p className="text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              RAG-powered company standards for AI Intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {embeddingStats && embeddingStats.pending > 0 && (
            <button
              onClick={runBackfill}
              disabled={backfilling}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 text-xs font-bold transition-colors disabled:opacity-50"
              title="Generate AI embeddings for entries that don't have them yet"
            >
              <svg className={`w-3.5 h-3.5 ${backfilling ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              {backfilling ? 'Embedding...' : `Embed ${embeddingStats.pending}`}
            </button>
          )}
          <button
            onClick={openNewEntry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b37d] hover:bg-[#0d9e6f] text-white text-sm font-bold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Knowledge
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
            !filterCategory
              ? 'bg-[#10b37d]/10 border-[#10b37d]/30 text-[#10b37d]'
              : 'bg-[var(--card-bg)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          All ({entries.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = entries.filter((e) => e.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(filterCategory === cat.value ? '' : cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                filterCategory === cat.value
                  ? 'border-current'
                  : 'bg-[var(--card-bg)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              style={filterCategory === cat.value ? { color: cat.color, borderColor: cat.color, backgroundColor: `${cat.color}15` } : {}}
            >
              {cat.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* RAG Status Banner */}
      <div className="rounded-xl border border-[#10b37d]/20 bg-[#10b37d]/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#10b37d] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">RAG-Powered & Confidential.</strong>{' '}
              Knowledge entries are embedded using AI and retrieved semantically — the Intelligence Hub only loads entries relevant to each question,
              making responses faster and more accurate.
            </p>
            {embeddingStats && (
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-[var(--text-muted)]">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />
                  {embeddingStats.embedded} embedded
                </span>
                {embeddingStats.pending > 0 && (
                  <span className="text-xs text-amber-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />
                    {embeddingStats.pending} pending
                  </span>
                )}
                <span className="text-xs text-[var(--text-muted)]">{embeddingStats.total} total</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <div className="w-5 h-5 border-2 border-[#10b37d] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading knowledge base...</span>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 md:p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">No knowledge entries yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Add your company SOPs, policies, scoring rules, and brand standards to train the AI.
          </p>
          <button
            onClick={openNewEntry}
            className="px-5 py-2.5 rounded-xl bg-[#10b37d] hover:bg-[#0d9e6f] text-white text-sm font-bold transition-colors"
          >
            Add Your First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, items]) => {
              const meta = getCategoryMeta(category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      {meta.label}
                    </h2>
                    <span className="text-xs text-[var(--text-muted)]">({items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-xl border bg-[var(--card-bg)] p-4 transition-colors hover:border-[var(--text-muted)]/20 ${
                          entry.isActive ? 'border-[var(--border-subtle)]' : 'border-red-500/20 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">{entry.title}</h3>
                              {!entry.isActive && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold">DISABLED</span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                              {entry.content.slice(0, 200)}
                              {entry.content.length > 200 ? '...' : ''}
                            </p>
                            {entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {entry.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--input-bg)] text-[var(--text-muted)]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {entry.hasEmbedding ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400" title="Embedded for RAG search">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Embedded
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400" title="Pending embedding — will use keyword match">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleActive(entry)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                entry.isActive
                                  ? 'text-[#10b37d] hover:bg-[#10b37d]/10'
                                  : 'text-red-400 hover:bg-red-500/10'
                              }`}
                              title={entry.isActive ? 'Disable (hide from AI)' : 'Enable (show to AI)'}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {entry.isActive ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                )}
                                {entry.isActive && <circle cx="12" cy="12" r="3" />}
                              </svg>
                            </button>
                            <button
                              onClick={() => openEditEntry(entry)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {editingEntry ? 'Edit Knowledge Entry' : 'New Knowledge Entry'}
              </h2>
              <button
                onClick={() => setShowEditor(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setFormCategory(cat.value)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
                        formCategory === cat.value
                          ? 'border-current'
                          : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                      style={
                        formCategory === cat.value
                          ? { color: cat.color, borderColor: cat.color, backgroundColor: `${cat.color}15` }
                          : {}
                      }
                    >
                      <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                  Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Store Opening Checklist SOP"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#10b37d]"
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                  Content <span className="text-[var(--text-muted)] font-normal">(The AI will read this verbatim)</span>
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Paste your SOP, policy, scoring rules, or any company standard here. Be as detailed as possible — the AI uses this to understand your operations and provide relevant analysis."
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#10b37d] resize-y leading-relaxed"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                  Tags <span className="text-[var(--text-muted)] font-normal">(comma separated, optional)</span>
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. hygiene, food-safety, kitchen"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#10b37d]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEntry}
                disabled={!formTitle.trim() || !formContent.trim() || saving}
                className="px-5 py-2 rounded-xl bg-[#10b37d] hover:bg-[#0d9e6f] disabled:opacity-40 text-white text-sm font-bold transition-colors"
              >
                {saving ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
