'use client';

import React, { useState } from 'react';
import { FollowUpRenderer } from '../../../components/follow-up';
import type { FollowUpDetail } from '../../../types/follow-up';

// ──────────────────────────────────────────
// Follow-Up Detail Page
// ──────────────────────────────────────────
// Renders the full follow-up checklist for an individual
// follow-up. In production this would fetch via params.id.

// Mock data for demonstration
const mockFollowUp: FollowUpDetail = {
  id: 'fu-001',
  companyId: 'c-1',
  originalSubmissionId: 'sub-001',
  programId: 'prog-001',
  storeId: 'st-001',
  assignedToId: 'emp-002',
  createdById: 'emp-001',
  status: 'OPEN',
  title: 'Follow-Up: Daily Store Opening — Downtown Flagship',
  dueDate: '2026-03-20',
  completedAt: null,
  verifiedAt: null,
  verifiedById: null,
  notes: null,
  createdAt: '2026-03-13T10:30:00Z',
  updatedAt: '2026-03-13T10:30:00Z',
  items: [
    {
      id: 'fi-001',
      followUpId: 'fu-001',
      originalQuestionId: 'q-001',
      originalResponseId: 'r-001',
      issueDescription: '[Safety & Operations] "Floor cleanliness - free of debris/liquid?" — Response: No',
      originalAnswer: 'No',
      storeResponse: null,
      rootCauseAnalysis: null,
      correctiveAction: null,
      preventiveAction: null,
      status: 'OPEN',
      resolutionNotes: null,
      resolvedAt: null,
      verificationNotes: null,
      verifiedAt: null,
      verifiedById: null,
      evidenceUrls: [],
      createdAt: '2026-03-13T10:30:00Z',
      updatedAt: '2026-03-13T10:30:00Z',
      originalQuestion: {
        id: 'q-001',
        text: 'Floor cleanliness - free of debris/liquid?',
        questionType: 'YES_NO',
        sectionId: 's-001',
      },
    },
    {
      id: 'fi-002',
      followUpId: 'fu-001',
      originalQuestionId: 'q-002',
      originalResponseId: 'r-002',
      issueDescription: '[Safety & Operations] "Primary register area (cash drawer) secured?" — Response: No',
      originalAnswer: 'No',
      storeResponse: 'Cash drawer hinge was broken during morning rush',
      rootCauseAnalysis: 'Worn out hinge mechanism due to heavy daily usage and lack of preventive maintenance schedule',
      correctiveAction: null,
      preventiveAction: null,
      status: 'RCA_SUBMITTED',
      resolutionNotes: null,
      resolvedAt: null,
      verificationNotes: null,
      verifiedAt: null,
      verifiedById: null,
      evidenceUrls: [],
      createdAt: '2026-03-13T10:30:00Z',
      updatedAt: '2026-03-13T11:00:00Z',
      originalQuestion: {
        id: 'q-002',
        text: 'Primary register area (cash drawer) secured?',
        questionType: 'YES_NO',
        sectionId: 's-001',
      },
    },
    {
      id: 'fi-003',
      followUpId: 'fu-001',
      originalQuestionId: 'q-003',
      originalResponseId: 'r-003',
      issueDescription: '[Brand Standards] "Associate appearance meets brand standards?" — Response: 3/10',
      originalAnswer: '3',
      storeResponse: 'New hires had not received uniform allocation',
      rootCauseAnalysis: 'Onboarding delay — uniforms ordered but not yet delivered',
      correctiveAction: 'Expedited uniform order, temporary branded lanyards issued',
      preventiveAction: 'Added uniform pre-order to hiring checklist, 7-day buffer before start',
      status: 'CAPA_SUBMITTED',
      resolutionNotes: null,
      resolvedAt: null,
      verificationNotes: null,
      verifiedAt: null,
      verifiedById: null,
      evidenceUrls: [],
      createdAt: '2026-03-13T10:30:00Z',
      updatedAt: '2026-03-13T14:00:00Z',
      originalQuestion: {
        id: 'q-003',
        text: 'Associate appearance meets brand standards?',
        questionType: 'RATING_SCALE',
        sectionId: 's-002',
      },
    },
  ],
  store: { id: 'st-001', storeName: 'Downtown Flagship', storeCode: 'S-001' },
  assignedTo: { id: 'emp-002', name: 'Sarah Chen', email: 'sarah@prism.com' },
  createdBy: { id: 'emp-001', name: 'John Doe' },
  program: { id: 'prog-001', name: 'Daily Store Opening' },
  originalSubmission: {
    id: 'sub-001',
    submittedAt: '2026-03-13T09:45:00Z',
    score: 72,
    percentage: 72,
  },
};

export default function FollowUpDetailPage() {
  const [data, setData] = useState<FollowUpDetail>(mockFollowUp);

  return (
    <div className="pb-20 animate-fadeInUp">
      <FollowUpRenderer
        followUp={data}
        onUpdate={setData}
      />
    </div>
  );
}
