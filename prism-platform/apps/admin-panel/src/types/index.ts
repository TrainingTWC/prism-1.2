// ──────────────────────────────────────────
// Prism Admin Panel — Shared Types
// ──────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  logo: string | null;
  createdAt: string;
}

export interface Store {
  id: string;
  companyId: string;
  storeName: string;
  region: string;
  city: string;
}

export interface Employee {
  id: string;
  companyId: string;
  empId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  storeId: string | null;
  managerId: string | null;
  trainerId: string | null;
  roleId: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

// ── Program Engine Types ──

export type ProgramType =
  | 'QA_AUDIT'
  | 'TRAINING_ASSESSMENT'
  | 'CAMPUS_HIRING'
  | 'COMPLIANCE_INSPECTION'
  | 'OPERATIONAL_SURVEY'
  | 'COMPETITION_SCORING'
  | 'CUSTOM';

export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

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

export interface ScoringConfig {
  weightedSections?: boolean;
  passingScore?: number;
  maxScore?: number;
  failOnCritical?: boolean;
  scoreDisplay?: 'percentage' | 'points' | 'grade';
}

export interface ConditionalLogic {
  dependsOn: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface ProgramQuestion {
  id: string;
  sectionId: string;
  questionType: QuestionType;
  text: string;
  description?: string | null;
  order: number;
  weight: number;
  scoringEnabled: boolean;
  required: boolean;
  minValue?: number | null;
  maxValue?: number | null;
  minLength?: number | null;
  maxLength?: number | null;
  options: string[];
  ratingScale?: { min: number; max: number; labels?: Record<string, string> } | null;
  allowImages: boolean;
  allowAnnotation: boolean;
  allowComments: boolean;
  conditionalLogic?: ConditionalLogic | null;
  defaultValue?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramSection {
  id: string;
  programId: string;
  title: string;
  description?: string | null;
  order: number;
  weight: number;
  questions: ProgramQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  type: ProgramType;
  department?: string | null;
  status: ProgramStatus;
  version: number;
  parentId?: string | null;
  scoringEnabled: boolean;
  offlineEnabled: boolean;
  imageUploadEnabled: boolean;
  geoLocationEnabled: boolean;
  signatureEnabled: boolean;
  scoringConfig?: ScoringConfig | null;
  sections: ProgramSection[];
  _count?: { submissions: number };
  createdAt: string;
  updatedAt: string;
}

export interface ProgramListItem {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  type: ProgramType;
  department?: string | null;
  status: ProgramStatus;
  version: number;
  scoringEnabled: boolean;
  offlineEnabled: boolean;
  imageUploadEnabled: boolean;
  geoLocationEnabled: boolean;
  signatureEnabled: boolean;
  sections: { id: string; title: string; _count: { questions: number } }[];
  _count?: { submissions: number };
  createdAt: string;
  updatedAt: string;
}

export interface ProgramListResponse {
  data: ProgramListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProgramVersion {
  id: string;
  version: number;
  status: ProgramStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Form input types for creating / updating ──

export interface CreateProgramInput {
  companyId: string;
  name: string;
  description?: string;
  type?: ProgramType;
  department?: string;
  scoringEnabled?: boolean;
  offlineEnabled?: boolean;
  imageUploadEnabled?: boolean;
  geoLocationEnabled?: boolean;
  signatureEnabled?: boolean;
  scoringConfig?: ScoringConfig;
}

export interface CreateSectionInput {
  title: string;
  description?: string;
  order?: number;
  weight?: number;
}

export interface CreateQuestionInput {
  questionType: QuestionType;
  text: string;
  description?: string;
  order?: number;
  weight?: number;
  scoringEnabled?: boolean;
  required?: boolean;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  options?: string[];
  ratingScale?: { min: number; max: number; labels?: Record<string, string> } | null;
  allowImages?: boolean;
  allowAnnotation?: boolean;
  allowComments?: boolean;
  conditionalLogic?: ConditionalLogic | null;
  defaultValue?: string;
}
