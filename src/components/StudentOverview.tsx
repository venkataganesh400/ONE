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
} from '../utils/workspace.ts';
import { requestSmartSchedule } from '../utils/aiClient.ts';

interface StudentOverviewProps {
  data: StudentWorkspaceData;
  onUpdateData: (updater: (prev: StudentWorkspaceData) => StudentWorkspaceData) => void;
  onNavigate: (tab: StudentTab) => void;
  onStartTaskFocus: (courseCode: string, taskId?: string) => void;
}

export const StudentOverview: React.FC<StudentOverviewProps> = ({
  data,
  onUpdateData,
  onNavigate,
  onStartTaskFocus,
}) => {
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskCourse, setQuickTaskCourse] = useState(data.courses[0]?.code || 'CS-301');

  const [quickExpenseTitle, setQuickExpenseTitle] = useState('');
  const [quickExpenseAmount, setQuickExpenseAmount] = useState('');
  const [quickExpenseCategory, setQuickExpenseCategory] =
    useState<ExpenseCategory>('Food & Dining');

  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamCourse, setNewExamCourse] = useState(data.courses[0]?.code || 'CS-301');
  const [newExamDate, setNewExamDate] = useState('2026-10-30');
  const [newExamType, setNewExamType] = useState<'Exam' | 'Quiz' | 'Project'>('Exam');
  const [showAddExam, setShowAddExam] = useState(false);

  const [startHour, setStartHour] = useState('08:30');
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [blockStart, setBlockStart] = useState('16:00');
  const [blockEnd, setBlockEnd] = useState('16:50');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockCourse, setBlockCourse] = useState(data.courses[0]?.code || 'CS-301');

  const studyMetrics = calculateStudyMetrics(data.courses);
  const expenseSummary = calculateExpenseSummary(data.expenses, data.monthlyBudget);
  const pendingTasks = data.tasks.filter((t) => !t.completed);
  const scheduleBlocks = data.scheduleBlocks || [];

  const handleGenerateAISchedule = async () => {
    setIsGeneratingSchedule(true);
    try {
      const result = await requestSmartSchedule(data, startHour);
      onUpdateData((prev) => ({
        ...prev,
        scheduleBlocks: result.blocks,
        scheduleCoachNote: result.coachNote,
      }));
    } finally {
      setIsGeneratingSchedule(false);
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
    };

    onUpdateData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    setQuickTaskTitle('');
  };

  const handleToggleTask = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  };

  const handleQuickExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(quickExpenseAmount);
    if (!quickExpenseTitle.trim() || isNaN(amount) || amount <= 0) return;

    onUpdateData((prev) => ({
      ...prev,
      expenses: [
        {
          id: 'ex-' + Date.now(),
          title: quickExpenseTitle.trim(),
          amount,
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
    if (!newExamTitle.trim() || !newExamDate) return;

    const exam: ExamDeadline = {
      id: 'exm-' + Date.now(),
      title: newExamTitle.trim(),
      course: newExamCourse,
      date: newExamDate,
      type: newExamType,
    };

    onUpdateData((prev) => ({
      ...prev,
      exams: [...prev.exams, exam].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setNewExamTitle('');
    setShowAddExam(false);
  };

  const handleDeleteExam = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      exams: prev.exams.filter((ex) => ex.id !== id),
    }));
  };

  return (
    <div className="space-y-8">
      {/* Primary Daily Focus Banner */}
      <section className="p-6 sm:p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <span>Student Daily Alignment</span>
            <span aria-hidden="true">·</span>
            <span>{data.focusCadenceMinutes}m Study Blocks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight text-balance">
            {data.dailyPriority}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() =>
              onStartTaskFocus(
                pendingTasks[0]?.course || data.courses[0]?.code || 'CS-301',
                pendingTasks[0]?.id
              )
            }
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-xs sm:text-sm font-semibold hover:opacity-90 transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start {data.focusCadenceMinutes}m Focus</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('checkin')}
            className="flex items-center gap-2 px-5 py-3 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 text-xs sm:text-sm font-medium transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Recalibrate Day</span>
          </button>
        </div>
      </section>

      {/* 4-Column Student KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('tasks')}
          className="text-left p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition"
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Pending Coursework</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {pendingTasks.length}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {data.tasks.length - pendingTasks.length} completed
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('study')}
          className="text-left p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition"
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Weekly Study Hours</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {studyMetrics.totalLoggedHours}
            <span className="text-base font-normal text-zinc-400">
              /{studyMetrics.totalTargetHours}h
            </span>
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {studyMetrics.overallMasteryPercent}% syllabus mastery
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('study')}
          className="text-left p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition"
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Estimated GPA</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {studyMetrics.estimatedGpa}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Across {data.courses.length} active courses
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('expenses')}
          className="text-left p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition"
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Budget Remaining</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {data.currency}
            {expenseSummary.remaining.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Safe spend: {data.currency}
            {expenseSummary.dailySafeSpend.toFixed(2)}/day
          </p>
        </button>
      </section>

      {/* AI Daily Time-Blocked Schedule Architect */}
      <section className="p-6 sm:p-7 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-950 dark:text-white" />
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                Today&apos;s Time-Blocked Schedule
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {data.scheduleCoachNote ||
                'Connects your priority tasks, exam countdowns, and focus cadence into a concrete timeline.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <label htmlFor="schedule-start-time" className="sr-only">
              Schedule start time
            </label>
            <select
              id="schedule-start-time"
              aria-label="Schedule start time"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="px-3 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white"
            >
              <option value="07:30">Start 07:30</option>
              <option value="08:30">Start 08:30</option>
              <option value="09:30">Start 09:30</option>
              <option value="11:00">Start 11:00</option>
              <option value="14:00">Start 14:00</option>
            </select>

            <button
              type="button"
              disabled={isGeneratingSchedule}
              onClick={handleGenerateAISchedule}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isGeneratingSchedule ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingSchedule ? 'Planning with Gemini...' : 'Generate AI Schedule'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddBlock(!showAddBlock)}
              className="px-3.5 py-2 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 transition"
            >
              {showAddBlock ? 'Cancel' : '+ Add Block'}
            </button>
          </div>
        </div>

        {showAddBlock && (
          <form
            onSubmit={handleAddCustomBlock}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5"
          >
            <input
              type="time"
              aria-label="Block start time"
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
            />
            <input
              type="time"
              aria-label="Block end time"
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
            />
            <select
              aria-label="Block course"
              value={blockCourse}
              onChange={(e) => setBlockCourse(e.target.value)}
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
            >
              {data.courses.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code}
                </option>
              ))}
              <option value="BREAK">BREAK</option>
            </select>
            <input
              type="text"
              required
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              placeholder="Time block goal (e.g. Review Linear Algebra Lecture 7)..."
              className="sm:col-span-4 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white"
            />
            <button
              type="submit"
              className="sm:col-span-2 px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold"
            >
              Save Block
            </button>
          </form>
        )}

        <div className="divide-y divide-zinc-200 dark:divide-zinc-900">
          {scheduleBlocks.map((block) => (
            <div
              key={block.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleScheduleBlock(block.id)}
                  aria-label={`Mark schedule block ${block.title} as ${
                    block.completed ? 'incomplete' : 'complete'
                  }`}
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 border transition ${
                    block.completed
                      ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:border-white dark:text-black'
                      : 'border-zinc-400 dark:border-zinc-700 text-transparent hover:border-zinc-950 dark:hover:border-white'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>

                <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0 w-24">
                  {block.startTime}–{block.endTime}
                </span>

                <span className="px-2.5 py-0.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-mono font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">
                  {block.course}
                </span>

                <p
                  className={`text-sm font-medium truncate ${
                    block.completed
                      ? 'line-through text-zinc-400 dark:text-zinc-600'
                      : 'text-zinc-950 dark:text-white'
                  }`}
                >
                  {block.title}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {block.type !== 'break' && (
                  <button
                    type="button"
                    onClick={() => onStartTaskFocus(block.course, block.taskId)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:border-zinc-950 dark:hover:border-white transition"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Focus</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteScheduleBlock(block.id)}
                  aria-label={`Delete schedule block ${block.title}`}
                  className="p-1.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Priority Assignments & Tasks */}
        <section className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                Priority Assignments & Tasks
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tap any item to mark complete or launch a linked focus session
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
            >
              <span>All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Add Task Form */}
          <form onSubmit={handleQuickAddTask} className="flex flex-col sm:flex-row gap-2">
            <select
              aria-label="Select course for task"
              value={quickTaskCourse}
              onChange={(e) => setQuickTaskCourse(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none"
            >
              {data.courses.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code}
                </option>
              ))}
              <option value="GENERAL">GENERAL</option>
            </select>
            <input
              type="text"
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="Add assignment, lab, or reading..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-950 dark:focus:border-white"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Task Rows */}
          <div className="divide-y divide-zinc-200 dark:divide-zinc-900">
            {data.tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="py-3.5 flex items-start justify-between gap-3 group"
              >
                <div
                  onClick={() => handleToggleTask(task.id)}
                  className="flex items-start gap-3.5 min-w-0 flex-1 cursor-pointer"
                >
                  <button
                    type="button"
                    aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border transition ${
                      task.completed
                        ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:border-white dark:text-black'
                        : 'border-zinc-400 dark:border-zinc-700 text-transparent group-hover:border-zinc-950 dark:group-hover:border-white'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        task.completed
                          ? 'line-through text-zinc-400 dark:text-zinc-600'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      <span>{task.course}</span>
                      <span aria-hidden="true">·</span>
                      <span>Due {task.dueDate}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{task.priority} priority</span>
                      {task.subtasks && task.subtasks.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}{' '}
                            steps
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!task.completed && (
                  <button
                    type="button"
                    onClick={() => onStartTaskFocus(task.course, task.id)}
                    aria-label={`Start focus session for ${task.title}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-zinc-950 dark:hover:border-white transition shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Focus</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Right 5 Cols: Upcoming Exams & Quick Expense Logger */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Exams & Milestones */}
          <section className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                Exams & Major Deadlines
              </h2>
              <button
                type="button"
                onClick={() => setShowAddExam(!showAddExam)}
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              >
                {showAddExam ? 'Cancel' : '+ Add Exam'}
              </button>
            </div>

            {showAddExam && (
              <form
                onSubmit={handleAddExam}
                className="space-y-2.5 pt-1 pb-3 border-b border-zinc-200 dark:border-zinc-800"
              >
                <input
                  type="text"
                  required
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="Exam or project title..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <select
                    aria-label="Exam course"
                    value={newExamCourse}
                    onChange={(e) => setNewExamCourse(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
                  >
                    {data.courses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Milestone type"
                    value={newExamType}
                    onChange={(e) =>
                      setNewExamType(e.target.value as 'Exam' | 'Quiz' | 'Project')
                    }
                    className="px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white"
                  >
                    <option value="Exam">Exam</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Project">Project</option>
                  </select>
                  <input
                    type="date"
                    aria-label="Exam date"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-zinc-200 dark:divide-zinc-900">
              {data.exams.map((exam) => {
                const countdown = calculateDaysUntil(exam.date);
                return (
                  <div
                    key={exam.id}
                    className="py-3 flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {exam.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                        <span>{exam.course}</span>
                        <span aria-hidden="true">·</span>
                        <span>{exam.type}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {exam.date}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold ${
                          countdown.isUrgent
                            ? 'bg-zinc-950 text-white dark:bg-white dark:text-black'
                            : 'bg-zinc-200/80 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {countdown.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExam(exam.id)}
                        aria-label={`Remove ${exam.title}`}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick Campus Expense Log */}
          <section className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                Quick Expense Log
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('expenses')}
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              >
                Full Budget →
              </button>
            </div>

            <form onSubmit={handleQuickExpense} className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickExpenseTitle}
                  onChange={(e) => setQuickExpenseTitle(e.target.value)}
                  placeholder="Coffee, textbook, lunch..."
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quickExpenseAmount}
                  onChange={(e) => setQuickExpenseAmount(e.target.value)}
                  placeholder={`${data.currency}0.00`}
                  className="w-24 px-3 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm font-mono text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  aria-label="Expense category"
                  value={quickExpenseCategory}
                  onChange={(e) => setQuickExpenseCategory(e.target.value as ExpenseCategory)}
                  className="flex-1 px-3 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Books & Supplies">Books & Supplies</option>
                  <option value="Coffee & Snacks">Coffee & Snacks</option>
                  <option value="Transport">Transport</option>
                  <option value="Housing & Utilities">Housing & Utilities</option>
                  <option value="Other">Other</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
