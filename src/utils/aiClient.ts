import type {
  ExpenseCategory,
  ExpenseItem,
  NoteFlashcard,
  ScheduleBlock,
  StudentWorkspaceData,
  SyllabusTopicItem,
  TaskSubstep,
} from '../types/index.ts';
import {
  buildLocalSmartSchedule,
  decomposeTaskLocally,
  generateCourseSyllabusLocally,
  generateNoteQuizLocally,
  parseNaturalLanguageExpensesLocally,
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
  todayStr: string
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
    todayStr
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
