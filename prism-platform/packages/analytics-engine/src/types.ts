// ──────────────────────────────────────────
// Analytics Engine Types
// ──────────────────────────────────────────

export type TimeRange = '7d' | '30d' | '90d' | '365d' | 'custom';

export interface AnalyticsQuery {
  companyId: string;
  entityType: 'store' | 'manager' | 'region' | 'employee' | 'program';
  entityId?: string;
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
  metrics: string[];
}

export interface AnalyticsResult {
  query: AnalyticsQuery;
  data: Record<string, unknown>;
  generatedAt: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface EntityMetrics {
  entityId: string;
  entityType: string;
  healthScore: number;
  totalSubmissions: number;
  averageScore: number;
  openTasks: number;
  trends: TrendDataPoint[];
}

export interface DashboardData {
  overview: {
    totalStores: number;
    totalEmployees: number;
    activePrograms: number;
    pendingTasks: number;
  };
  recentSubmissions: {
    id: string;
    programName: string;
    storeName: string;
    score: number;
    submittedAt: string;
  }[];
  performanceTrends: TrendDataPoint[];
  topPerformers: {
    entityId: string;
    entityName: string;
    score: number;
  }[];
}
