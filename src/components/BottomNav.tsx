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
  { id: 'planner', label: 'Home', icon: LayoutGrid },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'study', label: 'Study', icon: GraduationCap },
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'expenses', label: 'Wallet', icon: Wallet },
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
        {/* Top Specular Crest Line */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white dark:via-white/30 to-transparent"
        />

        <div className="relative z-10 grid grid-cols-6 items-center w-full">
          {/* Smooth Sliding Pill Indicator */}
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
                className={`relative z-10 min-w-0 min-h-[44px] sm:min-h-[44px] px-0.5 sm:px-3 py-1 sm:py-2 rounded-[20px] sm:rounded-full flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 smooth-spring active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3C2E25] dark:focus-visible:outline-[#FAF7F2] ${
                  isActive
                    ? 'text-white dark:text-[#1A1613] font-semibold'
                    : 'text-[#665D54] dark:text-[#A89E92] hover:text-[#1C1917] dark:hover:text-[#FAF7F2] font-medium'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 smooth-spring ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                />
                <span className="text-[9.5px] sm:text-xs tracking-tight leading-none truncate max-w-full block">
                  {item.label}
                </span>
                {showTaskCount && (
                  <span
                    className={`hidden md:inline-block text-[10px] font-mono tabular-nums leading-none smooth-spring ${
                      isActive
                        ? 'text-[#D6CFC4] dark:text-[#524940]'
                        : 'text-[#8C7D70] dark:text-[#6E6357]'
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
