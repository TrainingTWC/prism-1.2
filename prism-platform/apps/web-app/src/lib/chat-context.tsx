'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { apiClient } from './api';
import { useAuth } from './auth-context';

/* ── Types ── */
interface ModerationInfo {
  violated: boolean;
  violations: string[];
  censoredMessage: string;
  warningCount: number;
  escalated: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system-warning';
  content: string;
  timestamp: Date;
  censored?: boolean;
  censoredContent?: string;
  moderation?: ModerationInfo;
}

interface ChatResponse {
  reply: string;
  moderation?: ModerationInfo;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hello! I am Prism Intelligence. How can I help you analyze your operational data today?',
  timestamp: new Date(),
};

/* ── Context shape ── */
interface ChatContextValue {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  sendMessage: (text?: string) => Promise<void>;
  clearChat: () => void;
  /** floating widget open/close */
  isOpen: boolean;
  toggleOpen: () => void;
  setOpen: (v: boolean) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used inside ChatProvider');
  return ctx;
}

/* ── Provider ── */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, employeeInfo, empId } = useAuth();

  const toggleOpen = useCallback(() => setOpen((p) => !p), []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: msg,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const history = messages
          .filter((m) => m.id !== 'welcome' && m.role !== 'system-warning')
          .map((m) => ({
            role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: m.content,
          }));

        const res = await apiClient<ChatResponse>('/api/intelligence/chat', {
          method: 'POST',
          body: {
            message: msg,
            history,
            userName: user?.name || employeeInfo?.name || empId || 'User',
            userRole: employeeInfo?.department || 'unknown',
          },
        });

        if (res.moderation?.violated) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMessage.id
                ? { ...m, censored: true, censoredContent: res.moderation!.censoredMessage }
                : m,
            ),
          );
          const warningMessage: ChatMessage = {
            id: `warn-${Date.now()}`,
            role: 'system-warning',
            content: res.reply || '',
            timestamp: new Date(),
            moderation: res.moderation,
          };
          setMessages((prev) => [...prev, warningMessage]);
        } else {
          const aiMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: res.reply,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
      } catch (err: any) {
        const errorMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Analysis failed: ${err.message || 'Unable to connect to Intelligence Engine. Please check that the API server is running.'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, messages, user, employeeInfo, empId],
  );

  const clearChat = useCallback(() => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        setInput,
        isLoading,
        sendMessage,
        clearChat,
        isOpen,
        toggleOpen,
        setOpen,
        messagesEndRef,
        inputRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
