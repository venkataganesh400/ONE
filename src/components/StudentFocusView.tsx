import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import type { StudentWorkspaceData } from '../types/index.ts';
import { formatTimeLeft } from '../utils/workspace.ts';

interface StudentFocusViewProps {
  data: StudentWorkspaceData;
  onUpdateData: (updater: (prev: StudentWorkspaceData) => StudentWorkspaceData) => void;
}

const PRESETS = [
  { label: '25m Pomodoro', minutes: 25 },
  { label: '50m Lecture', minutes: 50 },
  { label: '90m Exam Prep', minutes: 90 },
  { label: '5m Rest', minutes: 5 },
];

export const StudentFocusView: React.FC<StudentFocusViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(data.focusCadenceMinutes || 50);
  const [timeLeft, setTimeLeft] = useState((data.focusCadenceMinutes || 50) * 60);
  const [isRunning, setIsRunning] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(
    data.activeFocusCourse || data.courses[0]?.code || 'CS-301'
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    data.activeFocusTaskId || ''
  );
  const [markTaskDoneOnFinish, setMarkTaskDoneOnFinish] = useState(false);

  // Sync if user deep-linked from Overview or Tasks
  useEffect(() => {
    if (data.activeFocusCourse) {
      setSelectedCourse(data.activeFocusCourse);
    }
    if (data.activeFocusTaskId !== undefined) {
      setSelectedTaskId(data.activeFocusTaskId || '');
    }
  }, [data.activeFocusCourse, data.activeFocusTaskId]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pendingTasks = data.tasks.filter((t) => !t.completed);
  const activeTask = data.tasks.find((t) => t.id === selectedTaskId);

  const playChime = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.1);
    } catch {
      // Fallback if audio autoplay is blocked
    }
  };

  const creditSessionToCourse = (
    courseCode: string,
    minutes: number,
    taskId?: string,
    completeTask?: boolean
  ) => {
    const addedHours = Number((minutes / 60).toFixed(1));
    onUpdateData((prev) => {
      const linkedTask = prev.tasks.find((t) => t.id === taskId);
      return {
        ...prev,
        sessions: [
          {
            id: 'ss-' + Date.now(),
            courseCode,
            taskId: linkedTask?.id,
            taskTitle: linkedTask?.title,
            durationMinutes: minutes,
            completedAt: new Date().toISOString(),
          },
          ...prev.sessions,
        ],
        courses: prev.courses.map((c) =>
          c.code === courseCode
            ? { ...c, loggedHours: Number((c.loggedHours + addedHours).toFixed(1)) }
            : c
        ),
        tasks:
          completeTask && taskId
            ? prev.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
            : prev.tasks,
      };
    });
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playChime();
            creditSessionToCourse(
              selectedCourse,
              selectedMinutes,
              selectedTaskId || undefined,
              markTaskDoneOnFinish
            );
            return selectedMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, selectedCourse, selectedMinutes, selectedTaskId, markTaskDoneOnFinish]);

  const handleSelectPreset = (minutes: number) => {
    setIsRunning(false);
    setSelectedMinutes(minutes);
    setTimeLeft(minutes * 60);
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    const found = data.tasks.find((t) => t.id === taskId);
    if (found && found.course !== 'GENERAL') {
      setSelectedCourse(found.course);
    }
    onUpdateData((prev) => ({
      ...prev,
      activeFocusTaskId: taskId || null,
      activeFocusCourse: found?.course || prev.activeFocusCourse,
    }));
  };

  const handleCompleteNow = () => {
    setIsRunning(false);
    playChime();
    creditSessionToCourse(
      selectedCourse,
      selectedMinutes,
      selectedTaskId || undefined,
      markTaskDoneOnFinish
    );
    setTimeLeft(selectedMinutes * 60);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
          Focus & Study Session Timer
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Bind your session to a specific course and assignment, lock in your study cadence, and automatically log hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Timer Card */}
        <section className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center space-y-7">
          {/* Interval Selector Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset.minutes)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  selectedMinutes === preset.minutes
                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Course & Assignment Attribution Selectors */}
          <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="space-y-1">
              <label
                htmlFor="focus-course-select"
                className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400"
              >
                Course Attribution
              </label>
              <select
                id="focus-course-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono font-semibold text-zinc-950 dark:text-white"
              >
                {data.courses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="focus-task-select"
                className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400"
              >
                Linked Assignment / Task
              </label>
              <select
                id="focus-task-select"
                value={selectedTaskId}
                onChange={(e) => handleSelectTask(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white"
              >
                <option value="">General Course Study (No specific task)</option>
                {pendingTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.course}] {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeTask && !activeTask.completed && (
            <label className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={markTaskDoneOnFinish}
                onChange={(e) => setMarkTaskDoneOnFinish(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700"
              />
              <span>
                Mark &ldquo;{activeTask.title}&rdquo; complete when session finishes
              </span>
            </label>
          )}

          {/* Big Tabular Countdown */}
          <div className="py-2">
            <div className="text-6xl sm:text-8xl font-extrabold font-mono text-zinc-950 dark:text-white tracking-tight tabular-nums">
              {formatTimeLeft(timeLeft)}
            </div>
            <p className="mt-2 text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {isRunning
                ? `Focusing on ${selectedCourse}${activeTask ? ` · ${activeTask.title}` : ''}`
                : 'Ready to Begin'}
            </p>
          </div>

          {/* Primary Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-sm font-semibold hover:opacity-90 transition active:scale-95"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Session</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Study Block</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(selectedMinutes * 60);
              }}
              aria-label="Reset timer"
              className="p-4 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCompleteNow}
              className="flex items-center gap-1.5 px-5 py-4 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 text-xs font-semibold transition"
            >
              <Check className="w-4 h-4" />
              <span>Log {selectedMinutes}m Now</span>
            </button>
          </div>
        </section>

        {/* Right 5 Cols: Active Study Guardrails & Session Log */}
        <div className="lg:col-span-5 space-y-6">
          <section className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h2 className="text-base font-bold text-zinc-950 dark:text-white">
              Locked Study Guardrails
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
              {data.distractionRules.map((rule) => (
                <li key={rule} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-zinc-950 dark:text-white shrink-0" />
                  <span className="capitalize">{rule.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                Completed Study Sessions
              </h2>
              <span className="text-xs font-mono text-zinc-500">
                {data.sessions.length} logged
              </span>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-900">
              {data.sessions.slice(0, 6).map((session) => (
                <div
                  key={session.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-zinc-950 dark:text-white font-semibold">
                        {session.courseCode}
                      </strong>
                      <span className="text-zinc-400">·</span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {session.completedAt.split('T')[0]}
                      </span>
                    </div>
                    {session.taskTitle && (
                      <p className="mt-0.5 text-[11px] font-sans text-zinc-500 dark:text-zinc-400 truncate">
                        {session.taskTitle}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
                    +{session.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
