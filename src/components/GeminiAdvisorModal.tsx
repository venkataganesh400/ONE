import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Shield,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { StudentWorkspaceData } from '../types/index.ts';
import {
  requestAcademicCoach,
  AcademicCoachResponse,
  AcademicCoachSuggestion,
} from '../utils/aiClient.ts';

interface GeminiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StudentWorkspaceData;
  onUpdateData: (updater: (prev: StudentWorkspaceData) => StudentWorkspaceData) => void;
}

export const GeminiAdvisorModal: React.FC<GeminiAdvisorModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateData,
}) => {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<AcademicCoachResponse | null>(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateStrategy = async () => {
    setLoading(true);
    setApplied(false);
    try {
      const res = await requestAcademicCoach(data);
      setStrategy(res);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyScheduleAndPriority = () => {
    if (!strategy) return;
    onUpdateData((prev) => ({
      ...prev,
      dailyPriority: strategy.dailyFocusRecommendation || prev.dailyPriority,
      scheduleCoachNote: strategy.scheduleRationale || prev.scheduleCoachNote,
      scheduleBlocks: strategy.blocks.length > 0 ? strategy.blocks : prev.scheduleBlocks,
    }));
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const getCategoryIcon = (category: AcademicCoachSuggestion['category']) => {
    switch (category) {
      case 'schedule':
        return Clock;
      case 'exam_prep':
        return TrendingUp;
      case 'budget':
        return Shield;
      case 'focus':
        return Compass;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1A1714] border border-[#E8E2D8] dark:border-[#332C25] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gemini-advisor-title"
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-[#E8E2D8] dark:border-[#2C2520] flex items-center justify-between bg-[#FAF7F2] dark:bg-[#1E1B18]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3C2E25] to-[#241A14] dark:from-[#FAF7F2] dark:to-[#DED8CB] text-white dark:text-[#1C1917] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#D8A775] dark:text-[#8A5836]" />
            </div>
            <div>
              <h2 id="gemini-advisor-title" className="text-base sm:text-lg font-bold text-[#1C1917] dark:text-[#F7F4EE] leading-tight">
                Gemini Academic AI Strategist
              </h2>
              <p className="text-xs text-[#665D54] dark:text-[#9E9387]">
                Intelligent schedule planning, productivity suggestions &amp; workload pacing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#665D54] dark:text-[#9E9387] hover:bg-black/5 dark:hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {!strategy && !loading && (
            <div className="text-center py-8 px-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF7F2] dark:bg-[#25201B] border border-[#E8E2D8] dark:border-[#332C25] flex items-center justify-center text-[#8A5836] dark:text-[#C4976A]">
                <Compass className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                  Plan Your Academic Day with Gemini
                </h3>
                <p className="text-xs text-[#665D54] dark:text-[#9E9387] leading-relaxed">
                  Gemini analyzes your assignments, upcoming exams, course hours, and safe spending limit to structure an optimal chronological time-block schedule.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateStrategy}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] text-xs sm:text-sm font-semibold hover:opacity-90 transition shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#D8A775] dark:text-[#8A5836]" />
                <span>Generate Strategy &amp; Schedule</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#8A5836] dark:text-[#C4976A]" />
              <p className="text-sm font-semibold text-[#1C1917] dark:text-[#FAF7F2]">
                Analyzing academic workload with Gemini...
              </p>
              <p className="text-xs text-[#665D54] dark:text-[#9E9387]">
                Optimizing time-blocks around cognitive energy and deadlines
              </p>
            </div>
          )}

          {strategy && !loading && (
            <div className="space-y-5 animate-fadeIn">
              {/* Daily Priority Recommendation */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FAF7F2] to-[#F3EFE7] dark:from-[#24201C] dark:to-[#1B1815] border border-[#E8E2D8] dark:border-[#38312A] space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A5836] dark:text-[#C4976A] font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Recommended Daily Focus Anchor
                </span>
                <p className="text-base sm:text-lg font-bold text-[#1C1917] dark:text-[#FAF7F2] leading-snug">
                  {strategy.dailyFocusRecommendation}
                </p>
                <p className="text-xs text-[#665D54] dark:text-[#9E9387]">
                  {strategy.scheduleRationale}
                </p>
              </div>

              {/* Strategic Suggestions Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#665D54] dark:text-[#9E9387]">
                  Personalized Academic Strategy ({strategy.suggestions.length} Tips)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {strategy.suggestions.map((item, idx) => {
                    const Icon = getCategoryIcon(item.category);
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E8E2D8] dark:border-[#322A23] space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#FAF7F2] dark:bg-[#28221D] flex items-center justify-center text-[#8A5836] dark:text-[#C4976A]">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-[#665D54] dark:text-[#9E9387] leading-relaxed">
                          {item.description}
                        </p>
                        <div className="text-[11px] font-mono text-[#8A5836] dark:text-[#C4976A] pt-0.5">
                          Tip: {item.actionTip}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Generated Time-Block Schedule Preview */}
              {strategy.blocks.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#665D54] dark:text-[#9E9387]">
                      Generated Timeline ({strategy.blocks.length} Blocks)
                    </h3>
                    <span className="text-[11px] font-mono text-[#8C7D70]">
                      Chronological Order
                    </span>
                  </div>

                  <div className="divide-y divide-[#F0EBE2] dark:divide-[#28221D] border border-[#E8E2D8] dark:border-[#322A23] rounded-2xl overflow-hidden bg-white dark:bg-[#1E1B18]">
                    {strategy.blocks.map((block, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-[#8C7D70] shrink-0 font-medium">
                            {block.startTime}–{block.endTime}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-[#25201B] font-mono font-bold text-[#3C2E25] dark:text-[#FAF7F2] shrink-0">
                            {block.course}
                          </span>
                          <span className="text-[#1C1917] dark:text-[#FAF7F2] truncate font-medium">
                            {block.title}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#8C7D70] shrink-0">
                          {block.durationMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-[#E8E2D8] dark:border-[#2C2520] bg-[#FAF7F2] dark:bg-[#1E1B18] flex items-center justify-between gap-3">
          {strategy ? (
            <>
              <button
                type="button"
                onClick={handleGenerateStrategy}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs text-[#665D54] dark:text-[#9E9387] hover:text-[#1C1917] dark:hover:text-[#FAF7F2] transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                onClick={handleApplyScheduleAndPriority}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  applied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] hover:opacity-90'
                }`}
              >
                {applied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Applied to Today&apos;s Schedule!</span>
                  </>
                ) : (
                  <>
                    <span>Apply Schedule to Day</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl border border-[#D6CFC4] dark:border-[#383028] text-xs font-medium text-[#665D54] dark:text-[#9E9387]"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
