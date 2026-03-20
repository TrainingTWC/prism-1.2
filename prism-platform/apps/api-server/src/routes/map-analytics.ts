// ──────────────────────────────────────────
// Map Analytics Routes
// ──────────────────────────────────────────

import type { FastifyInstance } from 'fastify';
import { MapAnalyticsService } from '../services/map-analytics/index.js';
import { cached } from '../lib/cache.js';

type Scope = 'all' | 'region' | 'am' | 'trainer' | 'store';

function parseDateFrom(val?: string): Date | undefined {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function mapAnalyticsRoutes(app: FastifyInstance) {
  /**
   * GET /api/map-analytics/scores
   * Query: scope, scopeValue, dateFrom
   */
  app.get('/scores', async (request) => {
    const { scope, scopeValue, dateFrom } = request.query as Record<string, string | undefined>;
    const s = (scope || 'all') as Scope;
    const cacheKey = `map-analytics:scores:${s}:${scopeValue || ''}:${dateFrom || ''}`;
    const data = await cached(cacheKey, () =>
      MapAnalyticsService.getScoresByScope({
        scope: s,
        scopeValue: scopeValue || undefined,
        dateFrom: parseDateFrom(dateFrom),
      }),
    );
    return { data };
  });

  /**
   * GET /api/map-analytics/employees
   * Query: scope, scopeValue
   */
  app.get('/employees', async (request) => {
    const { scope, scopeValue } = request.query as Record<string, string | undefined>;
    const s = (scope || 'all') as Scope;
    const cacheKey = `map-analytics:employees:${s}:${scopeValue || ''}`;
    const data = await cached(cacheKey, () =>
      MapAnalyticsService.getEmployeeCounts({
        scope: s,
        scopeValue: scopeValue || undefined,
      }),
    );
    return { data };
  });

  /**
   * GET /api/map-analytics/store-scores
   * Query: dateFrom
   * Returns per-store avg scores for heat overlay.
   */
  app.get('/store-scores', async (request) => {
    const { dateFrom } = request.query as Record<string, string | undefined>;
    const cacheKey = `map-analytics:store-scores:${dateFrom || ''}`;
    const data = await cached(cacheKey, () =>
      MapAnalyticsService.getStoreScores({
        scope: 'all',
        dateFrom: parseDateFrom(dateFrom),
      }),
    );
    return { data };
  });

  /**
   * GET /api/map-analytics/store-detail/:id
   * Returns department-wise scores, manpower, AM/trainer, AI insight for one store.
   */
  app.get('/store-detail/:id', async (request) => {
    const { id } = request.params as { id: string };
    if (!id || id.length < 10) return { data: null };
    const cacheKey = `map-analytics:store-detail:${id}`;
    const data = await cached(cacheKey, () =>
      MapAnalyticsService.getStoreDetail(id),
    );
    return { data };
  });
}
