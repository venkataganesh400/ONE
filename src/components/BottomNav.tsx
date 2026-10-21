import React from 'react';
import {
  LayoutGrid,
  CheckSquare,
  GraduationCap,
  Timer,
  Wallet,
  BookText,
} from 'lucide-react';
import type { StudentTab } from '../types/index.ts';

interface BottomNavProps {
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  pendingTaskCount: number;
}

const NAV_ITEMS: {
  id: StudentTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'planner', label: 'Overview', icon: LayoutGrid },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'study', label: 'Studies', icon: GraduationCap },
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'expenses', label: 'Expenses', icon: Wallet },
  { id: 'notes', label: 'Notes', icon: BookText },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingTaskCount,
}) => {
  if (activeTab === 'checkin') {
    return null;
  }

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.id === activeTab)
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-2 sm:px-6 pb-[max(0.625rem,env(safe-area-inset-bottom,0.625rem))] sm:pb-5">
      <nav
        aria-label="Student workspace navigation"
        className="pointer-events-auto relative w-full max-w-[420px] sm:max-w-[660px] overflow-hidden glossy-dock rounded-[26px] sm:rounded-full p-1 sm:p-1.5"
      >
        {/* Top Half Glossy Specular Sheen Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 via-white/18 to-transparent dark:from-white/16 dark:via-white/5 dark:to-transparent rounded-t-[26px] sm:rounded-t-full"
        />

        {/* Top Specular Crest Line */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white dark:via-white/50 to-transparent"
        />

        <div className="relative z-10 grid grid-cols-6 items-center w-full">
          {/* Smooth Sliding Glossy Pill Indicator */}
          <div
            aria-hidden="true"
            style={{
              width: `${100 / NAV_ITEMS.length}%`,
              transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
            }}
            className="pointer-events-none absolute inset-y-0 left-0 rounded-[20px] sm:rounded-full glossy-active-tab smooth-spring"
          />

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const showTaskCount = item.id === 'tasks' && pendingTaskCount > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative z-10 min-w-0 min-h-[46px] sm:min-h-[44px] px-0.5 sm:px-3 py-1.5 sm:py-2 rounded-[20px] sm:rounded-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 smooth-spring active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:focus-visible:outline-white ${
                  isActive
                    ? 'text-white dark:text-zinc-950 font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-950/5 dark:hover:bg-white/6 font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 smooth-spring ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                />
                <span className="text-[10px] sm:text-xs tracking-tight leading-none truncate max-w-full">
                  {item.label}
                </span>
                {showTaskCount && (
                  <span
                    className={`hidden md:inline-block text-[10px] font-mono tabular-nums leading-none smooth-spring ${
                      isActive
                        ? 'text-zinc-300 dark:text-zinc-600'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {pendingTaskCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
