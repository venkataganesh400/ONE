import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { CourseItem, StudentWorkspaceData } from '../types/index.ts';
import { calculateStudyMetrics } from '../utils/workspace.ts';

interface StudentStudyViewProps {
  data: StudentWorkspaceData;
  onUpdateData: (updater: (prev: StudentWorkspaceData) => StudentWorkspaceData) => void;
}

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D'];

export const StudentStudyView: React.FC<StudentStudyViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [targetHours, setTargetHours] = useState('10');
  const [totalTopics, setTotalTopics] = useState('16');
  const [credits, setCredits] = useState('4');
  const [grade, setGrade] = useState('A');

  const metrics = calculateStudyMetrics(data.courses);
  const totalCredits = data.courses.reduce((acc, c) => acc + c.credits, 0);

  const handleLogHour = (courseId: string, delta: number) => {
    onUpdateData((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id === courseId
          ? { ...c, loggedHours: Math.max(0, Number((c.loggedHours + delta).toFixed(1))) }
          : c
      ),
    }));
  };

  const handleCompleteTopic = (courseId: string, delta: number) => {
    onUpdateData((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              completedTopics: Math.min(
                c.totalTopics,
                Math.max(0, c.completedTopics + delta)
              ),
            }
          : c
      ),
    }));
  };

  const handleUpdateGrade = (courseId: string, newGrade: string) => {
    onUpdateData((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => (c.id === courseId ? { ...c, grade: newGrade } : c)),
    }));
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const newCourse: CourseItem = {
      id: 'c-' + Date.now(),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      targetHoursPerWeek: Math.max(1, parseInt(targetHours, 10) || 10),
      loggedHours: 0,
      completedTopics: 0,
      totalTopics: Math.max(1, parseInt(totalTopics, 10) || 15),
      grade,
      credits: Math.max(1, parseInt(credits, 10) || 3),
    };

    onUpdateData((prev) => ({
      ...prev,
      courses: [...prev.courses, newCourse],
    }));

    setCode('');
    setName('');
    setShowAddCourse(false);
  };

  const handleDeleteCourse = (courseId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== courseId),
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Studies & Course Tracker
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Monitor syllabus completion, weekly study hours, and semester GPA across your courses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCourse(!showAddCourse)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddCourse ? 'Cancel' : 'Add Course'}</span>
        </button>
      </div>

      {/* Add Course Form */}
      {showAddCourse && (
        <form
          onSubmit={handleAddCourse}
          className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            Enroll New Course
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code (e.g. CS-402)"
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
            />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Course Name (e.g. Machine Learning)"
              className="sm:col-span-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white"
            />
            <input
              type="number"
              min="1"
              value={targetHours}
              onChange={(e) => setTargetHours(e.target.value)}
              placeholder="Target hrs/wk"
              title="Weekly Target Study Hours"
              className="px-3 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
            />
            <input
              type="number"
              min="1"
              value={totalTopics}
              onChange={(e) => setTotalTopics(e.target.value)}
              placeholder="Total topics"
              title="Total Syllabus Topics"
              className="px-3 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition"
            >
              Save Course
            </button>
          </div>
        </form>
      )}

      {/* Academic Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Weighted GPA</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {metrics.estimatedGpa}
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">4.00 Scale</span>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Study Hours Logged</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {metrics.totalLoggedHours}
            <span className="text-base font-normal text-zinc-400">
              /{metrics.totalTargetHours}h
            </span>
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">This week</span>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Syllabus Mastery</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {metrics.overallMasteryPercent}%
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Topics completed</span>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Enrolled Load</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {totalCredits} <span className="text-base font-normal text-zinc-400">credits</span>
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {data.courses.length} active subjects
          </span>
        </div>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.courses.map((course) => {
          const hourPct = Math.min(
            100,
            Math.round((course.loggedHours / Math.max(1, course.targetHoursPerWeek)) * 100)
          );
          const topicPct = Math.min(
            100,
            Math.round((course.completedTopics / Math.max(1, course.totalTopics)) * 100)
          );

          return (
            <div
              key={course.id}
              className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    <span>{course.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.credits} Credits</span>
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-zinc-950 dark:text-white">
                    {course.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor={`grade-${course.id}`} className="sr-only">
                    Grade for {course.name}
                  </label>
                  <select
                    id={`grade-${course.id}`}
                    value={course.grade}
                    onChange={(e) => handleUpdateGrade(course.id, e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-950 dark:text-white"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        Grade: {g}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course.id)}
                    aria-label={`Delete course ${course.code}`}
                    className="p-1.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Study Hours Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Weekly Study Hours</span>
                  <span className="font-mono font-semibold text-zinc-950 dark:text-white">
                    {course.loggedHours} / {course.targetHoursPerWeek} hrs ({hourPct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-zinc-950 dark:bg-white transition-all duration-300"
                    style={{ width: `${hourPct}%` }}
                  />
                </div>
              </div>

              {/* Syllabus Topics Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Syllabus Topics Mastered</span>
                  <span className="font-mono font-semibold text-zinc-950 dark:text-white">
                    {course.completedTopics} / {course.totalTopics} topics ({topicPct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-zinc-700 dark:bg-zinc-300 transition-all duration-300"
                    style={{ width: `${topicPct}%` }}
                  />
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-900 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLogHour(course.id, 1)}
                  className="px-3.5 py-2 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition active:scale-95"
                >
                  +1h Study
                </button>
                <button
                  type="button"
                  onClick={() => handleCompleteTopic(course.id, 1)}
                  className="px-3.5 py-2 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 text-xs font-medium transition active:scale-95"
                >
                  +1 Syllabus Topic
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
