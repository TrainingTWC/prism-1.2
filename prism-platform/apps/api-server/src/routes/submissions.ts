// ──────────────────────────────────────────
// Submission routes — full CRUD + scoring
// ──────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  SubmissionService,
  SubmissionEngineError,
  CreateSubmissionSchema,
  SaveDraftSchema,
  SubmitFinalSchema,
  SyncOfflineSchema,
  ListSubmissionsQuerySchema,
} from '../services/submission-engine/index.js';

// ── Error handler ──

function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof SubmissionEngineError) {
    const status = error.code === 'NOT_FOUND' ? 404
      : error.code === 'VALIDATION_FAILED' ? 422
      : 400;
    return reply.status(status).send({ error: error.message, code: error.code });
  }
  throw error;
}

export async function submissionRoutes(app: FastifyInstance) {
  // ── List submissions (paginated + filtered) ──
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = ListSubmissionsQuerySchema.parse(request.query);
      const result = await SubmissionService.list(query);
      return result;
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // ── Get submission by ID (full detail with responses) ──
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const sub = await SubmissionService.getById(id);
      return sub;
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // ── Create new draft submission ──
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const input = CreateSubmissionSchema.parse(request.body);
      const sub = await SubmissionService.create(input);
      return reply.status(201).send(sub);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // ── Save draft responses ──
  app.patch('/:id/draft', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const input = SaveDraftSchema.parse(request.body);
      const sub = await SubmissionService.saveDraft(id, input);
      return sub;
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // ── Submit final (validate + score + lock) ──
  app.post('/:id/submit', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const input = SubmitFinalSchema.parse(request.body);
      const sub = await SubmissionService.submit(id, input);
      return sub;
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // ── Sync offline submission ──
  app.post('/sync', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const input = SyncOfflineSchema.parse(request.body);
      const sub = await SubmissionService.syncOffline(input);
      return reply.status(201).send(sub);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // ── Review submission ──
  app.post('/:id/review', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { reviewedById } = request.body as { reviewedById: string };
      if (!reviewedById) {
        return reply.status(400).send({ error: 'reviewedById is required' });
      }
      const sub = await SubmissionService.review(id, reviewedById);
      return sub;
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // ── Archive submission ──
  app.post('/:id/archive', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const sub = await SubmissionService.archive(id);
      return sub;
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // ── Image / file upload ──
  app.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await (request as any).file();
      if (!data) {
        return reply.status(400).send({ error: 'No file provided' });
      }

      const { uploadSubmissionImage } = await import('../lib/storage.js');
      const buffer = await data.toBuffer();
      const fileName = `${Date.now()}-${data.filename}`;
      const url = await uploadSubmissionImage(fileName, buffer);

      return { url };
    } catch (err) {
      return handleError(err, reply);
    }
  });
}
