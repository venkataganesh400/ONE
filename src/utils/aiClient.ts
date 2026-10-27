import type {
  ExpenseCategory,
  ExpenseItem,
  NoteFlashcard,
  ScheduleBlock,
  StudentWorkspaceData,
  SyllabusTopicItem,
  TaskItem,
  TaskSubstep,
  TimetableSlot,
} from '../types/index.ts';
import {
  buildLocalSmartSchedule,
  classifyAndScheduleTasksLocally,
  decomposeTaskLocally,
  generateCourseSyllabusLocally,
  generateNoteQuizLocally,
  getTodayDayOfWeek,
  parseNaturalLanguageExpensesLocally,
  parseTimetableLocally,
  analyzeDocumentLocally,
} from './workspace.ts';

export async function requestSmartSchedule(
  data: StudentWorkspaceData,
  startHour: string = '08:30'
): Promise<{ coachNote: string; blocks: ScheduleBlock[]; source: 'gemini' | 'local' }> {
  try {
    const res = await fetch('/api/gemini/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dailyPriority: data.dailyPriority,
        focusCadenceMinutes: data.focusCadenceMinutes,
        studyMode: data.studyMode,
        tasks: data.tasks.filter((t) => !t.completed),
        exams: data.exams,
        courses: data.courses,
        startHour,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.blocks) && json.blocks.length > 0) {
        const blocks: ScheduleBlock[] = json.blocks.map(
          (
            b: {
              startTime?: string;
              endTime?: string;
              title?: string;
              course?: string;
              type?: string;
              durationMinutes?: number;
            },
            idx: number
          ) => ({
            id: `sb-ai-${Date.now()}-${idx}`,
            startTime: b.startTime || '09:00',
            endTime: b.endTime || '09:50',
            title: b.title || 'Focused Study Session',
            course: b.course || data.courses[0]?.code || 'CS-301',
            type:
              b.type === 'break' ||
              b.type === 'exam_prep' ||
              b.type === 'review' ||
              b.type === 'focus'
                ? b.type
                : 'focus',
            durationMinutes: Number(b.durationMinutes) || data.focusCadenceMinutes || 50,
            completed: false,
          })
        );
        return {
          coachNote:
            json.coachNote ||
            'Gemini structured your daily blocks around upcoming deadlines and energy peaks.',
          blocks,
          source: 'gemini',
        };
      }
    }
  } catch {
    // Offline or static host fallback
  }

  const fallback = buildLocalSmartSchedule(data, startHour);
  return { ...fallback, source: 'local' };
}

export async function requestTaskDecomposition(
  title: string,
  course: string,
  dueDate: string,
  focusCadenceMinutes: number
): Promise<{ subtasks: TaskSubstep[]; source: 'gemini' | 'local' }> {
  try {
    const res = await fetch('/api/gemini/decompose-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, course, dueDate, focusCadenceMinutes }),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.subtasks) && json.subtasks.length > 0) {
        const subtasks: TaskSubstep[] = json.subtasks.map(
          (s: { title?: string; estimatedMinutes?: number }, idx: number) => ({
            id: `sub-ai-${Date.now()}-${idx}`,
            title: s.title || `Step ${idx + 1}`,
            estimatedMinutes: Number(s.estimatedMinutes) || 25,
            completed: false,
          })
        );
        return { subtasks, source: 'gemini' };
      }
    }
  } catch {
    // Offline fallback
  }

  return {
    subtasks: decomposeTaskLocally(title, course, focusCadenceMinutes),
    source: 'local',
  };
}

export async function requestNoteActiveRecall(
  title: string,
  course: string,
  content: string
): Promise<{
  summaryBullets: string[];
  flashcards: NoteFlashcard[];
  source: 'gemini' | 'local';
}> {
  try {
    const res = await fetch('/api/gemini/note-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, course, content }),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.flashcards) && json.flashcards.length > 0) {
        const flashcards: NoteFlashcard[] = json.flashcards.map(
          (f: { question?: string; answer?: string }, idx: number) => ({
            id: `fc-ai-${Date.now()}-${idx}`,
            question: f.question || 'Key concept question',
            answer: f.answer || 'Key concept explanation',
          })
        );
        const summaryBullets: string[] = Array.isArray(json.summaryBullets)
          ? json.summaryBullets
          : [];
        return { summaryBullets, flashcards, source: 'gemini' };
      }
    }
  } catch {
    // Offline fallback
  }

  const fallback = generateNoteQuizLocally(title, course, content);
  return { ...fallback, source: 'local' };
}

