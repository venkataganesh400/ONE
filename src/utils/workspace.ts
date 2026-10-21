import type {
  CourseItem,
  ExpenseCategory,
  ExpenseItem,
  StudentCheckinResponses,
  StudentWorkspaceData,
} from '../types/index.ts';

export const DEFAULT_CHECKIN_RESPONSES: StudentCheckinResponses = {
  studyMode: 'exam_prep',
  topGoal: 'Complete Data Structures & Algorithms Problem Set',
  focusInterval: '50m',
  budgetTarget: '500',
  distractionRules: ['phone_away', 'active_recall', 'track_every_expense'],
};

export const INITIAL_STUDENT_WORKSPACE: StudentWorkspaceData = {
  theme: 'dark',
  currency: '$',
  monthlyBudget: 500,
  dailyPriority: 'Complete Data Structures & Algorithms Problem Set',
  focusCadenceMinutes: 50,
  studyMode: 'exam_prep',
  distractionRules: ['phone_away', 'active_recall', 'track_every_expense'],
  tasks: [
    {
      id: 'st-1',
      title: 'Implement Red-Black Tree insertion & balancing lab',
      course: 'CS-301',
      dueDate: '2026-10-22',
      priority: 'high',
      completed: false,
      createdAt: '2026-10-20',
    },
    {
      id: 'st-2',
      title: 'Solve Eigenvalues & Diagonalization problem set #4',
      course: 'MATH-204',
      dueDate: '2026-10-23',
      priority: 'high',
      completed: false,
      createdAt: '2026-10-20',
    },
    {
      id: 'st-3',
      title: 'Read Chapter 6: Virtual Memory & Paging architecture',
      course: 'CS-305',
      dueDate: '2026-10-24',
      priority: 'medium',
      completed: true,
      createdAt: '2026-10-19',
    },
    {
      id: 'st-4',
      title: 'Submit lab partner peer evaluation form',
      course: 'PHYS-102',
      dueDate: '2026-10-25',
      priority: 'low',
      completed: false,
      createdAt: '2026-10-19',
    },
  ],
  courses: [
    {
      id: 'c-1',
      code: 'CS-301',
      name: 'Data Structures & Algorithms',
      targetHoursPerWeek: 12,
      loggedHours: 9.5,
      completedTopics: 18,
      totalTopics: 24,
      grade: 'A',
      credits: 4,
    },
    {
      id: 'c-2',
      code: 'MATH-204',
      name: 'Applied Linear Algebra',
      targetHoursPerWeek: 10,
      loggedHours: 7.0,
      completedTopics: 14,
      totalTopics: 20,
      grade: 'A-',
      credits: 4,
    },
    {
      id: 'c-3',
      code: 'CS-305',
      name: 'Operating Systems Kernel',
      targetHoursPerWeek: 10,
      loggedHours: 8.5,
      completedTopics: 11,
      totalTopics: 16,
      grade: 'B+',
      credits: 4,
    },
    {
      id: 'c-4',
      code: 'PHYS-102',
      name: 'Electromagnetism & Waves',
      targetHoursPerWeek: 8,
      loggedHours: 6.0,
      completedTopics: 12,
      totalTopics: 15,
      grade: 'A',
      credits: 3,
    },
  ],
  expenses: [
    {
      id: 'ex-1',
      title: 'Used Algorithms Textbook (CLRS 4th Ed.)',
      amount: 58.0,
      category: 'Books & Supplies',
      date: '2026-10-18',
    },
    {
      id: 'ex-2',
      title: 'Campus Dining Hall Weekly Meal Plan Reload',
      amount: 85.0,
      category: 'Food & Dining',
      date: '2026-10-19',
    },
    {
      id: 'ex-3',
      title: 'Student Metro & Bus Monthly Pass',
      amount: 32.0,
      category: 'Transport',
      date: '2026-10-15',
    },
    {
      id: 'ex-4',
      title: 'Library Late-Night Espresso & Oat Bar',
      amount: 6.5,
      category: 'Coffee & Snacks',
      date: '2026-10-20',
    },
  ],
  notes: [
    {
      id: 'sn-1',
      title: 'Master Theorem & Recurrence Relations',
      course: 'CS-301',
      isPinned: true,
      updatedAt: '2026-10-20',
      content: `Recurrence form: T(n) = a T(n/b) + f(n) where a >= 1, b > 1

1. Case 1: If f(n) = O(n^(log_b(a) - epsilon)), then T(n) = Theta(n^(log_b(a)))
2. Case 2: If f(n) = Theta(n^(log_b(a))), then T(n) = Theta(n^(log_b(a)) * log n)
3. Case 3: If f(n) = Omega(n^(log_b(a) + epsilon)), then T(n) = Theta(f(n))

Key Exam Reminder:
- Merge Sort: a=2, b=2, f(n)=O(n) -> Case 2 -> O(n log n)
- Binary Search: a=1, b=2, f(n)=O(1) -> Case 2 -> O(log n)`,
    },
    {
      id: 'sn-2',
      title: 'Virtual Memory Page Replacement Notes',
      course: 'CS-305',
      isPinned: false,
      updatedAt: '2026-10-19',
      content: `Page Replacement Strategies:
- Optimal (Belady): Replace page that will not be used for longest period.
- LRU (Least Recently Used): Approximates optimal using reference timestamps or stack.
- Clock (Second-Chance): Circular queue with reference bit R=0/1.

Thrashing occurs when a process spends more time paging than executing instructions (Working Set > Physical Frames).`,
    },
  ],
  sessions: [
    {
      id: 'ss-1',
      courseCode: 'CS-301',
      durationMinutes: 50,
      completedAt: '2026-10-20T09:30:00Z',
    },
    {
      id: 'ss-2',
      courseCode: 'MATH-204',
      durationMinutes: 50,
      completedAt: '2026-10-20T14:00:00Z',
    },
  ],
  exams: [
    {
      id: 'exm-1',
      title: 'Data Structures Midterm Exam',
      course: 'CS-301',
      date: '2026-10-27',
      type: 'Exam',
    },
    {
      id: 'exm-2',
      title: 'Linear Algebra Quiz 3 (Vector Spaces)',
      course: 'MATH-204',
      date: '2026-10-24',
      type: 'Quiz',
    },
    {
      id: 'exm-3',
      title: 'Kernel Shell & Pipe Implementation Milestone',
      course: 'CS-305',
      date: '2026-11-02',
      type: 'Project',
    },
  ],
};

