// ──────────────────────────────────────────
// Violations Route — View & manage chat violations
// ──────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ModerationService } from '../services/intelligence/moderation.service.js';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export async function violationsRoutes(app: FastifyInstance) {
  // ── List violations ──
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, limit } = request.query as { userId?: string; limit?: string };
      const violations = await ModerationService.getViolations(COMPANY_ID, {
        userId,
        limit: limit ? parseInt(limit, 10) : 50,
      });
      return { data: violations };
    } catch (err) {
      app.log.error(err, 'Error fetching violations');
      return reply.status(500).send({ error: 'Failed to fetch violations' });
    }
  });

  // ── Get violation count for a user ──
  app.get('/count/:userName', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userName } = request.params as { userName: string };
      const { days } = request.query as { days?: string };
      const count = await ModerationService.getUserViolationCount(
        COMPANY_ID,
        decodeURIComponent(userName),
        days ? parseInt(days, 10) : 30,
      );
      return { data: { userName, count, period: `${days || 30} days` } };
    } catch (err) {
      app.log.error(err, 'Error fetching violation count');
      return reply.status(500).send({ error: 'Failed to fetch violation count' });
    }
  });
}
