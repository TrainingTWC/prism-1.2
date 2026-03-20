// ──────────────────────────────────────────
// Prism — Entity Intelligence Service
// ──────────────────────────────────────────
// Centralized service for computing entity
// intelligence data. Uses mock data until
// API integration is complete.
// ──────────────────────────────────────────

import type {
  StoreIntelligence,
  ManagerIntelligence,
  RegionIntelligence,
  RegionStoreEntry,
  EmployeeIntelligence,
  ProgramIntelligence,
  TrendSeries,
  ProgramPerformance,
  RecentSubmission,
  TaskSummary,
  RecurringIssue,
  ComparisonEntry,
  EntityListItem,
} from '../types/entity-intelligence';
import {
  calculateStoreHealthScore,
  calculateManagerEffectiveness,
  calculateRegionalPerformance,
  calculateProgramPerformance,
  calculateEmployeePerformance,
  scoreToRisk,
  computeTrend,
  computeTrendDelta,
  generateTrendData,
} from './entity-scores';

// ──────────────────────────────────────────
// Mock Data Generators
// ──────────────────────────────────────────

function makeTrendSeries(label: string, days: number, base: number, color?: string): TrendSeries {
  const data = generateTrendData(days, base);
  return { label, data, color };
}

function makePrograms(): ProgramPerformance[] {
  return [
    { programId: 'p1', programName: 'QA Audit', score: 85, trend: 'up', totalSubmissions: 142, lastSubmission: '2026-03-12', avgCompletionTime: 35 },
    { programId: 'p2', programName: 'Training Audit', score: 91, trend: 'flat', totalSubmissions: 98, lastSubmission: '2026-03-11', avgCompletionTime: 28 },
    { programId: 'p3', programName: 'Operations Audit', score: 78, trend: 'down', totalSubmissions: 110, lastSubmission: '2026-03-13', avgCompletionTime: 42 },
    { programId: 'p4', programName: 'HR Compliance', score: 88, trend: 'up', totalSubmissions: 64, lastSubmission: '2026-03-10', avgCompletionTime: 22 },
    { programId: 'p5', programName: 'Safety Inspection', score: 82, trend: 'flat', totalSubmissions: 75, lastSubmission: '2026-03-09', avgCompletionTime: 30 },
  ];
}

function makeSubmissions(): RecentSubmission[] {
  return [
    { id: 'sub-1', programName: 'QA Audit', storeName: 'Downtown Flagship', submittedBy: 'Jane Smith', score: 88, submittedAt: '2026-03-13T09:15:00Z', status: 'reviewed' },
    { id: 'sub-2', programName: 'Training Audit', storeName: 'Westfield District', submittedBy: 'Mark Chen', score: 92, submittedAt: '2026-03-12T14:30:00Z', status: 'submitted' },
    { id: 'sub-3', programName: 'Operations Audit', storeName: 'Tokyo Ginza', submittedBy: 'Yuki Tanaka', score: 75, submittedAt: '2026-03-12T08:00:00Z', status: 'reviewed' },
    { id: 'sub-4', programName: 'HR Compliance', storeName: 'Paris Champs-Élysées', submittedBy: 'Marie Dupont', score: 94, submittedAt: '2026-03-11T16:45:00Z', status: 'submitted' },
    { id: 'sub-5', programName: 'Safety Inspection', storeName: 'London Regent St', submittedBy: 'James Wilson', score: 81, submittedAt: '2026-03-11T11:20:00Z', status: 'pending' },
    { id: 'sub-6', programName: 'QA Audit', storeName: 'Berlin Mitte', submittedBy: 'Lukas Braun', score: 79, submittedAt: '2026-03-10T13:10:00Z', status: 'reviewed' },
  ];
}

