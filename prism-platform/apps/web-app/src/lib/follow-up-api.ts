// ──────────────────────────────────────────
// Follow-Up API client
// ──────────────────────────────────────────

import { apiClient } from './api';
import { API_ROUTES } from './constants';
import type {
  FollowUpDetail,
  CreateFollowUpInput,
  UpdateFollowUpItemInput,
} from '../types/follow-up';

const BASE = API_ROUTES.FOLLOW_UPS;

// ── List follow-ups ──

export async function listFollowUps(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiClient<{
    items: FollowUpDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`${BASE}${qs}`);
}

// ── Get single follow-up ──

export async function fetchFollowUp(id: string): Promise<FollowUpDetail> {
  return apiClient<FollowUpDetail>(`${BASE}/${id}`);
}

// ── Create follow-up from submission ──

export async function createFollowUp(
  data: CreateFollowUpInput,
): Promise<FollowUpDetail> {
  return apiClient<FollowUpDetail>(BASE, {
    method: 'POST',
    body: data,
  });
}

// ── Update follow-up status ──

export async function updateFollowUpStatus(
  id: string,
  status: string,
  notes?: string,
): Promise<FollowUpDetail> {
  return apiClient<FollowUpDetail>(`${BASE}/${id}/status`, {
    method: 'PATCH',
    body: { status, notes },
  });
}

// ── Update follow-up item (store response, RCA, CAPA, etc.) ──

export async function updateFollowUpItem(
  followUpId: string,
  itemId: string,
  data: UpdateFollowUpItemInput,
): Promise<FollowUpDetail> {
  return apiClient<FollowUpDetail>(`${BASE}/${followUpId}/items/${itemId}`, {
    method: 'PATCH',
    body: data,
  });
}

// ── Verify a follow-up item ──

export async function verifyFollowUpItem(
  followUpId: string,
  itemId: string,
  data: { verificationNotes: string; verifiedById: string },
): Promise<FollowUpDetail> {
  return apiClient<FollowUpDetail>(
    `${BASE}/${followUpId}/items/${itemId}/verify`,
    { method: 'POST', body: data },
  );
}
