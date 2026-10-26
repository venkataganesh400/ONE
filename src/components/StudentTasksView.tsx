import React, { useState } from 'react';
import {
  Check,
  Plus,
  Search,
  Trash2,
  Sparkles,
  Play,
  Loader2,
  Calendar,
  Flag,
  CheckCircle2,
  ListTodo,
  Clock,
  FolderKanban,
} from 'lucide-react';
import type { StudentWorkspaceData, TaskItem } from '../types/index.ts';
import { requestTaskDecomposition } from '../utils/aiClient.ts';

interface StudentTasksViewProps {
  data: StudentWorkspaceData;
  onUpdateData: (updater: (prev: StudentWorkspaceData) => StudentWorkspaceData) => void;
  onStartTaskFocus?: (courseCode: string, taskId?: string) => void;
}

export const StudentTasksView: React.FC<StudentTasksViewProps> = ({
  data,
  onUpdateData,
  onStartTaskFocus,
}) => {
  const [smartFilter, setSmartFilter] = useState<'all' | 'today' | 'longer_term' | 'completed'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState(data.courses[0]?.code || 'CS-301');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('high');

  const [decomposingTaskId, setDecomposingTaskId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const courseCodes = Array.from(
    new Set([...data.courses.map((c) => c.code), ...data.tasks.map((t) => t.course)])
  );

  const totalTasks = data.tasks.length;
  const todayTasksCount = data.tasks.filter((t) => !t.completed && (t.classification === 'today' || t.dueDate === todayStr)).length;
  const longerTermCount = data.tasks.filter((t) => !t.completed && t.classification === 'longer_term').length;
  const completedCount = data.tasks.filter((t) => t.completed).length;

  const filteredTasks = data.tasks.filter((task) => {
    if (smartFilter === 'today' && (task.completed || (task.classification !== 'today' && task.dueDate !== todayStr))) return false;
    if (smartFilter === 'longer_term' && (task.completed || task.classification !== 'longer_term')) return false;
    if (smartFilter === 'completed' && !task.completed) return false;
    if (smartFilter === 'all' && task.completed) return false; // Show active by default on All
    if (courseFilter !== 'all' && task.course !== courseFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (!task.title.toLowerCase().includes(q) && !task.course.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const item: TaskItem = {
      id: 'st-' + Date.now(),
      title: newTitle.trim(),
      course: newCourse,
      dueDate: newDueDate,
      priority: newPriority,
      completed: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onUpdateData((prev) => ({
      ...prev,
      tasks: [item, ...prev.tasks],
    }));

    setNewTitle('');
  };

  const handleToggle = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  };

  const handleUpdateTaskField = (id: string, patch: Partial<TaskItem>) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  };

  const handleDecomposeTask = async (task: TaskItem) => {
    setDecomposingTaskId(task.id);
    try {
      const res = await requestTaskDecomposition(
        task.title,
        task.course,
        task.dueDate,
        data.focusCadenceMinutes || 50
      );
      onUpdateData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === task.id ? { ...t, subtasks: res.subtasks } : t
        ),
      }));
    } finally {
      setDecomposingTaskId(null);
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId || !t.subtasks) return t;
        const updatedSubs = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        const allDone = updatedSubs.length > 0 && updatedSubs.every((s) => s.completed);
        return {
          ...t,
          subtasks: updatedSubs,
          completed: allDone ? true : t.completed,
        };
      }),
    }));
  };

  const handleDelete = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#E8E2D8] dark:border-[#332C25] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] dark:text-[#FAF7F2] tracking-tight">
            Reminders &amp; To-Do
          </h1>
          <p className="text-xs sm:text-sm text-[#665D54] dark:text-[#9E9387] mt-0.5">
            Apple Reminders-style checklist with individual course tagging, due dates &amp; smart subtasks
          </p>
        </div>
        <div className="text-xs font-mono text-[#8C7D70] dark:text-[#80766B]">
          {data.tasks.filter((t) => !t.completed).length} pending · {completedCount} completed
        </div>
      </div>

      {/* Apple Reminders 4-Grid Smart Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today */}
        <button
          type="button"
          onClick={() => setSmartFilter('today')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            smartFilter === 'today'
              ? 'bg-[#3C2E25] text-[#FAF7F2] border-[#3C2E25] shadow-sm dark:bg-[#FAF7F2] dark:text-[#1C1917] dark:border-[#FAF7F2]'
              : 'bg-white dark:bg-[#1E1B18] border-[#E8E2D8] dark:border-[#322A23] hover:border-[#3C2E25]/40 text-[#1C1917] dark:text-[#FAF7F2]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              smartFilter === 'today' ? 'bg-white/20 dark:bg-black/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}>
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold font-mono">{todayTasksCount}</span>
          </div>
          <span className="text-xs font-semibold">Today</span>
        </button>

        {/* Scheduled / All */}
        <button
          type="button"
          onClick={() => setSmartFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            smartFilter === 'all'
              ? 'bg-[#3C2E25] text-[#FAF7F2] border-[#3C2E25] shadow-sm dark:bg-[#FAF7F2] dark:text-[#1C1917] dark:border-[#FAF7F2]'
              : 'bg-white dark:bg-[#1E1B18] border-[#E8E2D8] dark:border-[#322A23] hover:border-[#3C2E25]/40 text-[#1C1917] dark:text-[#FAF7F2]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              smartFilter === 'all' ? 'bg-white/20 dark:bg-black/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
            }`}>
              <ListTodo className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold font-mono">{totalTasks - completedCount}</span>
          </div>
          <span className="text-xs font-semibold">Active Tasks</span>
        </button>

        {/* Longer Projects & Milestones */}
        <button
          type="button"
          onClick={() => setSmartFilter('longer_term')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            smartFilter === 'longer_term'
              ? 'bg-[#3C2E25] text-[#FAF7F2] border-[#3C2E25] shadow-sm dark:bg-[#FAF7F2] dark:text-[#1C1917] dark:border-[#FAF7F2]'
              : 'bg-white dark:bg-[#1E1B18] border-[#E8E2D8] dark:border-[#322A23] hover:border-[#3C2E25]/40 text-[#1C1917] dark:text-[#FAF7F2]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              smartFilter === 'longer_term' ? 'bg-white/20 dark:bg-black/20' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
            }`}>
              <FolderKanban className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold font-mono">{longerTermCount}</span>
          </div>
          <span className="text-xs font-semibold">Longer Projects</span>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => setSmartFilter('completed')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            smartFilter === 'completed'
              ? 'bg-[#3C2E25] text-[#FAF7F2] border-[#3C2E25] shadow-sm dark:bg-[#FAF7F2] dark:text-[#1C1917] dark:border-[#FAF7F2]'
              : 'bg-white dark:bg-[#1E1B18] border-[#E8E2D8] dark:border-[#322A23] hover:border-[#3C2E25]/40 text-[#1C1917] dark:text-[#FAF7F2]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              smartFilter === 'completed' ? 'bg-white/20 dark:bg-black/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold font-mono">{completedCount}</span>
          </div>
          <span className="text-xs font-semibold">Completed</span>
        </button>
      </div>

      {/* Quick Add Bar (Apple-Style) */}
      <form
        onSubmit={handleAddTask}
        className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E8E2D8] dark:border-[#322A23] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <div className="flex items-center gap-2 flex-1 px-2">
          <Plus className="w-4 h-4 text-[#8A5836] dark:text-[#C4976A] shrink-0" />
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add new reminder or task..."
            className="w-full bg-transparent text-sm text-[#1C1917] dark:text-[#FAF7F2] placeholder-[#8C7D70] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0EBE2] dark:border-[#2C2621]">
          <select
            value={newCourse}
            onChange={(e) => setNewCourse(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#28221D] border border-[#E0D8CB] dark:border-[#383028] text-xs font-mono text-[#1C1917] dark:text-[#FAF7F2] focus:outline-none"
          >
            {courseCodes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="GENERAL">GENERAL</option>
          </select>

          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#28221D] border border-[#E0D8CB] dark:border-[#383028] text-xs font-medium text-[#1C1917] dark:text-[#FAF7F2] focus:outline-none"
          >
            <option value="high">High !</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#28221D] border border-[#E0D8CB] dark:border-[#383028] text-xs font-mono text-[#1C1917] dark:text-[#FAF7F2] focus:outline-none"
          />

          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] text-xs font-semibold hover:opacity-90 transition shrink-0"
          >
            Add
          </button>
        </div>
      </form>

      {/* Filter Row & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setCourseFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition shrink-0 ${
              courseFilter === 'all'
                ? 'bg-[#EFEAE1] dark:bg-[#2C2520] font-bold text-[#1C1917] dark:text-[#FAF7F2]'
                : 'text-[#665D54] dark:text-[#9E9387] hover:text-[#1C1917]'
            }`}
          >
            All Courses
          </button>
          {courseCodes.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCourseFilter(code)}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition shrink-0 ${
                courseFilter === code
                  ? 'bg-[#EFEAE1] dark:bg-[#2C2520] font-bold text-[#1C1917] dark:text-[#FAF7F2]'
                  : 'text-[#665D54] dark:text-[#9E9387] hover:text-[#1C1917]'
              }`}
            >
              {code}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8C7D70]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reminders..."
            className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E8E2D8] dark:border-[#322A23] text-xs text-[#1C1917] dark:text-[#FAF7F2] placeholder-[#8C7D70] focus:outline-none w-full sm:w-48"
          />
        </div>
      </div>

      {/* Grouped Reminders Card */}
      <div className="apple-card divide-y divide-[#F0EBE2] dark:divide-[#28221D] overflow-hidden">
        {filteredTasks.map((task) => {
          const isDecomposing = decomposingTaskId === task.id;
          return (
            <div
              key={task.id}
              className="p-4 sm:p-5 space-y-3 hover:bg-[#FAF8F5]/80 dark:hover:bg-[#241F1B]/60 transition"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Circular Checkbox (Apple Reminders style) */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(task.id)}
                    aria-label={`Toggle completion for ${task.title}`}
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border transition ${
                      task.completed
                        ? 'bg-[#3C2E25] border-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:border-[#FAF7F2] dark:text-[#1C1917]'
                        : 'border-[#8C7D70]/60 hover:border-[#3C2E25] dark:hover:border-[#FAF7F2]'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <p
                      onClick={() => handleToggle(task.id)}
                      className={`text-sm sm:text-base font-medium leading-snug cursor-pointer ${
                        task.completed
                          ? 'line-through text-[#8C7D70] dark:text-[#6E6357]'
                          : 'text-[#1C1917] dark:text-[#FAF7F2]'
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#665D54] dark:text-[#9E9387]">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-[#25201B] border border-[#E8E2D8] dark:border-[#332C25] font-semibold text-[#3C2E25] dark:text-[#FAF7F2]">
                        {task.course}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8C7D70]" />
                        <span>Due {task.dueDate}</span>
                      </span>
                      {task.priority === 'high' && (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                          <Flag className="w-3 h-3" /> High
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isDecomposing}
                    onClick={() => handleDecomposeTask(task)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-[#E0D8CB] dark:border-[#383028] bg-white dark:bg-[#201C18] text-xs font-medium text-[#3C2E25] dark:text-[#E8E2D8] hover:bg-[#FAF7F2] dark:hover:bg-[#28221D] transition"
                  >
                    {isDecomposing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-[#8A5836] dark:text-[#C4976A]" />
                    )}
                    <span className="hidden sm:inline">
                      {task.subtasks?.length ? 'Regenerate' : 'Subtasks'}
                    </span>
                  </button>

                  {onStartTaskFocus && !task.completed && (
                    <button
                      type="button"
                      onClick={() => onStartTaskFocus(task.course, task.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] text-xs font-semibold hover:opacity-90 transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Focus</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    aria-label="Delete task"
                    className="p-1.5 rounded-lg text-[#8C7D70] hover:text-rose-600 dark:hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subtasks Drawer */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="ml-8 p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#24201C] border border-[#E8E2D8] dark:border-[#322A23] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#665D54] dark:text-[#9E9387]">
                    <span>Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} done)</span>
                    <span>{task.subtasks.reduce((a, b) => a + b.estimatedMinutes, 0)}m est.</span>
                  </div>
                  <div className="divide-y divide-[#EBE5DB] dark:divide-[#2F2924]">
                    {task.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => handleToggleSubtask(task.id, sub.id)}
                        className="py-1.5 flex items-center justify-between gap-2 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition ${
                              sub.completed
                                ? 'bg-[#3C2E25] border-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:border-[#FAF7F2] dark:text-[#1C1917]'
                                : 'border-[#8C7D70]'
                            }`}
                          >
                            {sub.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>
                          <span className={sub.completed ? 'line-through text-[#8C7D70]' : 'text-[#1C1917] dark:text-[#FAF7F2]'}>
                            {sub.title}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#8C7D70]">{sub.estimatedMinutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F0EBE2] dark:bg-[#2A231D] flex items-center justify-center text-[#8A5836] dark:text-[#C4976A]">
              <ListTodo className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-[#1C1917] dark:text-[#FAF7F2]">
              {data.tasks.length === 0 ? 'Your task ledger is clear' : 'No tasks in this filter'}
            </p>
            <p className="text-xs text-[#8C7D70] max-w-sm leading-relaxed">
              {data.tasks.length === 0
                ? 'Type an assignment, reading, or reminder above to start structuring your academic workload.'
                : 'Try selecting All Tasks or clear the search query.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