function makeTasks(): TaskSummary[] {
  return [
    { id: 't1', title: 'Fix espresso calibration', assignedTo: 'Jane Smith', status: 'open', priority: 'high', dueDate: '2026-03-15' },
    { id: 't2', title: 'Update cleaning SOP binder', assignedTo: 'Mark Chen', status: 'in_progress', priority: 'medium', dueDate: '2026-03-18' },
    { id: 't3', title: 'Schedule barista re-training', assignedTo: 'Yuki Tanaka', status: 'open', priority: 'high', dueDate: '2026-03-14' },
    { id: 't4', title: 'Replace water filters', assignedTo: 'James Wilson', status: 'completed', priority: 'low', dueDate: '2026-03-20' },
    { id: 't5', title: 'Resubmit HR compliance forms', assignedTo: 'Marie Dupont', status: 'overdue', priority: 'critical', dueDate: '2026-03-10' },
    { id: 't6', title: 'Inventory audit follow-up', assignedTo: 'Jane Smith', status: 'open', priority: 'medium', dueDate: '2026-03-17' },
  ];
}

function makeIssues(): RecurringIssue[] {
  return [
    { id: 'i1', description: 'Milk steaming inconsistency', frequency: 14, lastOccurred: '2026-03-12', category: 'Quality', severity: 'high' },
    { id: 'i2', description: 'Dial-in calibration errors', frequency: 9, lastOccurred: '2026-03-11', category: 'Equipment', severity: 'medium' },
    { id: 'i3', description: 'Cleaning SOP failures', frequency: 7, lastOccurred: '2026-03-10', category: 'Hygiene', severity: 'high' },
    { id: 'i4', description: 'Incorrect cash handling', frequency: 4, lastOccurred: '2026-03-08', category: 'Operations', severity: 'medium' },
    { id: 'i5', description: 'Expired ingredient storage', frequency: 3, lastOccurred: '2026-03-07', category: 'Safety', severity: 'critical' },
  ];
}

function makeComparison(type: 'stores' | 'managers' | 'regions' | 'employees' | 'programs'): ComparisonEntry[] {
  const names: Record<string, string[]> = {
    stores: ['Downtown Flagship', 'Westfield District', 'Tokyo Ginza', 'Paris Champs-Élysées', 'London Regent St', 'Berlin Mitte', 'Mumbai Central', 'Sydney CBD'],
    managers: ['Sarah Johnson', 'Michael Chen', 'Emma Williams', 'David Kim', 'Priya Sharma', 'Thomas Mueller'],
    regions: ['North America', 'Europe', 'Asia Pacific', 'South Asia', 'Middle East'],
    employees: ['Jane Smith', 'Mark Chen', 'Yuki Tanaka', 'Marie Dupont', 'James Wilson', 'Lukas Braun', 'Ananya Patel'],
    programs: ['QA Audit', 'Training Audit', 'Operations Audit', 'HR Compliance', 'Safety Inspection'],
  };
  return names[type].map((name, i) => ({
    entityId: `${type[0]}-${i + 1}`,
    entityName: name,
    score: Math.round(95 - i * 3.5 + (Math.random() - 0.5) * 4),
    trend: (['up', 'flat', 'down'] as const)[i % 3],
    rank: i + 1,
  }));
}

// ──────────────────────────────────────────
// Store Intelligence
// ──────────────────────────────────────────

export function getStoreIntelligence(storeId: string): StoreIntelligence {
  const breakdown = [
    { programId: 'p1', programName: 'QA Audit', weight: 0.35, score: 85, trend: 'up' as const, submissions: 42 },
    { programId: 'p2', programName: 'Operations Audit', weight: 0.25, score: 78, trend: 'down' as const, submissions: 38 },
    { programId: 'p3', programName: 'Training Audit', weight: 0.20, score: 91, trend: 'flat' as const, submissions: 28 },
    { programId: 'p4', programName: 'HR Compliance', weight: 0.20, score: 88, trend: 'up' as const, submissions: 22 },
  ];

  const overall = calculateStoreHealthScore(breakdown);
  const trendData = generateTrendData(90, overall);

  return {
    storeId,
    storeName: 'Downtown Flagship',
    region: 'North America',
    city: 'New York',
    managerId: 'mgr-001',
    managerName: 'Sarah Johnson',
    healthScore: {
      overall,
      trend: computeTrend(trendData),
      trendDelta: computeTrendDelta(trendData),
      breakdown,
      riskLevel: scoreToRisk(overall),
    },
    performanceTrend: [
      makeTrendSeries('Overall', 90, overall, '#10b37d'),
      makeTrendSeries('QA', 90, 85, '#3B82F6'),
      makeTrendSeries('Operations', 90, 78, '#8B5CF6'),
    ],
    programPerformance: makePrograms(),
    recentSubmissions: makeSubmissions(),
    recurringIssues: makeIssues(),
    openTasks: makeTasks(),
    evidenceGallery: [],
    comparison: makeComparison('stores'),
    stats: {
      totalSubmissions: 489,
      thisMonth: 34,
      avgScore: overall,
      openTaskCount: 4,
      overdueTaskCount: 1,
    },
  };
}

