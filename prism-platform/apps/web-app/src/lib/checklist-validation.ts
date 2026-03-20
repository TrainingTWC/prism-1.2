// ──────────────────────────────────────────
// Client-side checklist validation
// ──────────────────────────────────────────

import type {
  ProgramSection,
  ProgramQuestion,
  ResponseInput,
} from '../types/checklist';

export interface ValidationError {
  questionId: string;
  message: string;
}

/**
 * Evaluate whether a question should be visible based on its conditional logic
 * and the current set of responses.
 */
export function isQuestionVisible(
  question: ProgramQuestion,
  responsesMap: Map<string, ResponseInput>,
): boolean {
  const logic = question.conditionalLogic;
  if (!logic) return true;

  const parentResponse = responsesMap.get(logic.dependsOn);
  if (!parentResponse) return false;

  const parentVal =
    parentResponse.booleanValue?.toString() ??
    parentResponse.answer ??
    '';

  if (logic.showWhen === 'equals') return parentVal === logic.value;
  if (logic.showWhen === 'not_equals') return parentVal !== logic.value;

  return true;
}

/**
 * Validate all responses for a set of sections.
 * Returns an array of errors. Empty = valid.
 */
export function validateChecklist(
  sections: ProgramSection[],
  responses: ResponseInput[],
): ValidationError[] {
  const errors: ValidationError[] = [];
  const responseMap = new Map<string, ResponseInput>();
  for (const r of responses) {
    responseMap.set(r.questionId, r);
  }

  for (const section of sections) {
    for (const question of section.questions) {
      // Skip hidden questions
      if (!isQuestionVisible(question, responseMap)) continue;

      const resp = responseMap.get(question.id);

      // Required check
      if (question.required && !resp) {
        errors.push({ questionId: question.id, message: 'This field is required' });
        continue;
      }

      if (!resp) continue;

      // Per-type validation
      switch (question.questionType) {
        case 'TEXT': {
          const val = resp.answer ?? '';
          if (question.required && val.trim().length === 0) {
            errors.push({ questionId: question.id, message: 'Text answer is required' });
          }
          if (question.minLength != null && val.length < question.minLength) {
            errors.push({
              questionId: question.id,
              message: `Minimum ${question.minLength} characters`,
            });
          }
          if (question.maxLength != null && val.length > question.maxLength) {
            errors.push({
              questionId: question.id,
              message: `Maximum ${question.maxLength} characters`,
            });
          }
          break;
        }

        case 'NUMBER': {
          if (question.required && resp.numericValue == null) {
            errors.push({ questionId: question.id, message: 'Numeric value is required' });
          }
          if (resp.numericValue != null) {
            if (question.minValue != null && resp.numericValue < question.minValue) {
              errors.push({
                questionId: question.id,
                message: `Minimum value is ${question.minValue}`,
              });
            }
            if (question.maxValue != null && resp.numericValue > question.maxValue) {
              errors.push({
                questionId: question.id,
                message: `Maximum value is ${question.maxValue}`,
              });
            }
          }
          break;
        }

        case 'YES_NO': {
          if (question.required && resp.booleanValue == null) {
            errors.push({ questionId: question.id, message: 'Please select Yes or No' });
          }
          break;
        }

        case 'DROPDOWN': {
          if (question.required && !resp.answer) {
            errors.push({ questionId: question.id, message: 'Please select an option' });
          }
          break;
        }

        case 'MULTIPLE_CHOICE': {
          if (
            question.required &&
            (!resp.selectedOptions || resp.selectedOptions.length === 0)
          ) {
            errors.push({
              questionId: question.id,
              message: 'Select at least one option',
            });
          }
          break;
        }

        case 'RATING_SCALE': {
          if (question.required && resp.numericValue == null) {
            errors.push({ questionId: question.id, message: 'Rating is required' });
          }
          break;
        }

        case 'IMAGE_UPLOAD': {
          if (question.required && !resp.imageUrl) {
            errors.push({ questionId: question.id, message: 'Image is required' });
          }
          break;
        }

        case 'FILE_UPLOAD': {
          if (question.required && !resp.fileUrl) {
            errors.push({ questionId: question.id, message: 'File is required' });
          }
          break;
        }

        case 'SIGNATURE': {
          if (question.required && !resp.signatureUrl) {
            errors.push({ questionId: question.id, message: 'Signature is required' });
          }
          break;
        }
      }
    }
  }

  return errors;
}
