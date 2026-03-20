'use client';

import React, { useEffect } from 'react';
import { useChatContext } from '@/lib/chat-context';

/* ── Glitch characters for client-side rendering ── */
const GLITCH_CHARS = ['█', '▓', '░', '▒', '╳', '◈', '◆', '⬡', '⎔', '⏣', '☠', '⚡', '✕'];

void GLITCH_CHARS; // suppress unused lint

function renderCensoredText(text: string): React.ReactNode[] {
  const censorPattern = /(\[[\u2588\u2593\u2591\u2592\u2573\u25C8\u25C6\u2B21\u23D4\u23E3\u2620\u26A1\u2715]+\])/g;
  const parts = text.split(censorPattern);
  return parts.map((part, i) => {
    if (/^\[[\u2588\u2593\u2591\u2592\u2573\u25C8\u25C6\u2B21\u23D4\u23E3\u2620\u26A1\u2715]+\]$/.test(part)) {
      return (
        <span key={i} className="glitch-censor" title="[REDACTED]">
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const SUGGESTED_PROMPTS = [
  'Which store has the lowest compliance score?',
  'Show me program performance summary',
  'Top 5 performing employees this month',
  'Compare region-wise audit scores',
  'Which programs need immediate attention?',
  'Give me an overall operational health summary',
];

export default function IntelligenceHubPage() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
    clearChat,
    setOpen,
    messagesEndRef,
    inputRef,
  } = useChatContext();

  // Close floating widget when on the full page
  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesEndRef]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line) => {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--text-primary)] font-bold">$1</strong>');
        if (line.startsWith('### ')) {
          return `<h4 class="text-sm font-bold text-[var(--text-primary)] mt-3 mb-1">${formatted.slice(4)}</h4>`;
        }
        if (line.startsWith('## ')) {
          return `<h3 class="text-base font-bold text-[var(--text-primary)] mt-4 mb-2">${formatted.slice(3)}</h3>`;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return `<div class="flex gap-2 ml-2"><span class="text-[#10b37d] mt-0.5">•</span><span>${formatted.slice(2)}</span></div>`;
        }
        const numMatch = line.match(/^(\d+)\.\s/);
        if (numMatch) {
          return `<div class="flex gap-2 ml-2"><span class="text-[#10b37d] font-bold min-w-[1.2rem]">${numMatch[1]}.</span><span>${formatted.slice(numMatch[0].length)}</span></div>`;
        }
        if (line.trim() === '') {
          return `<div class="h-2"></div>`;
        }
        return `<div>${formatted}</div>`;
      })
      .join('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-[#10b37d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          <div>
            <h1 className="text-base sm:text-xl font-black tracking-wider text-[var(--text-primary)] uppercase">Intelligence Hub</h1>
            <p className="text-[9px] sm:text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase hidden sm:block">Advanced AI analysis of your operational ecosystem.</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-bg)] hover:bg-[var(--input-bg)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          title="Clear conversation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-5">
          {messages.map((msg) => {
            // ── System Warning (violation) ──
            if (msg.role === 'system-warning') {
              const isEscalated = msg.moderation?.escalated;
              return (
                <div key={msg.id} className="flex justify-center px-4">
                  <div className={`violation-warning max-w-[85%] ${isEscalated ? 'escalated' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isEscalated ? 'bg-red-600' : 'bg-red-500/20'}`}>
                        <svg className={`w-4 h-4 ${isEscalated ? 'text-white' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isEscalated ? 'text-red-400' : 'text-red-400/80'}`}>
                            {isEscalated ? 'VIOLATION ESCALATED' : 'POLICY VIOLATION'}
                          </span>
                          {msg.moderation?.warningCount && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              Strike {msg.moderation.warningCount}/3
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{msg.content}</p>
                        {msg.moderation?.violations && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {msg.moderation.violations.map((v, i) => (
                              <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/8 text-red-400/70 border border-red-500/10 uppercase tracking-wider">
                                {v.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // ── Normal messages (user + assistant) ──
            return (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-[#10b37d] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 004.5 8.25v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? msg.censored
                      ? 'bg-[var(--input-bg)] border border-red-500/30 text-[var(--text-secondary)] rounded-br-sm'
                      : 'bg-[#10b37d] text-white rounded-br-sm'
                    : 'bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                ) : msg.censored && msg.censoredContent ? (
                  <div className="flex items-center gap-2">
                    <span className="select-none">{renderCensoredText(msg.censoredContent)}</span>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-[var(--input-bg)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}
            </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-[#10b37d] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 004.5 8.25v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div className="bg-[var(--input-bg)] border border-[var(--border-subtle)] rounded-xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#10b37d] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#10b37d] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#10b37d] animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-[var(--text-muted)] ml-2">Analyzing data...</span>
                </div>
              </div>
            </div>
          )}

          {/* Suggested prompts */}
          {messages.length === 1 && !isLoading && (
            <div className="pt-4">
              <p className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-wider">Suggested queries</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] hover:border-[#10b37d]/40 hover:bg-[#10b37d]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200"
                  >
                    <span className="text-[#10b37d] mr-2">&rarr;</span>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-[var(--border-subtle)] px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter operational query..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-lg bg-[#10b37d] hover:bg-[#0d9e6f] disabled:opacity-30 disabled:hover:bg-[#10b37d] flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-2">
        <p className="text-[10px] tracking-[0.25em] text-[var(--text-muted)] uppercase">
          Intelligence Engine v3.1 &mdash; Secure Link Established
        </p>
      </div>
    </div>
  );
}


