// ──────────────────────────────────────────
// Prism — Entity Intelligence API Client
// ──────────────────────────────────────────

import { apiClient } from './api';
import type {
  StoreIntelligence,
  ManagerIntelligence,
  RegionIntelligence,
  EmployeeIntelligence,
  ProgramIntelligence,
  EntityListItem,
  TimeRange,
} from '../types/entity-intelligence';

const ENTITIES_BASE = '/api/entities';

// ── Store Intelligence ──

export async function fetchStoreIntelligence(
  storeId: string,
  range?: TimeRange,
): Promise<StoreIntelligence> {
  const qs = range ? `?range=${range}` : '';
  // Hits the real backend at /api/stores/:id/intelligence
  const res = await apiClient<{ data: StoreIntelligence }>(`/api/stores/${storeId}/intelligence${qs}`);
  return res.data;
}

export async function fetchStoreList(): Promise<EntityListItem[]> {
  return apiClient<EntityListItem[]>(`${ENTITIES_BASE}/stores`);
}

// ── Manager Intelligence ──

export async function fetchManagerIntelligence(
  managerId: string,
  range?: TimeRange,
): Promise<ManagerIntelligence> {
  const qs = range ? `?range=${range}` : '';
  return apiClient<ManagerIntelligence>(`${ENTITIES_BASE}/managers/${managerId}${qs}`);
}

export async function fetchManagerList(): Promise<EntityListItem[]> {
  return apiClient<EntityListItem[]>(`${ENTITIES_BASE}/managers`);
}

// ── Region Intelligence ──

export async function fetchRegionIntelligence(
  regionId: string,
  range?: TimeRange,
): Promise<RegionIntelligence> {
  const qs = range ? `?range=${range}` : '';
  return apiClient<RegionIntelligence>(`${ENTITIES_BASE}/regions/${regionId}${qs}`);
}

export async function fetchRegionList(): Promise<EntityListItem[]> {
  return apiClient<EntityListItem[]>(`${ENTITIES_BASE}/regions`);
}

// ── Employee Intelligence ──

export async function fetchEmployeeIntelligence(
  employeeId: string,
  range?: TimeRange,
): Promise<EmployeeIntelligence> {
  const qs = range ? `?range=${range}` : '';
  return apiClient<EmployeeIntelligence>(`${ENTITIES_BASE}/employees/${employeeId}${qs}`);
}

export async function fetchEmployeeList(): Promise<EntityListItem[]> {
  return apiClient<EntityListItem[]>(`${ENTITIES_BASE}/employees`);
}

// ── Program Intelligence ──

export async function fetchProgramIntelligence(
  programId: string,
  range?: TimeRange,
): Promise<ProgramIntelligence> {
  const qs = range ? `?range=${range}` : '';
  return apiClient<ProgramIntelligence>(`${ENTITIES_BASE}/programs/${programId}${qs}`);
}

export async function fetchProgramList(): Promise<EntityListItem[]> {
  return apiClient<EntityListItem[]>(`${ENTITIES_BASE}/programs`);
}
