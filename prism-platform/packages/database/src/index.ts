// ──────────────────────────────────────────
// @prism/database — Public API
// ──────────────────────────────────────────

export { prisma } from './client.js';
export type { PrismaClient } from './client.js';

// Re-export Prisma namespace for JSON utilities (Prisma.JsonNull, Prisma.InputJsonValue, etc.)
export { Prisma } from '@prisma/client';

// Re-export all generated Prisma types for convenience
export {
  ProgramStatus,
  ProgramType,
  QuestionType,
  SubmissionStatus,
  TaskStatus,
  TaskPriority,
  NotificationChannel,
  NotificationStatus,
  StorageBucket,
} from '@prisma/client';

export type {
  Company,
  Region,
  Store,
  Role,
  Permission,
  RolePermission,
  Employee,
  Program,
  ProgramSection,
  ProgramQuestion,
  ProgramSubmission,
  ProgramResponse,
  Task,
  TaskComment,
  Notification,
  FileUpload,
} from '@prisma/client';
