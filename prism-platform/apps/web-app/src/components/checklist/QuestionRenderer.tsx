'use client';

import React from 'react';
import type { ProgramQuestion, ResponseInput } from '../../types/checklist';
import {
  TextQuestion,
  NumberQuestion,
  YesNoQuestion,
  DropdownQuestion,
  MultipleChoiceQuestion,
  RatingScaleQuestion,
  ImageUploadQuestion,
  FileUploadQuestion,
  SignatureQuestion,
} from './questions';

interface Props {
  question: ProgramQuestion;
  response: ResponseInput;
  onChange: (response: ResponseInput) => void;
  onUpload: (file: File) => Promise<string>;
  error?: string;
}

export function QuestionRenderer({
  question,
  response,
  onChange,
  onUpload,
  error,
}: Props) {
  const updateResponse = (patch: Partial<ResponseInput>) => {
    onChange({ ...response, ...patch });
  };

  const renderInput = () => {
    switch (question.questionType) {
      case 'TEXT':
        return (
          <TextQuestion
            questionId={question.id}
            value={response.answer ?? ''}
            onChange={(v) => updateResponse({ answer: v })}
            minLength={question.minLength}
            maxLength={question.maxLength}
            required={question.required}
            error={error}
          />
        );

      case 'NUMBER':
        return (
          <NumberQuestion
            questionId={question.id}
            value={response.numericValue ?? null}
            onChange={(v) => updateResponse({ numericValue: v ?? undefined })}
            min={question.minValue}
            max={question.maxValue}
            required={question.required}
            error={error}
          />
        );

      case 'YES_NO':
        return (
          <YesNoQuestion
            questionId={question.id}
            value={response.booleanValue ?? null}
            onChange={(v) => updateResponse({ booleanValue: v })}
            required={question.required}
            error={error}
          />
        );

      case 'DROPDOWN':
        return (
          <DropdownQuestion
            questionId={question.id}
            value={response.answer ?? ''}
            onChange={(v) => updateResponse({ answer: v })}
            options={question.options}
            required={question.required}
            error={error}
          />
        );

      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceQuestion
            questionId={question.id}
            value={response.selectedOptions ?? []}
            onChange={(v) => updateResponse({ selectedOptions: v })}
            options={question.options}
            required={question.required}
            error={error}
          />
        );

      case 'RATING_SCALE':
        return question.ratingScale ? (
          <RatingScaleQuestion
            questionId={question.id}
            value={response.numericValue ?? null}
            onChange={(v) => updateResponse({ numericValue: v })}
            config={question.ratingScale}
            required={question.required}
            error={error}
          />
        ) : null;

      case 'IMAGE_UPLOAD':
        return (
          <ImageUploadQuestion
            questionId={question.id}
            value={response.imageUrl ?? null}
            values={response.imageUrls}
            onChange={(v) => updateResponse({ imageUrl: v })}
            onMultiChange={(urls) => updateResponse({ imageUrls: urls, imageUrl: urls[0] ?? '' })}
            onUpload={onUpload}
            allowAnnotation={question.allowAnnotation}
            onAnnotationChange={(ann) => updateResponse({ annotation: ann })}
            error={error}
          />
        );

      case 'FILE_UPLOAD':
        return (
          <FileUploadQuestion
            questionId={question.id}
            value={response.fileUrl ?? null}
            onChange={(v) => updateResponse({ fileUrl: v })}
            onUpload={onUpload}
            required={question.required}
            error={error}
          />
        );

      case 'SIGNATURE':
        return (
          <SignatureQuestion
            questionId={question.id}
            value={response.signatureUrl ?? null}
            onChange={(v) => updateResponse({ signatureUrl: v })}
            error={error}
          />
        );

      default:
        return <p className="text-sm text-obsidian-500">Unsupported question type</p>;
    }
  };

  return (
    <div id={`q-${question.id}`} className="space-y-2">
      {/* Question header */}
      <div className="flex items-start gap-2">
        <label htmlFor={question.id} className="text-sm font-medium text-obsidian-100">
          {question.text}
          {question.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {question.scoringEnabled && (
          <span className="ml-auto shrink-0 rounded-full bg-[rgba(13,140,99,0.08)] px-2 py-0.5
            text-[10px] font-medium text-[#10b37d]">
            {question.weight} pts
          </span>
        )}
      </div>

      {question.description && (
        <p className="text-xs text-obsidian-500">{question.description}</p>
      )}

      {/* Question input */}
      {renderInput()}

      {/* Optional comment field */}
      {question.allowComments && (
        <div className="pt-1">
          <textarea
            value={response.comment ?? ''}
            onChange={(e) => updateResponse({ comment: e.target.value })}
            placeholder="Add a comment..."
            rows={2}
            className="w-full rounded-lg bg-obsidian-800/60 border border-obsidian-600/30 px-3 py-2
              text-xs text-obsidian-100 placeholder:text-obsidian-500 focus:outline-none
              focus:ring-1 focus:ring-[#0d8c63]/40 resize-y"
          />
        </div>
      )}
    </div>
  );
}
