// ──────────────────────────────────────────
// Submission Engine — barrel export
// ──────────────────────────────────────────

export { SubmissionService, SubmissionEngineError } from './submission.service.js';
export { calculateScore } from './scoring.js';
export type { SubmissionScore, SectionScore, ScoredResponse } from './scoring.js';
export {
  CreateSubmissionSchema,
  SaveDraftSchema,
  SubmitFinalSchema,
  SyncOfflineSchema,
  ListSubmissionsQuerySchema,
  ResponseInputSchema,
} from './validation.js';
export type {
  CreateSubmissionInput,
  SaveDraftInput,
  SubmitFinalInput,
  SyncOfflineInput,
  ListSubmissionsQuery,
  ResponseInput,
} from './validation.js';
