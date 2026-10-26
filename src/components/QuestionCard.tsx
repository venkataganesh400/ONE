import React from 'react';
import { Check } from 'lucide-react';
import type { QuestionOption } from '../types/index.ts';

interface QuestionCardProps {
  option: QuestionOption;
  isSelected: boolean;
  onSelect: () => void;
  isMultiple?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  option,
  isSelected,
  onSelect,
  isMultiple = false,
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      role={isMultiple ? 'checkbox' : 'radio'}
      aria-checked={isSelected}
      className={`group w-full text-left p-5 sm:p-6 rounded-3xl border transition-all duration-150 cursor-pointer outline-none relative ${
        isSelected
          ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-950 dark:border-white text-zinc-950 dark:text-white ring-1 ring-zinc-950/15 dark:ring-white/20'
          : 'bg-zinc-50/70 dark:bg-zinc-950/70 border-zinc-200 dark:border-zinc-800/90 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Radio / Checkbox Indicator */}
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150 border ${
              isSelected
                ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:border-white dark:text-black'
                : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-transparent group-hover:border-zinc-500'
            }`}
            aria-hidden="true"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>

          {/* Text Labels */}
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-base sm:text-lg font-semibold text-zinc-950 dark:text-white tracking-tight">
                {option.label}
              </span>
              {option.badge && (
                <>
                  <span className="text-zinc-400 dark:text-zinc-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    {option.badge}
                  </span>
                </>
              )}
            </div>

            {option.description && (
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {option.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Keyboard Shortcut */}
        {option.shortcut && (
          <div
            className={`hidden sm:flex items-center justify-center w-6 h-6 rounded-md font-mono text-xs border shrink-0 transition ${
              isSelected
                ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white'
                : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-950 text-zinc-500'
            }`}
            title={`Press '${option.shortcut}' on your keyboard`}
          >
            {option.shortcut}
          </div>
        )}
      </div>
    </button>
  );
};
