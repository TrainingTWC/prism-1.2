// ──────────────────────────────────────────
// Embedding Service — Google text-embedding-004 + pgvector RAG
// ──────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../../lib/prisma.js';
import crypto from 'crypto';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const EMBEDDING_MODEL = 'gemini-embedding-001';

// ── Helpers ──

function contentHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 64);
}

function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_KEY not configured');
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Build the text blob to embed for a knowledge entry.
 * Combines category, title, tags, and content for richer semantic signal.
 */
function buildEmbeddingText(entry: {
  category: string;
  title: string;
  content: string;
  tags?: string[];
}): string {
  const categoryLabel: Record<string, string> = {
    SOP_PROCEDURE: 'Standard Operating Procedure',
    SCORING_GRADING: 'Scoring and Grading Rules',
    COMPANY_POLICY: 'Company Policy',
    BRAND_STANDARD: 'Brand Standard',
    TRAINING_MATERIAL: 'Training Material',
    REGIONAL_GUIDELINE: 'Regional Guideline',
    PRODUCT_LAUNCH: 'Product Launch',
    GENERAL: 'General Knowledge',
  };
  const parts = [
    `Category: ${categoryLabel[entry.category] || entry.category}`,
    `Title: ${entry.title}`,
  ];
  if (entry.tags && entry.tags.length > 0) {
    parts.push(`Tags: ${entry.tags.join(', ')}`);
  }
  parts.push(`\n${entry.content}`);
  return parts.join('\n');
}

// ──────────────────────────────────────────
// PUBLIC API
// ──────────────────────────────────────────

export class EmbeddingService {
  /**
   * Generate a 768-dim embedding vector for a text string.
   * Uses gemini-embedding-001 with outputDimensionality=768 for HNSW compatibility.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' },
      outputDimensionality: 768,
    });
    return result.embedding.values;
  }

  /**
   * Generate and store embedding for a single knowledge entry.
   * Skips if content hasn't changed (based on content hash).
   */
  static async embedKnowledgeEntry(entryId: string, force = false): Promise<boolean> {
    const entry = await prisma.companyKnowledge.findUnique({
      where: { id: entryId },
    });
    if (!entry) throw new Error(`Knowledge entry ${entryId} not found`);

    const text = buildEmbeddingText({
      category: entry.category,
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
    });
    const hash = contentHash(text);

    // Skip if content hasn't changed (unless forced)
    if (!force) {
      const current = await prisma.$queryRaw<{ content_hash: string | null }[]>`
        SELECT content_hash FROM company_knowledge WHERE id = ${entryId}::uuid
      `;
      if (current[0]?.content_hash === hash) {
        return false; // No change
      }
    }

    // Generate embedding
    const embedding = await EmbeddingService.generateEmbedding(text);

    // Store embedding + hash via raw SQL (Prisma doesn't support vector type)
    const embeddingStr = `[${embedding.join(',')}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE company_knowledge SET embedding = $1::vector, content_hash = $2 WHERE id = $3::uuid`,
      embeddingStr,
      hash,
      entryId,
    );

