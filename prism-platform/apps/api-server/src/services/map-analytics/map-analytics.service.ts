// ──────────────────────────────────────────
// Map Analytics Service — Consolidated data for map overlay
// ──────────────────────────────────────────

import { prisma } from '../../lib/prisma.js';

const EXCLUDED_PROGRAM_NAMES = ['Campus Hire', 'Brew League'];

type Scope = 'all' | 'region' | 'am' | 'trainer' | 'store';

interface MapAnalyticsQuery {
  scope: Scope;
  scopeValue?: string;     // region name, AM name, trainer name, or storeId
  dateFrom?: Date;
}

export class MapAnalyticsService {
  /**
   * Get consolidated audit scores per program for a given scope.
   * Groups by program and returns avg scores per store within scope.
   */
  static async getScoresByScope(query: MapAnalyticsQuery) {
    const { scope, scopeValue, dateFrom } = query;

    const where: any = {
      status: 'SUBMITTED',
      program: { name: { notIn: EXCLUDED_PROGRAM_NAMES } },
    };
    if (dateFrom) where.submittedAt = { gte: dateFrom };

    // Scope filtering
    if (scope === 'region' && scopeValue) {
      where.store = { region: { name: { equals: scopeValue, mode: 'insensitive' } } };
    } else if (scope === 'am' && scopeValue) {
      where.store = { amName: { equals: scopeValue, mode: 'insensitive' } };
    } else if (scope === 'trainer' && scopeValue) {
      where.store = { trainer1Name: { equals: scopeValue, mode: 'insensitive' } };
    } else if (scope === 'store' && scopeValue) {
      where.storeId = scopeValue;
    }

    const submissions = await prisma.programSubmission.findMany({
      where,
      select: {
        percentage: true,
        submittedAt: true,
        program: { select: { id: true, name: true, department: true } },
        store: { select: { id: true, storeCode: true, storeName: true } },
      },
    });

    // Group by program
    const byProgram = new Map<string, { name: string; dept: string | null; scores: number[]; storeScores: Map<string, number[]> }>();
    for (const s of submissions) {
      const key = s.program.id;
      if (!byProgram.has(key)) {
        byProgram.set(key, { name: s.program.name, dept: s.program.department, scores: [], storeScores: new Map() });
      }
      const g = byProgram.get(key)!;
      if (s.percentage != null) {
        g.scores.push(s.percentage);
        const sid = s.store.id;
        if (!g.storeScores.has(sid)) g.storeScores.set(sid, []);
        g.storeScores.get(sid)!.push(s.percentage);
      }
    }

    const programs = Array.from(byProgram.entries()).map(([id, g]) => {
      const avgScore = g.scores.length > 0
        ? Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 100) / 100
        : 0;
      return {
        programId: id,
        programName: g.name,
        department: g.dept,
        avgScore,
        totalSubmissions: g.scores.length,
        storeCount: g.storeScores.size,
      };
    }).sort((a, b) => b.totalSubmissions - a.totalSubmissions);

    // Overall
    const allScores = submissions.filter(s => s.percentage != null).map(s => s.percentage!);
    const overallAvg = allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
      : 0;

