/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Download, RotateCcw, Upload, FileJson } from 'lucide-react';
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
import { BottomNav } from './components/BottomNav.tsx';
import { QuestionScreen } from './components/QuestionScreen.tsx';
import { StudentOverview } from './components/StudentOverview.tsx';
import { StudentTasksView } from './components/StudentTasksView.tsx';
import { StudentStudyView } from './components/StudentStudyView.tsx';
import { StudentFocusView } from './components/StudentFocusView.tsx';
import { StudentExpensesView } from './components/StudentExpensesView.tsx';
import { StudentNotesView } from './components/StudentNotesView.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';

const WORKSPACE_STORAGE_KEY = 'one_student_workspace_v5';
const CHECKIN_STORAGE_KEY = 'one_student_checkin_v5';

export default function App() {
  const [data, setData] = useState<StudentWorkspaceData>(() => {
    if (typeof window === 'undefined') return INITIAL_STUDENT_WORKSPACE;
    try {
      const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_STUDENT_WORKSPACE,
          ...parsed,
          currency: parsed.currency || '₹',
          scheduleBlocks:
            Array.isArray(parsed.scheduleBlocks) && parsed.scheduleBlocks.length > 0
              ? parsed.scheduleBlocks
              : INITIAL_STUDENT_WORKSPACE.scheduleBlocks,
        };
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleStartTaskFocus = (courseCode: string, taskId?: string) => {
    const safeCourse =
      courseCode && courseCode !== 'BREAK' && courseCode !== 'GENERAL'
        ? courseCode
        : data.courses[0]?.code || 'CS-301';
    setData((prev) => ({
      ...prev,
      activeFocusCourse: safeCourse,
      activeFocusTaskId: taskId || null,
    }));
    handleSelectTab('focus');
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

  const handleExportJsonBackup = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `one-student-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.courses)) {
          setData((prev) => ({
            ...INITIAL_STUDENT_WORKSPACE,
            ...parsed,
            theme: parsed.theme || prev.theme,
          }));
        }
      } catch {
        // Ignore invalid JSON file
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemoData = () => {
    setData((prev) => ({
      ...INITIAL_STUDENT_WORKSPACE,
      theme: prev.theme,
    }));
  };

  const activeQuestion = QUESTIONS[currentStepIndex];
  const pendingTaskCount = data.tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-black dark:text-white flex flex-col font-sans selection:bg-zinc-950 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-200">
      {/* Thin Top Progress Bar when in Check-in flow */}
      {activeTab === 'checkin' && (
        <ProgressBar currentStep={currentStepIndex + 1} totalSteps={TOTAL_QUESTIONS} />
      )}

      {/* Executive Top Header */}
      <Header
        theme={data.theme}
        onToggleTheme={handleToggleTheme}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentStep={currentStepIndex + 1}
        totalSteps={TOTAL_QUESTIONS}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'checkin' && activeQuestion ? (
          <div key={`checkin-${activeQuestion.id}`} className="flex-1 flex flex-col view-transition-enter">
            <QuestionScreen
              question={activeQuestion}
              responses={checkinResponses}
              onUpdateResponses={setCheckinResponses}
              onContinue={handleCheckinContinue}
              onBack={handleCheckinBack}
              canBack={currentStepIndex > 0}
              isLastStep={currentStepIndex === TOTAL_QUESTIONS - 1}
            />
          </div>
        ) : (
          <div
            key={activeTab}
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9 flex-1 view-transition-enter"
          >
            {activeTab === 'planner' && (
              <StudentOverview
                data={data}
                onUpdateData={setData}
                onNavigate={handleSelectTab}
                onStartTaskFocus={handleStartTaskFocus}
              />
            )}
            {activeTab === 'tasks' && (
              <StudentTasksView
                data={data}
                onUpdateData={setData}
                onStartTaskFocus={handleStartTaskFocus}
              />
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

      {/* Quiet Footer with Export, JSON Backup/Restore & Reset (padded for bottom glossy nav dock) */}
      {activeTab !== 'checkin' && (
        <footer className="border-t border-zinc-200/80 dark:border-zinc-900 pt-6 pb-28 sm:pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span>One · All-in-One Student Workspace · Gemini Schedule &amp; Study Engine</span>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleExportReport}
                className="inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-white transition whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report (.md)</span>
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={handleExportJsonBackup}
                className="inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-white transition whitespace-nowrap shrink-0"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Backup (.json)</span>
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-white transition whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore (.json)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportJsonBackup}
                className="hidden"
                aria-label="Restore JSON workspace backup"
              />
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={handleResetDemoData}
                className="inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-white transition whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sample Data</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Glossy Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        pendingTaskCount={pendingTaskCount}
      />

      <OfflineIndicator />
    </div>
  );
}
