'use client';

import React, { useState } from 'react';
import { GlassPanel } from '@prism/ui';

const mockQuestions = [
    { id: 'q1', text: 'Floor cleanliness - free of debris/liquid?', type: 'Boolean' },
    { id: 'q2', text: 'Primary register area (cash drawer) secured?', type: 'Boolean' },
    { id: 'q3', text: 'Associate appearance meets brand standards?', type: 'Scale' },
    { id: 'q4', text: 'Restroom inventory - soap/paper/sanitary?', type: 'MultiSelect' },
    { id: 'q5', text: 'Enter specific store count for regional promotion:', type: 'Numeric' },
];

export default function ExecutionPage() {
    const [responses, setResponses] = useState<Record<string, any>>({});

    const handleAnswer = (id: string, value: any) => {
        setResponses(prev => ({ ...prev, [id]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <span className="text-overline text-[#10b37d]">Section 1 of 5: Safety & Operations</span>
                    <h1 className="text-[32px] font-extrabold text-obsidian-50 tracking-tight">Daily Store Opening</h1>
                    <p className="text-obsidian-500 text-sm">Downtown Flagship [S-001] • 12 Mar 2026</p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-2xl font-black font-mono text-[#10b37d]">20%</div>
                    <div className="w-32 h-1.5 bg-obsidian-700/60 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-gradient-to-r from-[#0d8c63] to-[#10b37d] w-1/5 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                {mockQuestions.map((q, idx) => (
                    <GlassPanel key={q.id} className="p-8 group hover:border-[rgba(13,140,99,0.2)] transition-all duration-normal ease-out-expo">
                        <div className="flex gap-6">
                            <span className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-element bg-[rgba(13,140,99,0.08)] text-[#10b37d] font-bold text-sm">
                                {idx + 1}
                            </span>
                            <div className="space-y-6 w-full">
                                <h3 className="text-base font-semibold text-obsidian-100">{q.text}</h3>
                                
                                {q.type === 'Boolean' && (
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => handleAnswer(q.id, true)}
                                            className={`flex-1 py-3 px-6 rounded-element border font-bold text-sm transition-all duration-normal ease-out-expo ${responses[q.id] === true ? 'bg-[#22C55E] border-[#22C55E] text-white shadow-lg shadow-[#22C55E]/20' : 'bg-obsidian-800/60 border-obsidian-600/30 text-obsidian-400 hover:bg-obsidian-700/50'}`}
                                        >
                                            PASS
                                        </button>
                                        <button 
                                            onClick={() => handleAnswer(q.id, false)}
                                            className={`flex-1 py-3 px-6 rounded-element border font-bold text-sm transition-all duration-normal ease-out-expo ${responses[q.id] === false ? 'bg-[#EF4444] border-[#EF4444] text-white shadow-lg shadow-[#EF4444]/20' : 'bg-obsidian-800/60 border-obsidian-600/30 text-obsidian-400 hover:bg-obsidian-700/50'}`}
                                        >
                                            FAIL
                                        </button>
                                    </div>
                                )}

                                {q.type === 'Numeric' && (
                                    <input 
                                        type="number"
                                        placeholder="Enter value"
                                        className="w-full bg-obsidian-800/60 border border-obsidian-600/30 rounded-element p-4 text-obsidian-100 placeholder-obsidian-500 focus:outline-none focus:ring-1 focus:ring-[#0d8c63]/40 focus:border-[#0d8c63]/40 transition-all duration-fast"
                                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                                    />
                                )}

                                {q.type === 'Scale' && (
                                    <div className="flex justify-between gap-1">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                                            <button 
                                                key={val}
                                                onClick={() => handleAnswer(q.id, val)}
                                                className={`h-10 w-10 rounded-md text-xs font-bold transition-all duration-fast ${responses[q.id] === val ? 'bg-gradient-to-br from-[#0d8c63] to-[#10b37d] text-white shadow-lg shadow-[#0d8c63]/20' : 'bg-obsidian-800/60 text-obsidian-500 hover:bg-obsidian-700/50 hover:text-obsidian-300'}`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="pt-2 flex items-center text-obsidian-500 gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-normal">
                                    <button className="flex items-center gap-1.5 text-xs hover:text-[#10b37d] transition-colors duration-fast"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Photo</button>
                                    <button className="flex items-center gap-1.5 text-xs hover:text-[#10b37d] transition-colors duration-fast"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg> Comment</button>
                                </div>
                            </div>
                        </div>
                    </GlassPanel>
                ))}
            </div>

            <div className="fixed bottom-0 left-64 right-0 p-6 bg-[var(--bg-surface)] backdrop-blur-xl backdrop-saturate-[1.2] border-t border-obsidian-600/20 flex justify-between items-center z-50">
                <button className="px-6 py-2.5 text-obsidian-400 font-bold text-sm hover:text-obsidian-200 transition-colors duration-fast">Draft Saved at 10:45 AM</button>
                <div className="flex gap-3">
                    <button className="px-6 py-2.5 rounded-element border border-obsidian-600/40 text-obsidian-200 font-bold text-sm hover:bg-obsidian-700/40 transition-all duration-fast">Previous Section</button>
                    <button className="px-8 py-2.5 rounded-element bg-gradient-to-r from-[#0d8c63] to-[#10b37d] text-white font-black text-sm shadow-lg shadow-[#0d8c63]/30 hover:-translate-y-px active:scale-[0.98] transition-all duration-normal ease-out-expo">Submit Evaluation</button>
                </div>
            </div>
        </div>
    );
}