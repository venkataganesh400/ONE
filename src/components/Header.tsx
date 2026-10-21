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

const WORKSPACE_TABS: { id: StudentTab; label: string }[] = [
  { id: 'planner', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'study', label: 'Studies' },
  { id: 'focus', label: 'Focus' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'notes', label: 'Notes' },
];

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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-900 bg-white/90 dark:bg-black/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element Brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('planner')}
          className="text-lg font-extrabold tracking-tight text-zinc-950 dark:text-white whitespace-nowrap shrink-0 focus:outline-none"
          aria-label="One Student Workspace Home"
        >
          One
        </button>

        {/* Zone 2: Navigation links or Check-in Step Counter */}
        {isCheckin ? (
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
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
              <span>Skip to Student Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <nav
            className="hidden md:flex items-center gap-6 text-sm font-medium"
            aria-label="Student workspace navigation"
          >
            {WORKSPACE_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-semibold'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: Theme Toggle & Check-in / Install Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition text-xs font-medium whitespace-nowrap shrink-0"
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black hover:opacity-90 transition text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Daily Check-in</span>
            </button>
          )}

          <PWAInstallButton compact />
        </div>
      </div>
    </header>
  );
};
