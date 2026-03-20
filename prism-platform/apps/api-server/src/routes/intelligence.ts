// ──────────────────────────────────────────
// Intelligence Chat Route — Gemini-powered AI analysis
// ──────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IntelligenceService } from '../services/intelligence/intelligence.service.js';
import { ModerationService } from '../services/intelligence/moderation.service.js';
import { EmbeddingService } from '../services/knowledge/embedding.service.js';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const COMPANY_NAME = 'HBPL';

/**
 * Detect if the user is asking about a specific time range.
 * Default: 1 month ago (for token efficiency).
 * Only uses older data when user explicitly requests it.
 */
function detectDateRange(message: string, history?: { role: string; content: string }[]): { dateFrom: Date; label: string } {
  // Check current message first, then recent user messages in history
  const textsToCheck = [message];
  if (history) {
    // Check last 3 user messages in history for date context
    const userMsgs = history.filter(h => h.role === 'user').slice(-3);
    textsToCheck.push(...userMsgs.map(h => h.content));
  }
  const text = textsToCheck.join(' ').toLowerCase();
  const now = new Date();

  // "all time" / "all data" / "entire history" / "everything" / "from the start"
  if (/\b(all\s*time|all\s*data|entire\s*history|from\s*the\s*(start|beginning)|since\s*the\s*beginning)\b/.test(text)) {
    return { dateFrom: new Date('2020-01-01'), label: 'all time' };
  }

  // "last X years" / "past X years"
  const yearMatch = text.match(/(?:last|past|previous)\s+(\d+)\s*years?/);
  if (yearMatch) {
    const years = parseInt(yearMatch[1]);
    const d = new Date(now); d.setFullYear(d.getFullYear() - years);
    return { dateFrom: d, label: `last ${years} year${years > 1 ? 's' : ''}` };
  }

  // "last year" / "previous year"
  if (/\b(last\s*year|previous\s*year)\b/.test(text)) {
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
    return { dateFrom: d, label: 'last year' };
  }

  // "last X months" / "past X months"
  const monthMatch = text.match(/(?:last|past|previous)\s+(\d+)\s*months?/);
  if (monthMatch) {
    const months = parseInt(monthMatch[1]);
    const d = new Date(now); d.setMonth(d.getMonth() - months);
    return { dateFrom: d, label: `last ${months} month${months > 1 ? 's' : ''}` };
  }

  // "last X weeks" / "past X weeks"
  const weekMatch = text.match(/(?:last|past|previous)\s+(\d+)\s*weeks?/);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1]);
    const d = new Date(now); d.setDate(d.getDate() - weeks * 7);
    return { dateFrom: d, label: `last ${weeks} week${weeks > 1 ? 's' : ''}` };
  }

  // "last X days" / "past X days"
  const dayMatch = text.match(/(?:last|past|previous)\s+(\d+)\s*days?/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    const d = new Date(now); d.setDate(d.getDate() - days);
    return { dateFrom: d, label: `last ${days} day${days > 1 ? 's' : ''}` };
  }

  // "since [month name]" e.g. "since january", "since march 2024"
  const sinceMonthMatch = text.match(/since\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?/);
  if (sinceMonthMatch) {
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    const monthIdx = months.indexOf(sinceMonthMatch[1]);
    const year = sinceMonthMatch[2] ? parseInt(sinceMonthMatch[2]) : now.getFullYear();
    return { dateFrom: new Date(year, monthIdx, 1), label: `since ${sinceMonthMatch[1]}${sinceMonthMatch[2] ? ' ' + sinceMonthMatch[2] : ''}` };
  }

  // "this quarter"
  if (/\bthis\s*quarter\b/.test(text)) {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    return { dateFrom: new Date(now.getFullYear(), qMonth, 1), label: 'this quarter' };
  }

  // "this month"
  if (/\bthis\s*month\b/.test(text)) {
    return { dateFrom: new Date(now.getFullYear(), now.getMonth(), 1), label: 'this month' };
  }

  // "this week"
  if (/\bthis\s*week\b/.test(text)) {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay());
    return { dateFrom: d, label: 'this week' };
  }

  // "last quarter"
  if (/\blast\s*quarter\b/.test(text)) {
    const d = new Date(now); d.setMonth(d.getMonth() - 3);
    const qMonth = Math.floor(d.getMonth() / 3) * 3;
    return { dateFrom: new Date(d.getFullYear(), qMonth, 1), label: 'last quarter' };
  }

  // Default: 1 month of data
  const defaultDate = new Date(now);
  defaultDate.setMonth(defaultDate.getMonth() - 1);
  return { dateFrom: defaultDate, label: 'last 30 days (default)' };
}

