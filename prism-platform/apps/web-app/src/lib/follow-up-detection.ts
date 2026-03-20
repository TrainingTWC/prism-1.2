// ──────────────────────────────────────────
// Follow-Up Detection Logic
// ──────────────────────────────────────────
// Scans a completed submission for failed responses
// and produces the data needed to create a follow-up.
// ──────────────────────────────────────────

import type {
  ProgramDetail,
  ProgramQuestion,
  ProgramSection,
  ResponseInput,
  ProgramResponseDetail,
} from '../types/checklist';
import type { FailedQuestion } from '../types/follow-up';

/**
 * Determine if a single response constitutes a "failure".
 *
 * Rules:
 *   YES_NO          → booleanValue === false  (a "No" answer)
 *   RATING_SCALE    → score below 50% of maxScore  (ratingScale.max)
 *   DROPDOWN        → option has score === 0
 *   MULTIPLE_CHOICE → any selected option has score === 0
 *   NUMBER          → numericValue below minValue threshold
 *
 * For free-text, image, signature, file — never auto-fail.
 */
export function isResponseFailed(
  question: ProgramQuestion,
  response: ResponseInput | ProgramResponseDetail,
): boolean {
  switch (question.questionType) {
    case 'YES_NO': {
      // A "No" answer is a failure
      const boolVal =
        'booleanValue' in response ? response.booleanValue : undefined;
      return boolVal === false;
    }

    case 'RATING_SCALE': {
      const numVal =
        'numericValue' in response ? response.numericValue : undefined;
      if (numVal == null) return false;
      const scale = question.ratingScale;
      if (!scale) return false;
      const threshold = (scale.max - scale.min) * 0.5 + scale.min;
      return numVal < threshold;
    }

    case 'DROPDOWN': {
      const answer =
        'answer' in response ? response.answer : undefined;
      if (!answer) return false;
      const opt = question.options.find((o) => o.value === answer);
      return opt ? opt.score === 0 : false;
    }

    case 'MULTIPLE_CHOICE': {
      const selected =
        'selectedOptions' in response ? response.selectedOptions : undefined;
      if (!selected || selected.length === 0) return false;
      return selected.some((val) => {
        const opt = question.options.find((o) => o.value === val);
        return opt ? opt.score === 0 : false;
      });
    }

    case 'NUMBER': {
      const numVal =
        'numericValue' in response ? response.numericValue : undefined;
      if (numVal == null) return false;
      if (question.minValue != null && numVal < question.minValue) return true;
      return false;
    }

    default:
      return false;
  }
}

/**
 * Build a human-readable answer string for display.
 */
function formatAnswer(
  question: ProgramQuestion,
  response: ResponseInput | ProgramResponseDetail,
): string {
  switch (question.questionType) {
    case 'YES_NO': {
      const b = 'booleanValue' in response ? response.booleanValue : undefined;
      return b === true ? 'Yes' : b === false ? 'No' : '—';
    }
    case 'RATING_SCALE':
    case 'NUMBER': {
      const n = 'numericValue' in response ? response.numericValue : undefined;
      return n != null ? String(n) : '—';
    }
    case 'DROPDOWN': {
      const a = 'answer' in response ? response.answer : undefined;
      const opt = question.options.find((o) => o.value === a);
      return opt?.label ?? a ?? '—';
    }
    case 'MULTIPLE_CHOICE': {
      const sel =
        'selectedOptions' in response ? response.selectedOptions : undefined;
      if (!sel || sel.length === 0) return '—';
      return sel
        .map((v) => question.options.find((o) => o.value === v)?.label ?? v)
        .join(', ');
    }
    default: {
      const txt = 'answer' in response ? response.answer : undefined;
      return txt ?? '—';
    }
  }
}

/**
 * Build an issue description from the question + failed answer.
 */
function buildIssueDescription(
  question: ProgramQuestion,
  sectionTitle: string,
  answer: string,
): string {
  return `[${sectionTitle}] "${question.text}" — Response: ${answer}`;
}

/**
 * Scan all responses against the program structure and return the set
 * of questions that failed.
 */
export function detectFailedQuestions(
  program: ProgramDetail,
  responses: ResponseInput[],
  /** If server-side responses with IDs are available, use those for responseId */
  serverResponses?: ProgramResponseDetail[],
): FailedQuestion[] {
  const failed: FailedQuestion[] = [];
  const responseMap = new Map<string, ResponseInput>();
  for (const r of responses) responseMap.set(r.questionId, r);

  const serverMap = new Map<string, ProgramResponseDetail>();
  if (serverResponses) {
    for (const r of serverResponses) serverMap.set(r.questionId, r);
  }

  for (const section of program.sections) {
    for (const question of section.questions) {
      const resp = responseMap.get(question.id);
      if (!resp) continue;

      if (isResponseFailed(question, resp)) {
        const answer = formatAnswer(question, resp);
        const serverResp = serverMap.get(question.id);

        failed.push({
          questionId: question.id,
          responseId: serverResp?.id ?? '', // empty if not yet available from server
          questionText: question.text,
          questionType: question.questionType,
          sectionTitle: section.title,
          originalAnswer: answer,
          issueDescription: buildIssueDescription(question, section.title, answer),
        });
      }
    }
  }

  return failed;
}

/**
 * Build a flat lookup from questionId → question for quick access.
 */
export function buildQuestionIndex(
  sections: ProgramSection[],
): Map<string, ProgramQuestion> {
  const map = new Map<string, ProgramQuestion>();
  for (const s of sections) {
    for (const q of s.questions) {
      map.set(q.id, q);
    }
  }
  return map;
}

/**
 * Quick check: does this submission have any failures?
 */
export function hasFailures(
  program: ProgramDetail,
  responses: ResponseInput[],
): boolean {
  return detectFailedQuestions(program, responses).length > 0;
}
