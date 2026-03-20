'use client';

import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Types ──

export interface DashboardStats {
  totalSubmissions: number;
  uniqueStores: number;
  uniqueAuditors: number;
  avgScore: number;
  avgRawScore: number;
  avgMaxScore: number;
  dateRange: { from: string | null; to: string | null };
}

export interface StoreScore {
  storeId: string;
  storeName: string;
  storeCode: string;
  region: string;
  avgScore: number;
  count: number;
}

export interface RegionScore {
  region: string;
  avgScore: number;
  count: number;
  storeCount: number;
}

export interface ScoreBucket {
  range: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  avgScore: number;
  count: number;
}

export interface RecentSubmission {
  id: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  submittedAt: string | null;
  status: string;
  sectionScores: unknown;
  employee: { name: string; empId: string };
  store: { storeName: string; storeCode: string; region?: { name: string } };
}

export interface DashboardData {
  programId: string;
  slug: string;
  stats: DashboardStats;
  storeScores: StoreScore[];
  regionScores: RegionScore[];
  scoreDistribution: ScoreBucket[];
  monthlyTrend: MonthlyTrend[];
  topStores: StoreScore[];
  bottomStores: StoreScore[];
  recentSubmissions: RecentSubmission[];
}

export interface DashboardFilters {
  region?: string;
  store?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FilterOptions {
  regions: { label: string; value: string }[];
  stores: { label: string; value: string; region: string }[];
}

// ── Consolidated ──

export interface ConsolidatedProgram {
  programId: string;
  name: string;
  department: string;
  type: string;
  totalSubmissions: number;
  avgScore: number;
}

export interface ConsolidatedData {
  totalSubmissions: number;
  totalPrograms: number;
  programsWithData: number;
  overallAvgScore: number;
  programs: ConsolidatedProgram[];
}

// ── Hook: useDashboardData ──

export function useDashboardData(slug: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({});

  const fetchData = useCallback(async (f: DashboardFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (f.region) params.set('region', f.region);
      if (f.store) params.set('store', f.store);
      if (f.dateFrom) params.set('dateFrom', f.dateFrom);
      if (f.dateTo) params.set('dateTo', f.dateTo);
      const qs = params.toString();
      const url = `${API}/api/analytics/dashboard/${slug}${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load dashboard data: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData(filters);
  }, [fetchData, filters]);

  const applyFilters = useCallback((f: Record<string, string>) => {
    setFilters({
      region: f.region || undefined,
      store: f.store || undefined,
      dateFrom: f.dateFrom || undefined,
      dateTo: f.dateTo || undefined,
    });
  }, []);

  return { data, loading, error, applyFilters, refresh: () => fetchData(filters) };
}

// ── Hook: useConsolidatedData ──

export function useConsolidatedData() {
  const [data, setData] = useState<ConsolidatedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/analytics/consolidated`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// ── Hook: useFilterOptions ──

export function useFilterOptions() {
  const [options, setOptions] = useState<FilterOptions>({ regions: [], stores: [] });

  useEffect(() => {
    fetch(`${API}/api/analytics/filters`)
      .then(r => r.json())
      .then(setOptions)
      .catch(() => {});
  }, []);

  return options;
}