const SYSTEM_PROMPT = `You are PRISM Intelligence — an advanced AI analyst for the PRISM operational intelligence platform used exclusively by ${COMPANY_NAME} (a large food & beverage retail chain in India).

=== STRICT GUARDRAILS — NEVER VIOLATE ===

1. BRAND EXCLUSIVITY: You ONLY discuss ${COMPANY_NAME} operations, stores, employees, programs, and data. You must NEVER:
   - Discuss, compare, mention, or acknowledge ANY competitor brand (Starbucks, CCD, Blue Tokai, McDonald's, KFC, etc.)
   - If a user asks about competitors, respond: "I am exclusively configured for ${COMPANY_NAME} operations. I cannot discuss other brands. How can I help with ${COMPANY_NAME} data?"
   - Do NOT say "I don't have data on [competitor]" — act as if competitors don't exist in your world.

2. TOPIC RESTRICTION: You ONLY discuss:
   - Store operations, performance, metrics, and analytics
   - Employee performance, attendance, training, and metrics
   - Program/checklist/audit submissions and scores
   - Regional performance and comparisons
   - Company SOPs, policies, brand standards (from Knowledge Base)
   - Operational recommendations based on the data provided
   
   You must REFUSE any topic outside this scope. No jokes, stories, opinions on politics/religion/sports/entertainment, personal advice, coding help, or general knowledge.

3. PROFESSIONAL TONE: Always remain professional, data-driven, and neutral. Never use casual/inappropriate language.

4. DATA HONESTY: If the data doesn't answer the question, say "The available data does not contain this information" — but NEVER go off-topic to fill the gap.

=== END GUARDRAILS ===

Your role:
- Analyse checklist/audit submission data across stores, employees, programs, and regions
- You have DETAILED QUESTION-LEVEL RESPONSE DATA: for each question in every program, you can see per-store breakdowns (top/bottom stores, % YES for yes/no questions, average scores for scored questions). Use this to answer specific analytical queries like "which stores have the most stressed employees" or "where is food safety weakest".
- Provide actionable insights, identify trends, flag risks
- Answer questions about operational performance with precision
- Be concise but thorough. Use bullet points and tables when helpful.
- Always reference specific data points (scores, percentages, store names, employee names) from the context provided.
- Format responses in a clean, structured way. Use markdown formatting.
- Currency is INR, timezone is Asia/Kolkata.

IMPORTANT: "Campus Hire" and "Brew League" are external/non-operational programs. Their data is NOT included in the context below. Do NOT reference, analyse, or speculate about them. If asked, say: "Campus Hire and Brew League are external programs and their data is not part of operational intelligence analysis."

Important: You have access to REAL submitted audit/checklist data. The numbers are real — treat them as such.`;