// ──────────────────────────────────────────
// Manager Intelligence
// ──────────────────────────────────────────

export function getManagerIntelligence(managerId: string): ManagerIntelligence {
  const storeScores = [85, 78, 91, 72, 88];
  const overall = calculateManagerEffectiveness(storeScores, 82, 90);
  const trendData = generateTrendData(90, overall);

  return {
    managerId,
    managerName: 'Sarah Johnson',
    department: 'Operations',
    designation: 'Area Manager',
    effectivenessScore: {
      overall,
      trend: computeTrend(trendData),
      trendDelta: computeTrendDelta(trendData),
      storesManaged: storeScores.length,
      avgStoreHealth: Math.round(storeScores.reduce((a, b) => a + b, 0) / storeScores.length),
      topStoreScore: Math.max(...storeScores),
      bottomStoreScore: Math.min(...storeScores),
      riskLevel: scoreToRisk(overall),
    },
    stores: [
      { storeId: 's1', storeName: 'Downtown Flagship', city: 'New York', healthScore: 85, trend: 'up', openTasks: 3, lastAudit: '2026-03-12' },
      { storeId: 's2', storeName: 'Westfield District', city: 'San Francisco', healthScore: 78, trend: 'down', openTasks: 5, lastAudit: '2026-03-10' },
      { storeId: 's3', storeName: 'Lincoln Park', city: 'Chicago', healthScore: 91, trend: 'up', openTasks: 1, lastAudit: '2026-03-13' },
      { storeId: 's4', storeName: 'Midtown Plaza', city: 'Atlanta', healthScore: 72, trend: 'down', openTasks: 7, lastAudit: '2026-03-08' },
      { storeId: 's5', storeName: 'Harbor View', city: 'Boston', healthScore: 88, trend: 'flat', openTasks: 2, lastAudit: '2026-03-11' },
    ],
    performanceTrend: [
      makeTrendSeries('Effectiveness', 90, overall, '#10b37d'),
      makeTrendSeries('Avg Store Health', 90, 83, '#3B82F6'),
    ],
    programPerformance: makePrograms(),
    recentSubmissions: makeSubmissions(),
    openTasks: makeTasks(),
    comparison: makeComparison('managers'),
    stats: {
      totalStores: 5,
      totalSubmissions: 312,
      avgStoreHealth: 83,
      openTaskCount: 18,
      overdueTaskCount: 3,
    },
  };
}

// ──────────────────────────────────────────
// Region Intelligence
// ──────────────────────────────────────────