const VALID_CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Books & Supplies',
  'Coffee & Snacks',
  'Transport',
  'Housing & Utilities',
  'Other',
];

export async function requestSmartExpenseParse(
  rawText: string,
  monthlyBudget: number,
  totalSpent: number,
  todayStr: string,
  currency: string = '₹'
): Promise<{
  advice: string;
  items: Omit<ExpenseItem, 'id'>[];
  source: 'gemini' | 'local';
}> {
  try {
    const res = await fetch('/api/gemini/parse-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText,
        monthlyBudget,
        totalSpent,
        today: todayStr,
        currency,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.items) && json.items.length > 0) {
        const items: Omit<ExpenseItem, 'id'>[] = json.items
          .map(
            (item: {
              title?: string;
              amount?: number;
              category?: string;
              date?: string;
            }) => {
              const cat = VALID_CATEGORIES.includes(item.category as ExpenseCategory)
                ? (item.category as ExpenseCategory)
                : 'Other';
              return {
                title: item.title || 'Campus Expense',
                amount: Number(Number(item.amount || 0).toFixed(2)),
                category: cat,
                date: item.date || todayStr,
              };
            }
          )
          .filter((i: Omit<ExpenseItem, 'id'>) => i.amount > 0);

        if (items.length > 0) {
          return {
            advice: json.advice || 'Parsed and categorized your expenses.',
            items,
            source: 'gemini',
          };
        }
      }
    }
  } catch {
    // Offline fallback
  }

  const fallback = parseNaturalLanguageExpensesLocally(
    rawText,
    monthlyBudget,
    totalSpent,
    todayStr,
    currency
  );
  return { ...fallback, source: 'local' };
}

export async function requestCourseSyllabus(
  code: string,
  name: string
): Promise<{ topics: SyllabusTopicItem[]; source: 'gemini' | 'local' }> {
  try {
    const res = await fetch('/api/gemini/course-syllabus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, name }),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.topics) && json.topics.length > 0) {
        const topics: SyllabusTopicItem[] = json.topics.map((t: string, idx: number) => ({
          id: `top-ai-${Date.now()}-${idx}`,
          title: t,
          completed: false,
        }));
        return { topics, source: 'gemini' };
      }
    }
  } catch {
    // Offline fallback
  }

  return {
    topics: generateCourseSyllabusLocally(code, name),
    source: 'local',
  };
}

export interface AcademicCoachSuggestion {
  category: 'schedule' | 'exam_prep' | 'budget' | 'focus';
  title: string;
  description: string;
  actionTip: string;
}

export interface AcademicCoachResponse {
  dailyFocusRecommendation: string;
  scheduleRationale: string;
  suggestions: AcademicCoachSuggestion[];
  blocks: ScheduleBlock[];
  source: 'gemini' | 'local';
}

