import React, { useState } from 'react';
import {
  Sun,
  Moon,
  SlidersHorizontal,
  RefreshCw,
  LogOut,
  Sparkles,
  Database,
  ArrowUpRight,
  UserCheck,
  Calendar,
  Settings,
  LogIn,
} from 'lucide-react';
import { User } from 'firebase/auth';
import type { StudentTab, ThemeMode } from '../types/index.ts';
import type { SyncStatus } from '../hooks/useCloudSync.ts';
import type { CompressionMetrics } from '../utils/compression.ts';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  currentStep?: number;
  totalSteps?: number;
  user: User | null;
  authLoading: boolean;
  isSigningIn?: boolean;
  onOpenAuthModal: () => void;
  onSignOut: () => Promise<void>;
  syncStatus: SyncStatus;
  lastSyncTime: string | null;
  compressionMetrics: CompressionMetrics | null;
  onOpenCompressionModal: () => void;
  onOpenGeminiAdvisor?: () => void;
  onOpenTimetableModal?: () => void;
  onOpenWorkspaceSettings?: () => void;
}

const SECTION_LABELS: Record<StudentTab, string> = {
  planner: 'Daily Schedule & Smart Blocks',
  tasks: 'To-Do List & Course Assignments',
  study: 'Syllabus Mastery & GPA Ledger',
  focus: 'Deep Work Timer & Session Attribution',
  expenses: 'Expense Tracker & Allowance Pacing',
  notes: 'Lecture Markdown & Recall Flashcards',
  checkin: 'Daily Alignment Wizard',
};

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  activeTab,
  onSelectTab,
  currentStep = 1,
  totalSteps = 5,
  user,
  authLoading,
  isSigningIn = false,
  onOpenAuthModal,
  onSignOut,
  syncStatus,
  lastSyncTime,
  compressionMetrics,
  onOpenCompressionModal,
  onOpenGeminiAdvisor,
  onOpenTimetableModal,
  onOpenWorkspaceSettings,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isCheckin = activeTab === 'checkin';

  return (
    <header className="shrink-0 z-40 w-full border-b border-[#E8E2D8] dark:border-[#322A23] glossy-header transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-15 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Apple-style Minimal Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('planner')}
          className="inline-flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-[#1C1917] dark:text-[#FAF7F2] whitespace-nowrap shrink-0 focus:outline-none group"
          aria-label="One Workspace Home"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#3C2E25] to-[#1C1510] dark:from-[#FAF7F2] dark:to-[#E0D8CB] flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105 shrink-0">
            <span className="font-extrabold text-sm sm:text-base text-[#FAF7F2] dark:text-[#1C1917] tracking-tighter">
              1
            </span>
          </div>
          <span className="font-semibold tracking-tight">One</span>
          <span className="hidden lg:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#EFEAE1] dark:bg-[#28221D] text-[#665D54] dark:text-[#A89E92] font-normal">
            Pro
          </span>
        </button>

        {/* Zone 2: Contextual Subtitle or Step Counter */}
        {isCheckin ? (
          <div className="flex items-center gap-2 text-xs font-mono text-[#665D54] dark:text-[#9E9387]">
            <span>
              <strong className="text-[#1C1917] dark:text-[#F7F4EE] font-semibold">
                {String(currentStep).padStart(2, '0')}
              </strong>{' '}
              / {String(totalSteps).padStart(2, '0')}
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onSelectTab('planner')}
              className="inline-flex items-center gap-1 text-[#665D54] dark:text-[#D6CFC4] hover:text-[#1C1917] dark:hover:text-white underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              <span>Skip</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-[#665D54] dark:text-[#9E9387] truncate">
            <span className="font-medium text-[#1C1917] dark:text-[#F7F4EE]">
              Student Workspace
            </span>
            <span aria-hidden="true" className="text-[#B8AEA2]">/</span>
            <span className="truncate">{SECTION_LABELS[activeTab]}</span>
          </div>
        )}

        {/* Zone 3: Production Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Timetable Trigger */}
          {onOpenTimetableModal && (
            <button
              type="button"
              onClick={onOpenTimetableModal}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E0D8CB] dark:border-[#383028] bg-white/70 dark:bg-[#201C18]/80 text-[#3C2E25] dark:text-[#E8E2D8] hover:bg-white dark:hover:bg-[#28231E] transition text-xs font-medium shadow-2xs"
              title="Class Timetable"
            >
              <Calendar className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
              <span>Timetable</span>
            </button>
          )}

          {/* Gemini Academic AI Strategist Trigger (Desktop/Tablet) */}
          {onOpenGeminiAdvisor && (
            <button
              type="button"
              onClick={onOpenGeminiAdvisor}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FAF7F2] to-[#F2EDE4] dark:from-[#25201B] dark:to-[#1C1713] border border-[#D8A775]/50 text-xs font-semibold text-[#3C2E25] dark:text-[#FAF7F2] shadow-2xs hover:border-[#8A5836] transition"
              title="Open Gemini Academic AI Strategist & Schedule Planner"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
              <span>Gemini AI</span>
            </button>
          )}

          {/* Compression Badge & Modal Trigger (Desktop) */}
          <button
            type="button"
            onClick={onOpenCompressionModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E0D8CB] dark:border-[#383028] bg-white/70 dark:bg-[#201C18]/80 text-[#3C2E25] dark:text-[#E8E2D8] hover:bg-white dark:hover:bg-[#28231E] transition text-xs font-mono shadow-2xs"
            title="Inspect Data Compression & Storage Savings"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#C4976A]" />
            <span>{compressionMetrics ? `${compressionMetrics.ratioPercent}% Saved` : 'Compressed'}</span>
          </button>

          {/* Real-time Cloud Sync Pill (Desktop/Tablet) */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E0D8CB] dark:border-[#383028] bg-white/70 dark:bg-[#201C18]/80 text-xs font-medium text-[#5C5248] dark:text-[#B5AAA0] shadow-2xs cursor-pointer"
            onClick={onOpenCompressionModal}
            title={
              user
                ? syncStatus === 'synced'
                  ? `Cloud synchronized at ${lastSyncTime || 'now'}`
                  : syncStatus === 'syncing'
                  ? 'Syncing compressed data to Firestore...'
                  : 'Cloud ready'
                : 'Local student mode. Click to view storage.'
            }
          >
            {user ? (
              syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#C4976A] animate-spin" />
                  <span className="hidden lg:inline text-[11px] font-mono">Syncing</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                  <span className="hidden lg:inline text-[11px] font-mono">Cloud Synced</span>
                </>
              )
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                <span className="hidden lg:inline text-[11px] font-mono">Local Store</span>
              </>
            )}
          </div>

          {/* User Profile / Auth Trigger */}
          {authLoading ? (
            <div className="w-8 h-8 rounded-full bg-[#EAE4D9] dark:bg-[#2A231C] animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition focus:outline-none"
                aria-label="User Account Menu"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#D6CFC4] dark:border-[#40372F]"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold text-xs flex items-center justify-center">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E8E2D8] dark:border-[#322A23] shadow-xl z-40 text-xs animate-fadeIn">
                    <div className="px-3 py-2 border-b border-[#F0EBE2] dark:divide-[#28221D] mb-1">
                      <p className="font-semibold text-[#1C1917] dark:text-[#F7F4EE] truncate">
                        {user.displayName || (user.isAnonymous ? 'Guest Student' : 'Student User')}
                      </p>
                      <p className="text-[11px] text-[#665D54] dark:text-[#9E9387] truncate font-mono">
                        {user.email || (user.isAnonymous ? 'Anonymous Local UID' : '')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenCompressionModal();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#3C2E25] dark:text-[#E8E2D8] hover:bg-[#FAF7F2] dark:hover:bg-[#28221D] transition"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Storage &amp; Compression</span>
                    </button>

                    {onOpenWorkspaceSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenWorkspaceSettings();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#3C2E25] dark:text-[#E8E2D8] hover:bg-[#FAF7F2] dark:hover:bg-[#28221D] transition"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Backup &amp; Export</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        setShowUserMenu(false);
                        await onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={isSigningIn}
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] text-xs font-semibold hover:opacity-90 transition shadow-2xs disabled:opacity-60"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Sign Up</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E0D8CB] dark:border-[#383028] bg-white/70 dark:bg-[#201C18]/80 text-[#3C2E25] dark:text-[#E8E2D8] hover:bg-white dark:hover:bg-[#28231E] transition text-xs font-medium whitespace-nowrap shadow-2xs"
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Workspace Settings / Backup Modal Trigger */}
          {onOpenWorkspaceSettings && (
            <button
              type="button"
              onClick={onOpenWorkspaceSettings}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E0D8CB] dark:border-[#383028] bg-white/70 dark:bg-[#201C18]/80 text-[#3C2E25] dark:text-[#E8E2D8] hover:bg-white dark:hover:bg-[#28231E] transition text-xs font-medium whitespace-nowrap shadow-2xs"
              title="Workspace Data & Backup Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {!isCheckin && (
            <button
              type="button"
              onClick={() => onSelectTab('checkin')}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl glossy-active-tab transition text-xs font-semibold whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Check-in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
