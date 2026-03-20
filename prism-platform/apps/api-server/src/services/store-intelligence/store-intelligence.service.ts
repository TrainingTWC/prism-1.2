// ──────────────────────────────────────────
// Store Intelligence — Service Implementation
// ──────────────────────────────────────────
// Queries Prisma for real store analytics:
//   - Store metadata + region + manager
//   - Health score from weighted program scores
//   - Performance trend (90d, 6m etc.)
//   - Program score breakdown
//   - Recent submissions
//   - Open tasks
//   - Recurring issues (questions with repeated poor scores)
//   - Evidence gallery (images from submissions)
// ──────────────────────────────────────────

import { prisma } from '../../lib/prisma.js';

type TimeRange = '30d' | '90d' | '6m' | '1y';

// ── Helpers ──

function rangeToDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case '30d': return new Date(now.getTime() - 30 * 86_400_000);
    case '90d': return new Date(now.getTime() - 90 * 86_400_000);
    case '6m':  return new Date(now.getTime() - 180 * 86_400_000);
    case '1y':  return new Date(now.getTime() - 365 * 86_400_000);
    default:    return new Date(now.getTime() - 90 * 86_400_000);
  }
}

function scoreToRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 85) return 'low';
  if (score >= 70) return 'medium';
  if (score >= 50) return 'high';
  return 'critical';
}

