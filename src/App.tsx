/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import type {
  StudentCheckinResponses,
  StudentTab,
  StudentWorkspaceData,
} from './types/index.ts';
import { QUESTIONS, TOTAL_QUESTIONS } from './utils/questions.ts';
import {
  applyCheckinToWorkspace,
  DEFAULT_CHECKIN_RESPONSES,
  generateStudentMarkdownReport,
  INITIAL_STUDENT_WORKSPACE,
} from './utils/workspace.ts';
import { ProgressBar } from './components/ProgressBar.tsx';
import { Header } from './components/Header.tsx';
import { QuestionScreen } from './components/QuestionScreen.tsx';
import { StudentOverview } from './components/StudentOverview.tsx';
import { StudentTasksView } from './components/StudentTasksView.tsx';
import { StudentStudyView } from './components/StudentStudyView.tsx';
import { StudentFocusView } from './components/StudentFocusView.tsx';
import { StudentExpensesView } from './components/StudentExpensesView.tsx';
import { StudentNotesView } from './components/StudentNotesView.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';

const WORKSPACE_STORAGE_KEY = 'one_student_workspace_v3';
const CHECKIN_STORAGE_KEY = 'one_student_checkin_v3';

const MOBILE_TABS: { id: StudentTab; label: string }[] = [
  { id: 'planner', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'study', label: 'Studies' },
  { id: 'focus', label: 'Focus' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'notes', label: 'Notes' },
];

export default function App() {
  const [data, setData] = useState<StudentWorkspaceData>(() => {
    if (typeof window === 'undefined') return INITIAL_STUDENT_WORKSPACE;
    try {
      const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STUDENT_WORKSPACE, ...parsed };
      }
      return INITIAL_STUDENT_WORKSPACE;
    } catch {
      return INITIAL_STUDENT_WORKSPACE;
    }
  });

  const [checkinResponses, setCheckinResponses] = useState<StudentCheckinResponses>(() => {
    if (typeof window === 'undefined') return DEFAULT_CHECKIN_RESPONSES;
    try {
      const saved = localStorage.getItem(CHECKIN_STORAGE_KEY);
      return saved
        ? { ...DEFAULT_CHECKIN_RESPONSES, ...JSON.parse(saved) }
        : DEFAULT_CHECKIN_RESPONSES;
    } catch {
      return DEFAULT_CHECKIN_RESPONSES;
    }
  });

  const getInitialNavigationFromHash = (): { tab: StudentTab; stepIndex: number } => {
    if (typeof window === 'undefined') return { tab: 'planner', stepIndex: 0 };
    const hash = window.location.hash.replace('#', '').toLowerCase();

    const stepMatch = hash.match(/^step-(\d+)$/);
    if (stepMatch) {
      const idx = parseInt(stepMatch[1], 10) - 1;
      if (idx >= 0 && idx < TOTAL_QUESTIONS) {
        return { tab: 'checkin', stepIndex: idx };
      }
    }

    const validTabs: StudentTab[] = [
      'planner',
      'tasks',
      'study',
      'focus',
      'expenses',
      'notes',
      'checkin',
    ];
    if (validTabs.includes(hash as StudentTab)) {
      return { tab: hash as StudentTab, stepIndex: 0 };
    }

    return { tab: 'planner', stepIndex: 0 };
  };

  const [activeTab, setActiveTab] = useState<StudentTab>(
    () => getInitialNavigationFromHash().tab
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(
    () => getInitialNavigationFromHash().stepIndex
  );

  // Sync Dark / Bright mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (data.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [data.theme]);

  // Persist workspace data
  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save student workspace data', e);
    }
  }, [data]);

  // Persist check-in responses
  useEffect(() => {
    try {
      localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(checkinResponses));
    } catch (e) {
      console.warn('Could not save check-in responses', e);
    }
  }, [checkinResponses]);

  // Sync browser hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const next = getInitialNavigationFromHash();
      setActiveTab(next.tab);
      setCurrentStepIndex(next.stepIndex);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleToggleTheme = () => {
    setData((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleSelectTab = (tab: StudentTab) => {
    setActiveTab(tab);
    if (tab === 'checkin') {
      setCurrentStepIndex(0);
      window.location.hash = 'step-1';
    } else {
      window.location.hash = tab;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckinContinue = () => {
    if (currentStepIndex < TOTAL_QUESTIONS - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      window.location.hash = `step-${nextIdx + 1}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setData((prev) => applyCheckinToWorkspace(prev, checkinResponses));
      setActiveTab('planner');
      window.location.hash = 'planner';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCheckinBack = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      window.location.hash = `step-${prevIdx + 1}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExportReport = () => {
    const md = generateStudentMarkdownReport(data);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `one-student-summary-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetDemoData = () => {
    setData((prev) => ({
      ...INITIAL_STUDENT_WORKSPACE,
      theme: prev.theme,
    }));
  };

  const activeQuestion = QUESTIONS[currentStepIndex];

  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-black dark:text-white flex flex-col font-sans selection:bg-zinc-950 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-200">
      {/* Thin Top Progress Bar when in Check-in flow */}
      {activeTab === 'checkin' && (
        <ProgressBar currentStep={currentStepIndex + 1} totalSteps={TOTAL_QUESTIONS} />
      )}

      {/* Minimal Top Bar with Dark/Bright Toggle */}
      <Header
        theme={data.theme}
        onToggleTheme={handleToggleTheme}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentStep={currentStepIndex + 1}
        totalSteps={TOTAL_QUESTIONS}
      />

      {/* Mobile Tab Strip (Visible on mobile when not in check-in wizard) */}
      {activeTab !== 'checkin' && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-950/80 px-4 py-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {MOBILE_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'checkin' && activeQuestion ? (
          <QuestionScreen
            key={activeQuestion.id}
            question={activeQuestion}
            responses={checkinResponses}
            onUpdateResponses={setCheckinResponses}
            onContinue={handleCheckinContinue}
            onBack={handleCheckinBack}
            canBack={currentStepIndex > 0}
            isLastStep={currentStepIndex === TOTAL_QUESTIONS - 1}
          />
        ) : (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
            {activeTab === 'planner' && (
              <StudentOverview
                data={data}
                onUpdateData={setData}
                onNavigate={handleSelectTab}
              />
            )}
            {activeTab === 'tasks' && (
              <StudentTasksView data={data} onUpdateData={setData} />
            )}
            {activeTab === 'study' && (
              <StudentStudyView data={data} onUpdateData={setData} />
            )}
            {activeTab === 'focus' && (
              <StudentFocusView data={data} onUpdateData={setData} />
            )}
            {activeTab === 'expenses' && (
              <StudentExpensesView data={data} onUpdateData={setData} />
            )}
            {activeTab === 'notes' && (
              <StudentNotesView data={data} onUpdateData={setData} />
            )}
          </div>
        )}
      </main>

      {/* Quiet Footer with Export & Reset */}
      {activeTab !== 'checkin' && (
        <footer className="border-t border-zinc-200 dark:border-zinc-900 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span>One · All-in-One Student Workspace · Offline-First PWA</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleExportReport}
                className="inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-white transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Study Report (.md)</span>
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={handleResetDemoData}
                className="inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-white transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sample Data</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      <OfflineIndicator />
    </div>
  );
}