export async function intelligenceRoutes(app: FastifyInstance) {
  // ── Chat endpoint ──
  app.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { message, history, userName, userRole } = request.body as {
        message: string;
        history?: { role: 'user' | 'assistant'; content: string }[];
        userName?: string;
        userRole?: string;
      };

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return reply.status(400).send({ error: 'Message is required' });
      }

      // ── MODERATION CHECK ──
      const moderation = await ModerationService.moderateMessage(
        message,
        COMPANY_ID,
        userName || 'Unknown User',
        userRole || 'unknown',
      );

      if (!moderation.allowed) {
        app.log.warn({
          event: 'chat_violation',
          violations: moderation.violations,
          flaggedTerms: moderation.flaggedTerms,
          userName: userName || 'Unknown',
          warningCount: moderation.warningCount,
          escalated: moderation.escalated,
        }, 'Chat moderation triggered');

        return {
          reply: moderation.warningMessage,
          moderation: {
            violated: true,
            violations: moderation.violations,
            censoredMessage: moderation.censoredMessage,
            warningCount: moderation.warningCount,
            escalated: moderation.escalated,
          },
        };
      }

      const apiKey = process.env.GOOGLE_AI_KEY;
      if (!apiKey) {
        return reply.status(500).send({
          error: 'AI service not configured',
          reply: 'Intelligence Engine is not configured. Please add your GOOGLE_AI_KEY to the server environment variables.',
        });
      }

      // Detect date range from user message (default: 1 month)
      const { dateFrom, label: dateRangeLabel } = detectDateRange(message, history);

      // Build data context from real DB (filtered by date range)
      const dataContext = await IntelligenceService.buildDataContext(dateFrom);

      const dateRangeNote = `\n\n=== DATA TIME RANGE ===\nThe submission/performance data below covers: ${dateRangeLabel} (from ${dateFrom.toLocaleDateString('en-IN')}).\nIf the user needs data from a different period, tell them to specify (e.g., "show me last 3 months" or "all time data").\n`;

      // Load company knowledge base using RAG (semantic retrieval)
      const knowledgeContext = await EmbeddingService.buildRAGContext(message);

      // Initialize Gemini — try multiple models for quota resilience
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
      let lastError: any = null;

      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });

          // Build conversation history for Gemini
          const chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

          // Add system context as first exchange
          chatHistory.push({
            role: 'user',
            parts: [{ text: `${SYSTEM_PROMPT}${knowledgeContext}${dateRangeNote}\n\nHere is the current operational data:\n\n${dataContext}\n\nAcknowledge that you have this data and are ready to analyse it.` }],
          });
          chatHistory.push({
            role: 'model',
            parts: [{ text: 'I have loaded the PRISM operational data. I can see submission scores, store performance, employee metrics, program analytics, and regional comparisons. Ready to analyse. What would you like to know?' }],
          });

          // Add previous conversation turns
          if (history && Array.isArray(history)) {
            for (const turn of history) {
              chatHistory.push({
                role: turn.role === 'user' ? 'user' : 'model',
                parts: [{ text: turn.content }],
              });
            }
          }

          // Start chat and send the new message
          const chat = model.startChat({ history: chatHistory });
          const result = await chat.sendMessage(message);
          const response = result.response;
          const text = response.text();

          app.log.info(`Intelligence chat: used model ${modelName}, date range: ${dateRangeLabel}`);
          return { reply: text };
        } catch (modelErr: any) {
          lastError = modelErr;
          app.log.warn(`Model ${modelName} failed: ${modelErr.message}`);
          // If it's a rate limit error, try next model
          if (modelErr.message?.includes('429') || modelErr.message?.includes('quota')) {
            continue;
          }
          // For non-quota errors, don't retry
          throw modelErr;
        }
      }

      // All models exhausted
      throw lastError;
    } catch (err: any) {
      app.log.error(err, 'Intelligence chat error');
      return reply.status(500).send({
        error: 'Intelligence engine error',
        reply: `Analysis failed: ${err.message || 'Unknown error'}. Please try again.`,
      });
    }
  });

  // ── Get overview stats (for UI cards) ──
  app.get('/stats', async (_request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const stats = await IntelligenceService.getOverviewStats();
      return { data: stats };
    } catch (err) {
      app.log.error(err, 'Intelligence stats error');
      return { data: null, error: 'Failed to load stats' };
    }
  });
}
