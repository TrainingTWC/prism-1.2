// ──────────────────────────────────────────
// Submission API client
// ──────────────────────────────────────────

import { apiClient } from './api';
import { API_ROUTES } from './constants';
import type {
  ProgramDetail,
  ProgramSubmissionDetail,
  ResponseInput,
} from '../types/checklist';

const BASE = API_ROUTES.SUBMISSIONS;

// ── Programs (for loading checklist) ──

export interface ProgramListItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  department: string | null;
  status: string;
  version: number;
  scoringEnabled: boolean;
  offlineEnabled: boolean;
  imageUploadEnabled: boolean;
  geoLocationEnabled: boolean;
  signatureEnabled: boolean;
  _count: { sections: number; submissions: number };
}

export interface ProgramListResponse {
  items: ProgramListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchActivePrograms(companyId: string): Promise<ProgramListResponse> {
  const qs = new URLSearchParams({ companyId, status: 'ACTIVE', limit: '100' });
  const raw = await apiClient<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(`${API_ROUTES.PROGRAMS}?${qs}`);
  return {
    items: raw.data.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      type: p.type,
      department: p.department ?? null,
      status: p.status,
      version: p.version,
      scoringEnabled: p.scoringEnabled,
      offlineEnabled: p.offlineEnabled,
      imageUploadEnabled: p.imageUploadEnabled,
      geoLocationEnabled: p.geoLocationEnabled,
      signatureEnabled: p.signatureEnabled,
      _count: { sections: p.sections?.length ?? 0, submissions: p._count?.submissions ?? 0 },
    })),
    total: raw.pagination.total,
    page: raw.pagination.page,
    limit: raw.pagination.limit,
    totalPages: raw.pagination.totalPages,
  };
}

export async function fetchProgramById(programId: string): Promise<ProgramDetail> {
  const res = await apiClient<{ data: ProgramDetail }>(`${API_ROUTES.PROGRAMS}/${programId}`);
  return res.data;
}

// ── Submissions ──

export async function createSubmission(data: {
  programId: string;
  employeeId: string;
  storeId: string;
  geoLat?: number;
  geoLng?: number;
  isOffline?: boolean;
  deviceId?: string;
}): Promise<ProgramSubmissionDetail> {
  return apiClient<ProgramSubmissionDetail>(BASE, {
    method: 'POST',
    body: data,
  });
}

export async function saveDraft(
  submissionId: string,
  data: { responses: ResponseInput[]; geoLat?: number; geoLng?: number },
): Promise<ProgramSubmissionDetail> {
  return apiClient<ProgramSubmissionDetail>(`${BASE}/${submissionId}/draft`, {
    method: 'PATCH',
    body: data,
  });
}

export async function submitFinal(
  submissionId: string,
  data: { responses: ResponseInput[]; geoLat?: number; geoLng?: number },
): Promise<ProgramSubmissionDetail> {
  return apiClient<ProgramSubmissionDetail>(`${BASE}/${submissionId}/submit`, {
    method: 'POST',
    body: data,
  });
}

export async function syncOfflineSubmission(data: {
  programId: string;
  employeeId: string;
  storeId: string;
  responses: ResponseInput[];
  geoLat?: number;
  geoLng?: number;
  deviceId: string;
  startedAt: string;
  submittedAt: string;
}): Promise<ProgramSubmissionDetail> {
  return apiClient<ProgramSubmissionDetail>(`${BASE}/sync`, {
    method: 'POST',
    body: data,
  });
}

export async function fetchSubmission(id: string): Promise<ProgramSubmissionDetail> {
  return apiClient<ProgramSubmissionDetail>(`${BASE}/${id}`);
}

export async function listSubmissions(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiClient<{
    items: ProgramSubmissionDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`${BASE}${qs}`);
}

// ── Image upload (via multipart to API or direct to Supabase) ──

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/api/submissions/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url as string;
}