    return true;
  }

  /**
   * Backfill embeddings for all knowledge entries that are missing them.
   * Returns { total, embedded, skipped, errors }.
   */
  static async backfillEmbeddings(): Promise<{
    total: number;
    embedded: number;
    skipped: number;
    errors: string[];
  }> {
    const entries = await prisma.companyKnowledge.findMany({
      where: { companyId: COMPANY_ID, isActive: true },
      select: { id: true, category: true, title: true, content: true, tags: true },
    });

    // Get existing hashes
    const existing = await prisma.$queryRaw<{ id: string; content_hash: string | null }[]>`
      SELECT id, content_hash FROM company_knowledge WHERE company_id = ${COMPANY_ID}::uuid
    `;
    const hashMap = new Map(existing.map((e) => [e.id, e.content_hash]));

    const result = { total: entries.length, embedded: 0, skipped: 0, errors: [] as string[] };

    for (const entry of entries) {
      try {
        const text = buildEmbeddingText(entry);
        const hash = contentHash(text);

        // Skip if already embedded and content unchanged
        if (hashMap.get(entry.id) === hash) {
          result.skipped++;
          continue;
        }

        const embedding = await EmbeddingService.generateEmbedding(text);
        const embeddingStr = `[${embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE company_knowledge SET embedding = $1::vector, content_hash = $2 WHERE id = $3::uuid`,
          embeddingStr,
          hash,
          entry.id,
        );
        result.embedded++;

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 200));
      } catch (err: any) {
        result.errors.push(`${entry.id}: ${err.message}`);
      }
    }

    return result;
  }

  /**
   * Semantic search: find the most relevant KB entries for a query.
   * Uses pgvector cosine similarity via the match_knowledge function.
   */
  static async searchSimilar(
    query: string,
    topK = 5,
    threshold = 0.3,
  ): Promise<
    {
      id: string;
      category: string;
      title: string;
      content: string;
      tags: string[];
      similarity: number;
    }[]
  > {
    // Generate query embedding
    const queryEmbedding = await EmbeddingService.generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Call the match_knowledge function with explicit type casts
    const results = await prisma.$queryRawUnsafe<
      {
        id: string;
        category: string;
        title: string;
        content: string;
        tags: string[];
        similarity: number;
      }[]
    >(
      `SELECT * FROM match_knowledge($1::vector(768), $2::float, $3::int, $4::uuid)`,
      embeddingStr,
      threshold,
      topK,
      COMPANY_ID,
    );

    return results;
  }

  /**
   * RAG context builder: given a user message, retrieve relevant KB entries
   * and format them for the AI system prompt.
   */
  static async buildRAGContext(userMessage: string): Promise<string> {
    try {
      // Check if there are any embedded entries
      const embeddedCount = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM company_knowledge 
        WHERE company_id = ${COMPANY_ID}::uuid 
          AND is_active = true 
          AND embedding IS NOT NULL
      `;

      const count = Number(embeddedCount[0]?.count || 0);

      if (count === 0) {
        // Fallback: load all active entries (legacy behaviour)
        return EmbeddingService.buildFullKBContext();
      }

      // RAG search
      const results = await EmbeddingService.searchSimilar(userMessage, 8, 0.25);

      if (results.length === 0) {
        return ''; // No relevant KB entries
      }

      const categoryLabels: Record<string, string> = {
        SOP_PROCEDURE: 'Standard Operating Procedures',
        SCORING_GRADING: 'Scoring & Grading Rules',
        COMPANY_POLICY: 'Company Policies',
        BRAND_STANDARD: 'Brand Standards',
        TRAINING_MATERIAL: 'Training Materials',
        REGIONAL_GUIDELINE: 'Regional Guidelines',
        PRODUCT_LAUNCH: 'Product Launch Process',
        GENERAL: 'General Knowledge',
      };

      let context = '\n\n=== COMPANY KNOWLEDGE BASE (RAG-RETRIEVED — MOST RELEVANT) ===\n';
      context +=
        'The following knowledge entries were selected based on semantic relevance to the current question. Use them to contextualise your analysis.\n';

      // Group by category for clarity
      const byCategory = new Map<string, typeof results>();
      for (const r of results) {
        const cat = r.category;
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(r);
      }

      for (const [cat, entries] of byCategory) {
        context += `\n## ${categoryLabels[cat] || cat}\n`;
        for (const entry of entries) {
          context += `\n### ${entry.title} (relevance: ${(entry.similarity * 100).toFixed(0)}%)\n${entry.content}\n`;
        }
      }

      return context;
    } catch (err: any) {
      console.error('RAG context build failed, falling back to full KB:', err.message);
      return EmbeddingService.buildFullKBContext();
    }
  }

  /**
   * Fallback: load ALL active KB entries (legacy full-dump approach).
   */
  static async buildFullKBContext(): Promise<string> {
    const entries = await prisma.companyKnowledge.findMany({
      where: { companyId: COMPANY_ID, isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    if (entries.length === 0) return '';

    const categoryLabels: Record<string, string> = {
      SOP_PROCEDURE: 'Standard Operating Procedures',
      SCORING_GRADING: 'Scoring & Grading Rules',
      COMPANY_POLICY: 'Company Policies',
      BRAND_STANDARD: 'Brand Standards',
      TRAINING_MATERIAL: 'Training Materials',
      REGIONAL_GUIDELINE: 'Regional Guidelines',
      PRODUCT_LAUNCH: 'Product Launch Process',
      GENERAL: 'General Knowledge',
    };

    let context = '\n\n=== COMPANY KNOWLEDGE BASE (CONFIDENTIAL) ===\n';
    context +=
      'These are the official company standards, SOPs, policies, and guidelines. Use them to contextualise your analysis and recommendations.\n\n';

    let currentCategory = '';
    for (const entry of entries) {
      if (entry.category !== currentCategory) {
        currentCategory = entry.category;
        context += `\n## ${categoryLabels[entry.category] || entry.category}\n`;
      }
      context += `\n### ${entry.title}\n${entry.content}\n`;
    }

    return context;
  }
}
