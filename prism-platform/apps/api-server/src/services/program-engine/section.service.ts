// ──────────────────────────────────────────
// SectionService — manage program sections
// ──────────────────────────────────────────

import { prisma } from '../../lib/prisma.js';
import { ProgramEngineError } from './program.service.js';
import type { CreateSectionInput, UpdateSectionInput } from './validation.js';

export class SectionService {
  // ── List sections for a program ──

  async listByProgram(programId: string) {
    return prisma.programSection.findMany({
      where: { programId },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });
  }

  // ── Get section by ID ──

  async getById(id: string) {
    return prisma.programSection.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
    });
  }

  // ── Create section ──

  async create(input: CreateSectionInput) {
    await this.assertProgramDraft(input.programId);

    // Auto-calculate order if not provided
    const order = input.order ?? await this.getNextOrder(input.programId);

    return prisma.programSection.create({
      data: {
        programId: input.programId,
        title: input.title,
        description: input.description,
        order,
        weight: input.weight,
      },
      include: {
        questions: true,
      },
    });
  }

  // ── Update section ──

  async update(id: string, input: UpdateSectionInput) {
    const section = await prisma.programSection.findUnique({
      where: { id },
      select: { id: true, programId: true },
    });
    if (!section) return null;

    await this.assertProgramDraft(section.programId);

    return prisma.programSection.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.order !== undefined && { order: input.order }),
        ...(input.weight !== undefined && { weight: input.weight }),
      },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
    });
  }

  // ── Delete section (cascades questions) ──

  async delete(id: string) {
    const section = await prisma.programSection.findUnique({
      where: { id },
      select: { id: true, programId: true },
    });
    if (!section) return null;

    await this.assertProgramDraft(section.programId);
    await prisma.programSection.delete({ where: { id } });
    return true;
  }

  // ── Reorder sections ──

  async reorder(programId: string, sectionIds: string[]) {
    await this.assertProgramDraft(programId);

    await prisma.$transaction(
      sectionIds.map((id, index) =>
        prisma.programSection.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return this.listByProgram(programId);
  }

  // ── Helpers ──

  private async getNextOrder(programId: string): Promise<number> {
    const last = await prisma.programSection.findFirst({
      where: { programId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }

  private async assertProgramDraft(programId: string) {
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { status: true },
    });

    if (!program) {
      throw new ProgramEngineError('PROGRAM_NOT_FOUND', 'Program not found.');
    }

    if (program.status !== 'DRAFT') {
      throw new ProgramEngineError(
        'CANNOT_EDIT_ACTIVE',
        'Sections can only be modified on DRAFT programs.'
      );
    }
  }
}

export const sectionService = new SectionService();
