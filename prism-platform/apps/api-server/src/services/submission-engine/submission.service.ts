// ──────────────────────────────────────────
// Submission Engine — Service layer
// ──────────────────────────────────────────

import { prisma, Prisma } from '../../lib/prisma.js';
import { calculateScore } from './scoring.js';
import type {
  CreateSubmissionInput,
  SaveDraftInput,
  SubmitFinalInput,
  SyncOfflineInput,
  ListSubmissionsQuery,
  ResponseInput,
} from './validation.js';

// ── Error class ──

export class SubmissionEngineError extends Error {
  constructor(message: string, public code: string = 'SUBMISSION_ERROR') {
    super(message);
    this.name = 'SubmissionEngineError';
  }
}

// ── Helpers ──

async function getSubmissionOrThrow(id: string) {
  const sub = await prisma.programSubmission.findUnique({
    where: { id },
    include: {
      responses: true,
      program: {
        include: {
          sections: {
            include: { questions: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' },
          },
        },
      },
      employee: { select: { id: true, name: true, email: true } },
      store: { select: { id: true, storeName: true, storeCode: true } },
    },
  });

  if (!sub) {
    throw new SubmissionEngineError('Submission not found', 'NOT_FOUND');
  }
  return sub;
}

function buildResponseData(
  submissionId: string,
  responses: ResponseInput[],
) {
  return responses.map((r) => ({
    submissionId,
    questionId: r.questionId,
    answer: r.answer ?? null,
    numericValue: r.numericValue ?? null,
    booleanValue: r.booleanValue ?? null,
    selectedOptions: r.selectedOptions
      ? (r.selectedOptions as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull as unknown as Prisma.InputJsonValue,
    imageUrl: r.imageUrl ?? null,
    fileUrl: r.fileUrl ?? null,
    signatureUrl: r.signatureUrl ?? null,
    annotation: r.annotation
      ? (r.annotation as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull as unknown as Prisma.InputJsonValue,
    comment: r.comment ?? null,
    geoLat: r.geoLat ?? null,
    geoLng: r.geoLng ?? null,
  }));
}

/**
 * Validate required questions are answered and type constraints are met.
 * Returns array of error messages (empty = valid).
 */
function validateResponses(
  sections: {
    id: string;
    questions: {
      id: string;
      questionType: string;
      required: boolean;
      minValue: number | null;
      maxValue: number | null;
      minLength: number | null;
      maxLength: number | null;
      conditionalLogic: unknown;
    }[];
  }[],
  responses: ResponseInput[],
  allResponses: ResponseInput[],
): string[] {
  const errors: string[] = [];
  const responseMap = new Map<string, ResponseInput>();
  for (const r of allResponses) {
    responseMap.set(r.questionId, r);
  }

  for (const section of sections) {
    for (const q of section.questions) {
      // Evaluate conditional logic — skip hidden questions
      if (q.conditionalLogic && typeof q.conditionalLogic === 'object') {
        const logic = q.conditionalLogic as {
          dependsOn?: string;
          showWhen?: string;
          value?: string;
        };
        if (logic.dependsOn) {
          const parentResponse = responseMap.get(logic.dependsOn);
          if (!parentResponse) continue; // parent not answered → skip
          const parentVal =
            parentResponse.booleanValue?.toString() ??
            parentResponse.answer ??
            '';
          if (logic.showWhen === 'equals' && parentVal !== logic.value) continue;
          if (logic.showWhen === 'not_equals' && parentVal === logic.value) continue;
        }
      }

      const resp = responses.find((r) => r.questionId === q.id);

      // Required check
      if (q.required && !resp) {
        errors.push(`Question ${q.id} is required`);
        continue;
      }
      if (!resp) continue;

      // Type-specific validation
      switch (q.questionType) {
        case 'TEXT': {
          const val = resp.answer ?? '';
          if (q.required && val.trim().length === 0) {
            errors.push(`Question ${q.id}: text answer is required`);
          }
          if (q.minLength != null && val.length < q.minLength) {
            errors.push(`Question ${q.id}: minimum length is ${q.minLength}`);
          }
          if (q.maxLength != null && val.length > q.maxLength) {
            errors.push(`Question ${q.id}: maximum length is ${q.maxLength}`);
          }
          break;
        }
        case 'NUMBER': {
          if (resp.numericValue == null && q.required) {
            errors.push(`Question ${q.id}: numeric value is required`);
          }
          if (resp.numericValue != null) {
            if (q.minValue != null && resp.numericValue < q.minValue) {
              errors.push(`Question ${q.id}: minimum value is ${q.minValue}`);
            }
            if (q.maxValue != null && resp.numericValue > q.maxValue) {
              errors.push(`Question ${q.id}: maximum value is ${q.maxValue}`);
            }
          }
          break;
        }
        case 'YES_NO': {
          if (resp.booleanValue == null && q.required) {
            errors.push(`Question ${q.id}: yes/no answer is required`);
          }
          break;
        }
        case 'DROPDOWN': {
          if (!resp.answer && q.required) {
            errors.push(`Question ${q.id}: selection is required`);
          }
          break;
        }
        case 'MULTIPLE_CHOICE': {
          if ((!resp.selectedOptions || resp.selectedOptions.length === 0) && q.required) {
            errors.push(`Question ${q.id}: at least one option must be selected`);
          }
          break;
        }
        case 'RATING_SCALE': {
          if (resp.numericValue == null && q.required) {
            errors.push(`Question ${q.id}: rating is required`);
          }
          break;
        }
        case 'IMAGE_UPLOAD': {
          if (!resp.imageUrl && q.required) {
            errors.push(`Question ${q.id}: image upload is required`);
          }
          break;
        }
        case 'FILE_UPLOAD': {
          if (!resp.fileUrl && q.required) {
            errors.push(`Question ${q.id}: file upload is required`);
          }
          break;
        }
        case 'SIGNATURE': {
          if (!resp.signatureUrl && q.required) {
            errors.push(`Question ${q.id}: signature is required`);
          }
          break;
        }
      }
    }
  }

  return errors;
}

// ════════════════════════════════════════════════════════════════
//  SERVICE
// ════════════════════════════════════════════════════════════════

export class SubmissionService {
  // ── Create a new draft submission ──

  static async create(input: CreateSubmissionInput) {
    // Verify program is ACTIVE
    const program = await prisma.program.findUnique({
      where: { id: input.programId },
    });
    if (!program || program.status !== 'ACTIVE') {
      throw new SubmissionEngineError(
        'Program is not active',
        'PROGRAM_NOT_ACTIVE',
      );
    }

    const submission = await prisma.programSubmission.create({
      data: {
        programId: input.programId,
        employeeId: input.employeeId,
        storeId: input.storeId,
        status: 'DRAFT',
        geoLat: input.geoLat ?? null,
        geoLng: input.geoLng ?? null,
        isOffline: input.isOffline,
        deviceId: input.deviceId ?? null,
        startedAt: new Date(),
        sectionScores: Prisma.JsonNull as unknown as Prisma.InputJsonValue,
      },
    });

    return submission;
  }

  // ── Save draft responses (upsert) ──

  static async saveDraft(submissionId: string, input: SaveDraftInput) {
    const sub = await prisma.programSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!sub) throw new SubmissionEngineError('Submission not found', 'NOT_FOUND');
    if (sub.status !== 'DRAFT') {
      throw new SubmissionEngineError(
        'Can only save drafts for DRAFT submissions',
        'INVALID_STATUS',
      );
    }

    // Upsert responses inside a transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing responses for questions that are being updated
      const questionIds = input.responses.map((r) => r.questionId);
      await tx.programResponse.deleteMany({
        where: {
          submissionId,
          questionId: { in: questionIds },
        },
      });

      // Create new responses
      if (input.responses.length > 0) {
        await tx.programResponse.createMany({
          data: buildResponseData(submissionId, input.responses),
        });
      }

      // Update geo if provided
      await tx.programSubmission.update({
        where: { id: submissionId },
        data: {
          geoLat: input.geoLat ?? sub.geoLat,
          geoLng: input.geoLng ?? sub.geoLng,
        },
      });
    });

    return getSubmissionOrThrow(submissionId);
  }

  // ── Submit final (validate + score) ──

  static async submit(submissionId: string, input: SubmitFinalInput) {
    const sub = await prisma.programSubmission.findUnique({
      where: { id: submissionId },
      include: {
        program: {
          include: {
            sections: {
              include: { questions: { orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!sub) throw new SubmissionEngineError('Submission not found', 'NOT_FOUND');
    if (sub.status !== 'DRAFT') {
      throw new SubmissionEngineError(
        'Submission has already been submitted',
        'INVALID_STATUS',
      );
    }

    // Server-side validation
    const validationErrors = validateResponses(
      sub.program.sections,
      input.responses,
      input.responses,
    );
    if (validationErrors.length > 0) {
      throw new SubmissionEngineError(
        `Validation failed: ${validationErrors.join('; ')}`,
        'VALIDATION_FAILED',
      );
    }

    // Calculate scores
    const scoring = sub.program.scoringEnabled
      ? calculateScore(sub.program.sections, input.responses)
      : null;

    // Persist everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete old responses and re-create
      await tx.programResponse.deleteMany({
        where: { submissionId },
      });

      // Create all responses with scores
      const responseData = buildResponseData(submissionId, input.responses);
      if (scoring) {
        for (const rd of responseData) {
          const rs = scoring.responseScores.find(
            (s) => s.questionId === rd.questionId,
          );
          if (rs) {
            (rd as any).score = rs.score;
            (rd as any).maxScore = rs.maxScore;
          }
        }
      }

      if (responseData.length > 0) {
        await tx.programResponse.createMany({ data: responseData });
      }

      // Update submission
      return tx.programSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          geoLat: input.geoLat ?? sub.geoLat,
          geoLng: input.geoLng ?? sub.geoLng,
          score: scoring?.totalScore ?? null,
          maxScore: scoring?.maxScore ?? null,
          percentage: scoring?.percentage ?? null,
          sectionScores: scoring
            ? (scoring.sectionScores as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull as unknown as Prisma.InputJsonValue,
        },
      });
    });

    return getSubmissionOrThrow(result.id);
  }

  // ── Get by ID ──

  static async getById(id: string) {
    return getSubmissionOrThrow(id);
  }

  // ── List with filters + pagination ──

  static async list(query: ListSubmissionsQuery) {
    const where: Prisma.ProgramSubmissionWhereInput = {};

    if (query.programId) where.programId = query.programId;
    if (query.storeId) where.storeId = query.storeId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;
    if (query.companyId) {
      where.program = { companyId: query.companyId };
    }
    if (query.from || query.to) {
      where.submittedAt = {};
      if (query.from) where.submittedAt.gte = new Date(query.from);
      if (query.to) where.submittedAt.lte = new Date(query.to);
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      prisma.programSubmission.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          program: { select: { id: true, name: true, type: true } },
          employee: { select: { id: true, name: true } },
          store: { select: { id: true, storeName: true, storeCode: true } },
        },
      }),
      prisma.programSubmission.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  // ── Sync offline submission (create + submit in one step) ──

  static async syncOffline(input: SyncOfflineInput) {
    // Verify program is ACTIVE
    const program = await prisma.program.findUnique({
      where: { id: input.programId },
      include: {
        sections: {
          include: { questions: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!program || program.status !== 'ACTIVE') {
      throw new SubmissionEngineError(
        'Program is not active',
        'PROGRAM_NOT_ACTIVE',
      );
    }

    // Validate
    const errors = validateResponses(
      program.sections,
      input.responses,
      input.responses,
    );
    if (errors.length > 0) {
      throw new SubmissionEngineError(
        `Validation failed: ${errors.join('; ')}`,
        'VALIDATION_FAILED',
      );
    }

    // Score
    const scoring = program.scoringEnabled
      ? calculateScore(program.sections, input.responses)
      : null;

    // Create submission + responses in transaction
    const result = await prisma.$transaction(async (tx) => {
      const sub = await tx.programSubmission.create({
        data: {
          programId: input.programId,
          employeeId: input.employeeId,
          storeId: input.storeId,
          status: 'SYNCED',
          geoLat: input.geoLat ?? null,
          geoLng: input.geoLng ?? null,
          isOffline: true,
          deviceId: input.deviceId,
          startedAt: new Date(input.startedAt),
          submittedAt: new Date(input.submittedAt),
          syncedAt: new Date(),
          score: scoring?.totalScore ?? null,
          maxScore: scoring?.maxScore ?? null,
          percentage: scoring?.percentage ?? null,
          sectionScores: scoring
            ? (scoring.sectionScores as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull as unknown as Prisma.InputJsonValue,
        },
      });

      const responseData = buildResponseData(sub.id, input.responses);
      if (scoring) {
        for (const rd of responseData) {
          const rs = scoring.responseScores.find(
            (s) => s.questionId === rd.questionId,
          );
          if (rs) {
            (rd as any).score = rs.score;
            (rd as any).maxScore = rs.maxScore;
          }
        }
      }

      if (responseData.length > 0) {
        await tx.programResponse.createMany({ data: responseData });
      }

      return sub;
    });

    return getSubmissionOrThrow(result.id);
  }

  // ── Review (mark as reviewed) ──

  static async review(submissionId: string, reviewedById: string) {
    const sub = await prisma.programSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!sub) throw new SubmissionEngineError('Submission not found', 'NOT_FOUND');
    if (sub.status !== 'SUBMITTED' && sub.status !== 'SYNCED') {
      throw new SubmissionEngineError(
        'Only submitted/synced submissions can be reviewed',
        'INVALID_STATUS',
      );
    }

    await prisma.programSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'REVIEWED',
        reviewedAt: new Date(),
        reviewedById,
      },
    });

    return getSubmissionOrThrow(submissionId);
  }

  // ── Archive ──

  static async archive(submissionId: string) {
    const sub = await prisma.programSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!sub) throw new SubmissionEngineError('Submission not found', 'NOT_FOUND');

    await prisma.programSubmission.update({
      where: { id: submissionId },
      data: { status: 'ARCHIVED' },
    });

    return getSubmissionOrThrow(submissionId);
  }
}
