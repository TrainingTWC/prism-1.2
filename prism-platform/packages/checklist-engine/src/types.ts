// ──────────────────────────────────────────
// Checklist Engine Types
// ──────────────────────────────────────────

export type QuestionType =
  | 'text'
  | 'number'
  | 'yes_no'
  | 'dropdown'
  | 'multiple_choice'
  | 'image_upload'
  | 'file_upload'
  | 'rating_scale'
  | 'signature';

export interface Question {
  id: string;
  sectionId: string;
  type: QuestionType;
  text: string;
  weight: number;
  required: boolean;
  options?: string[];
  conditionalLogic?: ConditionalLogic;
  ratingScale?: { min: number; max: number };
}

export interface ConditionalLogic {
  dependsOn: string; // question ID
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  questions: Question[];
}

export interface ChecklistDefinition {
  id: string;
  programId: string;
  name: string;
  sections: Section[];
}

export interface ChecklistResponse {
  questionId: string;
  answer: string | number | boolean | string[];
  imageUrl?: string;
  geoLat?: number;
  geoLng?: number;
  timestamp: string;
}

export interface ChecklistSubmission {
  id: string;
  programId: string;
  employeeId: string;
  storeId: string;
  responses: ChecklistResponse[];
  submittedAt: string;
  syncedAt?: string;
  isOffline: boolean;
}

export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  sectionScores: {
    sectionId: string;
    score: number;
    maxScore: number;
  }[];
}

export interface ValidationResult {
  valid: boolean;
  errors: {
    questionId: string;
    message: string;
  }[];
}
