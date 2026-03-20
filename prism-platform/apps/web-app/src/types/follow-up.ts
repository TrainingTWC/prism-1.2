// ──────────────────────────────────────────
// Follow-Up Checklist — Client-side types
// ──────────────────────────────────────────

export type FollowUpStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'CLOSED';

export type FollowUpItemStatus =
  | 'OPEN'
  | 'STORE_RESPONDED'
  | 'RCA_SUBMITTED'
  | 'CAPA_SUBMITTED'
  | 'RESOLVED'
  | 'VERIFIED';

// ── Follow-Up Item (individual failed question) ──

export interface FollowUpItemDetail {
  id: string;
  followUpId: string;
  originalQuestionId: string;
  originalResponseId: string;
  issueDescription: string;
  originalAnswer: string | null;
  storeResponse: string | null;
  rootCauseAnalysis: string | null;
  correctiveAction: string | null;
  preventiveAction: string | null;
  status: FollowUpItemStatus;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  verificationNotes: string | null;
  verifiedAt: string | null;
  verifiedById: string | null;
  evidenceUrls: string[];
  createdAt: string;
  updatedAt: string;
  originalQuestion: {
    id: string;
    text: string;
    questionType: string;
    sectionId: string;
  };
}

// ── Follow-Up (parent record) ──

export interface FollowUpDetail {
  id: string;
  companyId: string;
  originalSubmissionId: string;
  programId: string;
  storeId: string;
  assignedToId: string;
  createdById: string;
  status: FollowUpStatus;
  title: string;
  dueDate: string | null;
  completedAt: string | null;
  verifiedAt: string | null;
  verifiedById: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: FollowUpItemDetail[];
  store: { id: string; storeName: string; storeCode: string | null };
  assignedTo: { id: string; name: string; email: string };
  createdBy: { id: string; name: string };
  program: { id: string; name: string };
  originalSubmission: {
    id: string;
    submittedAt: string | null;
    score: number | null;
    percentage: number | null;
  };
}

// ── Input types for creating / updating ──

export interface CreateFollowUpInput {
  originalSubmissionId: string;
  programId: string;
  storeId: string;
  companyId: string;
  assignedToId: string;
  createdById: string;
  title: string;
  dueDate?: string;
  notes?: string;
  items: CreateFollowUpItemInput[];
}

export interface CreateFollowUpItemInput {
  originalQuestionId: string;
  originalResponseId: string;
  issueDescription: string;
  originalAnswer?: string;
}

export interface UpdateFollowUpItemInput {
  storeResponse?: string;
  rootCauseAnalysis?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  resolutionNotes?: string;
  verificationNotes?: string;
  evidenceUrls?: string[];
  status?: FollowUpItemStatus;
}

// ── Failed question detection ──

export interface FailedQuestion {
  questionId: string;
  responseId: string;
  questionText: string;
  questionType: string;
  sectionTitle: string;
  originalAnswer: string;
  issueDescription: string;
}
