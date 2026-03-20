// ──────────────────────────────────────────
// QuestionService — manage program questions
// ──────────────────────────────────────────

import { prisma, Prisma } from '../../lib/prisma.js';
import { ProgramEngineError } from './program.service.js';
import type { CreateQuestionInput, UpdateQuestionInput } from './validation.js';

export class QuestionService {
  // ── List questions for a section ──

  async listBySection(sectionId: string) {
    return prisma.programQuestion.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
    });
  }

  // ── Get question by ID ──

  async getById(id: string) {
    return prisma.programQuestion.findUnique({
      where: { id },
    });
  }

  // ── Create question ──

  async create(input: CreateQuestionInput) {
    await this.assertSectionDraft(input.sectionId);

    // Auto-calculate order if not provided
    const order = input.order ?? await this.getNextOrder(input.sectionId);

    // Validate question-type-specific constraints
    this.validateQuestionTypeConstraints(input);

    return prisma.programQuestion.create({
      data: {
        sectionId: input.sectionId,
        questionType: input.questionType,
        text: input.text,
        description: input.description,
        order,
        weight: input.weight,
        scoringEnabled: input.scoringEnabled,
        required: input.required,
        minValue: input.minValue,
        maxValue: input.maxValue,
        minLength: input.minLength,
        maxLength: input.maxLength,
        options: input.options,
        ratingScale: input.ratingScale ?? undefined,
        allowImages: input.allowImages,
        allowAnnotation: input.allowAnnotation,
        allowComments: input.allowComments,
        conditionalLogic: input.conditionalLogic ?? undefined,
        defaultValue: input.defaultValue,
      },
    });
  }

  // ── Update question ──

  async update(id: string, input: UpdateQuestionInput) {
    const question = await prisma.programQuestion.findUnique({
      where: { id },
      select: { id: true, sectionId: true },
    });
    if (!question) return null;

    await this.assertSectionDraft(question.sectionId);

    if (input.questionType) {
      this.validateQuestionTypeConstraints({ ...input, questionType: input.questionType } as CreateQuestionInput);
    }

    return prisma.programQuestion.update({
      where: { id },
      data: {
        ...(input.questionType !== undefined && { questionType: input.questionType }),
        ...(input.text !== undefined && { text: input.text }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.order !== undefined && { order: input.order }),
        ...(input.weight !== undefined && { weight: input.weight }),
        ...(input.scoringEnabled !== undefined && { scoringEnabled: input.scoringEnabled }),
        ...(input.required !== undefined && { required: input.required }),
        ...(input.minValue !== undefined && { minValue: input.minValue }),
        ...(input.maxValue !== undefined && { maxValue: input.maxValue }),
        ...(input.minLength !== undefined && { minLength: input.minLength }),
        ...(input.maxLength !== undefined && { maxLength: input.maxLength }),
        ...(input.options !== undefined && { options: input.options }),
        ...(input.ratingScale !== undefined && { ratingScale: (input.ratingScale ?? Prisma.JsonNull) as Prisma.InputJsonValue }),
        ...(input.allowImages !== undefined && { allowImages: input.allowImages }),
        ...(input.allowAnnotation !== undefined && { allowAnnotation: input.allowAnnotation }),
        ...(input.allowComments !== undefined && { allowComments: input.allowComments }),
        ...(input.conditionalLogic !== undefined && { conditionalLogic: (input.conditionalLogic ?? Prisma.JsonNull) as Prisma.InputJsonValue }),
        ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue }),
      },
    });
  }

  // ── Delete question ──

  async delete(id: string) {
    const question = await prisma.programQuestion.findUnique({
      where: { id },
      select: { id: true, sectionId: true },
    });
    if (!question) return null;

    await this.assertSectionDraft(question.sectionId);
    await prisma.programQuestion.delete({ where: { id } });
    return true;
  }

  // ── Reorder questions within a section ──

  async reorder(sectionId: string, questionIds: string[]) {
    await this.assertSectionDraft(sectionId);

    await prisma.$transaction(
      questionIds.map((id, index) =>
        prisma.programQuestion.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return this.listBySection(sectionId);
  }

  // ── Duplicate question ──

  async duplicate(id: string) {
    const source = await prisma.programQuestion.findUnique({ where: { id } });
    if (!source) return null;

    await this.assertSectionDraft(source.sectionId);
    const nextOrder = await this.getNextOrder(source.sectionId);

    return prisma.programQuestion.create({
      data: {
        sectionId: source.sectionId,
        questionType: source.questionType,
        text: `${source.text} (copy)`,
        description: source.description,
        order: nextOrder,
        weight: source.weight,
        scoringEnabled: source.scoringEnabled,
        required: source.required,
        minValue: source.minValue,
        maxValue: source.maxValue,
        minLength: source.minLength,
        maxLength: source.maxLength,
        options: (source.options ?? []) as Prisma.InputJsonValue,
        ratingScale: (source.ratingScale ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        allowImages: source.allowImages,
        allowAnnotation: source.allowAnnotation,
        allowComments: source.allowComments,
        conditionalLogic: (source.conditionalLogic ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        defaultValue: source.defaultValue,
      },
    });
  }

  // ── Validate question type constraints ──

  private validateQuestionTypeConstraints(input: CreateQuestionInput) {
    const { questionType, options, ratingScale } = input;

    // DROPDOWN and MULTIPLE_CHOICE require options
    if ((questionType === 'DROPDOWN' || questionType === 'MULTIPLE_CHOICE') && (!options || options.length < 2)) {
      throw new ProgramEngineError(
        'INVALID_OPTIONS',
        `${questionType} questions must have at least 2 options.`
      );
    }

    // RATING_SCALE requires ratingScale config
    if (questionType === 'RATING_SCALE' && !ratingScale) {
      throw new ProgramEngineError(
        'MISSING_RATING_SCALE',
        'RATING_SCALE questions must include a ratingScale configuration with min and max.'
      );
    }

    // NUMBER can have min/max validation
    if (questionType === 'NUMBER' && input.minValue != null && input.maxValue != null) {
      if (input.minValue > input.maxValue) {
        throw new ProgramEngineError(
          'INVALID_RANGE',
          'minValue cannot be greater than maxValue.'
        );
      }
    }

    // TEXT can have length validation
    if (questionType === 'TEXT' && input.minLength != null && input.maxLength != null) {
      if (input.minLength > input.maxLength) {
        throw new ProgramEngineError(
          'INVALID_RANGE',
          'minLength cannot be greater than maxLength.'
        );
      }
    }
  }

  // ── Helpers ──

  private async getNextOrder(sectionId: string): Promise<number> {
    const last = await prisma.programQuestion.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }

  private async assertSectionDraft(sectionId: string) {
    const section = await prisma.programSection.findUnique({
      where: { id: sectionId },
      select: {
        program: {
          select: { status: true },
        },
      },
    });

    if (!section) {
      throw new ProgramEngineError('SECTION_NOT_FOUND', 'Section not found.');
    }

    if (section.program.status !== 'DRAFT') {
      throw new ProgramEngineError(
        'CANNOT_EDIT_ACTIVE',
        'Questions can only be modified on DRAFT programs.'
      );
    }
  }
}

export const questionService = new QuestionService();
