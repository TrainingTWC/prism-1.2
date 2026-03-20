// ──────────────────────────────────────────
// Knowledge Base Routes — Company standards CRUD + RAG
// ──────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { EmbeddingService } from '../services/knowledge/embedding.service.js';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001'; // HBPL

export async function knowledgeRoutes(app: FastifyInstance) {
  // ── List all knowledge entries (with embedding status) ──
  app.get('/', async (request: FastifyRequest, _reply: FastifyReply) => {
    const { category, active } = request.query as Record<string, string | undefined>;

    const entries = await prisma.companyKnowledge.findMany({
      where: {
        companyId: COMPANY_ID,
        ...(category ? { category: category as any } : {}),
        ...(active && active !== 'all' ? { isActive: active === 'true' } : {}),
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    // Add embedding status via raw query
    const embeddingStatus = await prisma.$queryRaw<{ id: string; has_embedding: boolean }[]>`
      SELECT id, (embedding IS NOT NULL) as has_embedding 
      FROM company_knowledge 
      WHERE company_id = ${COMPANY_ID}::uuid
    `;
    const statusMap = new Map(embeddingStatus.map((e) => [e.id, e.has_embedding]));

    const enriched = entries.map((e) => ({
      ...e,
      hasEmbedding: statusMap.get(e.id) ?? false,
    }));

    return { data: enriched };
  });

  // ── Get single entry ──
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const entry = await prisma.companyKnowledge.findFirst({
      where: { id, companyId: COMPANY_ID },
    });
    if (!entry) return reply.status(404).send({ error: 'Entry not found' });
    return { data: entry };
  });

  // ── Create entry (+ auto-embed) ──
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      category: string;
      title: string;
      content: string;
      tags?: string[];
      sortOrder?: number;
    };

    if (!body.title?.trim() || !body.content?.trim() || !body.category) {
      return reply.status(400).send({ error: 'Title, content, and category are required' });
    }

    const entry = await prisma.companyKnowledge.create({
      data: {
        companyId: COMPANY_ID,
        category: body.category as any,
        title: body.title.trim(),
        content: body.content.trim(),
        tags: body.tags || [],
        sortOrder: body.sortOrder || 0,
      },
    });

    // Generate embedding in background (don't block response)
    EmbeddingService.embedKnowledgeEntry(entry.id).catch((err) => {
      app.log.error(err, `Failed to embed new knowledge entry ${entry.id}`);
    });

    return reply.status(201).send({ data: entry });
  });

  // ── Update entry (+ re-embed if content changed) ──
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      category?: string;
      title?: string;
      content?: string;
      tags?: string[];
      isActive?: boolean;
      sortOrder?: number;
    };

    // Verify ownership
    const existing = await prisma.companyKnowledge.findFirst({
      where: { id, companyId: COMPANY_ID },
    });
    if (!existing) return reply.status(404).send({ error: 'Entry not found' });

    const entry = await prisma.companyKnowledge.update({
      where: { id },
      data: {
        ...(body.category ? { category: body.category as any } : {}),
        ...(body.title ? { title: body.title.trim() } : {}),
        ...(body.content ? { content: body.content.trim() } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });

    // Re-embed if content-related fields changed
    const contentChanged = body.title || body.content || body.category || body.tags !== undefined;
    if (contentChanged) {
      EmbeddingService.embedKnowledgeEntry(id).catch((err) => {
        app.log.error(err, `Failed to re-embed knowledge entry ${id}`);
      });
    }

    return { data: entry };
  });

  // ── Delete entry ──
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.companyKnowledge.findFirst({
      where: { id, companyId: COMPANY_ID },
    });
    if (!existing) return reply.status(404).send({ error: 'Entry not found' });

    await prisma.companyKnowledge.delete({ where: { id } });
    return { success: true };
  });

  // ── Get categories with counts ──
  app.get('/meta/categories', async (_request: FastifyRequest, _reply: FastifyReply) => {
    const entries = await prisma.companyKnowledge.findMany({
      where: { companyId: COMPANY_ID, isActive: true },
      select: { category: true },
    });

    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.category] = (counts[e.category] || 0) + 1;
    }

    return { data: counts };
  });

  // ── Semantic search ──
  app.get('/search/semantic', async (request: FastifyRequest, reply: FastifyReply) => {
    const { q, limit } = request.query as { q?: string; limit?: string };
    if (!q?.trim()) {
      return reply.status(400).send({ error: 'Query parameter "q" is required' });
    }

    try {
      const results = await EmbeddingService.searchSimilar(
        q.trim(),
        parseInt(limit || '5', 10),
        0.25,
      );
      return { data: results };
    } catch (err: any) {
      app.log.error(err, 'Semantic search failed');
      return reply.status(500).send({ error: 'Search failed: ' + err.message });
    }
  });

  // ── Backfill embeddings for all entries ──
  app.post('/embeddings/backfill', async (_request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const result = await EmbeddingService.backfillEmbeddings();
      return { data: result };
    } catch (err: any) {
      app.log.error(err, 'Backfill failed');
      return { error: 'Backfill failed: ' + err.message };
    }
  });

  // ── Re-embed a single entry ──
  app.post('/embeddings/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const embedded = await EmbeddingService.embedKnowledgeEntry(id, true);
      return { data: { id, embedded } };
    } catch (err: any) {
      app.log.error(err, `Failed to embed ${id}`);
      return reply.status(500).send({ error: err.message });
    }
  });

  // ── Embedding stats ──
  app.get('/embeddings/stats', async (_request: FastifyRequest, _reply: FastifyReply) => {
    const total = await prisma.companyKnowledge.count({
      where: { companyId: COMPANY_ID, isActive: true },
    });

    const embedded = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM company_knowledge 
      WHERE company_id = ${COMPANY_ID}::uuid 
        AND is_active = true 
        AND embedding IS NOT NULL
    `;

    return {
      data: {
        total,
        embedded: Number(embedded[0]?.count || 0),
        pending: total - Number(embedded[0]?.count || 0),
      },
    };
  });
}
