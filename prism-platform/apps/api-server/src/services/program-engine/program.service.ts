// ──────────────────────────────────────────
// ProgramService — CRUD, versioning, lifecycle
// ──────────────────────────────────────────

import { prisma, Prisma } from '../../lib/prisma.js';
import type { CreateProgramInput, UpdateProgramInput, ListProgramsQuery } from './validation.js';

export class ProgramService {
  // ── List programs (paginated, filterable) ──

  async list(query: ListProgramsQuery) {
    const { companyId, status, type, department, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;
    if (type) where.type = type;
    if (department) where.department = department;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      prisma.program.findMany({
        where,
        include: {
          sections: {
            select: { id: true, title: true, order: true, weight: true },
            orderBy: { order: 'asc' },
          },
          _count: { select: { submissions: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.program.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Get single program with full tree ──

  async getById(id: string) {
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!program) return null;
    return program;
  }

  // ── Create program (always starts as DRAFT) ──

  async create(input: CreateProgramInput) {
    return prisma.program.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        type: input.type,
        department: input.department,
        status: 'DRAFT',
        version: 1,
        scoringEnabled: input.scoringEnabled,
        offlineEnabled: input.offlineEnabled,
        imageUploadEnabled: input.imageUploadEnabled,
        geoLocationEnabled: input.geoLocationEnabled,
        signatureEnabled: input.signatureEnabled,
        scoringConfig: input.scoringConfig ?? {},
      },
      include: {
        sections: true,
      },
    });
  }

  // ── Update program (only DRAFT programs can be edited) ──

  async update(id: string, input: UpdateProgramInput) {
    const existing = await prisma.program.findUnique({ where: { id } });
    if (!existing) return null;

    if (existing.status !== 'DRAFT') {
      throw new ProgramEngineError(
        'CANNOT_EDIT_ACTIVE',
        'Only DRAFT programs can be edited. Create a new version to modify an active program.'
      );
    }

    return prisma.program.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.department !== undefined && { department: input.department }),
        ...(input.scoringEnabled !== undefined && { scoringEnabled: input.scoringEnabled }),
        ...(input.offlineEnabled !== undefined && { offlineEnabled: input.offlineEnabled }),
        ...(input.imageUploadEnabled !== undefined && { imageUploadEnabled: input.imageUploadEnabled }),
        ...(input.geoLocationEnabled !== undefined && { geoLocationEnabled: input.geoLocationEnabled }),
        ...(input.signatureEnabled !== undefined && { signatureEnabled: input.signatureEnabled }),
        ...(input.scoringConfig !== undefined && { scoringConfig: input.scoringConfig }),
      },
      include: {
        sections: {
          include: { questions: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  // ── Delete program (only DRAFT, or if no submissions) ──

  async delete(id: string) {
    const existing = await prisma.program.findUnique({
      where: { id },
      include: { _count: { select: { submissions: true } } },
    });

    if (!existing) return null;

    if (existing._count.submissions > 0) {
      throw new ProgramEngineError(
        'HAS_SUBMISSIONS',
        'Cannot delete a program that has submissions. Archive it instead.'
      );
    }

    await prisma.program.delete({ where: { id } });
    return true;
  }

  // ── Activate program (DRAFT → ACTIVE) ──

  async activate(id: string) {
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        sections: { include: { questions: true } },
      },
    });

    if (!program) return null;

    if (program.status !== 'DRAFT') {
      throw new ProgramEngineError(
        'INVALID_STATUS_TRANSITION',
        `Cannot activate a program with status "${program.status}". Only DRAFT programs can be activated.`
      );
    }

    // Validate program has at least one section with at least one question
    if (program.sections.length === 0) {
      throw new ProgramEngineError(
        'NO_SECTIONS',
        'Program must have at least one section before activation.'
      );
    }

    const hasQuestions = program.sections.some((s) => s.questions.length > 0);
    if (!hasQuestions) {
      throw new ProgramEngineError(
        'NO_QUESTIONS',
        'Program must have at least one question in any section before activation.'
      );
    }

    // Archive any currently active version (if this is a versioned program)
    if (program.parentId) {
      await prisma.program.updateMany({
        where: {
          parentId: program.parentId,
          status: 'ACTIVE',
          id: { not: id },
        },
        data: { status: 'ARCHIVED' },
      });
    }

    return prisma.program.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: { sections: { include: { questions: true }, orderBy: { order: 'asc' } } },
    });
  }

