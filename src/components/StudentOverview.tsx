import React, { useState } from 'react';
import {
  Check,
  Plus,
  Play,
  ArrowRight,
  SlidersHorizontal,
  Calendar,
  Trash2,
  Sparkles,
  Clock,
  Loader2,
  Bell,
  BellRing,
  BookOpen,
  MapPin,
  ListTodo,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import type {
  ExamDeadline,
  ExpenseCategory,
  ScheduleBlock,
  StudentTab,
  StudentWorkspaceData,
  TaskItem,
} from '../types/index.ts';
import {
  calculateDaysUntil,
  calculateExpenseSummary,
  calculateStudyMetrics,
  getTodayDayOfWeek,
} from '../utils/workspace.ts';
import { requestWorkloadIntake, requestSmartSchedule } from '../utils/aiClient.ts';
import { notificationService } from '../utils/notifications.ts';

interface StudentOverviewProps {
  data: StudentWorkspaceData;
  onUpdateData: (updater: (prev: StudentWorkspaceData) => StudentWorkspaceData) => void;
  onNavigate: (tab: StudentTab) => void;
  onStartTaskFocus: (courseCode: string, taskId?: string) => void;
  onOpenGeminiAdvisor?: () => void;
  onOpenTimetableModal?: () => void;
  onRequestNotifications?: () => Promise<boolean>;
  notificationPermission?: NotificationPermission;
}

export const StudentOverview: React.FC<StudentOverviewProps> = ({
  data,
  onUpdateData,
  onNavigate,
  onStartTaskFocus,
  onOpenGeminiAdvisor,
  onOpenTimetableModal,
  onRequestNotifications,
  notificationPermission = 'default',
}) => {
  // Primary Daily Intake State
  const [workloadInput, setWorkloadInput] = useState('');
  const [isIntaking, setIsIntaking] = useState(false);
  const [intakeFeedback, setIntakeFeedback] = useState<string | null>(null);

  // Quick inputs
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskCourse, setQuickTaskCourse] = useState(data.courses[0]?.code || 'CS-301');

  const [quickExpenseTitle, setQuickExpenseTitle] = useState('');
  const [quickExpenseAmount, setQuickExpenseAmount] = useState('');
  const [quickExpenseCategory, setQuickExpenseCategory] = useState<ExpenseCategory>('Food & Dining');

  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamCourse, setNewExamCourse] = useState(data.courses[0]?.code || 'CS-301');
  const [newExamDate, setNewExamDate] = useState('2026-10-30');
  const [newExamType, setNewExamType] = useState<'Exam' | 'Quiz' | 'Project'>('Exam');
  const [showAddExam, setShowAddExam] = useState(false);

  const [startHour, setStartHour] = useState('09:00');
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [blockStart, setBlockStart] = useState('16:00');
  const [blockEnd, setBlockEnd] = useState('16:50');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockCourse, setBlockCourse] = useState(data.courses[0]?.code || 'CS-301');

  const [scheduleTab, setScheduleTab] = useState<'today' | 'longer_term'>('today');

  const todayDay = getTodayDayOfWeek();
  const todayClasses = (data.timetable || []).filter((s) => s.dayOfWeek === todayDay);
  const studyMetrics = calculateStudyMetrics(data.courses);
  const expenseSummary = calculateExpenseSummary(data.expenses, data.monthlyBudget);

  const todayTasks = data.tasks.filter((t) => t.classification === 'today' || (!t.classification && !t.completed));
  const longerTermTasks = data.tasks.filter((t) => t.classification === 'longer_term');
  const scheduleBlocks = data.scheduleBlocks || [];

  // 1. Core Workflow: Take raw input of works today -> AI Classifies & Schedules
  const handleIntakeWorkload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!workloadInput.trim()) return;

    setIsIntaking(true);
    setIntakeFeedback(null);

    try {
      const result = await requestWorkloadIntake(
        workloadInput,
        data.courses,
        data.timetable || [],
        data.focusCadenceMinutes || 45,
        startHour
      );

      onUpdateData((prev) => {
        // Keep existing completed tasks, merge in new classified tasks
        const existingTasks = prev.tasks;
        const newTasks = [...result.todayTasks, ...result.longerTermTasks];

        // Deduplicate by title
        const mergedTasks = [...existingTasks];
        newTasks.forEach((nt) => {
          if (!mergedTasks.some((mt) => mt.title.toLowerCase() === nt.title.toLowerCase())) {
            mergedTasks.push(nt);
          }
        });

        return {
          ...prev,
          tasks: mergedTasks,
          scheduleBlocks: result.scheduleBlocks,
          scheduleCoachNote: result.summaryRationale,
          dailyPriority: result.todayTasks[0]?.title || prev.dailyPriority,
        };
      });

      setIntakeFeedback(result.summaryRationale);
      setWorkloadInput('');
    } catch {
      setIntakeFeedback('Could not classify workload. Check internet connection or retry.');
    } finally {
      setIsIntaking(false);
    }
  };

  const handleToggleScheduleBlock = (blockId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      scheduleBlocks: (prev.scheduleBlocks || []).map((b) =>
        b.id === blockId ? { ...b, completed: !b.completed } : b
      ),
    }));
  };

  const handleDeleteScheduleBlock = (blockId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      scheduleBlocks: (prev.scheduleBlocks || []).filter((b) => b.id !== blockId),
    }));
  };

  const handleAddCustomBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim()) return;
    const newBlock: ScheduleBlock = {
      id: 'sb-' + Date.now(),
      startTime: blockStart,
      endTime: blockEnd,
      title: blockTitle.trim(),
      course: blockCourse,
      type: blockCourse === 'BREAK' ? 'break' : 'focus',
      durationMinutes: data.focusCadenceMinutes || 50,
      completed: false,
    };
    onUpdateData((prev) => ({
      ...prev,
      scheduleBlocks: [...(prev.scheduleBlocks || []), newBlock].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      ),
    }));
    setBlockTitle('');
    setShowAddBlock(false);
  };

  const handleToggleTask = (taskId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: 'st-' + Date.now(),
      title: quickTaskTitle.trim(),
      course: quickTaskCourse,
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'high',
      completed: false,
      createdAt: new Date().toISOString().split('T')[0],
      classification: 'today',
      estimatedMinutes: data.focusCadenceMinutes || 45,
    };

    onUpdateData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    setQuickTaskTitle('');
  };

  const handleQuickAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickExpenseAmount);
    if (!quickExpenseTitle.trim() || isNaN(amt) || amt <= 0) return;

    onUpdateData((prev) => ({
      ...prev,
      expenses: [
        {
          id: 'exp-' + Date.now(),
          title: quickExpenseTitle.trim(),
          amount: amt,
          category: quickExpenseCategory,
          date: new Date().toISOString().split('T')[0],
        },
        ...prev.expenses,
      ],
    }));
    setQuickExpenseTitle('');
    setQuickExpenseAmount('');
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;

    const newEx: ExamDeadline = {
      id: 'ex-' + Date.now(),
      title: newExamTitle.trim(),
      course: newExamCourse,
      date: newExamDate,
      type: newExamType,
    };

    onUpdateData((prev) => ({
      ...prev,
      exams: [...prev.exams, newEx].sort((a, b) => a.date.localeCompare(b.date)),
    }));

    setNewExamTitle('');
    setShowAddExam(false);
  };

  const handleDeleteExam = (examId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      exams: prev.exams.filter((e) => e.id !== examId),
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. PRIMARY APP FLOW: Daily Work Intake & Smart AI Scheduling Card */}
      <section className="p-5 sm:p-7 rounded-3xl apple-card bg-gradient-to-br from-white via-[#FAF7F2] to-[#F5EFE6] dark:from-[#201C18] dark:via-[#1A1714] dark:to-[#14110E] border border-[#E0D8CB] dark:border-[#383028] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] flex items-center justify-center font-bold text-sm shadow-xs">
              <Sparkles className="w-4 h-4 text-[#D8A775] dark:text-[#8A5836]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1C1917] dark:text-[#FAF7F2]">
                What are you working on today?
              </h1>
              <p className="text-xs text-[#786C60] dark:text-[#A89E92]">
                Dump your tasks, assignments, and revisions. AI will classify urgent work vs longer projects and schedule around your classes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Timetable Trigger */}
            <button
              type="button"
              onClick={onOpenTimetableModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-white/80 dark:bg-[#1E1B18]/80 text-xs font-semibold text-[#3C2E25] dark:text-[#FAF7F2] hover:bg-white dark:hover:bg-[#28221D] transition shadow-2xs"
              title="Upload syllabus or edit weekly class timetable"
            >
              <Calendar className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
              <span>Timetable</span>
              {todayClasses.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#EFEAE1] dark:bg-[#2C241E] text-[10px] font-mono text-[#8A5836] dark:text-[#D8A775]">
                  {todayClasses.length} today
                </span>
              )}
            </button>

            {/* Notification Alert Status */}
            {notificationPermission !== 'granted' ? (
              <button
                type="button"
                onClick={onRequestNotifications}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition shadow-2xs"
                title="Enable OS notifications for missed tasks"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Alerts</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => notificationService.testNotification()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition"
                title="System notifications active. Click to test audio chime."
              >
                <BellRing className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Alerts Active</span>
              </button>
            )}
          </div>
        </div>

        {/* Natural Language Workload Input Form */}
        <form onSubmit={handleIntakeWorkload} className="space-y-3">
          <div className="relative">
            <textarea
              value={workloadInput}
              onChange={(e) => setWorkloadInput(e.target.value)}
              placeholder="Dump everything on your plate: &#10;e.g. Finish CS lab 3 by 4pm, review Econ chapters 4-5, start 15-page history research paper due in 2 weeks, solve stats problem set, buy printer ink"
              rows={3}
              className="w-full p-3.5 rounded-2xl border border-[#D6CFC4] dark:border-[#383028] bg-white dark:bg-[#1A1714] text-xs sm:text-sm text-[#1C1917] dark:text-[#FAF7F2] placeholder-[#8C7D70] focus:ring-2 focus:ring-[#8A5836]/40 focus:outline-none transition shadow-2xs resize-none scrollbar-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-[#786C60] dark:text-[#A89E92]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
                <span>Start day at:</span>
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-[#D6CFC4] dark:border-[#3C342C] bg-white dark:bg-[#1E1B18] text-xs font-mono"
                />
              </span>
              <span>·</span>
              <span>Cadence: <strong>{data.focusCadenceMinutes}m</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isIntaking || !workloadInput.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold text-xs sm:text-sm hover:opacity-90 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {isIntaking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-inherit" />
                    <span>Classifying &amp; Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D8A775] dark:text-[#8A5836]" />
                    <span>AI Schedule &amp; Classify</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* AI Rationale / Feedback Banner */}
        {intakeFeedback && (
          <div className="mt-4 p-3 rounded-2xl bg-[#EFEAE1] dark:bg-[#28221D] border border-[#E0D8CB] dark:border-[#383028] flex items-start gap-2 text-xs text-[#4A3F35] dark:text-[#D6CFC4] animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{intakeFeedback}</p>
          </div>
        )}
      </section>

      {/* 2. CLASSIFIED WORKLOAD & TODAY'S SCHEDULE TABS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E2D8] dark:border-[#2C241E] pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScheduleTab('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                scheduleTab === 'today'
                  ? 'bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917]'
                  : 'text-[#786C60] dark:text-[#A89E92] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Today&apos;s Time Blocks &amp; Tasks</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-white/20 dark:bg-black/20">
                {scheduleBlocks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setScheduleTab('longer_term')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                scheduleTab === 'longer_term'
                  ? 'bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917]'
                  : 'text-[#786C60] dark:text-[#A89E92] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Longer Projects &amp; Milestones</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-white/20 dark:bg-black/20">
                {longerTermTasks.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {scheduleTab === 'today' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddBlock(!showAddBlock)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#8A5836] dark:text-[#D8A775] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Block</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onStartTaskFocus(
                      todayTasks[0]?.course || data.courses[0]?.code || 'CS-301',
                      todayTasks[0]?.id
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] text-xs font-semibold hover:opacity-90 transition shadow-2xs"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Focus Session</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Today's Actionable Time Blocks & Scheduled Tasks */}
        {scheduleTab === 'today' && (
          <div className="space-y-4">
            {/* Custom Block Modal / Form */}
            {showAddBlock && (
              <form
                onSubmit={handleAddCustomBlock}
                className="p-4 rounded-2xl bg-white dark:bg-[#201C18] border border-[#E0D8CB] dark:border-[#383028] space-y-3 animate-fadeIn"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="time"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="p-2 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
                  />
                  <input
                    type="time"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="p-2 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Block Title (e.g. Write Lab Analysis)"
                    value={blockTitle}
                    onChange={(e) => setBlockTitle(e.target.value)}
                    className="sm:col-span-2 p-2 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <select
                    value={blockCourse}
                    onChange={(e) => setBlockCourse(e.target.value)}
                    className="p-2 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
                  >
                    {data.courses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} – {c.name}
                      </option>
                    ))}
                    <option value="GENERAL">GENERAL</option>
                    <option value="BREAK">BREAK</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold text-xs"
                  >
                    Add Block
                  </button>
                </div>
              </form>
            )}

            {/* Schedule Blocks Timeline */}
            {scheduleBlocks.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-[#DED7CA] dark:border-[#3E352B] text-center text-[#786C60] dark:text-[#A89E92] space-y-2">
                <Calendar className="w-8 h-8 mx-auto opacity-40 text-[#8A5836] dark:text-[#D8A775]" />
                <h3 className="font-semibold text-sm text-[#1C1917] dark:text-[#FAF7F2]">
                  No schedule blocks generated for today yet
                </h3>
                <p className="text-xs max-w-md mx-auto">
                  Type your works into the box above and click &quot;AI Schedule &amp; Classify&quot;, or upload your class timetable.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {scheduleBlocks.map((block) => {
                  const isClass = block.type === 'class';
                  const isBreak = block.type === 'break';

                  return (
                    <div
                      key={block.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        isClass
                          ? 'bg-[#F2EDFF] dark:bg-[#241E33] border-[#D4C4F7] dark:border-[#4B396E]'
                          : isBreak
                          ? 'bg-[#F6F4F0] dark:bg-[#1B1917] border-[#E8E2D8] dark:border-[#2C241E] opacity-75'
                          : block.completed
                          ? 'bg-white/60 dark:bg-[#1C1815]/60 border-[#E8E2D8] dark:border-[#2C241E] opacity-60'
                          : 'bg-white dark:bg-[#201C18] border-[#E0D8CB] dark:border-[#383028] shadow-2xs hover:border-[#8A5836]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isClass ? (
                          <div className="w-8 h-8 rounded-xl bg-[#6B46C1] text-white flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        ) : isBreak ? (
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleScheduleBlock(block.id)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 ${
                              block.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-[#C4B8A8] dark:border-[#52463C] hover:border-[#8A5836]'
                            }`}
                          >
                            {block.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                                isClass
                                  ? 'bg-[#E0D4FF] dark:bg-[#3D2C5E] text-[#553C9A] dark:text-[#D6BCFA]'
                                  : isBreak
                                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                                  : 'bg-[#EFEAE1] dark:bg-[#2C241E] text-[#665D54] dark:text-[#A89E92]'
                              }`}
                            >
                              {isClass ? 'CLASS TIMETABLE' : block.course}
                            </span>
                            <span className="text-[11px] font-mono text-[#786C60] dark:text-[#A89E92]">
                              {block.startTime} – {block.endTime} ({block.durationMinutes}m)
                            </span>
                          </div>

                          <h4
                            className={`font-semibold text-xs sm:text-sm mt-0.5 truncate ${
                              block.completed
                                ? 'line-through text-[#8C7D70]'
                                : 'text-[#1C1917] dark:text-[#FAF7F2]'
                            }`}
                          >
                            {block.title}
                          </h4>

                          {block.location && (
                            <p className="text-[11px] text-[#786C60] dark:text-[#A89E92] flex items-center gap-1 mt-0.5 font-mono">
                              <MapPin className="w-3 h-3 text-[#8A5836] dark:text-[#D8A775]" />
                              <span>{block.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isClass && !isBreak && !block.completed && (
                          <button
                            type="button"
                            onClick={() => onStartTaskFocus(block.course, block.taskId)}
                            className="p-1.5 rounded-lg border border-[#D6CFC4] dark:border-[#3C342C] text-[#3C2E25] dark:text-[#FAF7F2] hover:bg-[#FAF7F2] dark:hover:bg-[#28221D] transition"
                            title="Launch Focus Pomodoro for this block"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduleBlock(block.id)}
                          className="p-1.5 rounded-lg text-[#9C9083] hover:text-rose-600 transition"
                          title="Remove block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Longer-Term Projects & Milestones */}
        {scheduleTab === 'longer_term' && (
          <div className="space-y-3">
            {longerTermTasks.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-[#DED7CA] dark:border-[#3E352B] text-center text-[#786C60] dark:text-[#A89E92] space-y-1">
                <FolderKanban className="w-7 h-7 mx-auto opacity-40 text-[#8A5836] dark:text-[#D8A775]" />
                <h4 className="font-semibold text-xs text-[#1C1917] dark:text-[#FAF7F2]">
                  No longer-term projects classified yet
                </h4>
                <p className="text-[11px]">
                  When you enter milestones or projects (e.g. &quot;History term paper due in 2 weeks&quot;), AI places them here so today stays uncluttered.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {longerTermTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#201C18] border border-[#E0D8CB] dark:border-[#383028] flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                          task.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-[#C4B8A8] dark:border-[#52463C]'
                        }`}
                      >
                        {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#EFEAE1] dark:bg-[#2C241E] text-[#665D54] dark:text-[#A89E92]">
                            {task.course}
                          </span>
                          <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            {task.dueDate}
                          </span>
                        </div>
                        <h4
                          className={`font-semibold text-xs sm:text-sm mt-1 truncate ${
                            task.completed ? 'line-through text-[#8C7D70]' : 'text-[#1C1917] dark:text-[#FAF7F2]'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-[#9C9083] hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. 4-COLUMN ACADEMIC KPI STRIP */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => onNavigate('tasks')}
          className="text-left p-4 sm:p-5 rounded-2xl apple-card hover:border-[#8A5836]/40 transition group"
        >
          <span className="text-xs text-[#665D54] dark:text-[#9E9387]">Active To-Do Items</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-[#1C1917] dark:text-[#FAF7F2] tabular-nums">
            {data.tasks.filter((t) => !t.completed).length}
          </p>
          <p className="mt-1 text-xs text-[#8C7D70]">
            {data.tasks.filter((t) => t.completed).length} completed
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('study')}
          className="text-left p-4 sm:p-5 rounded-2xl apple-card hover:border-[#8A5836]/40 transition group"
        >
          <span className="text-xs text-[#665D54] dark:text-[#9E9387]">Estimated GPA</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-[#1C1917] dark:text-[#FAF7F2] tabular-nums">
            {studyMetrics.estimatedGpa}
          </p>
          <p className="mt-1 text-xs text-[#8C7D70]">
            {studyMetrics.overallMasteryPercent}% topic mastery
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('focus')}
          className="text-left p-4 sm:p-5 rounded-2xl apple-card hover:border-[#8A5836]/40 transition group"
        >
          <span className="text-xs text-[#665D54] dark:text-[#9E9387]">Weekly Study Hours</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-[#1C1917] dark:text-[#FAF7F2] tabular-nums">
            {studyMetrics.totalLoggedHours}{' '}
            <span className="text-sm font-normal text-[#8C7D70]">/ {studyMetrics.totalTargetHours}h</span>
          </p>
          <p className="mt-1 text-xs text-[#8C7D70]">
            {studyMetrics.totalTargetHours > 0
              ? Math.round((studyMetrics.totalLoggedHours / studyMetrics.totalTargetHours) * 100)
              : 0}% of target
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('expenses')}
          className="text-left p-4 sm:p-5 rounded-2xl apple-card hover:border-[#8A5836]/40 transition group"
        >
          <span className="text-xs text-[#665D54] dark:text-[#9E9387]">Safe Daily Spend</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-[#1C1917] dark:text-[#FAF7F2] tabular-nums">
            {data.currency}{expenseSummary.dailySafeSpend}
          </p>
          <p className="mt-1 text-xs text-[#8C7D70]">
            {data.currency}{expenseSummary.remaining} remaining this month
          </p>
        </button>
      </section>

      {/* 4. UPCOMING EXAMS & RAPID CAMPUS ACTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Exams / Milestones */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl apple-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                Upcoming Exams &amp; Deadlines
              </h3>
              <p className="text-xs text-[#665D54] dark:text-[#9E9387]">
                Target preparation days and milestone alerts
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddExam(!showAddExam)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] text-xs font-semibold text-[#8A5836] dark:text-[#D8A775] hover:bg-[#FAF7F2] dark:hover:bg-[#28221D] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddExam ? 'Cancel' : 'Add Exam'}</span>
            </button>
          </div>

          {showAddExam && (
            <form onSubmit={handleAddExam} className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1A1714] border border-[#E0D8CB] dark:border-[#332B24] space-y-2.5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Exam or project title (e.g. Midterm 2)"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="p-2 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-white dark:bg-[#221E1A] text-xs"
                />
                <input
                  type="date"
                  required
                  value={newExamDate}
                  onChange={(e) => setNewExamDate(e.target.value)}
                  className="p-2 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-white dark:bg-[#221E1A] text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <select
                  value={newExamCourse}
                  onChange={(e) => setNewExamCourse(e.target.value)}
                  className="p-2 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-white dark:bg-[#221E1A] text-xs"
                >
                  {data.courses.map((c) => (
                    <option key={c.id} value={c.code}>{c.code} – {c.name}</option>
                  ))}
                  <option value="GENERAL">GENERAL</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold text-xs"
                >
                  Save Exam
                </button>
              </div>
            </form>
          )}

          {data.exams.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-[#DED7CA] dark:border-[#3E352B] text-center text-[#786C60] dark:text-[#A89E92]">
              <Calendar className="w-6 h-6 mx-auto mb-1 opacity-40" />
              <p className="text-xs">No exam deadlines recorded.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.exams.map((ex) => {
                const days = calculateDaysUntil(ex.date);
                return (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#201C18] border border-[#E0D8CB] dark:border-[#383028] flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-mono shrink-0 ${
                          days.isUrgent
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold'
                            : 'bg-[#EFEAE1] dark:bg-[#2C241E] text-[#665D54] dark:text-[#A89E92]'
                        }`}
                      >
                        <span className="text-[11px] leading-none">{days.days}d</span>
                        <span className="text-[8px] uppercase">left</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#1C1917] dark:text-[#FAF7F2]">
                            {ex.title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EFEAE1] dark:bg-[#2C241E] text-[#665D54] dark:text-[#A89E92]">
                            {ex.course}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#786C60] dark:text-[#A89E92] mt-0.5">
                          {ex.type} · {ex.date}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteExam(ex.id)}
                      className="p-1.5 rounded-lg text-[#9C9083] hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rapid Campus Expense Logger */}
        <div className="p-5 sm:p-6 rounded-3xl apple-card space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1C1917] dark:text-[#FAF7F2]">
              Quick Log Expense
            </h3>
            <p className="text-xs text-[#665D54] dark:text-[#9E9387]">
              Pace your daily allowance in real time
            </p>
          </div>

          <form onSubmit={handleQuickAddExpense} className="space-y-2.5">
            <input
              type="text"
              required
              placeholder="e.g. Masala Dosa &amp; Chai"
              value={quickExpenseTitle}
              onChange={(e) => setQuickExpenseTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
            />
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                required
                placeholder="Amount (₹)"
                value={quickExpenseAmount}
                onChange={(e) => setQuickExpenseAmount(e.target.value)}
                className="w-1/2 p-2.5 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs font-mono"
              />
              <select
                value={quickExpenseCategory}
                onChange={(e) => setQuickExpenseCategory(e.target.value as ExpenseCategory)}
                className="w-1/2 p-2.5 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="Coffee & Snacks">Coffee & Snacks</option>
                <option value="Books & Supplies">Books & Supplies</option>
                <option value="Transport">Transport</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold text-xs hover:opacity-90 transition"
            >
              Add Expense
            </button>
          </form>

          <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#2C241E] flex items-center justify-between text-xs">
            <span className="text-[#665D54] dark:text-[#9E9387]">Recent Logged:</span>
            <button
              type="button"
              onClick={() => onNavigate('expenses')}
              className="font-medium text-[#8A5836] dark:text-[#D8A775] hover:underline"
            >
              View Wallet &rarr;
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
