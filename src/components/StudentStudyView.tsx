import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Check,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
} from 'lucide-react';
import type {
  CourseDocument,
  CourseItem,
  StudentWorkspaceData,
  SyllabusTopicItem,
} from '../types/index.ts';
import { calculateStudyMetrics } from '../utils/workspace.ts';
import { requestCourseSyllabus } from '../utils/aiClient.ts';
import { SubjectDocumentModal } from './SubjectDocumentModal.tsx';

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
  const [totalTopics, setTotalTopics] = useState('6');
  const [credits, setCredits] = useState('4');
  const [grade, setGrade] = useState('A');

  const [expandedCourseIds, setExpandedCourseIds] = useState<Record<string, boolean>>({
    'c-1': true,
  });
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});
  const [generatingCourseId, setGeneratingCourseId] = useState<string | null>(null);
  const [activeDocModalCourse, setActiveDocModalCourse] = useState<CourseItem | null>(null);

  const handleSaveCourseDocuments = (courseId: string, docs: CourseDocument[]) => {
    onUpdateData((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id === courseId ? { ...c, documents: docs } : c
      ),
    }));
    // Keep active modal course updated in state
    setActiveDocModalCourse((prev) => (prev && prev.id === courseId ? { ...prev, documents: docs } : prev));
  };

  const metrics = calculateStudyMetrics(data.courses);
  const totalCredits = data.courses.reduce((acc, c) => acc + c.credits, 0);

  const toggleExpandCourse = (courseId: string) => {
    setExpandedCourseIds((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

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
      courses: prev.courses.map((c) => {
        if (c.id !== courseId) return c;
        const nextCompleted = Math.min(
          c.totalTopics,
          Math.max(0, c.completedTopics + delta)
        );
        return {
          ...c,
          completedTopics: nextCompleted,
        };
      }),
    }));
  };

  const handleToggleSyllabusItem = (courseId: string, topicId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => {
        if (c.id !== courseId || !c.syllabusTopics) return c;
        const updatedList = c.syllabusTopics.map((item) =>
          item.id === topicId ? { ...item, completed: !item.completed } : item
        );
        const completedCount = updatedList.filter((i) => i.completed).length;
        return {
          ...c,
          syllabusTopics: updatedList,
          completedTopics: completedCount,
          totalTopics: Math.max(updatedList.length, c.totalTopics),
        };
      }),
    }));
  };

  const handleAddSyllabusTopic = (courseId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = (newTopicInputs[courseId] || '').trim();
    if (!text) return;

    const newItem: SyllabusTopicItem = {
      id: 'top-' + Date.now(),
      title: text,
      completed: false,
    };

    onUpdateData((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => {
        if (c.id !== courseId) return c;
        const updatedList = [...(c.syllabusTopics || []), newItem];
        return {
          ...c,
          syllabusTopics: updatedList,
          totalTopics: updatedList.length,
          completedTopics: updatedList.filter((i) => i.completed).length,
        };
      }),
    }));

    setNewTopicInputs((prev) => ({ ...prev, [courseId]: '' }));
  };

  const handleGenerateAISyllabus = async (course: CourseItem) => {
    setGeneratingCourseId(course.id);
    try {
      const res = await requestCourseSyllabus(course.code, course.name);
      onUpdateData((prev) => ({
        ...prev,
        courses: prev.courses.map((c) =>
          c.id === course.id
            ? {
                ...c,
                syllabusTopics: res.topics,
                totalTopics: res.topics.length,
                completedTopics: 0,
              }
            : c
        ),
      }));
      setExpandedCourseIds((prev) => ({ ...prev, [course.id]: true }));
    } finally {
      setGeneratingCourseId(null);
    }
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
      totalTopics: Math.max(1, parseInt(totalTopics, 10) || 6),
      grade,
      credits: Math.max(1, parseInt(credits, 10) || 3),
      syllabusTopics: [],
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
            Monitor named syllabus modules, weekly study hours, and semester GPA across your courses.
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
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code (e.g. CS-402)"
              className="sm:col-span-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
            />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Course Name (e.g. Machine Learning)"
              className="sm:col-span-4 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white"
            />
            <input
              type="number"
              min="1"
              value={targetHours}
              onChange={(e) => setTargetHours(e.target.value)}
              placeholder="Target hrs/wk"
              title="Weekly Target Study Hours"
              className="sm:col-span-2 px-3 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
            />
            <input
              type="number"
              min="1"
              max="6"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="Credits"
              title="Course Credits"
              className="sm:col-span-2 px-3 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
            />
            <button
              type="submit"
              className="sm:col-span-2 px-4 py-2.5 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition"
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
      {data.courses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            No courses enrolled yet
          </h2>
          <p className="text-xs text-zinc-500 max-w-sm">
            Add your subjects with credit hours and study targets to unlock automated GPA tracking and AI syllabus generation.
          </p>
          <button
            type="button"
            onClick={() => setShowAddCourse(true)}
            className="px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition mt-2"
          >
            + Add First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {data.courses.map((course) => {
          const hourPct = Math.min(
            100,
            Math.round((course.loggedHours / Math.max(1, course.targetHoursPerWeek)) * 100)
          );
          const topicPct = Math.min(
            100,
            Math.round((course.completedTopics / Math.max(1, course.totalTopics)) * 100)
          );
          const isExpanded = Boolean(expandedCourseIds[course.id]);
          const isGenerating = generatingCourseId === course.id;

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

              {/* Quick Action Buttons with Decrement & Increment Controls */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleLogHour(course.id, -1)}
                    aria-label={`Subtract 1 study hour from ${course.code}`}
                    className="px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-500 transition"
                  >
                    -1h
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogHour(course.id, 1)}
                    className="px-3.5 py-1.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition active:scale-95"
                  >
                    +1h Study
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCompleteTopic(course.id, -1)}
                    aria-label={`Subtract 1 completed topic from ${course.code}`}
                    className="px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-500 transition"
                  >
                    -1 Topic
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCompleteTopic(course.id, 1)}
                    className="px-3.5 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 text-xs font-medium transition active:scale-95"
                  >
                    +1 Topic
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDocModalCourse(course)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D8A775]/50 bg-gradient-to-r from-amber-500/10 to-transparent text-xs font-semibold text-[#8A5836] dark:text-[#D8A775] hover:border-[#8A5836] transition shadow-2xs"
                    title="Manage PDFs, syllabus notes & analyze with Gemini"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Docs ({course.documents?.length || 0})</span>
                    {course.documents?.some((d) => d.analysis) && (
                      <Sparkles className="w-3 h-3 text-[#8A5836] dark:text-[#D8A775]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleExpandCourse(course.id)}
                    className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                  >
                    <span>Syllabus ({course.syllabusTopics?.length || 0})</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable Named Syllabus Topic Checklist */}
              {isExpanded && (
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      Syllabus Modules Checklist
                    </span>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleGenerateAISyllabus(course)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:border-zinc-950 dark:hover:border-white transition"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>AI Populate Modules</span>
                    </button>
                  </div>

                  {course.syllabusTopics && course.syllabusTopics.length > 0 ? (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {course.syllabusTopics.map((topic) => (
                        <div
                          key={topic.id}
                          onClick={() => handleToggleSyllabusItem(course.id, topic.id)}
                          className="py-2 flex items-center gap-2.5 cursor-pointer group/topic"
                        >
                          <button
                            type="button"
                            aria-label={`Toggle syllabus topic ${topic.title}`}
                            className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition ${
                              topic.completed
                                ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:border-white dark:text-black'
                                : 'border-zinc-400 dark:border-zinc-700 text-transparent group-hover/topic:border-zinc-950 dark:group-hover/topic:border-white'
                            }`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </button>
                          <span
                            className={`text-xs sm:text-sm ${
                              topic.completed
                                ? 'line-through text-zinc-400 dark:text-zinc-600'
                                : 'text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            {topic.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      No named syllabus topics yet. Add one below or generate with AI.
                    </p>
                  )}

                  <form
                    onSubmit={(e) => handleAddSyllabusTopic(course.id, e)}
                    className="flex gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={newTopicInputs[course.id] || ''}
                      onChange={(e) =>
                        setNewTopicInputs((prev) => ({
                          ...prev,
                          [course.id]: e.target.value,
                        }))
                      }
                      placeholder="Add syllabus topic or chapter..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold"
                    >
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {activeDocModalCourse && (
        <SubjectDocumentModal
          isOpen={Boolean(activeDocModalCourse)}
          onClose={() => setActiveDocModalCourse(null)}
          course={activeDocModalCourse}
          onSaveDocuments={(docs) => handleSaveCourseDocuments(activeDocModalCourse.id, docs)}
        />
      )}
    </div>
  );
};
