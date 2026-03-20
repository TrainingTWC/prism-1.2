// ──────────────────────────────────────────
// Entity Intelligence Types
// ──────────────────────────────────────────

import type { TrendDataPoint } from '@prism/analytics-engine';

export type EntityType = 'store' | 'manager' | 'region' | 'employee' | 'program';

export interface IntelligencePageData {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  healthScore: number;
  performanceTrends: TrendDataPoint[];
  recentSubmissions: SubmissionSummary[];
  openTasks: TaskSummary[];
  recurringIssues: IssueSummary[];
}

export interface StoreIntelligence extends IntelligencePageData {
  entityType: 'store';
  programBreakdown: ProgramBreakdownItem[];
  region: string;
  city: string;
}

export interface ManagerIntelligence extends IntelligencePageData {
  entityType: 'manager';
  managedStores: string[];
  teamSize: number;
}

export interface RegionIntelligence extends IntelligencePageData {
  entityType: 'region';
  storeCount: number;
  topPerformingStores: string[];
  bottomPerformingStores: string[];
}

export interface EmployeeIntelligence extends IntelligencePageData {
  entityType: 'employee';
  department: string;
  designation: string;
  submissionCount: number;
}

export interface ProgramIntelligence extends IntelligencePageData {
  entityType: 'program';
  totalSubmissions: number;
  averageScore: number;
  completionRate: number;
  storeBreakdown: { storeId: string; storeName: string; avgScore: number }[];
}

// Supporting types

interface SubmissionSummary {
  id: string;
  programName: string;
  score: number;
  submittedAt: string;
}

interface TaskSummary {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
}

interface IssueSummary {
  questionText: string;
  frequency: number;
  lastOccurrence: string;
}

interface ProgramBreakdownItem {
  programId: string;
  programName: string;
  submissionCount: number;
  averageScore: number;
}
