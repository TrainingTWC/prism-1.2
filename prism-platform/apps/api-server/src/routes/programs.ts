// ──────────────────────────────────────────
// Program Engine — API Routes
// ──────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { cached, invalidate } from '../lib/cache.js';
import {
  programService,
  sectionService,
  questionService,
  ProgramEngineError,
  CreateProgramSchema,
  UpdateProgramSchema,
  ListProgramsQuerySchema,
  CreateSectionSchema,
  UpdateSectionSchema,
  ReorderSectionsSchema,
  CreateQuestionSchema,
  UpdateQuestionSchema,
  ReorderQuestionsSchema,
} from '../services/program-engine/index.js';

// ── Error handler helper ──

function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof ProgramEngineError) {
    return reply.status(400).send({ error: error.code, message: error.message });
  }
  throw error;
}

export async function programRoutes(app: FastifyInstance) {

  // ════════════════════════════════════════
  //  PROGRAMS
  // ════════════════════════════════════════

  // List programs (GET /api/programs?companyId=...&status=...&page=1&limit=20)
  app.get('/', async (request: FastifyRequest, _reply: FastifyReply) => {
    const query = ListProgramsQuerySchema.parse(request.query);
    const cacheKey = `programs:list:${JSON.stringify(query)}`;
    return cached(cacheKey, () => programService.list(query));
  });

  // Get program by ID (GET /api/programs/:id)
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const program = await programService.getById(request.params.id);
    if (!program) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Program not found.' });
    return { data: program };
  });

  // Create program (POST /api/programs)
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const input = CreateProgramSchema.parse(request.body);
      const program = await programService.create(input);
      invalidate('programs:list');
      return reply.status(201).send({ data: program });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Update program (PATCH /api/programs/:id)
  app.patch('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const input = UpdateProgramSchema.parse(request.body);
      const program = await programService.update(request.params.id, input);
      if (!program) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Program not found.' });
      invalidate('programs:list');
      return { data: program };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Delete program (DELETE /api/programs/:id)
  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const result = await programService.delete(request.params.id);
      if (!result) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Program not found.' });
      invalidate('programs:list');
      return reply.status(204).send();
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Activate program (POST /api/programs/:id/activate)
  app.post('/:id/activate', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const program = await programService.activate(request.params.id);
      if (!program) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Program not found.' });
      return { data: program };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Archive program (POST /api/programs/:id/archive)
  app.post('/:id/archive', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const program = await programService.archive(request.params.id);
      if (!program) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Program not found.' });
      return { data: program };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Create new version (POST /api/programs/:id/version)
  app.post('/:id/version', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const program = await programService.createVersion(request.params.id);
      if (!program) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Program not found.' });
      return reply.status(201).send({ data: program });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // List versions (GET /api/programs/:id/versions)
  app.get('/:id/versions', async (request: FastifyRequest<{ Params: { id: string } }>, _reply: FastifyReply) => {
    const versions = await programService.listVersions(request.params.id);
    if (!versions) return _reply.status(404).send({ error: 'NOT_FOUND', message: 'Program not found.' });
    return { data: versions };
  });

  // ════════════════════════════════════════
  //  SECTIONS
  // ════════════════════════════════════════

  // List sections (GET /api/programs/:id/sections)
  app.get('/:id/sections', async (request: FastifyRequest<{ Params: { id: string } }>, _reply: FastifyReply) => {
    const sections = await sectionService.listByProgram(request.params.id);
    return { data: sections };
  });

  // Create section (POST /api/programs/:id/sections)
  app.post('/:id/sections', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const input = CreateSectionSchema.parse({
        ...(request.body as object),
        programId: request.params.id,
      });
      const section = await sectionService.create(input);
      return reply.status(201).send({ data: section });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Update section (PATCH /api/programs/sections/:sectionId)
  app.patch('/sections/:sectionId', async (request: FastifyRequest<{ Params: { sectionId: string } }>, reply: FastifyReply) => {
    try {
      const input = UpdateSectionSchema.parse(request.body);
      const section = await sectionService.update(request.params.sectionId, input);
      if (!section) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Section not found.' });
      return { data: section };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Delete section (DELETE /api/programs/sections/:sectionId)
  app.delete('/sections/:sectionId', async (request: FastifyRequest<{ Params: { sectionId: string } }>, reply: FastifyReply) => {
    try {
      const result = await sectionService.delete(request.params.sectionId);
      if (!result) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Section not found.' });
      return reply.status(204).send();
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Reorder sections (PUT /api/programs/:id/sections/reorder)
  app.put('/:id/sections/reorder', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { sectionIds } = ReorderSectionsSchema.parse(request.body);
      const sections = await sectionService.reorder(request.params.id, sectionIds);
      return { data: sections };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // ════════════════════════════════════════
  //  QUESTIONS
  // ════════════════════════════════════════

  // List questions (GET /api/programs/sections/:sectionId/questions)
  app.get('/sections/:sectionId/questions', async (request: FastifyRequest<{ Params: { sectionId: string } }>, _reply: FastifyReply) => {
    const questions = await questionService.listBySection(request.params.sectionId);
    return { data: questions };
  });

  // Create question (POST /api/programs/sections/:sectionId/questions)
  app.post('/sections/:sectionId/questions', async (request: FastifyRequest<{ Params: { sectionId: string } }>, reply: FastifyReply) => {
    try {
      const input = CreateQuestionSchema.parse({
        ...(request.body as object),
        sectionId: request.params.sectionId,
      });
      const question = await questionService.create(input);
      return reply.status(201).send({ data: question });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Update question (PATCH /api/programs/questions/:questionId)
  app.patch('/questions/:questionId', async (request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) => {
    try {
      const input = UpdateQuestionSchema.parse(request.body);
      const question = await questionService.update(request.params.questionId, input);
      if (!question) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Question not found.' });
      return { data: question };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Delete question (DELETE /api/programs/questions/:questionId)
  app.delete('/questions/:questionId', async (request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) => {
    try {
      const result = await questionService.delete(request.params.questionId);
      if (!result) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Question not found.' });
      return reply.status(204).send();
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Duplicate question (POST /api/programs/questions/:questionId/duplicate)
  app.post('/questions/:questionId/duplicate', async (request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) => {
    try {
      const question = await questionService.duplicate(request.params.questionId);
      if (!question) return reply.status(404).send({ error: 'NOT_FOUND', message: 'Question not found.' });
      return reply.status(201).send({ data: question });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Reorder questions (PUT /api/programs/sections/:sectionId/questions/reorder)
  app.put('/sections/:sectionId/questions/reorder', async (request: FastifyRequest<{ Params: { sectionId: string } }>, reply: FastifyReply) => {
    try {
      const { questionIds } = ReorderQuestionsSchema.parse(request.body);
      const questions = await questionService.reorder(request.params.sectionId, questionIds);
      return { data: questions };
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
