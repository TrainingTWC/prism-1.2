'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatContext, ChatMessage } from '@/lib/chat-context';

/* ── Glitch characters (same as main page) ── */
const GLITCH_CHARS = ['█', '▓', '░', '▒', '╳', '◈', '◆', '⬡', '⎔', '⏣', '☠', '⚡', '✕'];

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

void GLITCH_CHARS; // suppress unused lint

function formatContent(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      const formatted = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-[var(--text-primary)] font-bold">$1</strong>',
      );
      if (line.startsWith('### '))
        return `<h4 class="text-xs font-bold text-[var(--text-primary)] mt-2 mb-0.5">${formatted.slice(4)}</h4>`;
      if (line.startsWith('## '))
        return `<h3 class="text-sm font-bold text-[var(--text-primary)] mt-3 mb-1">${formatted.slice(3)}</h3>`;
      if (line.startsWith('- ') || line.startsWith('* '))
        return `<div class="flex gap-1.5 ml-1"><span class="text-[#10b37d] mt-0.5">•</span><span>${formatted.slice(2)}</span></div>`;
      const numMatch = line.match(/^(\d+)\.\s/);
      if (numMatch)
        return `<div class="flex gap-1.5 ml-1"><span class="text-[#10b37d] font-bold min-w-[1rem]">${numMatch[1]}.</span><span>${formatted.slice(numMatch[0].length)}</span></div>`;
      if (line.trim() === '') return `<div class="h-1.5"></div>`;
      return `<div>${formatted}</div>`;
    })
    .join('');
}

const SUGGESTED_PROMPTS_MINI = [
  'Which store has the lowest compliance?',
  'Show me program performance summary',
  'Top 5 performing employees',
  'Overall operational health summary',
];

/* ═══════════════════════════════════════════════════
   Floating Chat Widget
   ═══════════════════════════════════════════════════ */
export function FloatingChat() {
  const pathname = usePathname();
  const isOnFullPage = pathname === '/ai-insights';

  const {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
    clearChat,
    isOpen,
    toggleOpen,
    messagesEndRef,
    inputRef,
  } = useChatContext();

  // Auto-scroll when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, messagesEndRef]);

  // Hide floating widget on the full Intelligence Hub page
  if (isOnFullPage) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <motion.button
        onClick={toggleOpen}
        className="fixed bottom-[5.5rem] right-4 md:bottom-6 md:right-6 z-[100] w-12 h-12 rounded-full bg-[#10b37d] hover:bg-[#0d9e6f] shadow-lg shadow-[#10b37d]/25 flex items-center justify-center transition-colors"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="Prism Intelligence"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="spark"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="fixed bottom-[7rem] right-3 md:bottom-20 md:right-6 z-[100] w-[calc(100vw-1.5rem)] sm:w-[380px] h-[calc(100vh-10rem)] md:h-[520px] max-h-[600px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] backdrop-blur-2xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--sidebar-bg)]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#10b37d] flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Prism Intelligence
                  </h3>
                  <p className="text-[9px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
                    Always-on AI assistant
                  </p>
                </div>
              </div>
              <button
                onClick={clearChat}
                className="p-1.5 rounded-md hover:bg-[var(--input-bg)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="Clear conversation"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-md bg-[#10b37d] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 004.5 8.25v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div className="bg-[var(--input-bg)] border border-[var(--border-subtle)] rounded-lg rounded-bl-sm px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10b37d] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10b37d] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10b37d] animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[10px] text-[var(--text-muted)] ml-1.5">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested prompts (only when fresh) */}
              {messages.length === 1 && !isLoading && (
                <div className="pt-2">
                  <p className="text-[10px] text-[var(--text-muted)] mb-2 uppercase tracking-wider">Suggestions</p>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTED_PROMPTS_MINI.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="text-left text-[11px] px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] hover:border-[#10b37d]/40 hover:bg-[#10b37d]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200"
                      >
                        <span className="text-[#10b37d] mr-1.5">&rarr;</span>
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[var(--border-subtle)] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-md bg-[#10b37d] hover:bg-[#0d9e6f] disabled:opacity-30 disabled:hover:bg-[#10b37d] flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Individual message bubble (compact) ── */
function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'system-warning') {
    const isEscalated = msg.moderation?.escalated;
    return (
      <div className="flex justify-center">
        <div className={`max-w-[90%] rounded-lg px-3 py-2 text-[11px] border ${isEscalated ? 'border-red-500/40 bg-red-500/10' : 'border-red-500/20 bg-red-500/5'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">
              {isEscalated ? 'ESCALATED' : 'POLICY VIOLATION'}
            </span>
            {msg.moderation?.warningCount && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                {msg.moderation.warningCount}/3
              </span>
            )}
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed">{msg.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.role === 'assistant' && (
        <div className="w-6 h-6 rounded-md bg-[#10b37d] flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 004.5 8.25v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-[11px] leading-relaxed ${
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
          <span className="select-none">{renderCensoredText(msg.censoredContent)}</span>
        ) : (
          msg.content
        )}
      </div>
      {msg.role === 'user' && (
        <div className="w-6 h-6 rounded-md bg-[var(--input-bg)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      )}
    </div>
  );
}