function computeTrend(values: number[]): 'up' | 'down' | 'flat' {
  if (values.length < 6) return 'flat';
  const recent = values.slice(-3);
  const older = values.slice(-6, -3);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const delta = recentAvg - olderAvg;
  if (Math.abs(delta) < 1.5) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

function computeDelta(values: number[]): number {
  if (values.length < 6) return 0;
  const recent = values.slice(-3);
  const older = values.slice(-6, -3);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  return Math.round((recentAvg - olderAvg) * 10) / 10;
}

// ── Main Service ──

export class StoreIntelligenceService {
  /**
   * Fetch the full intelligence payload for a single store.
   */
  static async getIntelligence(storeId: string, range: TimeRange = '90d') {
    const since = rangeToDate(range);

    // ── 1. Store Metadata ──
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        region: { select: { id: true, name: true } },
        employees: {
          where: { designation: { in: ['Store Manager', 'Manager', 'SM', 'ASM'] }, isActive: true },
          select: { id: true, name: true, designation: true },
          take: 1,
        },
      },
    });

    if (!store) {
      return null;
    }

    const manager = store.employees[0] ?? null;

    // ── 2. Submissions in range (for scoring) ──
    const submissions = await prisma.programSubmission.findMany({
      where: {
        storeId,
        submittedAt: { gte: since },
        status: { in: ['SUBMITTED', 'REVIEWED', 'SYNCED'] },
      },
      include: {
        program: { select: { id: true, name: true, department: true, type: true } },
        employee: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // ── 3. All-time submission count ──
    const totalSubmissions = await prisma.programSubmission.count({
      where: { storeId, status: { in: ['SUBMITTED', 'REVIEWED', 'SYNCED'] } },
    });

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const thisMonthCount = submissions.filter(
      (s) => s.submittedAt && s.submittedAt >= thisMonthStart,
    ).length;

    // ── 4. Program Score Breakdown ──
    const programMap = new Map<string, { id: string; name: string; scores: number[]; count: number }>();
    for (const sub of submissions) {
      const key = sub.programId;
      let entry = programMap.get(key);
      if (!entry) {
        entry = { id: sub.programId, name: sub.program.name, scores: [], count: 0 };
        programMap.set(key, entry);
      }
      if (sub.percentage != null) {
        entry.scores.push(sub.percentage);
      }
      entry.count++;
    }

    const programBreakdown = Array.from(programMap.values()).map((p) => {
      const avgScore = p.scores.length > 0
        ? Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length)
        : 0;
      const trend = computeTrend(p.scores);
      return {
        programId: p.id,
        programName: p.name,
        score: avgScore,
        trend,
        totalSubmissions: p.count,
        weight: 1 / Math.max(programMap.size, 1), // Equal weight if not configured
      };
    });

    // ── 5. Overall Health Score (weighted avg) ──
    const totalWeight = programBreakdown.reduce((s, b) => s + b.weight, 0);
    const overallScore = totalWeight > 0
      ? Math.round(programBreakdown.reduce((s, b) => s + b.score * b.weight, 0) / totalWeight)
      : 0;

    // ── 6. Performance Trend (daily averages) ──
    const dailyScores = new Map<string, number[]>();
    for (const sub of submissions) {
      if (sub.submittedAt && sub.percentage != null) {
        const day = sub.submittedAt.toISOString().slice(0, 10);
        const arr = dailyScores.get(day) ?? [];
        arr.push(sub.percentage);
        dailyScores.set(day, arr);
      }
    }
    const overallTrendData = Array.from(dailyScores.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date,
        value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }));

    const trendValues = overallTrendData.map((d) => d.value);
    const overallTrend = computeTrend(trendValues);
    const overallDelta = computeDelta(trendValues);

    // Per-program trends
    const programTrends = programBreakdown.slice(0, 3).map((pb) => {
      const programSubs = submissions
        .filter((s) => s.programId === pb.programId && s.percentage != null)
        .sort((a, b) => (a.submittedAt?.getTime() ?? 0) - (b.submittedAt?.getTime() ?? 0));
      return {
        label: pb.programName,
        data: programSubs.map((s) => ({
          date: s.submittedAt?.toISOString().slice(0, 10) ?? '',
          value: s.percentage ?? 0,
        })),
        color: ['#3B82F6', '#8B5CF6', '#22C55E'][programBreakdown.indexOf(pb) % 3],
      };
    });

    const performanceTrend = [
      { label: 'Overall', data: overallTrendData, color: '#10b37d' },
      ...programTrends,
    ];

    // ── 7. Recent Submissions (last 10) ──
    const recentSubmissions = submissions.slice(0, 10).map((s) => ({
      id: s.id,
      programName: s.program.name,
      storeName: store.storeName,
      submittedBy: s.employee.name,
      score: s.percentage != null ? Math.round(s.percentage) : 0,
      submittedAt: s.submittedAt?.toISOString() ?? s.createdAt.toISOString(),
      status: s.status === 'REVIEWED' ? 'reviewed' : s.status === 'SUBMITTED' ? 'submitted' : 'pending',
    }));

    // ── 8. Open Tasks ──
    const tasks = await prisma.task.findMany({
      where: {
        storeId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'OVERDUE'] },
      },
      include: {
        assignee: { select: { name: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 20,
    });

    const openTasks = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      assignedTo: t.assignee.name,
      status: t.status.toLowerCase() as 'open' | 'in_progress' | 'completed' | 'overdue',
      priority: t.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
      dueDate: t.dueDate?.toISOString().slice(0, 10) ?? '',
    }));

    const openTaskCount = tasks.filter((t) => t.status !== 'COMPLETED').length;
    const overdueTaskCount = tasks.filter((t) => t.status === 'OVERDUE').length;

    // ── 9. Recurring Issues (questions with repeated low scores) ──
    const lowScoreResponses = await prisma.programResponse.findMany({
      where: {
        submission: {
          storeId,
          submittedAt: { gte: since },
          status: { in: ['SUBMITTED', 'REVIEWED', 'SYNCED'] },
        },
        score: { not: null, lt: 50 },
      },
      include: {
        question: { select: { text: true, sectionId: true, section: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by question text to find recurring ones
    const issueMap = new Map<string, {
      description: string; category: string; count: number; lastDate: Date;
    }>();
    for (const resp of lowScoreResponses) {
      const key = resp.questionId;
      const existing = issueMap.get(key);
      if (existing) {
        existing.count++;
        if (resp.createdAt > existing.lastDate) existing.lastDate = resp.createdAt;
      } else {
        issueMap.set(key, {
          description: resp.question.text,
          category: resp.question.section.title,
          count: 1,
          lastDate: resp.createdAt,
        });
      }
    }

    const recurringIssues = Array.from(issueMap.entries())
      .filter(([, v]) => v.count >= 2) // Only truly recurring
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([, v], i) => ({
        id: `issue-${i}`,
        description: v.description.length > 80 ? v.description.slice(0, 77) + '...' : v.description,
        frequency: v.count,
        lastOccurred: v.lastDate.toISOString().slice(0, 10),
        category: v.category,
        severity: v.count >= 10 ? 'critical' as const : v.count >= 5 ? 'high' as const : v.count >= 3 ? 'medium' as const : 'low' as const,
      }));

    // ── 10. Evidence Gallery (images from submissions) ──
    const imageResponses = await prisma.programResponse.findMany({
      where: {
        submission: {
          storeId,
          submittedAt: { gte: since },
          status: { in: ['SUBMITTED', 'REVIEWED', 'SYNCED'] },
        },
        imageUrl: { not: null },
      },
      include: {
        question: { select: { text: true } },
        submission: {
          select: {
            submittedAt: true,
            program: { select: { name: true } },
            employee: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });

    const evidenceGallery = imageResponses.map((r) => ({
      id: r.id,
      imageUrl: r.imageUrl!,
      caption: r.question.text,
      programName: r.submission.program.name,
      uploadedBy: r.submission.employee.name,
      uploadedAt: r.submission.submittedAt?.toISOString() ?? r.createdAt.toISOString(),
    }));

    // ── 11. Store Comparison (top stores in the same region) ──
    const peerStores = store.regionId
      ? await prisma.store.findMany({
          where: { regionId: store.regionId, isActive: true, id: { not: storeId } },
          select: { id: true, storeName: true },
          take: 8,
        })
      : [];

    // Get average scores for peer stores
    const comparison = await Promise.all(
      peerStores.map(async (peer) => {
        const peerSubs = await prisma.programSubmission.aggregate({
          where: {
            storeId: peer.id,
            submittedAt: { gte: since },
            status: { in: ['SUBMITTED', 'REVIEWED', 'SYNCED'] },
            percentage: { not: null },
          },
          _avg: { percentage: true },
        });
        return {
          entityId: peer.id,
          entityName: peer.storeName,
          score: Math.round(peerSubs._avg.percentage ?? 0),
          trend: 'flat' as const,
          rank: 0,
        };
      }),
    );

    // Add current store and sort by score
    const allStores = [
      { entityId: storeId, entityName: store.storeName, score: overallScore, trend: overallTrend, rank: 0 },
      ...comparison,
    ]
      .sort((a, b) => b.score - a.score)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    // ── 12. Avg score ──
    const avgScore = submissions.length > 0
      ? Math.round(
          submissions
            .filter((s) => s.percentage != null)
            .reduce((sum, s) => sum + (s.percentage ?? 0), 0) /
          Math.max(submissions.filter((s) => s.percentage != null).length, 1),
        )
      : 0;

    // ── Assemble payload ──
    return {
      storeId,
      storeName: store.storeName,
      storeCode: store.storeCode,
      region: store.region?.name ?? 'Unknown',
      regionId: store.regionId,
      city: store.city,
      state: store.state,
      address: store.address,
      latitude: store.latitude,
      longitude: store.longitude,
      managerId: manager?.id ?? null,
      managerName: manager?.name ?? null,
      managerDesignation: manager?.designation ?? null,
      healthScore: {
        overall: overallScore,
        trend: overallTrend,
        trendDelta: overallDelta,
        breakdown: programBreakdown.map((b) => ({
          programId: b.programId,
          programName: b.programName,
          weight: b.weight,
          score: b.score,
          trend: b.trend,
          submissions: b.totalSubmissions,
        })),
        riskLevel: scoreToRisk(overallScore),
      },
      performanceTrend,
      programPerformance: programBreakdown.map((b) => ({
        programId: b.programId,
        programName: b.programName,
        score: b.score,
        trend: b.trend,
        totalSubmissions: b.totalSubmissions,
        lastSubmission: submissions.find((s) => s.programId === b.programId)?.submittedAt?.toISOString() ?? null,
        avgCompletionTime: 0, // Would need start/submit time diff
      })),
      recentSubmissions,
      openTasks,
      recurringIssues,
      evidenceGallery,
      comparison: allStores,
      stats: {
        totalSubmissions,
        thisMonth: thisMonthCount,
        avgScore,
        openTaskCount,
        overdueTaskCount,
      },
    };
  }
}