export async function requestAcademicCoach(
  data: StudentWorkspaceData
): Promise<AcademicCoachResponse> {
  try {
    const res = await fetch('/api/gemini/academic-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8500),
      body: JSON.stringify({
        dailyPriority: data.dailyPriority,
        focusCadenceMinutes: data.focusCadenceMinutes,
        tasks: data.tasks.filter((t) => !t.completed),
        courses: data.courses,
        exams: data.exams,
        expenses: data.expenses,
        monthlyBudget: data.monthlyBudget,
        currency: data.currency,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.dailyFocusRecommendation && Array.isArray(json.suggestions)) {
        const blocks: ScheduleBlock[] = Array.isArray(json.blocks)
          ? json.blocks.map(
              (
                b: {
                  startTime?: string;
                  endTime?: string;
                  title?: string;
                  course?: string;
                  type?: string;
                  durationMinutes?: number;
                },
                idx: number
              ) => ({
                id: `sb-coach-${Date.now()}-${idx}`,
                startTime: b.startTime || '09:00',
                endTime: b.endTime || '09:50',
                title: b.title || 'Focus Block',
                course: b.course || data.courses[0]?.code || 'STUDY',
                type:
                  b.type === 'break' || b.type === 'exam_prep' || b.type === 'review' || b.type === 'focus'
                    ? b.type
                    : 'focus',
                durationMinutes: Number(b.durationMinutes) || data.focusCadenceMinutes || 45,
                completed: false,
              })
            )
          : [];

        return {
          dailyFocusRecommendation: json.dailyFocusRecommendation,
          scheduleRationale: json.scheduleRationale,
          suggestions: json.suggestions,
          blocks,
          source: 'gemini',
        };
      }
    }
  } catch {
    // Offline fallback
  }

  const localSched = buildLocalSmartSchedule(data, '08:30');
  const pendingTasks = data.tasks.filter((t) => !t.completed);
  const topTask = pendingTasks[0];
  const nextExam = data.exams[0];
  const underloggedCourse = data.courses.find((c) => c.loggedHours < c.targetHoursPerWeek) || data.courses[0];

  const dynamicSuggestions: AcademicCoachSuggestion[] = [];

  if (topTask) {
    dynamicSuggestions.push({
      category: 'schedule',
      title: `Prioritize "${topTask.title}" (${topTask.course})`,
      description: `Targeting your top priority first thing prevents decision fatigue and protects your deepest focus slot.`,
      actionTip: `Block out ${topTask.estimatedMinutes || data.focusCadenceMinutes || 45} minutes without tabs or notifications.`,
    });
  } else {
    dynamicSuggestions.push({
      category: 'schedule',
      title: 'Plan Your Morning Anchor Objective',
      description: 'Defining 1 explicit academic deliverable sets the cognitive direction for the whole day.',
      actionTip: 'Add your most important assignment to the Tasks tab.',
    });
  }

  if (nextExam) {
    dynamicSuggestions.push({
      category: 'exam_prep',
      title: `Upcoming Exam: ${nextExam.title} (${nextExam.course})`,
      description: `Targeting active recall rather than re-reading notes significantly boosts exam grade averages.`,
      actionTip: `Dedicate 1 study block to solving past exam problems or self-quizzing.`,
    });
  } else if (underloggedCourse) {
    dynamicSuggestions.push({
      category: 'focus',
      title: `Boost Study Hours in ${underloggedCourse.code}`,
      description: `You have logged ${underloggedCourse.loggedHours}h of your ${underloggedCourse.targetHoursPerWeek}h weekly goal for ${underloggedCourse.name}.`,
      actionTip: `Schedule a 50-minute deep-work session to close the gap before the weekend.`,
    });
  }

  dynamicSuggestions.push({
    category: 'focus',
    title: `${data.focusCadenceMinutes || 45}m Cadence with Recovery Spacing`,
    description: `Single-task with phone out of sight for ${data.focusCadenceMinutes || 45} minutes, followed by a strict 10-15 minute screen-free recovery.`,
    actionTip: `Start the Pomodoro timer in the Focus tab to attribute time to your active course.`,
  });

  return {
    dailyFocusRecommendation:
      data.dailyPriority ||
      (topTask ? `Master ${topTask.title} (${topTask.course}) as your primary anchor today.` : 'Establish your primary daily objective to anchor deep-work hours.'),
    scheduleRationale: localSched.coachNote,
    suggestions: dynamicSuggestions,
    blocks: localSched.blocks,
    source: 'local',
  };
}

export interface WorkloadIntakeResponse {
  summaryRationale: string;
  todayTasks: TaskItem[];
  longerTermTasks: TaskItem[];
  scheduleBlocks: ScheduleBlock[];
  source: 'gemini' | 'local';
}

export async function requestWorkloadIntake(
  rawInput: string,
  courses: StudentWorkspaceData['courses'],
  timetableSlots: TimetableSlot[] = [],
  focusCadenceMinutes: number = 45,
  startHour: string = '09:00'
): Promise<WorkloadIntakeResponse> {
  const currentDay = getTodayDayOfWeek();
  const timetableToday = timetableSlots.filter((s) => s.dayOfWeek === currentDay);

  try {
    const res = await fetch('/api/gemini/intake-and-classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(9500),
      body: JSON.stringify({
        rawInput,
        courses,
        timetableToday,
        focusCadenceMinutes,
        startHour,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.todayTasks) && Array.isArray(json.longerTermTasks)) {
        const todayStr = new Date().toISOString().split('T')[0];

        const todayTasks: TaskItem[] = json.todayTasks.map((t: any, idx: number) => ({
          id: `task-today-ai-${Date.now()}-${idx}`,
          title: t.title || 'Today Study Task',
          course: t.course || courses[0]?.code || 'GENERAL',
          dueDate: todayStr,
          priority: t.priority === 'high' || t.priority === 'low' ? t.priority : 'medium',
          completed: false,
          createdAt: todayStr,
          classification: 'today',
          estimatedMinutes: Number(t.estimatedMinutes) || focusCadenceMinutes,
          scheduledStartTime: t.scheduledStartTime,
          scheduledEndTime: t.scheduledEndTime,
        }));

        const longerTermTasks: TaskItem[] = json.longerTermTasks.map((t: any, idx: number) => ({
          id: `task-long-ai-${Date.now()}-${idx}`,
          title: t.title || 'Project Milestone',
          course: t.course || courses[0]?.code || 'GENERAL',
          dueDate: t.dueDate || 'Next Week',
          priority: t.priority === 'high' || t.priority === 'low' ? t.priority : 'medium',
          completed: false,
          createdAt: todayStr,
          classification: 'longer_term',
          estimatedMinutes: Number(t.estimatedMinutes) || 120,
        }));

        const scheduleBlocks: ScheduleBlock[] = Array.isArray(json.scheduleBlocks)
          ? json.scheduleBlocks.map((b: any, idx: number) => ({
              id: `sb-intake-${Date.now()}-${idx}`,
              startTime: b.startTime || '09:00',
              endTime: b.endTime || '09:45',
              title: b.title || 'Focus Session',
              course: b.course || 'GENERAL',
              type:
                b.type === 'class' || b.type === 'break' || b.type === 'exam_prep' || b.type === 'review'
                  ? b.type
                  : 'focus',
              durationMinutes: Number(b.durationMinutes) || focusCadenceMinutes,
              completed: false,
              location: b.location,
            }))
          : [];

        return {
          summaryRationale:
            json.summaryRationale ||
            `Classified ${todayTasks.length} task(s) for today and ${longerTermTasks.length} longer project(s).`,
          todayTasks,
          longerTermTasks,
          scheduleBlocks,
          source: 'gemini',
        };
      }
    }
  } catch {
    // Offline / fallback to local classifier
  }

  const localResult = classifyAndScheduleTasksLocally(
    rawInput,
    courses,
    timetableSlots,
    focusCadenceMinutes,
    startHour
  );
  return { ...localResult, source: 'local' };
}

export async function requestTimetableParse(
  rawText: string
): Promise<{ summary: string; slots: TimetableSlot[]; source: 'gemini' | 'local' }> {
  try {
    const res = await fetch('/api/gemini/parse-timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(9500),
      body: JSON.stringify({ rawText }),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.slots) && json.slots.length > 0) {
        const slots: TimetableSlot[] = json.slots.map((s: any, idx: number) => ({
          id: `tt-ai-${Date.now()}-${idx}`,
          dayOfWeek: s.dayOfWeek || 'Monday',
          courseCode: s.courseCode || 'CRS-101',
          courseName: s.courseName || 'Lecture',
          startTime: s.startTime || '09:00',
          endTime: s.endTime || '10:30',
          room: s.room || '',
          instructor: s.instructor || '',
        }));

        return {
          summary: json.summary || `Parsed ${slots.length} recurring class timeslot(s).`,
          slots,
          source: 'gemini',
        };
      }
    }
  } catch {
    // Offline fallback
  }

  const local = parseTimetableLocally(rawText);
  return { ...local, source: 'local' };
}