export function getFocusIntervalMinutes(intervalId: string): number {
  switch (intervalId) {
    case '25m':
      return 25;
    case '45m':
      return 45;
    case '50m':
      return 50;
    case '90m':
      return 90;
    default:
      return 25;
  }
}

export function calculateExpenseSummary(expenses: ExpenseItem[], monthlyBudget: number) {
  const totalSpent = Number(
    expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)
  );
  const safeBudget = Math.max(1, monthlyBudget);
  const remaining = Number((monthlyBudget - totalSpent).toFixed(2));
  const percentUsed = Math.min(100, Math.round((totalSpent / safeBudget) * 100));

  const byCategory: Record<ExpenseCategory, number> = {
    'Food & Dining': 0,
    'Books & Supplies': 0,
    Transport: 0,
    'Housing & Utilities': 0,
    'Coffee & Snacks': 0,
    Other: 0,
  };

  for (const exp of expenses) {
    const cat = exp.category in byCategory ? exp.category : 'Other';
    byCategory[cat] = Number((byCategory[cat] + exp.amount).toFixed(2));
  }

  return {
    totalSpent,
    remaining,
    percentUsed,
    byCategory,
    isOverBudget: remaining < 0,
  };
}

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};

export function calculateStudyMetrics(courses: CourseItem[]) {
  if (courses.length === 0) {
    return {
      totalLoggedHours: 0,
      totalTargetHours: 0,
      overallMasteryPercent: 0,
      estimatedGpa: '0.00',
    };
  }

  const totalLoggedHours = Number(
    courses.reduce((acc, c) => acc + c.loggedHours, 0).toFixed(1)
  );
  const totalTargetHours = courses.reduce((acc, c) => acc + c.targetHoursPerWeek, 0);

  const totalCompletedTopics = courses.reduce((acc, c) => acc + c.completedTopics, 0);
  const totalTopics = Math.max(
    1,
    courses.reduce((acc, c) => acc + c.totalTopics, 0)
  );
  const overallMasteryPercent = Math.min(
    100,
    Math.round((totalCompletedTopics / totalTopics) * 100)
  );

  let totalQualityPoints = 0;
  let totalCredits = 0;
  for (const c of courses) {
    const pts = GRADE_POINTS[c.grade] ?? 3.5;
    totalQualityPoints += pts * c.credits;
    totalCredits += c.credits;
  }

  const gpa = totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : '0.00';

  return {
    totalLoggedHours,
    totalTargetHours,
    overallMasteryPercent,
    estimatedGpa: gpa,
  };
}

