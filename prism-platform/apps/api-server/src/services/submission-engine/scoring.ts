// ──────────────────────────────────────────
// Scoring Engine — calculates scores per response,
// section and total submission
// ──────────────────────────────────────────

import type { ResponseInput } from './validation.js';

// We define minimal interfaces to avoid direct @prisma/client dependency
// These match the Prisma model shapes used in scoring.

interface ScoringQuestion {
  id: string;
  questionType: string;
  weight: number;
  scoringEnabled: boolean;
  options: unknown;
  ratingScale: unknown;
  minValue: number | null;
  maxValue: number | null;
}

interface ScoringSection {
  id: string;
  title: string;
  weight: number;
  questions: ScoringQuestion[];
}

// ── Types ──

export interface ScoredResponse {
  questionId: string;
  score: number;
  maxScore: number;
}

export interface SectionScore {
  sectionId: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  weight: number;
}

export interface SubmissionScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  sectionScores: SectionScore[];
  responseScores: ScoredResponse[];
}

// ── Option shape (stored as JSON in question.options) ──

interface QuestionOption {
  label: string;
  value: string;
  score?: number;
}

// ── Rating scale shape (stored as JSON in question.ratingScale) ──

interface RatingScaleConfig {
  min: number;
  max: number;
  step?: number;
  labels?: Record<string, string>;
}

// ── Helpers ──

function parseOptions(raw: unknown): QuestionOption[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw as QuestionOption[];
}

function parseRatingScale(raw: unknown): RatingScaleConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as RatingScaleConfig;
}

// ── Per-question scoring ──

function scoreQuestion(
  question: ScoringQuestion,
  response: ResponseInput | undefined,
): ScoredResponse {
  const maxScore = question.weight;

  // If scoring is disabled for this question, it doesn't count
  if (!question.scoringEnabled) {
    return { questionId: question.id, score: 0, maxScore: 0 };
  }

  // No response → 0 score
  if (!response) {
    return { questionId: question.id, score: 0, maxScore };
  }

  let score = 0;

  switch (question.questionType) {
    case 'YES_NO': {
      // true = full points, false = 0
      if (response.booleanValue === true) {
        score = maxScore;
      }
      break;
    }

    case 'NUMBER': {
      // If the question has a max_value defined, score proportionally
      // Otherwise binary: any number → full points
      if (response.numericValue != null) {
        if (question.maxValue != null && question.maxValue > 0) {
          const val = Math.min(
            Math.max(response.numericValue, question.minValue ?? 0),
            question.maxValue,
          );
          const range = question.maxValue - (question.minValue ?? 0);
          score = range > 0 ? (val / question.maxValue) * maxScore : maxScore;
        } else {
          // Binary: answered = full points
          score = maxScore;
        }
      }
      break;
    }

    case 'RATING_SCALE': {
      const config = parseRatingScale(question.ratingScale);
      if (config && response.numericValue != null) {
        const range = config.max - config.min;
        const clamped = Math.min(
          Math.max(response.numericValue, config.min),
          config.max,
        );
        score = range > 0 ? ((clamped - config.min) / range) * maxScore : maxScore;
      }
      break;
    }

    case 'DROPDOWN': {
      const opts = parseOptions(question.options);
      if (response.answer) {
        const selected = opts.find(
          (o) => o.value === response.answer || o.label === response.answer,
        );
        if (selected) {
          if (selected.score != null) {
            // Use explicit score from option config
            score = (selected.score / Math.max(...opts.map((o) => o.score ?? 0), 1)) * maxScore;
          } else {
            // Binary: answered = full points
            score = maxScore;
          }
        }
      }
      break;
    }

    case 'MULTIPLE_CHOICE': {
      const opts = parseOptions(question.options);
      const selected = response.selectedOptions ?? [];
      if (selected.length > 0) {
        const correctOpts = opts.filter((o) => o.score != null && o.score > 0);
        if (correctOpts.length > 0) {
          // Sum scores of selected options vs total possible
          const totalPossible = correctOpts.reduce((s, o) => s + (o.score ?? 0), 0);
          const selectedScore = selected.reduce((s, val) => {
            const opt = opts.find((o) => o.value === val || o.label === val);
            return s + (opt?.score ?? 0);
          }, 0);
          score = totalPossible > 0
            ? Math.min(selectedScore / totalPossible, 1) * maxScore
            : maxScore;
        } else {
          // Binary: answered = full points
          score = maxScore;
        }
      }
      break;
    }

    case 'TEXT': {
      // Text questions: binary scoring — has answer = full points
      if (response.answer && response.answer.trim().length > 0) {
        score = maxScore;
      }
      break;
    }

    case 'IMAGE_UPLOAD': {
      // Presence = full points
      if (response.imageUrl) {
        score = maxScore;
      }
      break;
    }

    case 'FILE_UPLOAD': {
      if (response.fileUrl) {
        score = maxScore;
      }
      break;
    }

    case 'SIGNATURE': {
      if (response.signatureUrl) {
        score = maxScore;
      }
      break;
    }

    default:
      break;
  }

  return {
    questionId: question.id,
    score: Math.round(score * 100) / 100,
    maxScore: Math.round(maxScore * 100) / 100,
  };
}

// ── Full submission scoring ──

export function calculateScore(
  sections: ScoringSection[],
  responses: ResponseInput[],
): SubmissionScore {
  const responseMap = new Map<string, ResponseInput>();
  for (const r of responses) {
    responseMap.set(r.questionId, r);
  }

  const sectionScores: SectionScore[] = [];
  const responseScores: ScoredResponse[] = [];
  let totalWeightedScore = 0;
  let totalMaxWeightedScore = 0;

  for (const section of sections) {
    const scorableQuestions = section.questions.filter((q: ScoringQuestion) => q.scoringEnabled);

    let sectionRawScore = 0;
    let sectionRawMax = 0;

    for (const question of section.questions) {
      const scored = scoreQuestion(question, responseMap.get(question.id));
      responseScores.push(scored);
      sectionRawScore += scored.score;
      sectionRawMax += scored.maxScore;
    }

    const sectionPct =
      sectionRawMax > 0
        ? Math.round((sectionRawScore / sectionRawMax) * 10000) / 100
        : scorableQuestions.length === 0
        ? 100
        : 0;

    sectionScores.push({
      sectionId: section.id,
      title: section.title,
      score: Math.round(sectionRawScore * 100) / 100,
      maxScore: Math.round(sectionRawMax * 100) / 100,
      percentage: sectionPct,
      weight: section.weight,
    });

    // Weighted contribution
    totalWeightedScore += sectionRawScore * section.weight;
    totalMaxWeightedScore += sectionRawMax * section.weight;
  }

  const totalPct =
    totalMaxWeightedScore > 0
      ? Math.round((totalWeightedScore / totalMaxWeightedScore) * 10000) / 100
      : 0;

  return {
    totalScore: Math.round(totalWeightedScore * 100) / 100,
    maxScore: Math.round(totalMaxWeightedScore * 100) / 100,
    percentage: totalPct,
    sectionScores,
    responseScores,
  };
}
