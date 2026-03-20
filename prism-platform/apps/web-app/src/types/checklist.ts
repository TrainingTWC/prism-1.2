// ──────────────────────────────────────────
// Checklist & Submission — Client-side types
// ──────────────────────────────────────────

export type QuestionType =
  | 'TEXT'
  | 'NUMBER'
  | 'YES_NO'
  | 'DROPDOWN'
  | 'MULTIPLE_CHOICE'
  | 'RATING_SCALE'
  | 'IMAGE_UPLOAD'
  | 'FILE_UPLOAD'
  | 'SIGNATURE';

export type ProgramType =
  | 'QA_AUDIT'
  | 'TRAINING_ASSESSMENT'
  | 'CAMPUS_HIRING'
  | 'COMPLIANCE_INSPECTION'
  | 'OPERATIONAL_SURVEY'
  | 'COMPETITION_SCORING'
  | 'CUSTOM';

export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'SYNCED' | 'REVIEWED' | 'ARCHIVED';

export interface ScoringConfig {
  weightedSections?: boolean;
  passingScore?: number;
  maxScore?: number;
  failOnCritical?: boolean;
  scoreDisplay?: 'percentage' | 'points' | 'grade';
}

export interface QuestionOption {
  label: string;
  value: string;
  score?: number;
}

export interface RatingScaleConfig {
  min: number;
  max: number;
  step?: number;
  labels?: Record<string, string>;
}

export interface ConditionalLogic {
  dependsOn: string;
  showWhen: 'equals' | 'not_equals';
  value: string;
}

export interface ProgramQuestion {
  id: string;
  sectionId: string;
  questionType: QuestionType;
  text: string;
  description: string | null;
  order: number;
  weight: number;
  scoringEnabled: boolean;
  required: boolean;
  minValue: number | null;
  maxValue: number | null;
  minLength: number | null;
  maxLength: number | null;
  options: QuestionOption[];
  ratingScale: RatingScaleConfig | null;
  allowImages: boolean;
  allowAnnotation: boolean;
  allowComments: boolean;
  conditionalLogic: ConditionalLogic | null;
  defaultValue: string | null;
}

export interface ProgramSection {
  id: string;
  programId: string;
  title: string;
  description: string | null;
  order: number;
  weight: number;
  questions: ProgramQuestion[];
}

export interface ProgramDetail {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  version: number;
  scoringEnabled: boolean;
  offlineEnabled: boolean;
  imageUploadEnabled: boolean;
  geoLocationEnabled: boolean;
  signatureEnabled: boolean;
  sections: ProgramSection[];
}

export interface ResponseInput {
  questionId: string;
  answer?: string;
  numericValue?: number;
  booleanValue?: boolean;
  selectedOptions?: string[];
  imageUrl?: string;
  imageUrls?: string[];
  fileUrl?: string;
  signatureUrl?: string;
  annotation?: { shapes?: unknown[]; notes?: string };
  comment?: string;
  geoLat?: number;
  geoLng?: number;
}

export interface SectionScore {
  sectionId: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  weight: number;
}

export interface ProgramSubmissionDetail {
  id: string;
  programId: string;
  employeeId: string;
  storeId: string;
  status: SubmissionStatus;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  geoLat: number | null;
  geoLng: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  isOffline: boolean;
  deviceId: string | null;
  sectionScores: SectionScore[];
  program: ProgramDetail;
  responses: ProgramResponseDetail[];
  employee: { id: string; name: string; email: string };
  store: { id: string; storeName: string; storeCode: string | null };
}

export interface ProgramResponseDetail {
  id: string;
  submissionId: string;
  questionId: string;
  answer: string | null;
  numericValue: number | null;
  booleanValue: boolean | null;
  selectedOptions: string[] | null;
  imageUrl: string | null;
  fileUrl: string | null;
  signatureUrl: string | null;
  annotation: unknown | null;
  comment: string | null;
  geoLat: number | null;
  geoLng: number | null;
  score: number | null;
  maxScore: number | null;
}

// ── Offline draft shape (IndexedDB) ──

export interface OfflineDraft {
  id: string; // local UUID
  programId: string;
  employeeId: string;
  storeId: string;
  responses: ResponseInput[];
  geoLat?: number;
  geoLng?: number;
  deviceId: string;
  startedAt: string;
  updatedAt: string;
  synced: boolean;
}
