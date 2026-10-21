import React, { useState } from 'react';
import {
  Check,
  Plus,
  Search,
  Trash2,
  Sparkles,
  Play,
  Loader2,
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState(data.courses[0]?.code || 'CS-301');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('high');

  const [decomposingTaskId, setDecomposingTaskId] = useState<string | null>(null);

  const courseCodes = Array.from(
    new Set([...data.courses.map((c) => c.code), ...data.tasks.map((t) => t.course)])
  );

  const filteredTasks = data.tasks.filter((task) => {
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    if (courseFilter !== 'all' && task.course !== courseFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (
        !task.title.toLowerCase().includes(q) &&
        !task.course.toLowerCase().includes(q)
      ) {
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
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
          Assignments & Daily Tasks
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Track problem sets, decompose large labs with Gemini into study sub-steps, and launch linked focus sessions.
        </p>
      </div>

      {/* Add Assignment Form */}
      <form
        onSubmit={handleAddTask}
        className="p-5 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4"
      >
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          New Assignment or Study Task
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Assignment title (e.g. Finish Dynamic Programming Lab 5)..."
            className="sm:col-span-5 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-950 dark:focus:border-white"
          />
          <select
            aria-label="Course code"
            value={newCourse}
            onChange={(e) => setNewCourse(e.target.value)}
            className="sm:col-span-2 px-3 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white"
          >
            {courseCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
            <option value="GENERAL">GENERAL</option>
          </select>
          <select
            aria-label="Task priority"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="sm:col-span-2 px-3 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <input
            type="date"
            aria-label="Due date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="sm:col-span-2 px-3 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white"
          />
          <button
            type="submit"
            className="sm:col-span-1 px-4 py-2.5 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1"
            aria-label="Add Assignment"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:hidden">Add Task</span>
          </button>
        </div>
      </form>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-fit">
          {(['all', 'pending', 'completed'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCourseFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition whitespace-nowrap ${
                courseFilter === 'all'
                  ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All Courses
            </button>
            {courseCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCourseFilter(code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition whitespace-nowrap ${
                  courseFilter === code
                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 pr-4 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Task Table / List */}
      <div className="rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-900 overflow-hidden">
        {filteredTasks.map((task) => {
          const isDecomposing = decomposingTaskId === task.id;
          return (
            <div
              key={task.id}
              className="p-4 sm:p-6 space-y-4 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(task.id)}
                    aria-label={`Toggle completion for ${task.title}`}
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border transition ${
                      task.completed
                        ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:border-white dark:text-black'
                        : 'border-zinc-400 dark:border-zinc-700 text-transparent hover:border-zinc-950 dark:hover:border-white'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p
                      onClick={() => handleToggle(task.id)}
                      className={`text-sm sm:text-base font-semibold leading-snug cursor-pointer ${
                        task.completed
                          ? 'line-through text-zinc-400 dark:text-zinc-600'
                          : 'text-zinc-950 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold">
                        {task.course}
                      </span>
                      <span aria-hidden="true">·</span>
                      <label className="inline-flex items-center gap-1">
                        <span>Due</span>
                        <input
                          type="date"
                          aria-label={`Due date for ${task.title}`}
                          value={task.dueDate}
                          onChange={(e) =>
                            handleUpdateTaskField(task.id, { dueDate: e.target.value })
                          }
                          className="bg-transparent border-b border-transparent hover:border-zinc-400 focus:border-zinc-950 dark:focus:border-white text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none"
                        />
                      </label>
                      <span aria-hidden="true">·</span>
                      <select
                        aria-label={`Priority for ${task.title}`}
                        value={task.priority}
                        onChange={(e) =>
                          handleUpdateTaskField(task.id, {
                            priority: e.target.value as 'low' | 'medium' | 'high',
                          })
                        }
                        className="bg-transparent text-xs font-mono capitalize text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                      >
                        <option value="high">high priority</option>
                        <option value="medium">medium priority</option>
                        <option value="low">low priority</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    disabled={isDecomposing}
                    onClick={() => handleDecomposeTask(task)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:border-zinc-950 dark:hover:border-white transition disabled:opacity-50"
                  >
                    {isDecomposing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {task.subtasks && task.subtasks.length > 0
                        ? 'Regenerate Steps'
                        : 'Break Down with AI'}
                    </span>
                  </button>

                  {onStartTaskFocus && !task.completed && (
                    <button
                      type="button"
                      onClick={() => onStartTaskFocus(task.course, task.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Focus</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    aria-label={`Delete task ${task.title}`}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Decomposed Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="ml-0 sm:ml-9 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    <span>Execution Study Plan ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} completed)</span>
                    <span>Est. {task.subtasks.reduce((a, b) => a + b.estimatedMinutes, 0)}m total</span>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {task.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => handleToggleSubtask(task.id, sub.id)}
                        className="py-2 flex items-center justify-between gap-3 cursor-pointer group/sub"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            aria-label={`Toggle substep ${sub.title}`}
                            className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition ${
                              sub.completed
                                ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:border-white dark:text-black'
                                : 'border-zinc-400 dark:border-zinc-700 text-transparent group-hover/sub:border-zinc-950 dark:group-hover/sub:border-white'
                            }`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </button>
                          <span
                            className={`text-xs sm:text-sm ${
                              sub.completed
                                ? 'line-through text-zinc-400 dark:text-zinc-600'
                                : 'text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            {sub.title}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-zinc-400 shrink-0">
                          {sub.estimatedMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              No assignments or tasks match your current filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCourseFilter('all');
                setSearchQuery('');
              }}
              className="text-xs font-mono underline text-zinc-900 dark:text-white"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