  // ── Archive program (ACTIVE → ARCHIVED) ──

  async archive(id: string) {
    const program = await prisma.program.findUnique({ where: { id } });
    if (!program) return null;

    if (program.status !== 'ACTIVE') {
      throw new ProgramEngineError(
        'INVALID_STATUS_TRANSITION',
        `Cannot archive a program with status "${program.status}". Only ACTIVE programs can be archived.`
      );
    }

    return prisma.program.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  // ── Create new version (deep-clone an existing program as DRAFT) ──

  async createVersion(sourceId: string) {
    const source = await prisma.program.findUnique({
      where: { id: sourceId },
      include: {
        sections: {
          include: { questions: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!source) return null;

    const parentId = source.parentId ?? source.id;

    // Count existing versions
    const versionCount = await prisma.program.count({
      where: { OR: [{ id: parentId }, { parentId }] },
    });

    // Create the new program version with deep-cloned sections & questions
    return prisma.$transaction(async (tx) => {
      const newProgram = await tx.program.create({
        data: {
          companyId: source.companyId,
          name: source.name,
          description: source.description,
          type: source.type,
          department: source.department,
          status: 'DRAFT',
          version: versionCount + 1,
          parentId,
          scoringEnabled: source.scoringEnabled,
          offlineEnabled: source.offlineEnabled,
          imageUploadEnabled: source.imageUploadEnabled,
          geoLocationEnabled: source.geoLocationEnabled,
          signatureEnabled: source.signatureEnabled,
          scoringConfig: source.scoringConfig ?? {},
        },
      });

      // Clone sections and questions
      for (const section of source.sections) {
        const newSection = await tx.programSection.create({
          data: {
            programId: newProgram.id,
            title: section.title,
            description: section.description,
            order: section.order,
            weight: section.weight,
          },
        });

        if (section.questions.length > 0) {
          await tx.programQuestion.createMany({
            data: section.questions.map((q) => ({
              sectionId: newSection.id,
              questionType: q.questionType,
              text: q.text,
              description: q.description,
              order: q.order,
              weight: q.weight,
              scoringEnabled: q.scoringEnabled,
              required: q.required,
              minValue: q.minValue,
              maxValue: q.maxValue,
              minLength: q.minLength,
              maxLength: q.maxLength,
              options: (q.options ?? []) as Prisma.InputJsonValue,
              ratingScale: (q.ratingScale ?? Prisma.JsonNull) as Prisma.InputJsonValue,
              allowImages: q.allowImages,
              allowAnnotation: q.allowAnnotation,
              allowComments: q.allowComments,
              conditionalLogic: (q.conditionalLogic ?? Prisma.JsonNull) as Prisma.InputJsonValue,
              defaultValue: q.defaultValue,
            })),
          });
        }
      }

      // Return the full new version
      return tx.program.findUnique({
        where: { id: newProgram.id },
        include: {
          sections: {
            include: { questions: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  }

  // ── List versions of a program ──

  async listVersions(programId: string) {
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) return null;

    const parentId = program.parentId ?? program.id;

    return prisma.program.findMany({
      where: {
        OR: [{ id: parentId }, { parentId }],
      },
      select: {
        id: true,
        version: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { version: 'desc' },
    });
  }
}

// ── Error class for business rule violations ──

export class ProgramEngineError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ProgramEngineError';
  }
}

export const programService = new ProgramService();