export function getRegionIntelligence(regionId: string): RegionIntelligence {
  const storeScores = [85, 78, 91, 72, 88, 94, 81, 76];
  const overall = calculateRegionalPerformance(storeScores);
  const trendData = generateTrendData(90, overall);

  const allStores: RegionStoreEntry[] = [
    { storeId: 's1', storeName: 'Downtown Flagship', city: 'New York', healthScore: 94, trend: 'up' as const, riskLevel: 'low' as const, lastAudit: '2026-03-13' },
    { storeId: 's2', storeName: 'Westfield District', city: 'San Francisco', healthScore: 88, trend: 'flat' as const, riskLevel: 'low' as const, lastAudit: '2026-03-12' },
    { storeId: 's3', storeName: 'Lincoln Park', city: 'Chicago', healthScore: 85, trend: 'up' as const, riskLevel: 'low' as const, lastAudit: '2026-03-11' },
    { storeId: 's4', storeName: 'Harbor View', city: 'Boston', healthScore: 81, trend: 'flat' as const, riskLevel: 'medium' as const, lastAudit: '2026-03-10' },
    { storeId: 's5', storeName: 'Midtown Plaza', city: 'Atlanta', healthScore: 78, trend: 'down' as const, riskLevel: 'medium' as const, lastAudit: '2026-03-09' },
    { storeId: 's6', storeName: 'River Walk', city: 'Austin', healthScore: 76, trend: 'down' as const, riskLevel: 'medium' as const, lastAudit: '2026-03-08' },
    { storeId: 's7', storeName: 'Sunset Strip', city: 'Los Angeles', healthScore: 72, trend: 'down' as const, riskLevel: 'high' as const, lastAudit: '2026-03-07' },
    { storeId: 's8', storeName: 'Old Port', city: 'Portland', healthScore: 91, trend: 'up' as const, riskLevel: 'low' as const, lastAudit: '2026-03-12' },
  ];

  return {
    regionId,
    regionName: 'North America',
    performanceScore: {
      overall,
      trend: computeTrend(trendData),
      trendDelta: computeTrendDelta(trendData),
      storeCount: allStores.length,
      avgStoreHealth: overall,
      topPerformer: { storeId: 's1', storeName: 'Downtown Flagship', score: 94 },
      riskStores: allStores.filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical').length,
      riskLevel: scoreToRisk(overall),
    },
    stores: allStores,
    topStores: allStores.filter((s) => s.healthScore >= 85),
    riskStores: allStores.filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical'),
    performanceTrend: [
      makeTrendSeries('Regional Avg', 90, overall, '#10b37d'),
      makeTrendSeries('Top Quartile', 90, 90, '#22C55E'),
      makeTrendSeries('Bottom Quartile', 90, 74, '#EF4444'),
    ],
    programBreakdown: makePrograms(),
    comparison: makeComparison('regions'),
    stats: {
      totalStores: allStores.length,
      totalSubmissions: 1240,
      avgScore: overall,
      openTaskCount: 32,
      criticalIssues: 3,
    },
  };
}

// ──────────────────────────────────────────
// Employee Intelligence
// ──────────────────────────────────────────

export function getEmployeeIntelligence(employeeId: string): EmployeeIntelligence {
  const overall = calculateEmployeePerformance(87, 78, 90);
  const trendData = generateTrendData(90, overall);

  return {
    employeeId,
    employeeName: 'Jane Smith',
    empId: 'EMP-1042',
    department: 'Quality Assurance',
    designation: 'Senior Auditor',
    storeId: 's1',
    storeName: 'Downtown Flagship',
    performanceScore: {
      overall,
      trend: computeTrend(trendData),
      trendDelta: computeTrendDelta(trendData),
      submissionCount: 142,
      avgScore: 87,
      completionRate: 94,
      riskLevel: scoreToRisk(overall),
    },
    performanceTrend: [
      makeTrendSeries('Performance', 90, overall, '#10b37d'),
      makeTrendSeries('Avg Score', 90, 87, '#3B82F6'),
    ],
    programInvolvement: makePrograms().slice(0, 3),
    recentSubmissions: makeSubmissions().filter((_, i) => i < 5),
    assignedTasks: makeTasks().filter((_, i) => i < 4),
    comparison: makeComparison('employees'),
    stats: {
      totalSubmissions: 142,
      tasksCompleted: 38,
      tasksOpen: 4,
      programsActive: 3,
      avgScore: 87,
    },
  };
}

// ──────────────────────────────────────────
// Program Intelligence
// ──────────────────────────────────────────

