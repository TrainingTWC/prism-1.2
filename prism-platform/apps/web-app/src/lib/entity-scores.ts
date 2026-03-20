// ──────────────────────────────────────────
// Prism — Entity Score Calculators
// ──────────────────────────────────────────

import type {
  TrendDirection,
  TrendPoint,
  RiskLevel,
  ScoreBreakdown,
} from '../types/entity-intelligence';

// ── Helpers ──

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeTrend(data: TrendPoint[]): TrendDirection {
  if (data.length < 2) return 'flat';
  const recent = data.slice(-3);
  const older = data.slice(-6, -3);
  if (recent.length === 0 || older.length === 0) return 'flat';
  const recentAvg = recent.reduce((s, p) => s + p.value, 0) / recent.length;
  const olderAvg = older.reduce((s, p) => s + p.value, 0) / older.length;
  const delta = recentAvg - olderAvg;
  if (Math.abs(delta) < 1.5) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

export function computeTrendDelta(data: TrendPoint[]): number {
  if (data.length < 2) return 0;
  const recent = data.slice(-3);
  const older = data.slice(-6, -3);
  if (recent.length === 0 || older.length === 0) return 0;
  const recentAvg = recent.reduce((s, p) => s + p.value, 0) / recent.length;
  const olderAvg = older.reduce((s, p) => s + p.value, 0) / older.length;
  return Math.round((recentAvg - olderAvg) * 10) / 10;
}

export function scoreToRisk(score: number): RiskLevel {
  if (score >= 85) return 'low';
  if (score >= 70) return 'medium';
  if (score >= 50) return 'high';
  return 'critical';
}

// ── Store Health Score ──

export function calculateStoreHealthScore(
  breakdown: ScoreBreakdown[],
): number {
  const totalWeight = breakdown.reduce((s, b) => s + b.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = breakdown.reduce((s, b) => s + b.score * b.weight, 0);
  return clamp(Math.round((weighted / totalWeight) * 10) / 10, 0, 100);
}

// ── Manager Effectiveness Score ──

export function calculateManagerEffectiveness(
  storeHealthScores: number[],
  taskCompletionRate: number, // 0-100
  auditFrequencyRate: number, // 0-100
): number {
  if (storeHealthScores.length === 0) return 0;
  const avgHealth = storeHealthScores.reduce((s, v) => s + v, 0) / storeHealthScores.length;
  // Weighted: 50% store health, 30% task completion, 20% audit frequency
  return clamp(
    Math.round((avgHealth * 0.5 + taskCompletionRate * 0.3 + auditFrequencyRate * 0.2) * 10) / 10,
    0,
    100,
  );
}

// ── Regional Performance Score ──

export function calculateRegionalPerformance(
  storeScores: number[],
): number {
  if (storeScores.length === 0) return 0;
  const avg = storeScores.reduce((s, v) => s + v, 0) / storeScores.length;
  return clamp(Math.round(avg * 10) / 10, 0, 100);
}

// ── Program Performance Score ──

export function calculateProgramPerformance(
  submissionScores: number[],
  completionRate: number,
): number {
  if (submissionScores.length === 0) return 0;
  const avgScore = submissionScores.reduce((s, v) => s + v, 0) / submissionScores.length;
  // 70% score-based, 30% completion
  return clamp(
    Math.round((avgScore * 0.7 + completionRate * 0.3) * 10) / 10,
    0,
    100,
  );
}

// ── Employee Performance Score ──

export function calculateEmployeePerformance(
  avgScore: number,
  taskCompletionRate: number,
  submissionConsistency: number, // 0-100
): number {
  // 40% avg score, 35% task completion, 25% consistency
  return clamp(
    Math.round((avgScore * 0.4 + taskCompletionRate * 0.35 + submissionConsistency * 0.25) * 10) / 10,
    0,
    100,
  );
}

// ── Generate mock trend data ──

export function generateTrendData(
  days: number,
  baseValue: number,
  variance: number = 8,
): TrendPoint[] {
  const points: TrendPoint[] = [];
  const now = new Date();
  let value = baseValue;
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value = clamp(value + (Math.random() - 0.45) * variance, 0, 100);
    points.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 10) / 10,
    });
  }
  return points;
}
