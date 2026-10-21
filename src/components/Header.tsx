import React from 'react';
import { Sun, Moon, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import type { StudentTab, ThemeMode } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  currentStep?: number;
  totalSteps?: number;
}

const SECTION_LABELS: Record<StudentTab, string> = {
  planner: 'Daily Overview & AI Time-Block Schedule',
  tasks: 'Coursework Assignments & AI Task Breakdown',
  study: 'Syllabus Mastery & Semester GPA Ledger',
  focus: 'Deep Work Pomodoro & Session Attribution',
  expenses: 'Campus Allowance & Safe-Spend Pacing',
  notes: 'Lecture Markdown & Active Recall Flashcards',
  checkin: 'Daily Academic Alignment Wizard',
};

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  activeTab,
  onSelectTab,
  currentStep = 1,
  totalSteps = 5,
}) => {
  const isCheckin = activeTab === 'checkin';

  return (
    <header className="shrink-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 glossy-header transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand mark + single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('planner')}
          className="inline-flex items-center gap-2 text-base sm:text-lg font-extrabold tracking-tight text-zinc-950 dark:text-white whitespace-nowrap shrink-0 focus:outline-none group"
          aria-label="One Student Workspace Home"
        >
          <svg
            viewBox="0 0 512 512"
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg shadow-xs transition-transform duration-200 group-hover:scale-105 shrink-0"
            aria-hidden="true"
          >
            <rect width="512" height="512" rx="116" className="fill-zinc-950 dark:fill-zinc-900" />
            <rect
              width="504"
              height="504"
              x="4"
              y="4"
              rx="112"
              fill="none"
              className="stroke-zinc-800 dark:stroke-zinc-700"
              strokeWidth="12"
            />
            <circle
              cx="256"
              cy="256"
              r="168"
              fill="none"
              className="stroke-zinc-800 dark:stroke-zinc-800"
              strokeWidth="16"
            />
            <path
              d="M 256 88 A 168 168 0 0 1 424 256"
              fill="none"
              stroke="#ffffff"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <polygon points="196,204 244,156 244,204" fill="#a1a1aa" />
            <rect x="244" y="156" width="44" height="200" rx="8" fill="#ffffff" />
          </svg>
          <span>One</span>
        </button>

        {/* Zone 2: Contextual Section Title or Check-in Step Counter */}
        {isCheckin ? (
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <span>
              <strong className="text-zinc-950 dark:text-white font-semibold">
                {String(currentStep).padStart(2, '0')}
              </strong>{' '}
              / {String(totalSteps).padStart(2, '0')}
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onSelectTab('planner')}
              className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Skip</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 truncate">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Student Workspace
            </span>
            <span aria-hidden="true">/</span>
            <span className="truncate">{SECTION_LABELS[activeTab]}</span>
          </div>
        )}

        {/* Zone 3: Theme Toggle & Check-in / Install Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-zinc-300/90 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition text-xs font-medium whitespace-nowrap shrink-0"
            aria-label={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5" />
                <span>Bright</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </>
            )}
          </button>

          {!isCheckin && (
            <button
              type="button"
              onClick={() => onSelectTab('checkin')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full glossy-active-tab hover:opacity-95 transition text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="sm:hidden">Check-in</span>
              <span className="hidden sm:inline">Daily Check-in</span>
            </button>
          )}

          <PWAInstallButton compact />
        </div>
      </div>
    </header>
  );
};
