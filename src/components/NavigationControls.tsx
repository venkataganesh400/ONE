import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface NavigationControlsProps {
  onBack?: () => void;
  onContinue: () => void;
  canBack: boolean;
  canContinue: boolean;
  isLastStep: boolean;
  continueText?: string;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  onBack,
  onContinue,
  canBack,
  canContinue,
  isLastStep,
  continueText,
}) => {
  return (
    <div className="sticky bottom-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md pt-4 pb-6 mt-8 border-t border-zinc-200 dark:border-zinc-900/60 flex items-center justify-between gap-4 transition-colors">
      {/* Back Button */}
      {canBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700 transition active:scale-95 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0"
          aria-label="Go to previous question"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      ) : (
        <div className="w-20" aria-hidden="true" />
      )}

      {/* Continue / Complete Button */}
      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className="flex items-center gap-2 px-7 py-3 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black hover:opacity-90 transition text-xs sm:text-sm font-semibold active:scale-95 disabled:opacity-30 disabled:pointer-events-none whitespace-nowrap shrink-0"
        aria-label={isLastStep ? 'Complete check-in and open student workspace' : 'Continue to next question'}
      >
        <span>{continueText || (isLastStep ? 'Apply & Open Student Hub' : 'Continue')}</span>
        {isLastStep ? <Check className="w-4 h-4 stroke-[2.5]" /> : <ArrowRight className="w-4 h-4" />}
        <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 dark:text-zinc-700 bg-zinc-800 dark:bg-zinc-200 rounded">
          Enter
        </kbd>
      </button>
    </div>
  );
};
