// ──────────────────────────────────────────
// Programs CRUD API Client (for admin controls)
// ──────────────────────────────────────────

import { apiClient } from './api';
import { API_ROUTES } from './constants';
import type {
  ProgramDetail,
  ProgramSection,
  ProgramQuestion,
  ProgramType,
  ProgramStatus,
  ScoringConfig,
} from '../types/checklist';

const BASE = API_ROUTES.PROGRAMS;

// ── Types ──

export interface AdminProgramListItem {
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

export interface AdminProgramListResponse {
  data: AdminProgramListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

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
  questionType: string;
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
  conditionalLogic?: { dependsOn: string; condition: string; value: unknown } | null;
  defaultValue?: string;
}

export interface ProgramVersion {
  id: string;
  version: number;
  status: ProgramStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Programs CRUD ──

export async function listAllPrograms(params: {
  companyId: string;
  status?: string;
  type?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminProgramListResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  return apiClient<AdminProgramListResponse>(`${BASE}?${qs.toString()}`);
}

export async function getProgram(id: string): Promise<ProgramDetail> {
  const res = await apiClient<{ data: ProgramDetail }>(`${BASE}/${id}`);
  return res.data;
}

export async function createProgram(input: CreateProgramInput): Promise<ProgramDetail> {
  const res = await apiClient<{ data: ProgramDetail }>(BASE, { method: 'POST', body: input });
  return res.data;
}

export async function updateProgram(id: string, input: Partial<CreateProgramInput>): Promise<ProgramDetail> {
  const res = await apiClient<{ data: ProgramDetail }>(`${BASE}/${id}`, { method: 'PATCH', body: input });
  return res.data;
}

export async function deleteProgram(id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: 'DELETE' });
}

export async function activateProgram(id: string): Promise<ProgramDetail> {
  const res = await apiClient<{ data: ProgramDetail }>(`${BASE}/${id}/activate`, { method: 'POST' });
  return res.data;
}

export async function archiveProgram(id: string): Promise<ProgramDetail> {
  const res = await apiClient<{ data: ProgramDetail }>(`${BASE}/${id}/archive`, { method: 'POST' });
  return res.data;
}

export async function createVersion(id: string): Promise<ProgramDetail> {
  const res = await apiClient<{ data: ProgramDetail }>(`${BASE}/${id}/version`, { method: 'POST' });
  return res.data;
}

export async function listVersions(id: string): Promise<ProgramVersion[]> {
  const res = await apiClient<{ data: ProgramVersion[] }>(`${BASE}/${id}/versions`);
  return res.data;
}

// ── Sections ──

export async function createSection(programId: string, input: CreateSectionInput): Promise<ProgramSection> {
  const res = await apiClient<{ data: ProgramSection }>(`${BASE}/${programId}/sections`, {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateSection(sectionId: string, input: Partial<CreateSectionInput>): Promise<ProgramSection> {
  const res = await apiClient<{ data: ProgramSection }>(`${BASE}/sections/${sectionId}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteSection(sectionId: string): Promise<void> {
  await apiClient(`${BASE}/sections/${sectionId}`, { method: 'DELETE' });
}

export async function reorderSections(programId: string, sectionIds: string[]): Promise<void> {
  await apiClient(`${BASE}/${programId}/sections/reorder`, {
    method: 'PUT',
    body: { sectionIds },
  });
}

// ── Questions ──

export async function createQuestion(sectionId: string, input: CreateQuestionInput): Promise<ProgramQuestion> {
  const res = await apiClient<{ data: ProgramQuestion }>(`${BASE}/sections/${sectionId}/questions`, {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateQuestion(questionId: string, input: Partial<CreateQuestionInput>): Promise<ProgramQuestion> {
  const res = await apiClient<{ data: ProgramQuestion }>(`${BASE}/questions/${questionId}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await apiClient(`${BASE}/questions/${questionId}`, { method: 'DELETE' });
}

export async function duplicateQuestion(questionId: string): Promise<ProgramQuestion> {
  const res = await apiClient<{ data: ProgramQuestion }>(`${BASE}/questions/${questionId}/duplicate`, {
    method: 'POST',
  });
  return res.data;
}

export async function reorderQuestions(sectionId: string, questionIds: string[]): Promise<void> {
  await apiClient(`${BASE}/sections/${sectionId}/questions/reorder`, {
    method: 'PUT',
    body: { questionIds },
  });
}
