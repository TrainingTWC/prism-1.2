// ──────────────────────────────────────────
// Prism — Entity Intelligence Types
// ──────────────────────────────────────────

// ── Shared Primitives ──

export type EntityType = 'store' | 'manager' | 'region' | 'employee' | 'program';

export type TrendDirection = 'up' | 'down' | 'flat';

export type TimeRange = '30d' | '90d' | '6m' | '1y';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TrendSeries {
  label: string;
  data: TrendPoint[];
  color?: string;
}

export interface ScoreBreakdown {
  programId: string;
  programName: string;
  weight: number;
  score: number;
  trend: TrendDirection;
  submissions: number;
}

export interface ProgramPerformance {
  programId: string;
  programName: string;
  score: number;
  trend: TrendDirection;
  totalSubmissions: number;
  lastSubmission: string | null;
  avgCompletionTime: number; // minutes
}

export interface RecentSubmission {
  id: string;
  programName: string;
  storeName: string;
  submittedBy: string;
  score: number;
  submittedAt: string;
  status: 'pending' | 'submitted' | 'reviewed';
}

export interface TaskSummary {
  id: string;
  title: string;
  assignedTo: string;
  status: 'open' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
}

export interface RecurringIssue {
  id: string;
  description: string;
  frequency: number;
  lastOccurred: string;
  category: string;
  severity: RiskLevel;
}

export interface ComparisonEntry {
  entityId: string;
  entityName: string;
  score: number;
  trend: TrendDirection;
  rank: number;
}

export interface EvidenceItem {
  id: string;
  imageUrl: string;
  caption: string;
  programName: string;
  uploadedBy: string;
  uploadedAt: string;
}

// ── Store Intelligence ──

export interface StoreHealthScore {
  overall: number;
  trend: TrendDirection;
  trendDelta: number;
  breakdown: ScoreBreakdown[];
  riskLevel: RiskLevel;
}

export interface StoreIntelligence {
  storeId: string;
  storeName: string;
  storeCode?: string;
  region: string;
  regionId?: string | null;
  city: string;
  state?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  managerId: string | null;
  managerName: string | null;
  managerDesignation?: string | null;
  healthScore: StoreHealthScore;
  performanceTrend: TrendSeries[];
  programPerformance: ProgramPerformance[];
  recentSubmissions: RecentSubmission[];
  recurringIssues: RecurringIssue[];
  openTasks: TaskSummary[];
  evidenceGallery: EvidenceItem[];
  comparison: ComparisonEntry[];
  stats: {
    totalSubmissions: number;
    thisMonth: number;
    avgScore: number;
    openTaskCount: number;
    overdueTaskCount: number;
  };
}

// ── Manager Intelligence ──

export interface ManagerEffectivenessScore {
  overall: number;
  trend: TrendDirection;
  trendDelta: number;
  storesManaged: number;
  avgStoreHealth: number;
  topStoreScore: number;
  bottomStoreScore: number;
  riskLevel: RiskLevel;
}

export interface ManagerStoreEntry {
  storeId: string;
  storeName: string;
  city: string;
  healthScore: number;
  trend: TrendDirection;
  openTasks: number;
  lastAudit: string | null;
}

export interface ManagerIntelligence {
  managerId: string;
  managerName: string;
  department: string;
  designation: string;
  effectivenessScore: ManagerEffectivenessScore;
  stores: ManagerStoreEntry[];
  performanceTrend: TrendSeries[];
  programPerformance: ProgramPerformance[];
  recentSubmissions: RecentSubmission[];
  openTasks: TaskSummary[];
  comparison: ComparisonEntry[];
  stats: {
    totalStores: number;
    totalSubmissions: number;
    avgStoreHealth: number;
    openTaskCount: number;
    overdueTaskCount: number;
  };
}

// ── Region Intelligence ──

export interface RegionalPerformanceScore {
  overall: number;
  trend: TrendDirection;
  trendDelta: number;
  storeCount: number;
  avgStoreHealth: number;
  topPerformer: { storeId: string; storeName: string; score: number };
  riskStores: number;
  riskLevel: RiskLevel;
}

export interface RegionStoreEntry {
  storeId: string;
  storeName: string;
  city: string;
  healthScore: number;
  trend: TrendDirection;
  riskLevel: RiskLevel;
  lastAudit: string | null;
}

export interface RegionIntelligence {
  regionId: string;
  regionName: string;
  performanceScore: RegionalPerformanceScore;
  stores: RegionStoreEntry[];
  topStores: RegionStoreEntry[];
  riskStores: RegionStoreEntry[];
  performanceTrend: TrendSeries[];
  programBreakdown: ProgramPerformance[];
  comparison: ComparisonEntry[];
  stats: {
    totalStores: number;
    totalSubmissions: number;
    avgScore: number;
    openTaskCount: number;
    criticalIssues: number;
  };
}

// ── Employee Intelligence ──

export interface EmployeePerformanceScore {
  overall: number;
  trend: TrendDirection;
  trendDelta: number;
  submissionCount: number;
  avgScore: number;
  completionRate: number;
  riskLevel: RiskLevel;
}

export interface EmployeeIntelligence {
  employeeId: string;
  employeeName: string;
  empId: string;
  department: string;
  designation: string;
  storeId: string | null;
  storeName: string | null;
  performanceScore: EmployeePerformanceScore;
  performanceTrend: TrendSeries[];
  programInvolvement: ProgramPerformance[];
  recentSubmissions: RecentSubmission[];
  assignedTasks: TaskSummary[];
  comparison: ComparisonEntry[];
  stats: {
    totalSubmissions: number;
    tasksCompleted: number;
    tasksOpen: number;
    programsActive: number;
    avgScore: number;
  };
}

// ── Program Intelligence ──

export interface ProgramPerformanceMetrics {
  overall: number;
  trend: TrendDirection;
  trendDelta: number;
  totalSubmissions: number;
  avgScore: number;
  completionRate: number;
  avgCompletionTime: number; // minutes
  riskLevel: RiskLevel;
}

export interface ProgramStoreComparison {
  storeId: string;
  storeName: string;
  score: number;
  trend: TrendDirection;
  submissions: number;
  lastSubmission: string | null;
}

export interface ProgramRegionComparison {
  regionId: string;
  regionName: string;
  avgScore: number;
  trend: TrendDirection;
  totalSubmissions: number;
  storeCount: number;
}

export interface ProgramIntelligence {
  programId: string;
  programName: string;
  type: string;
  department: string;
  status: 'draft' | 'active' | 'archived';
  metrics: ProgramPerformanceMetrics;
  performanceTrend: TrendSeries[];
  storeComparison: ProgramStoreComparison[];
  regionComparison: ProgramRegionComparison[];
  recentSubmissions: RecentSubmission[];
  comparison: ComparisonEntry[];
  stats: {
    totalSubmissions: number;
    thisMonth: number;
    avgScore: number;
    uniqueStores: number;
    uniqueAuditors: number;
  };
}

// ── API Response Wrappers ──

export interface EntityListItem {
  id: string;
  name: string;
  type: EntityType;
  score: number;
  trend: TrendDirection;
  riskLevel: RiskLevel;
  subtitle: string;
  lastActivity: string | null;
}
