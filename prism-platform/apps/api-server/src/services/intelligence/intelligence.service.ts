// ──────────────────────────────────────────
// Intelligence Service — Data queries for AI chat
// ──────────────────────────────────────────

import { prisma } from '../../lib/prisma.js';

// Programs excluded from AI analysis (external / non-operational)
const EXCLUDED_PROGRAM_NAMES = ['Campus Hire', 'Brew League'];
const programExclusionFilter = { program: { name: { notIn: EXCLUDED_PROGRAM_NAMES } } };
const programExclusionFilterDirect = { name: { notIn: EXCLUDED_PROGRAM_NAMES } };

// Only count employees whose code starts with H, P, I, HK, or AP (excludes campus hires etc.)
const OPERATIONAL_EMPLOYEE_FILTER = {
  OR: [
    { empId: { startsWith: 'H' } },
    { empId: { startsWith: 'P' } },
    { empId: { startsWith: 'I' } },
    { empId: { startsWith: 'AP' } },
  ],
};

export class IntelligenceService {
  /**
   * Get a high-level summary of all submission data
   */
  static async getOverviewStats(dateFrom?: Date) {
    const submissionWhere: any = { status: 'SUBMITTED' as const, ...programExclusionFilter };
    if (dateFrom) submissionWhere.submittedAt = { gte: dateFrom };

    const [
      totalSubmissions,
      totalStores,
      totalEmployees,
      totalPrograms,
      recentSubmissions,
    ] = await Promise.all([
      prisma.programSubmission.count({ where: submissionWhere }),
      prisma.store.count({ where: { isActive: true } }),
      prisma.employee.count({ where: { isActive: true, ...OPERATIONAL_EMPLOYEE_FILTER } }),
      prisma.program.count({ where: { status: 'ACTIVE' } }),
      prisma.programSubmission.findMany({
        where: submissionWhere,
        orderBy: { submittedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          score: true,
          maxScore: true,
          percentage: true,
          submittedAt: true,
          program: { select: { name: true, department: true } },
          store: { select: { storeName: true, city: true } },
          employee: { select: { name: true, department: true } },
        },
      }),
    ]);

    const avgScore = recentSubmissions.length > 0
      ? recentSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / recentSubmissions.length
      : 0;

    return {
      totalSubmissions,
      totalStores,
      totalEmployees,
      totalPrograms,
      averageScore: Math.round(avgScore * 100) / 100,
      recentSubmissions: recentSubmissions.slice(0, 10),
    };
  }

