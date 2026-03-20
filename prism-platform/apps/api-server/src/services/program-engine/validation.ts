// ──────────────────────────────────────────
// Zod validation schemas for the Program Engine
// ──────────────────────────────────────────

import { z } from 'zod';

// ── Enums ──

export const ProgramTypeEnum = z.enum([
  'QA_AUDIT',
  'TRAINING_ASSESSMENT',
  'CAMPUS_HIRING',
  'COMPLIANCE_INSPECTION',
  'OPERATIONAL_SURVEY',
  'COMPETITION_SCORING',
  'CUSTOM',
]);

export const ProgramStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);

export const QuestionTypeEnum = z.enum([
  'TEXT',
  'NUMBER',
  'YES_NO',
  'DROPDOWN',
  'MULTIPLE_CHOICE',
  'RATING_SCALE',
  'IMAGE_UPLOAD',
  'FILE_UPLOAD',
  'SIGNATURE',
]);

// ── Conditional Logic ──

export const ConditionalLogicSchema = z.object({
  dependsOn: z.string().uuid(),
  condition: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
  value: z.union([z.string(), z.number(), z.boolean()]),
}).nullable().optional();

// ── Rating Scale ──

export const RatingScaleSchema = z.object({
  min: z.number().int().min(0),
  max: z.number().int().max(100),
  labels: z.record(z.string(), z.string()).optional(),
}).nullable().optional();

// ── Scoring Config ──

export const ScoringConfigSchema = z.object({
  weightedSections: z.boolean().optional(),
  passingScore: z.number().min(0).optional(),
  maxScore: z.number().min(0).optional(),
  failOnCritical: z.boolean().optional(),
  scoreDisplay: z.enum(['percentage', 'points', 'grade']).optional(),
  timerDuration: z.number().int().min(0).optional(),
  proctoringEnabled: z.boolean().optional(),
}).optional();

// ── Question ──

export const CreateQuestionSchema = z.object({
  sectionId: z.string().uuid(),
  questionType: QuestionTypeEnum,
  text: z.string().min(1).max(2000),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0).optional(),
  weight: z.number().min(0).default(1.0),
  negativeWeight: z.number().optional(),
  correctAnswer: z.string().optional(),
  scoringEnabled: z.boolean().default(true),
  required: z.boolean().default(false),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  options: z.array(z.union([z.string(), z.record(z.string(), z.any())])).default([]),
  ratingScale: RatingScaleSchema,
  allowImages: z.boolean().default(false),
  allowAnnotation: z.boolean().default(false),
  allowComments: z.boolean().default(false),
  conditionalLogic: ConditionalLogicSchema,
  defaultValue: z.string().optional(),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial().omit({ sectionId: true });

export const ReorderQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1),
});

// ── Section ──

export const CreateSectionSchema = z.object({
  programId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0).optional(),
  weight: z.number().min(0).default(1.0),
  isCritical: z.boolean().default(false),
  maxScore: z.number().min(0).optional(),
});

export const UpdateSectionSchema = CreateSectionSchema.partial().omit({ programId: true });

export const ReorderSectionsSchema = z.object({
  sectionIds: z.array(z.string().uuid()).min(1),
});

// ── Program ──

export const CreateProgramSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  type: ProgramTypeEnum.default('CUSTOM'),
  department: z.string().max(100).optional(),
  scoringEnabled: z.boolean().default(true),
  offlineEnabled: z.boolean().default(false),
  imageUploadEnabled: z.boolean().default(true),
  geoLocationEnabled: z.boolean().default(false),
  signatureEnabled: z.boolean().default(false),
  scoringConfig: ScoringConfigSchema,
});

export const UpdateProgramSchema = CreateProgramSchema.partial().omit({ companyId: true });

export const ListProgramsQuerySchema = z.object({
  companyId: z.string().uuid(),
  status: ProgramStatusEnum.optional(),
  type: ProgramTypeEnum.optional(),
  department: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Inferred Types ──

export type CreateProgramInput = z.infer<typeof CreateProgramSchema>;
export type UpdateProgramInput = z.infer<typeof UpdateProgramSchema>;
export type ListProgramsQuery = z.infer<typeof ListProgramsQuerySchema>;
export type CreateSectionInput = z.infer<typeof CreateSectionSchema>;
export type UpdateSectionInput = z.infer<typeof UpdateSectionSchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;
