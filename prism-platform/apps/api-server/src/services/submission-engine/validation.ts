// ──────────────────────────────────────────
// Submission Engine — Zod validation schemas
// ──────────────────────────────────────────

import { z } from 'zod';

// ── Response input (one per question) ──

export const ResponseInputSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().optional(),
  numericValue: z.number().optional(),
  booleanValue: z.boolean().optional(),
  selectedOptions: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  signatureUrl: z.string().url().optional(),
  annotation: z
    .object({
      shapes: z.array(z.unknown()).optional(),
      notes: z.string().optional(),
    })
    .optional(),
  comment: z.string().max(2000).optional(),
  geoLat: z.number().min(-90).max(90).optional(),
  geoLng: z.number().min(-180).max(180).optional(),
});

export type ResponseInput = z.infer<typeof ResponseInputSchema>;

// ── Create submission (start) ──

export const CreateSubmissionSchema = z.object({
  programId: z.string().uuid(),
  employeeId: z.string().uuid(),
  storeId: z.string().uuid(),
  geoLat: z.number().min(-90).max(90).optional(),
  geoLng: z.number().min(-180).max(180).optional(),
  isOffline: z.boolean().default(false),
  deviceId: z.string().max(100).optional(),
});

export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>;

// ── Save draft (partial responses) ──

export const SaveDraftSchema = z.object({
  responses: z.array(ResponseInputSchema),
  geoLat: z.number().min(-90).max(90).optional(),
  geoLng: z.number().min(-180).max(180).optional(),
});

export type SaveDraftInput = z.infer<typeof SaveDraftSchema>;

// ── Submit (final — triggers scoring & validation) ──

export const SubmitFinalSchema = z.object({
  responses: z.array(ResponseInputSchema),
  geoLat: z.number().min(-90).max(90).optional(),
  geoLng: z.number().min(-180).max(180).optional(),
});

export type SubmitFinalInput = z.infer<typeof SubmitFinalSchema>;

// ── Sync offline submission ──

export const SyncOfflineSchema = z.object({
  programId: z.string().uuid(),
  employeeId: z.string().uuid(),
  storeId: z.string().uuid(),
  responses: z.array(ResponseInputSchema),
  geoLat: z.number().min(-90).max(90).optional(),
  geoLng: z.number().min(-180).max(180).optional(),
  deviceId: z.string().max(100),
  startedAt: z.string().datetime(),
  submittedAt: z.string().datetime(),
});

export type SyncOfflineInput = z.infer<typeof SyncOfflineSchema>;

// ── List query ──

export const ListSubmissionsQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'SYNCED', 'REVIEWED', 'ARCHIVED']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListSubmissionsQuery = z.infer<typeof ListSubmissionsQuerySchema>;
