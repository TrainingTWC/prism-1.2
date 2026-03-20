'use client';

import React from 'react';
import Link from 'next/link';

interface ChecklistLayoutProps {
    name: string;
    breadcrumb?: string;
    completed: number;
    total: number;
    children: React.ReactNode;
}

export function ChecklistLayout({ name, breadcrumb, completed, total, children }: ChecklistLayoutProps) {
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    return (
        <div className="min-h-screen bg-obsidian-950">
            {/* Header Bar per §18.2 */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-obsidian-600/20 bg-[var(--bg-surface)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/checklists"
                        className="flex items-center gap-2 text-obsidian-400 hover:text-obsidian-200 transition-colors duration-fast"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">Back</span>
                    </Link>
                    <div className="h-4 w-px bg-obsidian-600/30" />
                    <span className="text-sm text-obsidian-300">
                        Checklists / <span className="text-obsidian-100 font-semibold">{breadcrumb || name}</span>
                    </span>
                </div>
                
                <div className="flex items-center gap-4">
                    {total > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 rounded-full bg-obsidian-700/40 overflow-hidden">
                                <div 
                                    className="h-full rounded-full bg-[#10b37d] transition-all duration-normal"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-obsidian-300 font-mono">{completed}/{total}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {children}
            </div>
        </div>
    );
}

interface ChecklistQuestionProps {
    index: number;
    question: string;
    type: 'boolean' | 'scale' | 'text' | 'multiselect' | 'number' | 'image';
    required?: boolean;
}

export function ChecklistQuestion({ index, question, type, required }: ChecklistQuestionProps) {
    return (
        <div className="rounded-2xl border border-obsidian-600/30 bg-[var(--card-bg)] backdrop-blur-xl p-5 transition-all duration-normal hover:border-obsidian-600/40">
            <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-obsidian-700/40 flex items-center justify-center text-xs font-bold text-obsidian-400 font-mono">
                    {index}
                </span>
                <div className="flex-1">
                    <p className="text-sm font-medium text-obsidian-200 mb-3">
                        {question}
                        {required && <span className="text-[#EF4444] ml-1">*</span>}
                    </p>
                    
                    {type === 'boolean' && (
                        <div className="flex gap-2">
                            <button className="px-4 py-2 rounded-xl text-xs font-semibold border border-obsidian-600/30 bg-obsidian-700/20 text-obsidian-300 hover:bg-[rgba(34,197,94,0.1)] hover:text-[#22C55E] hover:border-[rgba(34,197,94,0.3)] transition-all duration-fast">
                                Yes
                            </button>
                            <button className="px-4 py-2 rounded-xl text-xs font-semibold border border-obsidian-600/30 bg-obsidian-700/20 text-obsidian-300 hover:bg-[rgba(239,68,68,0.1)] hover:text-[#EF4444] hover:border-[rgba(239,68,68,0.3)] transition-all duration-fast">
                                No
                            </button>
                            <button className="px-4 py-2 rounded-xl text-xs font-semibold border border-obsidian-600/30 bg-obsidian-700/20 text-obsidian-300 hover:bg-obsidian-700/40 transition-all duration-fast">
                                N/A
                            </button>
                        </div>
                    )}
                    
                    {type === 'scale' && (
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} className="w-10 h-10 rounded-xl text-xs font-bold border border-obsidian-600/30 bg-obsidian-700/20 text-obsidian-300 hover:bg-[rgba(13,140,99,0.1)] hover:text-[#10b37d] hover:border-[rgba(13,140,99,0.3)] transition-all duration-fast">
                                    {n}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {type === 'text' && (
                        <textarea 
                            className="w-full px-4 py-3 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/40 text-obsidian-200 placeholder-obsidian-500 focus:ring-1 focus:ring-[#0d8c63]/20 focus:border-[#0d8c63]/40 outline-none transition-all duration-normal resize-none"
                            rows={3}
                            placeholder="Enter your response..."
                        />
                    )}
                    
                    {type === 'number' && (
                        <input 
                            type="number"
                            className="w-32 px-4 py-2.5 rounded-xl text-sm bg-obsidian-800/60 border border-obsidian-600/40 text-obsidian-200 placeholder-obsidian-500 focus:ring-1 focus:ring-[#0d8c63]/20 focus:border-[#0d8c63]/40 outline-none transition-all duration-normal font-mono"
                            placeholder="0"
                        />
                    )}
                    
                    {type === 'image' && (
                        <div className="border-2 border-dashed border-obsidian-600/30 rounded-xl p-6 text-center hover:border-obsidian-600/50 transition-colors duration-fast cursor-pointer">
                            <svg className="w-8 h-8 mx-auto text-obsidian-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-obsidian-400">Click to upload image</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