export function getProgramIntelligence(programId: string): ProgramIntelligence {
  const scores = [85, 88, 92, 79, 91, 86, 82, 94, 77, 90];
  const overall = calculateProgramPerformance(scores, 88);
  const trendData = generateTrendData(90, overall);

  return {
    programId,
    programName: 'QA Audit',
    type: 'Checklist',
    department: 'Quality Assurance',
    status: 'active',
    metrics: {
      overall,
      trend: computeTrend(trendData),
      trendDelta: computeTrendDelta(trendData),
      totalSubmissions: 1420,
      avgScore: 86,
      completionRate: 88,
      avgCompletionTime: 35,
      riskLevel: scoreToRisk(overall),
    },
    performanceTrend: [
      makeTrendSeries('Avg Score', 90, 86, '#10b37d'),
      makeTrendSeries('Completion %', 90, 88, '#22C55E'),
    ],
    storeComparison: [
      { storeId: 's1', storeName: 'Downtown Flagship', score: 92, trend: 'up', submissions: 42, lastSubmission: '2026-03-13' },
      { storeId: 's2', storeName: 'Westfield District', score: 85, trend: 'flat', submissions: 38, lastSubmission: '2026-03-12' },
      { storeId: 's3', storeName: 'Tokyo Ginza', score: 79, trend: 'down', submissions: 35, lastSubmission: '2026-03-11' },
      { storeId: 's4', storeName: 'Paris Champs-Élysées', score: 91, trend: 'up', submissions: 30, lastSubmission: '2026-03-10' },
      { storeId: 's5', storeName: 'London Regent St', score: 88, trend: 'flat', submissions: 28, lastSubmission: '2026-03-09' },
      { storeId: 's6', storeName: 'Berlin Mitte', score: 76, trend: 'down', submissions: 25, lastSubmission: '2026-03-08' },
    ],
    regionComparison: [
      { regionId: 'r1', regionName: 'North America', avgScore: 88, trend: 'up', totalSubmissions: 520, storeCount: 45 },
      { regionId: 'r2', regionName: 'Europe', avgScore: 84, trend: 'flat', totalSubmissions: 410, storeCount: 38 },
      { regionId: 'r3', regionName: 'Asia Pacific', avgScore: 81, trend: 'down', totalSubmissions: 290, storeCount: 22 },
      { regionId: 'r4', regionName: 'South Asia', avgScore: 79, trend: 'up', totalSubmissions: 200, storeCount: 15 },
    ],
    recentSubmissions: makeSubmissions(),
    comparison: makeComparison('programs'),
    stats: {
      totalSubmissions: 1420,
      thisMonth: 148,
      avgScore: 86,
      uniqueStores: 45,
      uniqueAuditors: 28,
    },
  };
}

// ──────────────────────────────────────────
// Entity Lists
// ──────────────────────────────────────────

export function getStoreList(): EntityListItem[] {
  return [
    { id: 's-001', name: 'Downtown Flagship', type: 'store', score: 85, trend: 'up', riskLevel: 'low', subtitle: 'New York · North America', lastActivity: '2026-03-13' },
    { id: 's-002', name: 'Westfield District', type: 'store', score: 78, trend: 'down', riskLevel: 'medium', subtitle: 'San Francisco · North America', lastActivity: '2026-03-12' },
    { id: 's-003', name: 'Tokyo Ginza', type: 'store', score: 91, trend: 'up', riskLevel: 'low', subtitle: 'Tokyo · Asia Pacific', lastActivity: '2026-03-13' },
    { id: 's-004', name: 'Paris Champs-Élysées', type: 'store', score: 72, trend: 'down', riskLevel: 'high', subtitle: 'Paris · Europe', lastActivity: '2026-03-11' },
    { id: 's-005', name: 'London Regent St', type: 'store', score: 94, trend: 'up', riskLevel: 'low', subtitle: 'London · Europe', lastActivity: '2026-03-13' },
    { id: 's-006', name: 'Berlin Mitte', type: 'store', score: 68, trend: 'down', riskLevel: 'high', subtitle: 'Berlin · Europe', lastActivity: '2026-03-10' },
    { id: 's-007', name: 'Mumbai Central', type: 'store', score: 82, trend: 'flat', riskLevel: 'medium', subtitle: 'Mumbai · South Asia', lastActivity: '2026-03-12' },
    { id: 's-008', name: 'Sydney CBD', type: 'store', score: 89, trend: 'up', riskLevel: 'low', subtitle: 'Sydney · Asia Pacific', lastActivity: '2026-03-13' },
  ];
}

