// ──────────────────────────────────────────
// Program Engine Types
// ──────────────────────────────────────────

import type { QuestionType, ConditionalLogic } from '@prism/checklist-engine';

export type ProgramStatus = 'draft' | 'active' | 'archived';

export type ProgramType =
  | 'qa_audit'
  | 'training_assessment'
  | 'campus_hiring'
  | 'compliance_inspection'
  | 'operational_survey'
  | 'competition_scoring'
  | 'custom';

export interface ProgramDefinition {
  id: string;
  companyId: string;
  name: string;
  type: ProgramType;
  department: string;
  status: ProgramStatus;
  sections: SectionDefinition[];
  scoringConfig: ScoringConfig;
  createdAt: string;
  updatedAt: string;
}

export interface SectionDefinition {
  id: string;
  title: string;
  order: number;
  questions: QuestionDefinition[];
}

export interface QuestionDefinition {
  id: string;
  type: QuestionType;
  text: string;
  weight: number;
  required: boolean;
  options?: string[];
  conditionalLogic?: ConditionalLogic;
  ratingScale?: { min: number; max: number };
}

export interface ScoringConfig {
  enabled: boolean;
  maxScore: number;
  passingScore?: number;
  weightedSections: boolean;
}

export interface ProgramValidation {
  valid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
}
