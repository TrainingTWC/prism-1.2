// ──────────────────────────────────────────────────────────────
// Analytics Routes — Real Dashboard Data from DB
// ──────────────────────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma, Prisma } from '../lib/prisma.js';
import { cached } from '../lib/cache.js';

// Program slug → programId mapping (loaded once)
const PROGRAM_SLUGS: Record<string, string> = {
  training: 'ba5d46c5-405f-4924-8cd1-11c5ffdd1c00',
  hr: '819ba2b8-b920-49dd-8a70-709dc37028f5',
  shlp: '9e0dffef-abb7-4c81-85b4-4921e977b335',
  operations: '80457773-31c4-4642-8b91-fc74e419ce73',
  'campus-hiring': 'b18a0d8f-4dca-42ac-811d-e3f4bf047908',
};

export async function analyticsRoutes(app: FastifyInstance) {

  // ════════════════════════════════════════════════════════════
  //  GET /api/analytics/dashboard/:slug
  //  Returns stats, store scores, region performance, score
  //  distribution, top/bottom stores, recent submissions
  // ════════════════════════════════════════════════════════════

  app.get('/dashboard/:slug', async (request: FastifyRequest<{
    Params: { slug: string };
    Querystring: { region?: string; store?: string; dateFrom?: string; dateTo?: string };
  }>, reply) => {
    const { slug } = request.params;
    const programId = PROGRAM_SLUGS[slug];
    if (!programId) {
      return reply.status(404).send({ error: 'Unknown dashboard slug' });
    }

    const { region, store, dateFrom, dateTo } = request.query as Record<string, string | undefined>;
    const cacheKey = `analytics:dashboard:${slug}:${region || ''}:${store || ''}:${dateFrom || ''}:${dateTo || ''}`;

    return cached(cacheKey, async () => {

    // Build base where clause
    const where: Prisma.ProgramSubmissionWhereInput = {
      programId,
      status: { in: ['SUBMITTED', 'SYNCED', 'REVIEWED'] },
    };
    if (store) where.storeId = store;
    if (dateFrom || dateTo) {
      where.submittedAt = {};
      if (dateFrom) (where.submittedAt as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.submittedAt as Record<string, Date>).lte = new Date(dateTo);
    }
    if (region) {
      where.store = { region: { name: { equals: region, mode: 'insensitive' } } };
    }

    // ── Fire ALL independent queries in parallel ──
    const [
      agg,
      totalSubs,
      uniqueStoresRaw,
      uniqueEmployeesRaw,
      storeScoresRaw,
      regionScoresRaw,
      distRaw,
      trendRaw,
      recentSubs,
      bottomRaw,
    ] = await Promise.all([
      // Core aggregates
      prisma.programSubmission.aggregate({
        where,
        _avg: { percentage: true, score: true, maxScore: true },
        _count: true,
        _min: { submittedAt: true },
        _max: { submittedAt: true },
      }),
      prisma.programSubmission.count({ where }),
      // Unique stores & employees
      prisma.programSubmission.groupBy({ by: ['storeId'], where }),
      prisma.programSubmission.groupBy({ by: ['employeeId'], where }),
      // Store scores (top 30)
      prisma.programSubmission.groupBy({
        by: ['storeId'],
        where,
        _avg: { percentage: true },
        _count: true,
        orderBy: { _avg: { percentage: 'desc' } },
        take: 30,
      }),
      // Region scores
      prisma.$queryRaw<Array<{
        region_name: string;
        avg_pct: number;
        cnt: bigint;
        store_cnt: bigint;
      }>>`
        SELECT r.name AS region_name,
               AVG(ps.percentage) AS avg_pct,
               COUNT(ps.id) AS cnt,
               COUNT(DISTINCT ps.store_id) AS store_cnt
        FROM program_submission ps
        JOIN store s ON s.id = ps.store_id
        JOIN region r ON r.id = s.region_id
        WHERE ps.program_id = ${programId}::uuid
          AND ps.status IN ('SUBMITTED','SYNCED','REVIEWED')
        GROUP BY r.name
        ORDER BY avg_pct DESC
      `,
      // Score distribution
      prisma.$queryRaw<Array<{ bucket: string; cnt: bigint }>>`
        SELECT
          CASE
            WHEN percentage < 20 THEN '0-20'
            WHEN percentage < 40 THEN '20-40'
            WHEN percentage < 60 THEN '40-60'
            WHEN percentage < 80 THEN '60-80'
            ELSE '80-100'
          END AS bucket,
          COUNT(*) AS cnt
        FROM program_submission
        WHERE program_id = ${programId}::uuid
          AND status IN ('SUBMITTED','SYNCED','REVIEWED')
          AND percentage IS NOT NULL
        GROUP BY bucket
        ORDER BY bucket
      `,
      // Monthly trend
      prisma.$queryRaw<Array<{
        month: string;
        avg_pct: number;
        cnt: bigint;
      }>>`
        SELECT TO_CHAR(submitted_at, 'YYYY-MM') AS month,
               AVG(percentage) AS avg_pct,
               COUNT(*) AS cnt
        FROM program_submission
        WHERE program_id = ${programId}::uuid
          AND status IN ('SUBMITTED','SYNCED','REVIEWED')
          AND submitted_at IS NOT NULL
        GROUP BY TO_CHAR(submitted_at, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `,
      // Recent submissions
      prisma.programSubmission.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          score: true,
          maxScore: true,
          percentage: true,
          submittedAt: true,
          status: true,
          sectionScores: true,
          employee: { select: { name: true, empId: true } },
          store: { select: { storeName: true, storeCode: true, region: { select: { name: true } } } },
        },
      }),
      // Bottom stores
      prisma.programSubmission.groupBy({
        by: ['storeId'],
        where,
        _avg: { percentage: true },
        _count: true,
        orderBy: { _avg: { percentage: 'asc' } },
        take: 5,
      }),
    ]);

    // ── Resolve store names (one batch query for both top & bottom) ──
    const allStoreIds = [...new Set([
      ...storeScoresRaw.map(s => s.storeId),
      ...bottomRaw.map(s => s.storeId),
    ])];
    const storeNames = await prisma.store.findMany({
      where: { id: { in: allStoreIds } },
      select: { id: true, storeName: true, storeCode: true, region: { select: { name: true } } },
    });
    const storeNameMap = new Map(storeNames.map(s => [s.id, s]));

    const storeScores = storeScoresRaw.map(s => {
      const info = storeNameMap.get(s.storeId);
      return {
        storeId: s.storeId,
        storeName: info?.storeName || 'Unknown',
        storeCode: info?.storeCode || '',
        region: info?.region?.name || '',
        avgScore: Math.round((s._avg.percentage || 0) * 10) / 10,
        count: s._count,
      };
    });

    const regionScores = regionScoresRaw.map(r => ({
      region: r.region_name,
      avgScore: Math.round((Number(r.avg_pct) || 0) * 10) / 10,
      count: Number(r.cnt),
      storeCount: Number(r.store_cnt),
    }));

    const scoreDistribution = distRaw.map(d => ({
      range: d.bucket,
      count: Number(d.cnt),
    }));

    const monthlyTrend = trendRaw.reverse().map(t => ({
      month: t.month,
      avgScore: Math.round((Number(t.avg_pct) || 0) * 10) / 10,
      count: Number(t.cnt),
    }));

    // ── Top & Bottom Stores ──
    const topStores = storeScores.slice(0, 5);
    const bottomStores = bottomRaw.map(s => {
      const info = storeNameMap.get(s.storeId);
      return {
        storeId: s.storeId,
        storeName: info?.storeName || 'Unknown',
        storeCode: info?.storeCode || '',
        avgScore: Math.round((s._avg.percentage || 0) * 10) / 10,
        count: s._count,
      };
    });

    return {
      programId,
      slug,
      stats: {
        totalSubmissions: totalSubs,
        uniqueStores: uniqueStoresRaw.length,
        uniqueAuditors: uniqueEmployeesRaw.length,
        avgScore: Math.round((agg._avg.percentage || 0) * 10) / 10,
        avgRawScore: Math.round((agg._avg.score || 0) * 10) / 10,
        avgMaxScore: Math.round((agg._avg.maxScore || 0) * 10) / 10,
        dateRange: {
          from: agg._min.submittedAt,
          to: agg._max.submittedAt,
        },
      },
      storeScores,
      regionScores,
      scoreDistribution,
      monthlyTrend,
      topStores,
      bottomStores,
      recentSubmissions: recentSubs,
    };

    }); // end cached
  });

  // ════════════════════════════════════════════════════════════
  //  GET /api/analytics/consolidated
  //  Cross-program overview for consolidated dashboard
  // ════════════════════════════════════════════════════════════

  app.get('/consolidated', async () => {
    return cached('analytics:consolidated', async () => {
    const programs = await prisma.program.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, department: true, type: true },
    });

    const results = await Promise.all(programs.map(async (prog) => {
      const agg = await prisma.programSubmission.aggregate({
        where: {
          programId: prog.id,
          status: { in: ['SUBMITTED', 'SYNCED', 'REVIEWED'] },
        },
        _avg: { percentage: true },
        _count: true,
      });
      return {
        programId: prog.id,
        name: prog.name,
        department: prog.department || 'General',
        type: prog.type,
        totalSubmissions: agg._count,
        avgScore: Math.round((agg._avg.percentage || 0) * 10) / 10,
      };
    }));

    const totalSubmissions = results.reduce((sum, r) => sum + r.totalSubmissions, 0);
    const withData = results.filter(r => r.totalSubmissions > 0);
    const overallAvg = withData.length > 0
      ? Math.round(withData.reduce((sum, r) => sum + r.avgScore, 0) / withData.length * 10) / 10
      : 0;

    return {
      totalSubmissions,
      totalPrograms: results.length,
      programsWithData: withData.length,
      overallAvgScore: overallAvg,
      programs: results.sort((a, b) => b.totalSubmissions - a.totalSubmissions),
    };
    }); // end cached
  });

  // ════════════════════════════════════════════════════════════
  //  GET /api/analytics/filters
  //  Returns available filter options (regions, stores, managers)
  // ════════════════════════════════════════════════════════════

  app.get('/filters', async () => {
    return cached('analytics:filters', async () => {
    const [regions, stores] = await Promise.all([
      prisma.region.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.store.findMany({
        select: { id: true, storeName: true, storeCode: true, region: { select: { name: true } } },
        orderBy: { storeName: 'asc' },
      }),
    ]);

    return {
      regions: regions.map(r => ({ label: r.name, value: r.id })),
      stores: stores.map(s => ({
        label: `${s.storeCode || ''} - ${s.storeName}`,
        value: s.id,
        region: s.region?.name || '',
      })),
    };
    }, 10 * 60 * 1000); // 10min TTL — filters rarely change
  });
}