export function getManagerList(): EntityListItem[] {
  return [
    { id: 'm-001', name: 'Sarah Johnson', type: 'manager', score: 87, trend: 'up', riskLevel: 'low', subtitle: 'Area Manager · 5 stores', lastActivity: '2026-03-13' },
    { id: 'm-002', name: 'Michael Chen', type: 'manager', score: 82, trend: 'flat', riskLevel: 'medium', subtitle: 'Regional Manager · 8 stores', lastActivity: '2026-03-12' },
    { id: 'm-003', name: 'Emma Williams', type: 'manager', score: 91, trend: 'up', riskLevel: 'low', subtitle: 'Area Manager · 4 stores', lastActivity: '2026-03-13' },
    { id: 'm-004', name: 'David Kim', type: 'manager', score: 74, trend: 'down', riskLevel: 'medium', subtitle: 'Area Manager · 6 stores', lastActivity: '2026-03-11' },
    { id: 'm-005', name: 'Priya Sharma', type: 'manager', score: 88, trend: 'up', riskLevel: 'low', subtitle: 'District Manager · 10 stores', lastActivity: '2026-03-13' },
  ];
}

export function getRegionList(): EntityListItem[] {
  return [
    { id: 'r-001', name: 'North America', type: 'region', score: 84, trend: 'up', riskLevel: 'low', subtitle: '45 stores · 12 managers', lastActivity: '2026-03-13' },
    { id: 'r-002', name: 'Europe', type: 'region', score: 81, trend: 'flat', riskLevel: 'medium', subtitle: '38 stores · 9 managers', lastActivity: '2026-03-13' },
    { id: 'r-003', name: 'Asia Pacific', type: 'region', score: 86, trend: 'up', riskLevel: 'low', subtitle: '22 stores · 6 managers', lastActivity: '2026-03-12' },
    { id: 'r-004', name: 'South Asia', type: 'region', score: 77, trend: 'down', riskLevel: 'medium', subtitle: '15 stores · 4 managers', lastActivity: '2026-03-12' },
    { id: 'r-005', name: 'Middle East', type: 'region', score: 79, trend: 'flat', riskLevel: 'medium', subtitle: '8 stores · 2 managers', lastActivity: '2026-03-11' },
  ];
}

export function getEmployeeList(): EntityListItem[] {
  return [
    { id: 'e-001', name: 'Jane Smith', type: 'employee', score: 87, trend: 'up', riskLevel: 'low', subtitle: 'Senior Auditor · QA', lastActivity: '2026-03-13' },
    { id: 'e-002', name: 'Mark Chen', type: 'employee', score: 82, trend: 'flat', riskLevel: 'medium', subtitle: 'Auditor · Operations', lastActivity: '2026-03-12' },
    { id: 'e-003', name: 'Yuki Tanaka', type: 'employee', score: 91, trend: 'up', riskLevel: 'low', subtitle: 'Lead Auditor · QA', lastActivity: '2026-03-13' },
    { id: 'e-004', name: 'Marie Dupont', type: 'employee', score: 78, trend: 'down', riskLevel: 'medium', subtitle: 'Auditor · HR', lastActivity: '2026-03-11' },
    { id: 'e-005', name: 'James Wilson', type: 'employee', score: 85, trend: 'up', riskLevel: 'low', subtitle: 'Auditor · Safety', lastActivity: '2026-03-12' },
    { id: 'e-006', name: 'Lukas Braun', type: 'employee', score: 73, trend: 'down', riskLevel: 'medium', subtitle: 'Junior Auditor · QA', lastActivity: '2026-03-10' },
  ];
}

export function getProgramList(): EntityListItem[] {
  return [
    { id: 'p-001', name: 'QA Audit', type: 'program', score: 86, trend: 'up', riskLevel: 'low', subtitle: 'Checklist · Quality Assurance', lastActivity: '2026-03-13' },
    { id: 'p-002', name: 'Training Audit', type: 'program', score: 91, trend: 'flat', riskLevel: 'low', subtitle: 'Checklist · Training', lastActivity: '2026-03-12' },
    { id: 'p-003', name: 'Operations Audit', type: 'program', score: 78, trend: 'down', riskLevel: 'medium', subtitle: 'Checklist · Operations', lastActivity: '2026-03-13' },
    { id: 'p-004', name: 'HR Compliance', type: 'program', score: 88, trend: 'up', riskLevel: 'low', subtitle: 'Compliance · HR', lastActivity: '2026-03-11' },
    { id: 'p-005', name: 'Safety Inspection', type: 'program', score: 82, trend: 'flat', riskLevel: 'medium', subtitle: 'Inspection · Safety', lastActivity: '2026-03-10' },
  ];
}