    return {
      scope,
      scopeValue: scopeValue || 'All',
      overallAvgScore: overallAvg,
      totalSubmissions: submissions.length,
      programs,
    };
  }

  /**
   * Get employee designation breakdown for a scope.
   */
  static async getEmployeeCounts(query: MapAnalyticsQuery) {
    const { scope, scopeValue } = query;

    const storeWhere: any = { isActive: true };
    if (scope === 'region' && scopeValue) {
      storeWhere.region = { name: { equals: scopeValue, mode: 'insensitive' } };
    } else if (scope === 'am' && scopeValue) {
      storeWhere.amName = { equals: scopeValue, mode: 'insensitive' };
    } else if (scope === 'trainer' && scopeValue) {
      storeWhere.trainer1Name = { equals: scopeValue, mode: 'insensitive' };
    } else if (scope === 'store' && scopeValue) {
      storeWhere.id = scopeValue;
    }

    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        store: storeWhere,
        OR: [
          { empId: { startsWith: 'H' } },
          { empId: { startsWith: 'P' } },
          { empId: { startsWith: 'I' } },
          { empId: { startsWith: 'AP' } },
        ],
      },
      select: { designation: true },
    });

    const byDesignation = new Map<string, number>();
    for (const e of employees) {
      const d = e.designation || 'Unknown';
      byDesignation.set(d, (byDesignation.get(d) || 0) + 1);
    }

    return {
      total: employees.length,
      byDesignation: Array.from(byDesignation.entries())
        .map(([designation, count]) => ({ designation, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /**
   * Get per-store scores for map heat data.
   * Returns each store with its average score across all programs.
   */
  static async getStoreScores(query: MapAnalyticsQuery) {
    const { dateFrom } = query;

    const where: any = {
      status: 'SUBMITTED',
      program: { name: { notIn: EXCLUDED_PROGRAM_NAMES } },
    };
    if (dateFrom) where.submittedAt = { gte: dateFrom };

    const submissions = await prisma.programSubmission.findMany({
      where,
      select: {
        percentage: true,
        store: {
          select: {
            id: true,
            storeCode: true,
            storeName: true,
            latitude: true,
            longitude: true,
            amName: true,
            trainer1Name: true,
            regionalTrainerName: true,
            region: { select: { name: true } },
          },
        },
      },
    });

    const byStore = new Map<string, {
      storeCode: string | null;
      storeName: string;
      lat: number | null;
      lng: number | null;
      amName: string | null;
      trainerName: string | null;
      regionalTrainerName: string | null;
      regionName: string | null;
      scores: number[];
    }>();

    for (const s of submissions) {
      const sid = s.store.id;
      if (!byStore.has(sid)) {
        byStore.set(sid, {
          storeCode: s.store.storeCode,
          storeName: s.store.storeName,
          lat: s.store.latitude,
          lng: s.store.longitude,
          amName: s.store.amName,
          trainerName: s.store.trainer1Name,
          regionalTrainerName: s.store.regionalTrainerName,
          regionName: s.store.region?.name || null,
          scores: [],
        });
      }
      if (s.percentage != null) byStore.get(sid)!.scores.push(s.percentage);
    }

    return Array.from(byStore.entries()).map(([id, g]) => ({
      storeId: id,
      storeCode: g.storeCode,
      storeName: g.storeName,
      latitude: g.lat,
      longitude: g.lng,
      amName: g.amName,
      trainerName: g.trainerName,
      regionalTrainerName: g.regionalTrainerName,
      regionName: g.regionName,
      avgScore: g.scores.length > 0
        ? Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 100) / 100
        : null,
      submissionCount: g.scores.length,
    }));
  }

  /**
   * Get detailed breakdown for a single store:
   * per-department scores, manpower, AM/HR/trainer info.
   */
  static async getStoreDetail(storeId: string) {
    const [store, submissions, employees] = await Promise.all([
      prisma.store.findUnique({
        where: { id: storeId },
        select: {
          id: true, storeCode: true, storeName: true, city: true,
          amName: true, trainer1Name: true, regionalTrainerName: true,
          storeFormat: true, menuType: true,
          region: { select: { name: true } },
        },
      }),
      prisma.programSubmission.findMany({
        where: {
          storeId,
          status: 'SUBMITTED',
          program: { name: { notIn: EXCLUDED_PROGRAM_NAMES } },
        },
        select: {
          percentage: true,
          program: { select: { name: true, department: true } },
        },
      }),
      prisma.employee.count({
        where: {
          isActive: true,
          storeId,
          OR: [
            { empId: { startsWith: 'H' } },
            { empId: { startsWith: 'P' } },
            { empId: { startsWith: 'I' } },
            { empId: { startsWith: 'AP' } },
          ],
        },
      }),
    ]);

    if (!store) return null;

    // Group scores by department
    const byDept = new Map<string, number[]>();
    for (const s of submissions) {
      const dept = s.program.department || s.program.name;
      if (!byDept.has(dept)) byDept.set(dept, []);
      if (s.percentage != null) byDept.get(dept)!.push(s.percentage);
    }

    const deptScores = Array.from(byDept.entries()).map(([dept, scores]) => ({
      department: dept,
      avgScore: scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : 0,
      count: scores.length,
    })).sort((a, b) => b.count - a.count);

    const allScores = submissions.filter(s => s.percentage != null).map(s => s.percentage!);
    const overallAvg = allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
      : null;

    // Generate one-line AI insight
    let aiInsight = '';
    if (overallAvg == null) {
      aiInsight = 'No audit data yet — schedule first audit.';
    } else if (overallAvg >= 85) {
      aiInsight = 'Top performer — consider as benchmark store for the region.';
    } else if (overallAvg >= 70) {
      const weakest = deptScores.length > 0 ? deptScores[deptScores.length - 1] : null;
      aiInsight = weakest && weakest.avgScore < 70
        ? `Solid overall but ${weakest.department} needs attention (${weakest.avgScore}%).`
        : 'Good performance — minor improvements can push into top tier.';
    } else if (overallAvg >= 50) {
      const weakest = deptScores.length > 0 ? deptScores[deptScores.length - 1] : null;
      aiInsight = weakest
        ? `Below target — focus on ${weakest.department} (${weakest.avgScore}%) for quickest gains.`
        : 'Below target — needs structured improvement plan.';
    } else {
      aiInsight = 'Critical — requires immediate intervention and retraining.';
    }

    return {
      storeId: store.id,
      storeCode: store.storeCode,
      storeName: store.storeName,
      city: store.city,
      region: store.region?.name || null,
      am: store.amName,
      trainer: store.trainer1Name,
      regionalTrainer: store.regionalTrainerName,
      format: store.storeFormat,
      menu: store.menuType,
      manpower: employees,
      overallScore: overallAvg,
      deptScores,
      aiInsight,
    };
  }
}