  /**
   * Get submission performance grouped by program
   */
  static async getProgramPerformance(dateFrom?: Date) {
    const submissionWhere: any = { status: 'SUBMITTED' as const, ...programExclusionFilter };
    if (dateFrom) submissionWhere.submittedAt = { gte: dateFrom };

    const submissions = await prisma.programSubmission.findMany({
      where: submissionWhere,
      select: {
        percentage: true,
        submittedAt: true,
        program: { select: { id: true, name: true, department: true, type: true } },
      },
    });

    const grouped = new Map<string, { name: string; department: string | null; scores: number[]; count: number }>();
    for (const s of submissions) {
      const key = s.program.id;
      if (!grouped.has(key)) {
        grouped.set(key, { name: s.program.name, department: s.program.department, scores: [], count: 0 });
      }
      const g = grouped.get(key)!;
      g.count++;
      if (s.percentage != null) g.scores.push(s.percentage);
    }

    return Array.from(grouped.entries()).map(([id, g]) => ({
      programId: id,
      programName: g.name,
      department: g.department,
      totalSubmissions: g.count,
      averageScore: g.scores.length > 0 ? Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 100) / 100 : null,
      minScore: g.scores.length > 0 ? Math.min(...g.scores) : null,
      maxScore: g.scores.length > 0 ? Math.max(...g.scores) : null,
    }));
  }

  /**
   * Get store performance rankings
   */
  static async getStorePerformance(limit = 20, dateFrom?: Date) {
    const submissionWhere: any = { status: 'SUBMITTED' as const, ...programExclusionFilter };
    if (dateFrom) submissionWhere.submittedAt = { gte: dateFrom };

    const submissions = await prisma.programSubmission.findMany({
      where: submissionWhere,
      select: {
        percentage: true,
        store: { select: { id: true, storeName: true, storeCode: true, city: true, state: true, region: { select: { name: true } } } },
        program: { select: { name: true } },
      },
    });

    const grouped = new Map<string, { name: string; code: string | null; city: string; region: string | null; scores: number[]; count: number }>();
    for (const s of submissions) {
      const key = s.store.id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          name: s.store.storeName,
          code: s.store.storeCode,
          city: s.store.city,
          region: s.store.region?.name || null,
          scores: [],
          count: 0,
        });
      }
      const g = grouped.get(key)!;
      g.count++;
      if (s.percentage != null) g.scores.push(s.percentage);
    }

    return Array.from(grouped.entries())
      .map(([id, g]) => ({
        storeId: id,
        storeName: g.name,
        storeCode: g.code,
        city: g.city,
        region: g.region,
        totalSubmissions: g.count,
        averageScore: g.scores.length > 0 ? Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 100) / 100 : null,
      }))
      .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
      .slice(0, limit);
  }

  /**
   * Get employee performance rankings
   */
  static async getEmployeePerformance(limit = 20, dateFrom?: Date) {
    const submissionWhere: any = { status: 'SUBMITTED' as const, ...programExclusionFilter };
    if (dateFrom) submissionWhere.submittedAt = { gte: dateFrom };

    const submissions = await prisma.programSubmission.findMany({
      where: submissionWhere,
      select: {
        percentage: true,
        employee: { select: { id: true, name: true, department: true, designation: true, store: { select: { storeName: true } } } },
        program: { select: { name: true } },
      },
    });

    const grouped = new Map<string, { name: string; department: string | null; designation: string | null; store: string | null; scores: number[]; count: number }>();
    for (const s of submissions) {
      const key = s.employee.id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          name: s.employee.name,
          department: s.employee.department,
          designation: s.employee.designation,
          store: s.employee.store?.storeName || null,
          scores: [],
          count: 0,
        });
      }
      const g = grouped.get(key)!;
      g.count++;
      if (s.percentage != null) g.scores.push(s.percentage);
    }

    return Array.from(grouped.entries())
      .map(([id, g]) => ({
        employeeId: id,
        employeeName: g.name,
        department: g.department,
        designation: g.designation,
        store: g.store,
        totalSubmissions: g.count,
        averageScore: g.scores.length > 0 ? Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 100) / 100 : null,
      }))
      .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
      .slice(0, limit);
  }

  /**
   * Get region-wide comparison
   */
  static async getRegionComparison(dateFrom?: Date) {
    const submissionWhere: any = { status: 'SUBMITTED' as const, ...programExclusionFilter };
    if (dateFrom) submissionWhere.submittedAt = { gte: dateFrom };

    const submissions = await prisma.programSubmission.findMany({
      where: submissionWhere,
      select: {
        percentage: true,
        store: { select: { region: { select: { id: true, name: true } } } },
      },
    });

    const grouped = new Map<string, { name: string; scores: number[]; count: number }>();
    for (const s of submissions) {
      const region = s.store.region;
      if (!region) continue;
      const key = region.id;
      if (!grouped.has(key)) {
        grouped.set(key, { name: region.name, scores: [], count: 0 });
      }
      const g = grouped.get(key)!;
      g.count++;
      if (s.percentage != null) g.scores.push(s.percentage);
    }

    return Array.from(grouped.entries())
      .map(([id, g]) => ({
        regionId: id,
        regionName: g.name,
        totalSubmissions: g.count,
        averageScore: g.scores.length > 0 ? Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 100) / 100 : null,
      }))
      .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
  }

  /**
   * Get detailed responses for a specific program (for deep analysis)
   */
  static async getProgramResponses(programName?: string, dateFrom?: Date) {
    const where: any = { status: 'SUBMITTED' as const, ...programExclusionFilter };
    if (dateFrom) where.submittedAt = { gte: dateFrom };
    if (programName) {
      where.program = { name: { contains: programName, mode: 'insensitive', notIn: EXCLUDED_PROGRAM_NAMES } };
    }

    const submissions = await prisma.programSubmission.findMany({
      where,
      take: 100,
      orderBy: { submittedAt: 'desc' },
      select: {
        percentage: true,
        submittedAt: true,
        sectionScores: true,
        program: { select: { name: true } },
        store: { select: { storeName: true, city: true } },
        employee: { select: { name: true } },
        responses: {
          select: {
            answer: true,
            numericValue: true,
            booleanValue: true,
            score: true,
            maxScore: true,
            question: { select: { text: true, questionType: true, sectionId: true } },
          },
        },
      },
    });

    return submissions;
  }

  /**
   * Get question-level analytics aggregated by program → section → question → store.
   * This enables the AI to answer "where are employees most stressed?" type questions
   * by cross-referencing individual question responses with store-level breakdowns.
   */
  static async getQuestionAnalyticsByProgram(dateFrom?: Date): Promise<string> {
    const submissionFilter: any = { status: 'SUBMITTED' as const, ...programExclusionFilter };
    if (dateFrom) submissionFilter.submittedAt = { gte: dateFrom };

    // Fetch all responses with question metadata (including ratingScale for reverse-mapping)
    const responses = await prisma.programResponse.findMany({
      where: { submission: submissionFilter },
      select: {
        answer: true,
        numericValue: true,
        booleanValue: true,
        score: true,
        maxScore: true,
        question: {
          select: {
            id: true,
            text: true,
            questionType: true,
            order: true,
            options: true,
            ratingScale: true,
            section: {
              select: {
                id: true,
                title: true,
                order: true,
                program: { select: { id: true, name: true } },
              },
            },
          },
        },
        submission: {
          select: {
            store: { select: { storeName: true, city: true, region: { select: { name: true } } } },
          },
        },
      },
    });

    // Build reverse label→number maps for RATING_SCALE questions
    const ratingReverseMaps = new Map<string, Map<string, number>>();

    // Build nested aggregation: Program → Section → Question → Store
    type StoreAgg = {
      yes: number; no: number;
      numericSum: number; numericCount: number;
      scoreSum: number; maxScoreSum: number;
      answerCounts: Map<string, number>;
      count: number; city: string; region: string;
    };
    type QuestionAgg = {
      text: string; type: string; order: number;
      stores: Map<string, StoreAgg>;
      totalResponses: number;
      ratingMax: number;
      ratingLabels: Record<string, string> | null;
      optionLabels: { label: string; score: number }[] | null;
    };
    type SectionAgg = { title: string; order: number; questions: Map<string, QuestionAgg> };
    type ProgramAgg = { name: string; sections: Map<string, SectionAgg> };

    const programs = new Map<string, ProgramAgg>();

    for (const r of responses) {
      const q = r.question;
      const sec = q.section;
      const prog = sec.program;
      const storeName = r.submission.store.storeName;
      const city = r.submission.store.city;
      const region = r.submission.store.region?.name || 'N/A';

      // Ensure program
      if (!programs.has(prog.id)) {
        programs.set(prog.id, { name: prog.name, sections: new Map() });
      }
      const pAgg = programs.get(prog.id)!;

      // Ensure section
      if (!pAgg.sections.has(sec.id)) {
        pAgg.sections.set(sec.id, { title: sec.title, order: sec.order, questions: new Map() });
      }
      const sAgg = pAgg.sections.get(sec.id)!;

      // Ensure question (with rating scale metadata)
      if (!sAgg.questions.has(q.id)) {
        const rs = q.ratingScale as { min?: number; max?: number; labels?: Record<string, string> } | null;
        const opts = q.options as { label?: string; score?: number; text?: string }[] | null;
        const optLabels = (opts && Array.isArray(opts) && opts.some(o => o.label && o.score != null))
          ? opts.filter(o => o.label && o.score != null).map(o => ({ label: o.label!, score: o.score! })).sort((a, b) => a.score - b.score)
          : null;
        sAgg.questions.set(q.id, {
          text: q.text, type: q.questionType, order: q.order,
          stores: new Map(), totalResponses: 0,
          ratingMax: rs?.max || 5,
          ratingLabels: rs?.labels || null,
          optionLabels: optLabels,
        });

        // Build reverse map (label text → numeric value) for RATING_SCALE questions
        if (q.questionType === 'RATING_SCALE') {
          const reverseMap = new Map<string, number>();
          // Method 1: ratingScale.labels (e.g. {"1":"Poor","2":"Below Average",...})
          if (rs?.labels) {
            for (const [numStr, labelText] of Object.entries(rs.labels)) {
              reverseMap.set((labelText as string).toLowerCase(), parseInt(numStr, 10));
            }
          }
          // Method 2: options array (e.g. [{label:"Every time",score:1},{label:"Never",score:5}])
          if (opts && Array.isArray(opts)) {
            for (const opt of opts) {
              if (opt.label && opt.score != null) {
                reverseMap.set(opt.label.toLowerCase(), opt.score);
              }
            }
          }
          if (reverseMap.size > 0) {
            ratingReverseMaps.set(q.id, reverseMap);
          }
        }
      }
      const qAgg = sAgg.questions.get(q.id)!;
      qAgg.totalResponses++;

      // Ensure store bucket
      if (!qAgg.stores.has(storeName)) {
        qAgg.stores.set(storeName, {
          yes: 0, no: 0, numericSum: 0, numericCount: 0,
          scoreSum: 0, maxScoreSum: 0, answerCounts: new Map(),
          count: 0, city, region,
        });
      }
      const storeAgg = qAgg.stores.get(storeName)!;
      storeAgg.count++;

      // Track answer distribution for all types
      if (r.answer) {
        storeAgg.answerCounts.set(r.answer, (storeAgg.answerCounts.get(r.answer) || 0) + 1);
      }

      // Type-specific aggregation
      if (q.questionType === 'YES_NO' && r.booleanValue != null) {
        if (r.booleanValue) storeAgg.yes++;
        else storeAgg.no++;
      } else if (q.questionType === 'RATING_SCALE' && r.answer) {
        // Reverse-map answer text → numeric value
        const reverseMap = ratingReverseMaps.get(q.id);
        if (reverseMap) {
          const numVal = reverseMap.get(r.answer.toLowerCase());
          if (numVal != null) {
            storeAgg.numericSum += numVal;
            storeAgg.numericCount++;
          }
        }
      } else if (q.questionType === 'MULTIPLE_CHOICE') {
        // MULTIPLE_CHOICE has score/maxScore populated
        if (r.score != null) storeAgg.scoreSum += r.score;
        if (r.maxScore != null) storeAgg.maxScoreSum += r.maxScore;
      } else if (q.questionType === 'DROPDOWN') {
        // Some dropdowns have numericValue
        if (r.numericValue != null) {
          storeAgg.numericSum += r.numericValue;
          storeAgg.numericCount++;
        }
      }
    }

    // Format the analytics into a readable string
    let output = `## DETAILED QUESTION & RESPONSE ANALYTICS\n`;
    output += `(Per-question breakdown with top/bottom stores by score/rating. Use this to answer specific questions about employee sentiments, operational weaknesses, compliance gaps, etc.)\n\n`;

    for (const [, pAgg] of programs) {
      output += `### Program: ${pAgg.name}\n`;

      const sortedSections = [...pAgg.sections.values()].sort((a, b) => a.order - b.order);
      for (const sec of sortedSections) {
        output += `#### Section: ${sec.title}\n`;

        const sortedQuestions = [...sec.questions.values()].sort((a, b) => a.order - b.order);
        for (const q of sortedQuestions) {
          // Skip text-only / media questions
          if (q.type === 'TEXT' || q.type === 'IMAGE_UPLOAD' || q.type === 'FILE_UPLOAD' || q.type === 'SIGNATURE') {
            continue;
          }

          output += `- Q: "${q.text}" [${q.type}] (${q.totalResponses} responses)\n`;

          const storeEntries = [...q.stores.entries()];
          const MIN_RESPONSES = 3;

          if (q.type === 'YES_NO') {
            const storeYesPct = storeEntries
              .filter(([, s]) => (s.yes + s.no) >= MIN_RESPONSES)
              .map(([name, s]) => ({
                name, city: s.city, region: s.region,
                yesPct: Math.round((s.yes / (s.yes + s.no)) * 100),
                count: s.count,
              }))
              .sort((a, b) => b.yesPct - a.yesPct);

            if (storeYesPct.length > 0) {
              const overallYes = Math.round(storeYesPct.reduce((s, e) => s + e.yesPct, 0) / storeYesPct.length);
              output += `  Overall avg: ${overallYes}% YES\n`;
              output += `  Highest YES: ${storeYesPct.slice(0, 5).map(s => `${s.name} (${s.yesPct}%, ${s.count} resp)`).join(', ')}\n`;
              output += `  Lowest YES: ${storeYesPct.slice(-5).reverse().map(s => `${s.name} (${s.yesPct}%, ${s.count} resp)`).join(', ')}\n`;
            }
          } else if (q.type === 'RATING_SCALE') {
            // Use reverse-mapped numeric averages
            const storeRatings = storeEntries
              .filter(([, s]) => s.numericCount >= MIN_RESPONSES)
              .map(([name, s]) => ({
                name, city: s.city, region: s.region,
                avg: Math.round((s.numericSum / s.numericCount) * 10) / 10,
                count: s.numericCount,
              }))
              .sort((a, b) => b.avg - a.avg);

            if (storeRatings.length > 0) {
              const overallAvg = Math.round(storeRatings.reduce((s, e) => s + e.avg, 0) / storeRatings.length * 10) / 10;
              let scaleLabel = '';
              if (q.optionLabels) {
                scaleLabel = ` (scale: ${q.optionLabels.map(o => `${o.score}=${o.label}`).join(', ')})`;
              } else if (q.ratingLabels) {
                scaleLabel = ` (scale: ${Object.entries(q.ratingLabels).map(([k, v]) => `${k}=${v}`).join(', ')})`;
              }
              output += `  Overall avg: ${overallAvg}/${q.ratingMax}${scaleLabel}\n`;
              output += `  Highest rated: ${storeRatings.slice(0, 5).map(s => `${s.name} (${s.avg}/${q.ratingMax}, ${s.count} resp)`).join(', ')}\n`;
              output += `  Lowest rated: ${storeRatings.slice(-5).reverse().map(s => `${s.name} (${s.avg}/${q.ratingMax}, ${s.count} resp)`).join(', ')}\n`;
            }
          } else if (q.type === 'MULTIPLE_CHOICE') {
            // Use score/maxScore percentages
            const storeScores = storeEntries
              .filter(([, s]) => s.maxScoreSum > 0 && s.count >= MIN_RESPONSES)
              .map(([name, s]) => ({
                name, city: s.city, region: s.region,
                scorePct: Math.round((s.scoreSum / s.maxScoreSum) * 100),
                count: s.count,
              }))
              .sort((a, b) => b.scorePct - a.scorePct);

            if (storeScores.length > 0) {
              const overallScore = Math.round(storeScores.reduce((s, e) => s + e.scorePct, 0) / storeScores.length);
              output += `  Overall avg: ${overallScore}% score\n`;
              output += `  Top stores: ${storeScores.slice(0, 5).map(s => `${s.name} (${s.scorePct}%, ${s.count} resp)`).join(', ')}\n`;
              output += `  Bottom stores: ${storeScores.slice(-5).reverse().map(s => `${s.name} (${s.scorePct}%, ${s.count} resp)`).join(', ')}\n`;
            }
          } else if (q.type === 'DROPDOWN') {
            // If numeric values exist, use them; otherwise show answer distribution
            const hasNumeric = storeEntries.some(([, s]) => s.numericCount >= MIN_RESPONSES);
            if (hasNumeric) {
              const storeNums = storeEntries
                .filter(([, s]) => s.numericCount >= MIN_RESPONSES)
                .map(([name, s]) => ({
                  name, city: s.city, region: s.region,
                  avg: Math.round((s.numericSum / s.numericCount) * 10) / 10,
                  count: s.numericCount,
                }))
                .sort((a, b) => b.avg - a.avg);

              if (storeNums.length > 0) {
                const overallAvg = Math.round(storeNums.reduce((s, e) => s + e.avg, 0) / storeNums.length * 10) / 10;
                output += `  Overall avg: ${overallAvg}\n`;
                output += `  Highest: ${storeNums.slice(0, 5).map(s => `${s.name} (avg ${s.avg}, ${s.count} resp)`).join(', ')}\n`;
                output += `  Lowest: ${storeNums.slice(-5).reverse().map(s => `${s.name} (avg ${s.avg}, ${s.count} resp)`).join(', ')}\n`;
              }
            } else {
              // Show most common answers across all stores (answer distribution)
              const answerTotals = new Map<string, number>();
              for (const [, s] of storeEntries) {
                for (const [ans, cnt] of s.answerCounts) {
                  answerTotals.set(ans, (answerTotals.get(ans) || 0) + cnt);
                }
              }
              const topAnswers = [...answerTotals.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
              if (topAnswers.length > 0) {
                output += `  Answer distribution: ${topAnswers.map(([ans, cnt]) => `"${ans}" (${cnt})`).join(', ')}\n`;
              }
            }
          }
        }
        output += `\n`;
      }
    }

    return output;
  }

  /**
   * Get all stores with their details for the AI context
   */
  static async getAllStoreDetails() {
    return prisma.store.findMany({
      where: { isActive: true },
      select: {
        storeName: true,
        storeCode: true,
        city: true,
        state: true,
        storeFormat: true,
        menuType: true,
        priceGroup: true,
        amName: true,
        hrbp1Name: true,
        hrbp2Name: true,
        hrbp3Name: true,
        trainer1Name: true,
        trainer2Name: true,
        trainer3Name: true,
        regionalTrainerName: true,
        regionalHrName: true,
        hrHeadName: true,
        region: { select: { name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { storeName: 'asc' },
    });
  }

  /**
   * Get all employees with their details for the AI context
   */
  static async getAllEmployeeDetails() {
    return prisma.employee.findMany({
      where: { isActive: true, ...OPERATIONAL_EMPLOYEE_FILTER },
      select: {
        name: true,
        empId: true,
        department: true,
        designation: true,
        category: true,
        location: true,
        dateOfJoining: true,
        store: { select: { storeName: true, city: true, region: { select: { name: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all programs with details
   */
  static async getAllProgramDetails() {
    return prisma.program.findMany({
      where: { status: 'ACTIVE', ...programExclusionFilterDirect },
      select: {
        name: true,
        department: true,
        type: true,
        description: true,
        _count: { select: { sections: true, submissions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all regions with store counts
   */
  static async getAllRegionDetails() {
    return prisma.region.findMany({
      select: {
        name: true,
        code: true,
        _count: { select: { stores: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get per-store scores broken down by program.
   * This lets the AI answer "which stores scored below X% on program Y?"
   */
  static async getStoreScoresByProgram(dateFrom?: Date) {
    const submissionWhere: any = { status: 'SUBMITTED' as const, ...programExclusionFilter };
    if (dateFrom) submissionWhere.submittedAt = { gte: dateFrom };

    const submissions = await prisma.programSubmission.findMany({
      where: submissionWhere,
      select: {
        percentage: true,
        program: { select: { id: true, name: true } },
        store: { select: { storeName: true, storeCode: true, city: true, region: { select: { name: true } } } },
      },
    });

    // Group: program → store → scores[]
    const programMap = new Map<string, {
      name: string;
      stores: Map<string, { storeName: string; code: string | null; city: string; region: string; scores: number[] }>;
    }>();

    for (const s of submissions) {
      if (s.percentage == null) continue;
      const progKey = s.program.id;
      if (!programMap.has(progKey)) {
        programMap.set(progKey, { name: s.program.name, stores: new Map() });
      }
      const prog = programMap.get(progKey)!;
      const storeName = s.store.storeName;
      if (!prog.stores.has(storeName)) {
        prog.stores.set(storeName, {
          storeName,
          code: s.store.storeCode,
          city: s.store.city,
          region: s.store.region?.name || 'N/A',
          scores: [],
        });
      }
      prog.stores.get(storeName)!.scores.push(s.percentage);
    }

    return programMap;
  }

  /**
   * Build a full data context string for the AI
   */
  static async buildDataContext(dateFrom?: Date): Promise<string> {
    const [overview, programs, topStores, topEmployees, regions, allStores, allEmployees, allPrograms, allRegions, questionAnalytics, storeByProgram] = await Promise.all([
      this.getOverviewStats(dateFrom),
      this.getProgramPerformance(dateFrom),
      this.getStorePerformance(15, dateFrom),
      this.getEmployeePerformance(15, dateFrom),
      this.getRegionComparison(dateFrom),
      this.getAllStoreDetails(),
      this.getAllEmployeeDetails(),
      this.getAllProgramDetails(),
      this.getAllRegionDetails(),
      this.getQuestionAnalyticsByProgram(dateFrom),
      this.getStoreScoresByProgram(dateFrom),
    ]);

    let context = `=== PRISM INTELLIGENCE DATA CONTEXT ===\n\n`;

    context += `## OVERVIEW\n`;
    context += `- Total Submitted Audits/Checklists: ${overview.totalSubmissions}\n`;
    context += `- Active Stores: ${overview.totalStores}\n`;
    context += `- Active Employees: ${overview.totalEmployees}\n`;
    context += `- Published Programs: ${overview.totalPrograms}\n`;
    context += `- Average Score (recent 50): ${overview.averageScore}%\n\n`;

    // ── Regions with store counts ──
    context += `## REGIONS\n`;
    for (const r of allRegions) {
      context += `- ${r.name}${r.code ? ` (${r.code})` : ''}: ${r._count.stores} stores\n`;
    }
    context += `\n`;

    // ── All stores with details ──
    context += `## ALL STORES (${allStores.length} active)\n`;
    context += `| Store Name | Code | City | State | Region | Format | Menu Type | Price Group | AM | Assigned Trainer | Support Trainer 2 | Support Trainer 3 | Regional Trainer | Assigned HRBP | Support HRBP 2 | Support HRBP 3 | Regional HR | HR Head | Employees |\n`;
    context += `|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
    for (const s of allStores) {
      context += `| ${s.storeName} | ${s.storeCode || '-'} | ${s.city} | ${s.state || '-'} | ${s.region?.name || '-'} | ${s.storeFormat || '-'} | ${s.menuType || '-'} | ${s.priceGroup || '-'} | ${s.amName || '-'} | ${s.trainer1Name || '-'} | ${s.trainer2Name || '-'} | ${s.trainer3Name || '-'} | ${s.regionalTrainerName || '-'} | ${s.hrbp1Name || '-'} | ${s.hrbp2Name || '-'} | ${s.hrbp3Name || '-'} | ${s.regionalHrName || '-'} | ${s.hrHeadName || '-'} | ${s._count.employees} |\n`;
    }
    context += `\n`;

    // ── All programs with details ──
    context += `## ALL PROGRAMS (${allPrograms.length} active)\n`;
    for (const p of allPrograms) {
      context += `- ${p.name} | Dept: ${p.department || '-'} | Type: ${p.type} | Sections: ${p._count.sections} | Submissions: ${p._count.submissions}${p.description ? ` | ${p.description}` : ''}\n`;
    }
    context += `\n`;

    // ── Employee summary by department/designation ──
    const deptMap = new Map<string, number>();
    const designationMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();
    for (const e of allEmployees) {
      deptMap.set(e.department || 'Unassigned', (deptMap.get(e.department || 'Unassigned') || 0) + 1);
      designationMap.set(e.designation || 'Unassigned', (designationMap.get(e.designation || 'Unassigned') || 0) + 1);
      if (e.category) categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + 1);
    }

    context += `## EMPLOYEE BREAKDOWN (${allEmployees.length} active)\n`;
    context += `### By Department\n`;
    for (const [dept, count] of [...deptMap.entries()].sort((a, b) => b[1] - a[1])) {
      context += `- ${dept}: ${count}\n`;
    }
    context += `### By Designation\n`;
    for (const [des, count] of [...designationMap.entries()].sort((a, b) => b[1] - a[1])) {
      context += `- ${des}: ${count}\n`;
    }
    if (categoryMap.size > 0) {
      context += `### By Category\n`;
      for (const [cat, count] of [...categoryMap.entries()].sort((a, b) => b[1] - a[1])) {
        context += `- ${cat}: ${count}\n`;
      }
    }
    context += `\n`;

    // ── Store breakdown by region/format/city ──
    const regionStoreMap = new Map<string, number>();
    const formatMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    const stateMap = new Map<string, number>();
    for (const s of allStores) {
      regionStoreMap.set(s.region?.name || 'Unassigned', (regionStoreMap.get(s.region?.name || 'Unassigned') || 0) + 1);
      if (s.storeFormat) formatMap.set(s.storeFormat, (formatMap.get(s.storeFormat) || 0) + 1);
      cityMap.set(s.city, (cityMap.get(s.city) || 0) + 1);
      if (s.state) stateMap.set(s.state, (stateMap.get(s.state) || 0) + 1);
    }

    context += `## STORE BREAKDOWN\n`;
    context += `### By Region\n`;
    for (const [r, count] of [...regionStoreMap.entries()].sort((a, b) => b[1] - a[1])) {
      context += `- ${r}: ${count} stores\n`;
    }
    if (formatMap.size > 0) {
      context += `### By Store Format\n`;
      for (const [f, count] of [...formatMap.entries()].sort((a, b) => b[1] - a[1])) {
        context += `- ${f}: ${count} stores\n`;
      }
    }
    context += `### By State\n`;
    for (const [st, count] of [...stateMap.entries()].sort((a, b) => b[1] - a[1])) {
      context += `- ${st}: ${count} stores\n`;
    }
    context += `### By City (top 20)\n`;
    for (const [c, count] of [...cityMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      context += `- ${c}: ${count} stores\n`;
    }
    context += `\n`;

    // ── Submission performance (if any) ──
    if (overview.totalSubmissions > 0) {
      context += `## PROGRAM PERFORMANCE\n`;
      for (const p of programs) {
        context += `- ${p.programName} (${p.department || 'N/A'}): ${p.totalSubmissions} submissions, avg ${p.averageScore}%, min ${p.minScore}%, max ${p.maxScore}%\n`;
      }
      context += `\n`;

      context += `## TOP STORES BY SCORE\n`;
      for (const s of topStores) {
        context += `- ${s.storeName} (${s.city}, ${s.region || 'N/A'}): ${s.totalSubmissions} submissions, avg ${s.averageScore}%\n`;
      }
      context += `\n`;

      context += `## TOP EMPLOYEES BY SCORE\n`;
      for (const e of topEmployees) {
        context += `- ${e.employeeName} (${e.department || 'N/A'}, ${e.store || 'N/A'}): ${e.totalSubmissions} submissions, avg ${e.averageScore}%\n`;
      }
      context += `\n`;

      context += `## REGION COMPARISON\n`;
      for (const r of regions) {
        context += `- ${r.regionName}: ${r.totalSubmissions} submissions, avg ${r.averageScore}%\n`;
      }

      context += `\n## RECENT SUBMISSIONS\n`;
      for (const s of overview.recentSubmissions) {
        context += `- ${s.program.name} at ${s.store.storeName} by ${s.employee.name}: ${s.percentage}% (${s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'N/A'})\n`;
      }
    }

    // ── Question-level response analytics ──
    if (questionAnalytics) {
      context += `\n${questionAnalytics}`;
    }

    // ── Store scores by program (enables "which stores scored below X% on program Y?") ──
    if (storeByProgram.size > 0) {
      context += `\n## STORE SCORES BY PROGRAM\n`;
      context += `(Each store's average score for each program. Use this to answer per-program store-level questions.)\n\n`;
      for (const [, prog] of storeByProgram) {
        const storeRows = [...prog.stores.values()]
          .map(s => ({
            storeName: s.storeName,
            code: s.code || '-',
            city: s.city,
            region: s.region,
            submissions: s.scores.length,
            avg: Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 100) / 100,
            min: Math.round(Math.min(...s.scores) * 100) / 100,
            max: Math.round(Math.max(...s.scores) * 100) / 100,
          }))
          .sort((a, b) => a.avg - b.avg); // worst first so AI can easily find low-scorers

        context += `### ${prog.name} (${storeRows.length} stores)\n`;
        context += `| Store | Code | City | Region | Submissions | Avg% | Min% | Max% |\n`;
        context += `|---|---|---|---|---|---|---|---|\n`;
        for (const r of storeRows) {
          context += `| ${r.storeName} | ${r.code} | ${r.city} | ${r.region} | ${r.submissions} | ${r.avg} | ${r.min} | ${r.max} |\n`;
        }
        context += `\n`;
      }
    }

    return context;
  }
}