export function applyCheckinToWorkspace(
  current: StudentWorkspaceData,
  responses: StudentCheckinResponses
): StudentWorkspaceData {
  const cadence = getFocusIntervalMinutes(responses.focusInterval);
  const budget = parseInt(responses.budgetTarget, 10) || current.monthlyBudget;
  const trimmedGoal = responses.topGoal.trim() || current.dailyPriority;

  const hasGoalTask = current.tasks.some(
    (t) => t.title.toLowerCase() === trimmedGoal.toLowerCase()
  );

  const updatedTasks = hasGoalTask
    ? current.tasks
    : [
        {
          id: 'st-' + Date.now(),
          title: trimmedGoal,
          course: current.courses[0]?.code || 'GENERAL',
          dueDate: new Date().toISOString().split('T')[0],
          priority: 'high' as const,
          completed: false,
          createdAt: new Date().toISOString().split('T')[0],
        },
        ...current.tasks,
      ];

  return {
    ...current,
    studyMode: responses.studyMode,
    dailyPriority: trimmedGoal,
    focusCadenceMinutes: cadence,
    monthlyBudget: budget,
    distractionRules: responses.distractionRules,
    tasks: updatedTasks,
  };
}

export function formatTimeLeft(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getWordCount(text: string): { words: number; chars: number } {
  const chars = text.length;
  const trimmed = text.trim();
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  return { words, chars };
}

export function generateStudentMarkdownReport(data: StudentWorkspaceData): string {
  const studyMetrics = calculateStudyMetrics(data.courses);
  const expenseSummary = calculateExpenseSummary(data.expenses, data.monthlyBudget);

  return `# One Student Workspace Summary

## Daily Academic Priority
> **${data.dailyPriority}**

- **Focus Cadence:** ${data.focusCadenceMinutes}m blocks
- **Weekly Study Hours:** ${studyMetrics.totalLoggedHours} / ${studyMetrics.totalTargetHours} hrs
- **Syllabus Mastery:** ${studyMetrics.overallMasteryPercent}% · **GPA:** ${studyMetrics.estimatedGpa}
- **Monthly Budget:** ${data.currency}${expenseSummary.totalSpent} / ${data.currency}${data.monthlyBudget} (${data.currency}${expenseSummary.remaining} remaining)

## Pending Assignments & Tasks
${data.tasks.map((t) => `- [${t.completed ? 'x' : ' '}] **[${t.course}]** ${t.title} (Due: ${t.dueDate})`).join('\n')}

## Enrolled Courses
${data.courses.map((c) => `- **${c.code} (${c.name})**: ${c.loggedHours}/${c.targetHoursPerWeek}h · ${c.completedTopics}/${c.totalTopics} topics · Grade: ${c.grade}`).join('\n')}
`;
}
