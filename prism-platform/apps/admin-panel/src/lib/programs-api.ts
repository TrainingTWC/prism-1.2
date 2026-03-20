// ──────────────────────────────────────────
// Prism Admin — Program Engine API Client
// ──────────────────────────────────────────

import { apiClient } from './api';
import type {
  Program,
  ProgramListResponse,
  ProgramVersion,
  ProgramSection,
  ProgramQuestion,
  CreateProgramInput,
  CreateSectionInput,
  CreateQuestionInput,
} from '../types';

const BASE = '/api/programs';

// ── Programs ──

export async function listPrograms(params: {
  companyId: string;
  status?: string;
  type?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProgramListResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  return apiClient<ProgramListResponse>(`${BASE}?${qs.toString()}`);
}

export async function getProgram(id: string): Promise<Program> {
  const res = await apiClient<{ data: Program }>(`${BASE}/${id}`);
  return res.data;
}

export async function createProgram(input: CreateProgramInput): Promise<Program> {
  const res = await apiClient<{ data: Program }>(BASE, { method: 'POST', body: input });
  return res.data;
}

export async function updateProgram(id: string, input: Partial<CreateProgramInput>): Promise<Program> {
  const res = await apiClient<{ data: Program }>(`${BASE}/${id}`, { method: 'PATCH', body: input });
  return res.data;
}

export async function deleteProgram(id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: 'DELETE' });
}

export async function activateProgram(id: string): Promise<Program> {
  const res = await apiClient<{ data: Program }>(`${BASE}/${id}/activate`, { method: 'POST' });
  return res.data;
}

export async function archiveProgram(id: string): Promise<Program> {
  const res = await apiClient<{ data: Program }>(`${BASE}/${id}/archive`, { method: 'POST' });
  return res.data;
}

export async function createVersion(id: string): Promise<Program> {
  const res = await apiClient<{ data: Program }>(`${BASE}/${id}/version`, { method: 'POST' });
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
