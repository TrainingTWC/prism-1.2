'use client';

import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type MapScope = 'all' | 'region' | 'am' | 'trainer' | 'store';

export interface ProgramScore {
  programId: string;
  programName: string;
  department: string | null;
  avgScore: number;
  totalSubmissions: number;
  storeCount: number;
}

export interface ScopeData {
  scope: MapScope;
  scopeValue: string;
  overallAvgScore: number;
  totalSubmissions: number;
  programs: ProgramScore[];
}

export interface DesignationCount {
  designation: string;
  count: number;
}

export interface EmployeeData {
  total: number;
  byDesignation: DesignationCount[];
}

export interface StoreScore {
  storeId: string;
  storeCode: string | null;
  storeName: string;
  latitude: number | null;
  longitude: number | null;
  amName: string | null;
  trainerName: string | null;
  regionalTrainerName: string | null;
  regionName: string | null;
  avgScore: number | null;
  submissionCount: number;
}

export function useMapAnalytics() {
  const [scopeData, setScopeData] = useState<ScopeData | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [storeScores, setStoreScores] = useState<StoreScore[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch per-store scores once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/map-analytics/store-scores`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setStoreScores(json.data || []);
      } catch (err) {
        console.error('Failed to fetch store scores:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch scope-specific data
  const fetchScope = useCallback(async (scope: MapScope, scopeValue?: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ scope });
      if (scopeValue) qs.set('scopeValue', scopeValue);

      const [scoresRes, empRes] = await Promise.all([
        fetch(`${API}/api/map-analytics/scores?${qs}`),
        fetch(`${API}/api/map-analytics/employees?${qs}`),
      ]);

      if (scoresRes.ok) {
        const json = await scoresRes.json();
        setScopeData(json.data || null);
      }
      if (empRes.ok) {
        const json = await empRes.json();
        setEmployeeData(json.data || null);
      }
    } catch (err) {
      console.error('Failed to fetch map analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch "all" on mount
  useEffect(() => {
    fetchScope('all');
  }, [fetchScope]);

  return { scopeData, employeeData, storeScores, loading, fetchScope };
}