export interface DocumentAnalysisResult {
  summary: string;
  keyTopics: string[];
  examPredictions: string[];
  recallQuiz: { question: string; answer: string }[];
  studyAdvice: string;
  customAnswer?: string;
  source: 'gemini' | 'local';
}

export async function requestDocumentAnalysis(
  docName: string,
  docText: string,
  courseCode: string,
  courseName: string,
  customQuery?: string
): Promise<DocumentAnalysisResult> {
  try {
    const res = await fetch('/api/gemini/analyze-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        docName,
        docText,
        courseCode,
        courseName,
        customQuery,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.summary && Array.isArray(json.keyTopics)) {
        return {
          summary: json.summary,
          keyTopics: json.keyTopics,
          examPredictions: Array.isArray(json.examPredictions) ? json.examPredictions : [],
          recallQuiz: Array.isArray(json.recallQuiz) ? json.recallQuiz : [],
          studyAdvice: json.studyAdvice || 'Focus on active recall and key proofs.',
          customAnswer: json.customAnswer || '',
          source: 'gemini',
        };
      }
    }
  } catch {
    // Offline / fallback
  }

  const local = analyzeDocumentLocally(
    docName,
    docText,
    courseCode,
    courseName,
    customQuery
  );
  return { ...local, source: 'local' };
}


