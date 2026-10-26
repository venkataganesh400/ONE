import React, { useEffect, useRef } from 'react';
import type { Question, StudentCheckinResponses } from '../types/index.ts';
import { QuestionCard } from './QuestionCard.tsx';
import { NavigationControls } from './NavigationControls.tsx';

interface QuestionScreenProps {
  question: Question;
  responses: StudentCheckinResponses;
  onUpdateResponses: (updater: (prev: StudentCheckinResponses) => StudentCheckinResponses) => void;
  onContinue: () => void;
  onBack: () => void;
  canBack: boolean;
  isLastStep: boolean;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  responses,
  onUpdateResponses,
  onContinue,
  onBack,
  canBack,
  isLastStep,
}) => {
  const textInputRef = useRef<HTMLInputElement>(null);

  const currentVal = responses[question.id as keyof StudentCheckinResponses];

  let canContinue = true;
  if (question.type === 'single') {
    canContinue = typeof currentVal === 'string' && currentVal.trim() !== '';
  } else if (question.type === 'multiple') {
    const list = Array.isArray(currentVal) ? currentVal : [];
    canContinue = list.length >= (question.minSelections || 1);
  } else if (question.type === 'text') {
    canContinue = typeof currentVal === 'string' && currentVal.trim().length > 0;
  }

  const handleOptionToggle = (optionId: string) => {
    if (question.type === 'single') {
      onUpdateResponses((prev) => ({
        ...prev,
        [question.id]: optionId,
      }));
    } else if (question.type === 'multiple') {
      onUpdateResponses((prev) => {
        const currentList = Array.isArray(prev[question.id as keyof StudentCheckinResponses])
          ? (prev[question.id as keyof StudentCheckinResponses] as string[])
          : [];
        const exists = currentList.includes(optionId);
        const updated = exists
          ? currentList.filter((id) => id !== optionId)
          : [...currentList, optionId];
        return {
          ...prev,
          [question.id]: updated,
        };
      });
    } else if (question.type === 'text') {
      const selectedOption = question.options.find((o) => o.id === optionId);
      if (selectedOption) {
        onUpdateResponses((prev) => ({
          ...prev,
          [question.id]: selectedOption.label,
        }));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      if (e.key === 'Enter') {
        e.preventDefault();
        if (canContinue) {
          onContinue();
        }
        return;
      }

      if (!isInput && e.key === 'Backspace' && canBack) {
        e.preventDefault();
        onBack();
        return;
      }

      if (!isInput && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (index >= 0 && index < question.options.length) {
          e.preventDefault();
          handleOptionToggle(question.options[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, canContinue, canBack, onContinue, onBack]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 flex flex-col min-h-[calc(100vh-120px)] justify-between">
      <div className="space-y-6 sm:space-y-8">
        {/* Step Metadata */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          <span>{question.category}</span>
          <span aria-hidden="true">·</span>
          <span>
            Step {String(question.stepNumber).padStart(2, '0')} of{' '}
            {String(question.totalSteps).padStart(2, '0')}
          </span>
        </div>

        {/* Question Headline & Subtitle */}
        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight leading-[1.15] text-balance">
            {question.title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed text-balance">
            {question.subtitle}
          </p>
        </div>

        {/* Text Input Mode (Step 2) */}
        {question.type === 'text' && (
          <div className="space-y-6 pt-2">
            <div>
              <label htmlFor="checkin-goal-input" className="sr-only">
                {question.title}
              </label>
              <input
                id="checkin-goal-input"
                ref={textInputRef}
                type="text"
                value={(currentVal as string) || ''}
                onChange={(e) =>
                  onUpdateResponses((prev) => ({
                    ...prev,
                    [question.id]: e.target.value,
                  }))
                }
                placeholder={question.placeholder || 'Type your target...'}
                className="w-full p-5 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 text-base sm:text-lg focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition"
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 block">
                Or tap a recommended academic target:
              </span>
              <div className="space-y-2.5">
                {question.options.map((opt) => {
                  const isSelected = (currentVal as string) === opt.label;
                  return (
                    <QuestionCard
                      key={opt.id}
                      option={opt}
                      isSelected={isSelected}
                      onSelect={() => handleOptionToggle(opt.id)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Single or Multiple Choice Mode */}
        {question.type !== 'text' && (
          <div
            className="space-y-3 pt-2"
            role={question.type === 'single' ? 'radiogroup' : 'group'}
            aria-label={question.title}
          >
            {question.options.map((option) => {
              const isSelected =
                question.type === 'single'
                  ? currentVal === option.id
                  : Array.isArray(currentVal) && currentVal.includes(option.id);

              return (
                <QuestionCard
                  key={option.id}
                  option={option}
                  isSelected={Boolean(isSelected)}
                  onSelect={() => handleOptionToggle(option.id)}
                  isMultiple={question.type === 'multiple'}
                />
              );
            })}
          </div>
        )}
      </div>

      <NavigationControls
        onBack={onBack}
        onContinue={onContinue}
        canBack={canBack}
        canContinue={canContinue}
        isLastStep={isLastStep}
      />
    </div>
  );
};
