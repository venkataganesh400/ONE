/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import type {
  StudentCheckinResponses,
  StudentTab,
  StudentWorkspaceData,
} from './types/index.ts';
import { QUESTIONS, TOTAL_QUESTIONS } from './utils/questions.ts';
import {
  applyCheckinToWorkspace,
  DEFAULT_CHECKIN_RESPONSES,
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
import { DataCompressionModal } from './components/DataCompressionModal.tsx';
import { GeminiAdvisorModal } from './components/GeminiAdvisorModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { TimetableModal } from './components/TimetableModal.tsx';
import { WorkspaceSettingsModal } from './components/WorkspaceSettingsModal.tsx';
import { useFirebaseAuth } from './hooks/useFirebaseAuth.ts';
import { useCloudSync } from './hooks/useCloudSync.ts';
import { useTaskNotifications } from './hooks/useTaskNotifications.ts';

const WORKSPACE_STORAGE_KEY = 'one_student_workspace_v8_clean';
const CHECKIN_STORAGE_KEY = 'one_student_checkin_v8';

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
          scheduleBlocks: Array.isArray(parsed.scheduleBlocks) ? parsed.scheduleBlocks : [],
          timetable: Array.isArray(parsed.timetable) ? parsed.timetable : [],
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

  // Modal States
  const [isCompressionModalOpen, setIsCompressionModalOpen] = useState(false);
  const [isGeminiAdvisorOpen, setIsGeminiAdvisorOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isWorkspaceSettingsOpen, setIsWorkspaceSettingsOpen] = useState(false);

  // Real-time Firebase Authentication
  const {
    user,
    loading: authLoading,
    isSigningIn,
    error: authError,
    clearError: clearAuthError,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signInAsGuestStudent,
    signOutUser,
  } = useFirebaseAuth();

  // Real-time Cloud Synchronization with LZ-String Compression
  const {
    syncStatus,
    lastSyncTime,
    metrics: cloudMetrics,
    saveToCloud,
  } = useCloudSync(user, data, (remoteData) => {
    setData((prev) => ({
      ...prev,
      ...remoteData,
      theme: prev.theme, // preserve user's local theme preference
    }));
  });

  // Background Task Notifications & Chime Alert System
  const {
    permission: notificationPermission,
    requestPermission: handleRequestNotificationPermission,
  } = useTaskNotifications(data.tasks, data.scheduleBlocks, true);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Persist workspace data locally
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
    scrollToTop();
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
      scrollToTop();
    } else {
      setData((prev) => applyCheckinToWorkspace(prev, checkinResponses));
      setActiveTab('planner');
      window.location.hash = 'planner';
      scrollToTop();
    }
  };

  const handleCheckinBack = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      window.location.hash = `step-${prevIdx + 1}`;
      scrollToTop();
    }
  };

  const activeQuestion = QUESTIONS[currentStepIndex];
  const pendingTaskCount = data.tasks.filter((t) => !t.completed).length;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#F9F7F2] text-[#1C1917] dark:bg-[#12100E] dark:text-[#F7F4EE] flex flex-col font-sans selection:bg-[#3C2E25] selection:text-white dark:selection:bg-[#FAF7F2] dark:selection:text-[#1C1917] transition-colors duration-200 relative">
      {/* Top Thin Progress Bar for Check-in */}
      {activeTab === 'checkin' && (
        <ProgressBar currentStep={currentStepIndex + 1} totalSteps={TOTAL_QUESTIONS} />
      )}

      {/* Production Top Header */}
      <Header
        theme={data.theme}
        onToggleTheme={handleToggleTheme}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentStep={currentStepIndex + 1}
        totalSteps={TOTAL_QUESTIONS}
        user={user}
        authLoading={authLoading}
        isSigningIn={isSigningIn}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={signOutUser}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        compressionMetrics={cloudMetrics}
        onOpenCompressionModal={() => setIsCompressionModalOpen(true)}
        onOpenGeminiAdvisor={() => setIsGeminiAdvisorOpen(true)}
        onOpenTimetableModal={() => setIsTimetableModalOpen(true)}
        onOpenWorkspaceSettings={() => setIsWorkspaceSettingsOpen(true)}
      />

      {/* Dedicated Scrollable Viewport Container (No web footer: app feel) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain flex flex-col pb-24 sm:pb-28"
      >
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          {activeTab === 'checkin' && activeQuestion ? (
            <div
              key={`checkin-${activeQuestion.id}`}
              className="flex-1 flex flex-col view-transition-enter"
            >
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
              className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-7 flex-1 view-transition-enter"
            >
              {activeTab === 'planner' && (
                <StudentOverview
                  data={data}
                  onUpdateData={setData}
                  onNavigate={handleSelectTab}
                  onStartTaskFocus={handleStartTaskFocus}
                  onOpenGeminiAdvisor={() => setIsGeminiAdvisorOpen(true)}
                  onOpenTimetableModal={() => setIsTimetableModalOpen(true)}
                  onRequestNotifications={handleRequestNotificationPermission}
                  notificationPermission={notificationPermission}
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
      </div>

      {/* Glossy Bottom Navigation Dock */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        pendingTaskCount={pendingTaskCount}
      />

      {/* User Authentication Modal (Google + Email/Password + Guest) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onSignInWithGoogle={signInWithGoogle}
        onSignUpWithEmail={signUpWithEmail}
        onSignInWithEmail={signInWithEmail}
        onSignInAsGuest={signInAsGuestStudent}
        isSigningIn={isSigningIn}
        authError={authError}
        onClearError={clearAuthError}
      />

      {/* Class Timetable Modal & Integrator */}
      <TimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        data={data}
        onUpdateData={setData}
      />

      {/* Workspace Data & Backup Settings Modal (replaces footer) */}
      <WorkspaceSettingsModal
        isOpen={isWorkspaceSettingsOpen}
        onClose={() => setIsWorkspaceSettingsOpen(false)}
        data={data}
        onUpdateData={setData}
        onOpenCompressionModal={() => setIsCompressionModalOpen(true)}
      />

      {/* Data Management & LZ Compression Modal */}
      <DataCompressionModal
        isOpen={isCompressionModalOpen}
        onClose={() => setIsCompressionModalOpen(false)}
        data={data}
        onRestoreData={(restored) => setData(restored)}
        metrics={cloudMetrics}
        user={user}
        onTriggerSaveToCloud={() => saveToCloud(data)}
        isSyncing={syncStatus === 'syncing'}
        lastSyncTime={lastSyncTime}
      />

      {/* Gemini Academic Coach & Planning Advisor Modal */}
      <GeminiAdvisorModal
        isOpen={isGeminiAdvisorOpen}
        onClose={() => setIsGeminiAdvisorOpen(false)}
        data={data}
        onUpdateData={setData}
      />

      <OfflineIndicator />
    </div>
  );
}
