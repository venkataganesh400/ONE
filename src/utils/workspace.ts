import type {
  CourseItem,
  DayOfWeek,
  ExpenseCategory,
  ExpenseItem,
  NoteFlashcard,
  ScheduleBlock,
  StudentCheckinResponses,
  StudentWorkspaceData,
  SyllabusTopicItem,
  TaskClassification,
  TaskItem,
  TaskSubstep,
  TimetableSlot,
} from '../types/index.ts';

export const DEFAULT_CHECKIN_RESPONSES: StudentCheckinResponses = {
  studyMode: 'exam_prep',
  topGoal: 'Complete Data Structures & Algorithms Problem Set',
  focusInterval: '50m',
  budgetTarget: '15000',
  distractionRules: ['phone_away', 'active_recall', 'track_every_expense'],
};

export const INITIAL_STUDENT_WORKSPACE: StudentWorkspaceData = {
  theme: 'dark',
  currency: '₹',
  monthlyBudget: 10000,
  dailyPriority: '',
  focusCadenceMinutes: 45,
  studyMode: 'exam_prep',
  distractionRules: ['phone_away', 'active_recall'],
  activeFocusTaskId: null,
  activeFocusCourse: '',
  scheduleCoachNote: '',
  scheduleBlocks: [],
  tasks: [],
  courses: [],
  expenses: [],
  notes: [],
  sessions: [],
  exams: [],
  timetable: [],
  notificationsEnabled: false,
  missedTaskAlerts: true,
};

export const SAMPLE_STUDENT_TEMPLATE: StudentWorkspaceData = {
  theme: 'dark',
  currency: '₹',
  monthlyBudget: 15000,
  dailyPriority: 'Complete Data Structures & Algorithms Problem Set',
  focusCadenceMinutes: 50,
  studyMode: 'exam_prep',
  distractionRules: ['phone_away', 'active_recall', 'track_every_expense'],
  activeFocusTaskId: 'st-1',
  activeFocusCourse: 'CS-301',
  scheduleCoachNote:
    'Front-loading CS-301 Red-Black Tree implementation while cognitive energy is highest, followed by MATH-204 Quiz 3 vector space drill.',
  scheduleBlocks: [
    {
      id: 'sb-1',
      startTime: '08:30',
      endTime: '09:20',
      title: 'Implement Red-Black Tree insertion & rotation cases',
      course: 'CS-301',
      type: 'focus',
      durationMinutes: 50,
      completed: true,
      taskId: 'st-1',
    },
    {
      id: 'sb-2',
      startTime: '09:20',
      endTime: '09:35',
      title: 'Hydration & screen-free recovery walk',
      course: 'BREAK',
      type: 'break',
      durationMinutes: 15,
      completed: true,
    },
    {
      id: 'sb-3',
      startTime: '09:35',
      endTime: '10:25',
      title: 'Solve Eigenvalues & Diagonalization problem set #4',
      course: 'MATH-204',
      type: 'exam_prep',
      durationMinutes: 50,
      completed: false,
      taskId: 'st-2',
    },
    {
      id: 'sb-4',
      startTime: '11:00',
      endTime: '11:50',
      title: 'Active recall drill: Master Theorem & Recurrence Relations',
      course: 'CS-301',
      type: 'review',
      durationMinutes: 50,
      completed: false,
    },
    {
      id: 'sb-5',
      startTime: '14:00',
      endTime: '14:50',
      title: 'Submit lab partner peer evaluation & review wave equations',
      course: 'PHYS-102',
      type: 'focus',
      durationMinutes: 50,
      completed: false,
      taskId: 'st-4',
    },
  ],
  tasks: [
    {
      id: 'st-1',
      title: 'Implement Red-Black Tree insertion & balancing lab',
      course: 'CS-301',
      dueDate: '2026-10-22',
      priority: 'high',
      completed: false,
      createdAt: '2026-10-20',
      subtasks: [
        {
          id: 'sub-1',
          title: 'Write standard BST node insertion with parent pointers',
          estimatedMinutes: 25,
          completed: true,
        },
        {
          id: 'sub-2',
          title: 'Implement leftRotate and rightRotate helper methods',
          estimatedMinutes: 35,
          completed: false,
        },
        {
          id: 'sub-3',
          title: 'Verify uncle-color recoloring & pass unit test suite',
          estimatedMinutes: 40,
          completed: false,
        },
      ],
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
      completedTopics: 4,
      totalTopics: 6,
      grade: 'A',
      credits: 4,
      syllabusTopics: [
        { id: 't-1', title: 'Asymptotic Complexity & Master Theorem', completed: true },
        { id: 't-2', title: 'Heaps, Priority Queues & Heapsort', completed: true },
        { id: 't-3', title: 'Balanced BSTs (AVL & Red-Black Trees)', completed: true },
        { id: 't-4', title: 'Hash Tables & Amortized Analysis', completed: true },
        { id: 't-5', title: 'Graph Traversals (BFS, DFS, Topological Sort)', completed: false },
        { id: 't-6', title: 'Dynamic Programming & Memoization', completed: false },
      ],
    },
    {
      id: 'c-2',
      code: 'MATH-204',
      name: 'Applied Linear Algebra',
      targetHoursPerWeek: 10,
      loggedHours: 7.0,
      completedTopics: 3,
      totalTopics: 5,
      grade: 'A-',
      credits: 4,
      syllabusTopics: [
        { id: 'm-1', title: 'Gaussian Elimination & LU Factorization', completed: true },
        { id: 'm-2', title: 'Vector Spaces, Basis & Dimension', completed: true },
        { id: 'm-3', title: 'Orthogonality & Gram-Schmidt Process', completed: true },
        { id: 'm-4', title: 'Eigenvalues, Eigenvectors & Diagonalization', completed: false },
        { id: 'm-5', title: 'Singular Value Decomposition (SVD)', completed: false },
      ],
    },
    {
      id: 'c-3',
      code: 'CS-305',
      name: 'Operating Systems Kernel',
      targetHoursPerWeek: 10,
      loggedHours: 8.5,
      completedTopics: 3,
      totalTopics: 5,
      grade: 'B+',
      credits: 4,
      syllabusTopics: [
        { id: 'os-1', title: 'Process Control Blocks & Context Switching', completed: true },
        { id: 'os-2', title: 'CPU Scheduling & Multi-Level Feedback Queues', completed: true },
        { id: 'os-3', title: 'Mutexes, Semaphores & Deadlock Prevention', completed: true },
        { id: 'os-4', title: 'Virtual Memory, Page Tables & TLB Caching', completed: false },
        { id: 'os-5', title: 'File System Inodes & Crash Consistency', completed: false },
      ],
    },
    {
      id: 'c-4',
      code: 'PHYS-102',
      name: 'Electromagnetism & Waves',
      targetHoursPerWeek: 8,
      loggedHours: 6.0,
      completedTopics: 3,
      totalTopics: 4,
      grade: 'A',
      credits: 3,
      syllabusTopics: [
        { id: 'p-1', title: "Gauss's Law & Electric Potential", completed: true },
        { id: 'p-2', title: 'Capacitance, Dielectrics & RC Circuits', completed: true },
        { id: 'p-3', title: "Magnetic Fields & Ampere's Law", completed: true },
        { id: 'p-4', title: "Faraday's Law & Maxwell's Equations", completed: false },
      ],
    },
  ],
  expenses: [
    {
      id: 'ex-1',
      title: 'Used Algorithms Textbook (CLRS 4th Ed.)',
      amount: 1850,
      category: 'Books & Supplies',
      date: '2026-10-18',
    },
    {
      id: 'ex-2',
      title: 'Campus Mess & Dining Hall Weekly Plan',
      amount: 2400,
      category: 'Food & Dining',
      date: '2026-10-19',
    },
    {
      id: 'ex-3',
      title: 'Student Metro & Bus Monthly Pass',
      amount: 900,
      category: 'Transport',
      date: '2026-10-15',
    },
    {
      id: 'ex-4',
      title: 'Library Late-Night Filter Coffee & Snack',
      amount: 180,
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
      summaryBullets: [
        'Compare non-recursive work f(n) against critical watershed exponent n^(log_b(a)).',
        'Case 1 (leaves dominate): T(n) = Theta(n^(log_b(a))).',
        'Case 2 (even work across levels): multiply by log n -> Theta(n^(log_b(a)) log n).',
      ],
      flashcards: [
        {
          id: 'fc-1',
          question: 'What is the recurrence relation and Master Theorem case for Merge Sort?',
          answer: 'T(n) = 2T(n/2) + O(n). Since log_2(2) = 1 and f(n) = Theta(n^1), it falls under Case 2, yielding Theta(n log n).',
        },
        {
          id: 'fc-2',
          question: 'When does Case 1 of the Master Theorem apply?',
          answer: 'When f(n) is polynomially smaller than n^(log_b(a)) by a factor of n^epsilon (leaves dominate total work).',
        },
      ],
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
      taskId: 'st-1',
      taskTitle: 'Implement Red-Black Tree insertion & balancing lab',
      durationMinutes: 50,
      completedAt: '2026-10-20T09:30:00Z',
    },
    {
      id: 'ss-2',
      courseCode: 'MATH-204',
      taskId: 'st-2',
      taskTitle: 'Solve Eigenvalues & Diagonalization problem set #4',
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

export function calculateDaysUntil(
  targetDateStr: string,
  referenceDateStr: string = '2026-10-20'
): { days: number; label: string; isUrgent: boolean; isPast: boolean } {
  const target = new Date(`${targetDateStr}T00:00:00Z`);
  const ref = new Date(`${referenceDateStr}T00:00:00Z`);
  if (isNaN(target.getTime()) || isNaN(ref.getTime())) {
    return { days: 0, label: 'Scheduled', isUrgent: false, isPast: false };
  }
  const diffDays = Math.round((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      days: diffDays,
      label: `${Math.abs(diffDays)}d ago`,
      isUrgent: false,
      isPast: true,
    };
  }
  if (diffDays === 0) {
    return { days: 0, label: 'Today', isUrgent: true, isPast: false };
  }
  if (diffDays === 1) {
    return { days: 1, label: 'Tomorrow', isUrgent: true, isPast: false };
  }
  return {
    days: diffDays,
    label: `${diffDays}d left`,
    isUrgent: diffDays <= 5,
    isPast: false,
  };
}

export function calculateExpenseSummary(
  expenses: ExpenseItem[],
  monthlyBudget: number,
  referenceDateStr: string = '2026-10-20'
) {
  const totalSpent = Number(
    expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)
  );
  const safeBudget = Math.max(1, monthlyBudget);
  const remaining = Number((monthlyBudget - totalSpent).toFixed(2));
  const percentUsed = Math.min(100, Math.round((totalSpent / safeBudget) * 100));

  const refDate = new Date(`${referenceDateStr}T00:00:00Z`);
  const year = isNaN(refDate.getTime()) ? 2026 : refDate.getUTCFullYear();
  const month = isNaN(refDate.getTime()) ? 9 : refDate.getUTCMonth();
  const currentDay = isNaN(refDate.getTime()) ? 20 : refDate.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysRemainingInMonth = Math.max(1, daysInMonth - currentDay + 1);
  const dailySafeSpend = Math.max(0, Number((remaining / daysRemainingInMonth).toFixed(2)));

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
    daysRemainingInMonth,
    dailySafeSpend,
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

  const baseUpdated: StudentWorkspaceData = {
    ...current,
    studyMode: responses.studyMode,
    dailyPriority: trimmedGoal,
    focusCadenceMinutes: cadence,
    monthlyBudget: budget,
    distractionRules: responses.distractionRules,
    tasks: updatedTasks,
  };

  // Also regenerate schedule blocks to match the newly selected cadence and top goal
  const generated = buildLocalSmartSchedule(baseUpdated, '08:30');

  return {
    ...baseUpdated,
    scheduleBlocks: generated.blocks,
    scheduleCoachNote: generated.coachNote,
  };
}

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const [hStr, mStr] = timeStr.split(':');
  const totalMins = (parseInt(hStr, 10) || 8) * 60 + (parseInt(mStr, 10) || 0) + minutesToAdd;
  const h = Math.floor((totalMins % (24 * 60)) / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function buildLocalSmartSchedule(
  data: StudentWorkspaceData,
  startHour: string = '08:30'
): { coachNote: string; blocks: ScheduleBlock[] } {
  const cadence = data.focusCadenceMinutes || 45;
  const pendingTasks = data.tasks.filter((t) => !t.completed);
  const primaryCourse = data.courses[0]?.code || 'STUDY';

  const blocks: ScheduleBlock[] = [];
  let cursor = startHour;

  // Block 1: Daily Priority / Top Task
  const firstTask = pendingTasks[0];
  const end1 = addMinutesToTime(cursor, cadence);
  blocks.push({
    id: `sb-${Date.now()}-1`,
    startTime: cursor,
    endTime: end1,
    title: firstTask ? firstTask.title : (data.dailyPriority || 'Morning Deep Work & Priority Focus'),
    course: firstTask ? firstTask.course : primaryCourse,
    type: 'focus',
    durationMinutes: cadence,
    completed: false,
    taskId: firstTask?.id,
  });
  cursor = end1;

  // Break 1
  const breakEnd1 = addMinutesToTime(cursor, 15);
  blocks.push({
    id: `sb-${Date.now()}-2`,
    startTime: cursor,
    endTime: breakEnd1,
    title: 'Screen-free recovery walk & hydration',
    course: 'BREAK',
    type: 'break',
    durationMinutes: 15,
    completed: false,
  });
  cursor = breakEnd1;

  // Block 2: Upcoming Exam Prep or Second Task
  const nearestExam = data.exams[0];
  const secondTask = pendingTasks[1];
  const end2 = addMinutesToTime(cursor, cadence);
  blocks.push({
    id: `sb-${Date.now()}-3`,
    startTime: cursor,
    endTime: end2,
    title: secondTask
      ? secondTask.title
      : nearestExam
        ? `Exam Prep: ${nearestExam.title}`
        : 'Core Coursework & Problem-Solving Block',
    course: secondTask?.course || nearestExam?.course || primaryCourse,
    type: 'focus',
    durationMinutes: cadence,
    completed: false,
    taskId: secondTask?.id,
  });
  cursor = addMinutesToTime(end2, 30); // Midday gap

  // Block 3: Active Recall from Notes
  const end3 = addMinutesToTime(cursor, cadence);
  const pinnedNote = data.notes.find((n) => n.isPinned) || data.notes[0];
  blocks.push({
    id: `sb-${Date.now()}-4`,
    startTime: cursor,
    endTime: end3,
    title: pinnedNote
      ? `Active Recall Review: ${pinnedNote.title}`
      : 'Active Recall, Notes Synthesis & Spaced Repetition',
    course: pinnedNote?.course || primaryCourse,
    type: 'review',
    durationMinutes: cadence,
    completed: false,
  });
  cursor = addMinutesToTime(end3, 15);

  // Block 4: Evening consolidation
  const thirdTask = pendingTasks[2];
  const end4 = addMinutesToTime(cursor, cadence);
  blocks.push({
    id: `sb-${Date.now()}-5`,
    startTime: cursor,
    endTime: end4,
    title: thirdTask
      ? thirdTask.title
      : 'Evening Progress Review & Tomorrow Planning',
    course: thirdTask?.course || primaryCourse,
    type: 'focus',
    durationMinutes: cadence,
    completed: false,
    taskId: thirdTask?.id,
  });

  return {
    coachNote: data.dailyPriority
      ? `Structured ${blocks.filter((b) => b.type !== 'break').length}x ${cadence}m deep-work blocks anchored around "${data.dailyPriority}".`
      : `Planned ${blocks.filter((b) => b.type !== 'break').length}x ${cadence}m high-productivity study intervals for your day.`,
    blocks,
  };
}

export function decomposeTaskLocally(
  title: string,
  course: string,
  cadenceMinutes: number = 50
): TaskSubstep[] {
  const half = Math.max(15, Math.round(cadenceMinutes * 0.5));
  return [
    {
      id: `sub-${Date.now()}-1`,
      title: `[${course}] Review core concepts & specification for: ${title}`,
      estimatedMinutes: half,
      completed: false,
    },
    {
      id: `sub-${Date.now()}-2`,
      title: `Complete primary implementation / problem-solving draft`,
      estimatedMinutes: cadenceMinutes,
      completed: false,
    },
    {
      id: `sub-${Date.now()}-3`,
      title: `Verify edge cases, self-test, and finalize submission`,
      estimatedMinutes: half,
      completed: false,
    },
  ];
}

export function generateNoteQuizLocally(
  title: string,
  course: string,
  content: string
): { summaryBullets: string[]; flashcards: NoteFlashcard[] } {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 8);

  const summaryBullets =
    lines.slice(0, 3).length > 0
      ? lines.slice(0, 3).map((l) => l.replace(/^[-*0-9.)+\s]+/, ''))
      : [
          `Master core definitions and theorems in ${title} (${course}).`,
          `Practice applying key formulas to boundary conditions.`,
          `Synthesize lecture examples for rapid exam recall.`,
        ];

  const flashcards: NoteFlashcard[] = [
    {
      id: `fc-${Date.now()}-1`,
      question: `What is the central principle covered in "${title}" (${course})?`,
      answer: summaryBullets[0] || content.slice(0, 140),
    },
    {
      id: `fc-${Date.now()}-2`,
      question: `How is "${title}" tested in ${course} problem sets and exams?`,
      answer:
        summaryBullets[1] ||
        'By analyzing time/space tradeoffs, proving invariants, or solving worked boundary cases.',
    },
    {
      id: `fc-${Date.now()}-3`,
      question: `What key edge case or reminder should you verify for ${title}?`,
      answer:
        summaryBullets[2] ||
        'Always verify base cases and assumptions before applying the main formula.',
    },
  ];

  return { summaryBullets, flashcards };
}

export function parseNaturalLanguageExpensesLocally(
  rawText: string,
  monthlyBudget: number,
  totalSpent: number,
  todayStr: string = '2026-10-20',
  currency: string = '₹'
): { advice: string; items: Omit<ExpenseItem, 'id'>[] } {
  const segments = rawText
    .split(/,|;|\band\b|\+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const items: Omit<ExpenseItem, 'id'>[] = [];

  const inferCategory = (text: string): ExpenseCategory => {
    const lower = text.toLowerCase();
    if (/coffee|latte|espresso|tea|chai|snack|matcha|cafe|boba|samosa|biscuit/.test(lower)) {
      return 'Coffee & Snacks';
    }
    if (/book|textbook|lab|pen|notebook|manual|print|xerox|course|supply|goggles|record/.test(lower)) {
      return 'Books & Supplies';
    }
    if (/bus|metro|train|uber|ola|rapido|auto|rickshaw|lyft|gas|petrol|transit|pass|ticket/.test(lower)) {
      return 'Transport';
    }
    if (/rent|hostel|pg|wifi|recharge|electric|utility|laundry|dorm/.test(lower)) {
      return 'Housing & Utilities';
    }
    if (
      /ramen|lunch|dinner|breakfast|food|meal|mess|canteen|dosa|idli|biryani|thali|roti|pizza|burger|grocery|salad|dining/.test(
        lower
      )
    ) {
      return 'Food & Dining';
    }
    return 'Other';
  };

  for (const seg of segments) {
    const match = seg.match(/(?:₹|rs\.?|inr|\$)?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i);
    if (match) {
      const normalizedNumber = match[1].replace(/,/g, '');
      const amount = parseFloat(normalizedNumber);
      if (amount > 0) {
        let cleanedTitle = seg
          .replace(match[0], '')
          .replace(/\b(rupees|rupee|rs\.?|inr|dollars|usd)\b/gi, '')
          .replace(/^(spent|paid|bought|for|on|at)\s+/i, '')
          .replace(/\b(on|for|yesterday|today)\b/gi, '')
          .trim();
        if (!cleanedTitle) {
          cleanedTitle = 'Campus Expense';
        } else {
          cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
        }
        items.push({
          title: cleanedTitle,
          amount: Number(amount.toFixed(2)),
          category: inferCategory(cleanedTitle),
          date: todayStr,
        });
      }
    }
  }

  const addedTotal = items.reduce((acc, i) => acc + i.amount, 0);
  const newRemaining = Number((monthlyBudget - (totalSpent + addedTotal)).toFixed(2));
  const advice =
    newRemaining >= 0
      ? `Logged ${items.length} item(s) totaling ${currency}${addedTotal.toFixed(2)}. You have ${currency}${newRemaining.toFixed(2)} remaining in your monthly student cap.`
      : `Alert: This pushes spending ${currency}${Math.abs(newRemaining).toFixed(2)} over your ${currency}${monthlyBudget} monthly cap.`;

  return { advice, items };
}

export function generateCourseSyllabusLocally(code: string, name: string): SyllabusTopicItem[] {
  return [
    { id: `top-${Date.now()}-1`, title: `${code} Foundations & Core Definitions`, completed: false },
    { id: `top-${Date.now()}-2`, title: `Primary Analytical Models in ${name}`, completed: false },
    { id: `top-${Date.now()}-3`, title: `Applied Problem Solving & Case Studies`, completed: false },
    { id: `top-${Date.now()}-4`, title: `Midterm Synthesis & Theorem Proofs`, completed: false },
    { id: `top-${Date.now()}-5`, title: `Advanced Systems & Optimization`, completed: false },
    { id: `top-${Date.now()}-6`, title: `Final Comprehensive Review`, completed: false },
  ];
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
- **Monthly Budget:** ${data.currency}${expenseSummary.totalSpent} / ${data.currency}${data.monthlyBudget} (${data.currency}${expenseSummary.remaining} remaining · Safe daily spend: ${data.currency}${expenseSummary.dailySafeSpend}/day)

## Today's Time-Blocked Schedule
${(data.scheduleBlocks || []).map((b) => `- [${b.completed ? 'x' : ' '}] **${b.startTime}–${b.endTime}** [${b.course}] ${b.title} (${b.durationMinutes}m)`).join('\n')}

## Pending Assignments & Tasks
${data.tasks.map((t) => `- [${t.completed ? 'x' : ' '}] **[${t.course}]** ${t.title} (Due: ${t.dueDate})`).join('\n')}

## Enrolled Courses
${data.courses.map((c) => `- **${c.code} (${c.name})**: ${c.loggedHours}/${c.targetHoursPerWeek}h · ${c.completedTopics}/${c.totalTopics} topics · Grade: ${c.grade}`).join('\n')}
`;
}

export function getTodayDayOfWeek(date: Date = new Date()): DayOfWeek {
  const days: DayOfWeek[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[date.getDay()];
}

export function parseTimetableLocally(rawText: string): { summary: string; slots: TimetableSlot[] } {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const slots: TimetableSlot[] = [];

  const dayRegex = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i;
  const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;

  const normalizeDay = (d: string): DayOfWeek => {
    const lower = d.toLowerCase();
    if (lower.startsWith('mon')) return 'Monday';
    if (lower.startsWith('tue')) return 'Tuesday';
    if (lower.startsWith('wed')) return 'Wednesday';
    if (lower.startsWith('thu')) return 'Thursday';
    if (lower.startsWith('fri')) return 'Friday';
    if (lower.startsWith('sat')) return 'Saturday';
    return 'Sunday';
  };

  const normalizeTime = (t: string): string => {
    let clean = t.trim().toLowerCase();
    const isPm = clean.includes('pm');
    const isAm = clean.includes('am');
    clean = clean.replace(/am|pm/g, '').trim();
    const parts = clean.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] ? parseInt(parts[1], 10) : 0;
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  let currentDay: DayOfWeek = 'Monday';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dayMatch = line.match(dayRegex);
    if (dayMatch) {
      currentDay = normalizeDay(dayMatch[1]);
    }

    const timeMatch = line.match(timeRegex);
    if (timeMatch) {
      const startTime = normalizeTime(timeMatch[1]);
      const endTime = normalizeTime(timeMatch[2]);

      // Extract course code (e.g. CS-301, MATH 201, ECE101, CHEM-101)
      const codeMatch = line.match(/\b([A-Z]{2,5}[ -]?\d{3}[A-Z]?)\b/i);
      const code = codeMatch ? codeMatch[1].toUpperCase().replace(' ', '-') : 'ACAD-101';

      // Remaining text as course name
      let name = line
        .replace(dayRegex, '')
        .replace(timeRegex, '')
        .replace(codeMatch ? codeMatch[0] : '', '')
        .replace(/[,;–\-|]/g, ' ')
        .trim();

      if (name.length < 3) {
        name = `${code} Lecture`;
      }

      // Check room
      const roomMatch = line.match(/\b(?:Room|Hall|Lab|LT|LH)[ -]?([A-Za-z0-9]+)\b/i);
      const room = roomMatch ? roomMatch[0] : '';

      slots.push({
        id: `tt-${Date.now()}-${slots.length + 1}`,
        dayOfWeek: currentDay,
        courseCode: code,
        courseName: name,
        startTime,
        endTime,
        room,
      });
    }
  }

  // Fallback defaults if text did not match strict regex
  if (slots.length === 0 && rawText.trim().length > 0) {
    const chunks = rawText.split(/[,\n]/).filter((c) => c.trim().length > 3);
    chunks.slice(0, 4).forEach((chunk, idx) => {
      const startH = 9 + idx * 2;
      slots.push({
        id: `tt-${Date.now()}-${idx + 1}`,
        dayOfWeek: 'Monday',
        courseCode: `CRS-${idx + 1}01`,
        courseName: chunk.trim(),
        startTime: `${String(startH).padStart(2, '0')}:00`,
        endTime: `${String(startH + 1).padStart(2, '0')}:30`,
        room: 'Lecture Hall A',
      });
    });
  }

  return {
    summary: `Extracted ${slots.length} recurring class slot(s) across your academic week.`,
    slots,
  };
}

export function classifyAndScheduleTasksLocally(
  rawInput: string,
  courses: CourseItem[],
  timetableSlots: TimetableSlot[] = [],
  focusCadence: number = 45,
  startHour: string = '09:00'
): {
  summaryRationale: string;
  todayTasks: TaskItem[];
  longerTermTasks: TaskItem[];
  scheduleBlocks: ScheduleBlock[];
} {
  const lines = rawInput
    .split(/[\n,;]/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const todayTasks: TaskItem[] = [];
  const longerTermTasks: TaskItem[] = [];

  const longerKeywords = [
    'next week',
    'in 2 weeks',
    'in a week',
    'due next',
    'end of month',
    'project',
    'term paper',
    'thesis',
    'capstone',
    'milestone',
    'presentation due',
    'longer',
    'later',
    'next month',
  ];

  const todayKeywords = [
    'today',
    'tonight',
    'now',
    'urgent',
    'asap',
    'due today',
    'lab due',
    'finish',
    'review',
    'problem set',
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    const isLonger = longerKeywords.some((kw) => lower.includes(kw));
    const isToday = todayKeywords.some((kw) => lower.includes(kw)) || !isLonger;

    // Detect matched course from code or title
    const matchedCourse =
      courses.find((c) => lower.includes(c.code.toLowerCase()) || lower.includes(c.name.toLowerCase()))
        ?.code ||
      courses[idx % Math.max(1, courses.length)]?.code ||
      'GENERAL';

    const priority: 'high' | 'medium' | 'low' =
      lower.includes('urgent') || lower.includes('exam') || lower.includes('final')
        ? 'high'
        : lower.includes('quick') || lower.includes('minor')
        ? 'low'
        : 'medium';

    if (isLonger) {
      longerTermTasks.push({
        id: `task-long-${Date.now()}-${idx}`,
        title: line,
        course: matchedCourse,
        dueDate: nextWeekDate,
        priority,
        completed: false,
        createdAt: todayStr,
        classification: 'longer_term',
        estimatedMinutes: 120,
      });
    } else {
      todayTasks.push({
        id: `task-today-${Date.now()}-${idx}`,
        title: line,
        course: matchedCourse,
        dueDate: todayStr,
        priority,
        completed: false,
        createdAt: todayStr,
        classification: 'today',
        estimatedMinutes: focusCadence,
      });
    }
  });

  // Now build schedule blocks
  // 1. Get today's classes
  const currentDay = getTodayDayOfWeek();
  const todayClasses = timetableSlots.filter((slot) => slot.dayOfWeek === currentDay);

  const blocks: ScheduleBlock[] = [];

  // Add class blocks
  todayClasses.forEach((cls) => {
    const [sh, sm] = cls.startTime.split(':').map(Number);
    const [eh, em] = cls.endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);

    blocks.push({
      id: `sb-cls-${cls.id}`,
      startTime: cls.startTime,
      endTime: cls.endTime,
      title: `${cls.courseCode}: ${cls.courseName}`,
      course: cls.courseCode,
      type: 'class',
      durationMinutes: duration > 0 ? duration : 60,
      completed: false,
      location: cls.room || 'Campus Hall',
    });
  });

  // Schedule today's tasks in available slots
  let [currHour, currMin] = startHour.split(':').map(Number);

  todayTasks.forEach((task, tIdx) => {
    // Check if slot overlaps with any class
    const slotDuration = task.estimatedMinutes || focusCadence;
    let proposedStart = `${String(currHour).padStart(2, '0')}:${String(currMin).padStart(2, '0')}`;

    let endMinutes = currHour * 60 + currMin + slotDuration;
    let endH = Math.floor(endMinutes / 60);
    let endM = endMinutes % 60;
    let proposedEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // If overlaps with a class, bump past the class end time
    for (const cls of todayClasses) {
      if (proposedStart < cls.endTime && proposedEnd > cls.startTime) {
        const [ceh, cem] = cls.endTime.split(':').map(Number);
        currHour = ceh;
        currMin = cem + 10; // 10 min buffer
        proposedStart = `${String(currHour).padStart(2, '0')}:${String(currMin).padStart(2, '0')}`;
        endMinutes = currHour * 60 + currMin + slotDuration;
        endH = Math.floor(endMinutes / 60);
        endM = endMinutes % 60;
        proposedEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }
    }

    blocks.push({
      id: `sb-study-${Date.now()}-${tIdx}`,
      startTime: proposedStart,
      endTime: proposedEnd,
      title: task.title,
      course: task.course,
      type: 'focus',
      durationMinutes: slotDuration,
      completed: false,
      taskId: task.id,
    });

    task.scheduledStartTime = proposedStart;
    task.scheduledEndTime = proposedEnd;

    // Advance time with a 15-min recovery break
    currHour = endH;
    currMin = endM + 15;
    if (currMin >= 60) {
      currHour += Math.floor(currMin / 60);
      currMin = currMin % 60;
    }
  });

  // Sort chronological
  blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));

  const summaryRationale = `Classified ${todayTasks.length} urgent task(s) for today and banked ${longerTermTasks.length} longer-term milestone(s), mapped seamlessly around your ${todayClasses.length} timetable class(es).`;

  return {
    summaryRationale,
    todayTasks,
    longerTermTasks,
    scheduleBlocks: blocks,
  };
}

export function analyzeDocumentLocally(
  docName: string,
  docText: string,
  courseCode: string,
  courseName: string,
  customQuery?: string
): {
  summary: string;
  keyTopics: string[];
  examPredictions: string[];
  recallQuiz: { question: string; answer: string }[];
  studyAdvice: string;
  customAnswer?: string;
} {
  const cleanLines = docText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 15);

  const keySentences = cleanLines.slice(0, 5);

  const summary =
    keySentences.length > 0
      ? `This document ("${docName}") covers essential academic material for ${courseCode} (${courseName}). Key emphasis includes: ${keySentences.map((s) => s.replace(/^[-*0-9.)+\s]+/, '')).join(' ')}`
      : `Academic notes and reference specifications for ${courseCode}: ${courseName} regarding "${docName}".`;

  const words = docText
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 5);

  const uniqueKeywords = Array.from(new Set(words)).slice(0, 6);

  const keyTopics: string[] =
    uniqueKeywords.length >= 3
      ? uniqueKeywords.map((kw, i) => `${kw.charAt(0).toUpperCase() + kw.slice(1)} Theoretical Framework ${i + 1}`)
      : [
          `${courseCode} Foundational Axioms`,
          `Applied Problem Patterns in ${docName}`,
          `Critical Boundary Constraints`,
          `Exam-Tested Proof Techniques`,
        ];

  const examPredictions: string[] = [
    `Prove or derive the primary relationship specified in the opening sections of "${docName}".`,
    `Analyze edge-case failure modes and constraints discussed in ${courseCode}.`,
    `Solve a multi-part synthesis problem combining ${keyTopics[0] || 'core concepts'} with real-world scenarios.`,
  ];

  const recallQuiz = [
    {
      question: `What core objective or concept does "${docName}" establish in ${courseCode}?`,
      answer: keySentences[0] || `Fundamental principles and formulas foundational to ${courseName}.`,
    },
    {
      question: `Which key topic in this document has the highest probability of appearing on exams?`,
      answer: `${keyTopics[0] || 'Primary theorems'} due to its frequent appearance in problem sets.`,
    },
    {
      question: `What constraint or condition must you verify before applying the techniques in this document?`,
      answer: `Check all base case boundaries, preconditions, and valid input domains specified in ${docName}.`,
    },
    {
      question: `How does the material in "${docName}" connect with the broader ${courseName} syllabus?`,
      answer: `It serves as the analytical backbone for upcoming assignment labs and midterm evaluations.`,
    },
  ];

  const studyAdvice = `Front-load 40 minutes to write out formulas and proofs in "${docName}" from memory, then self-grade using the recall quiz above.`;

  let customAnswer: string | undefined = undefined;
  if (customQuery) {
    const tokens = customQuery
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    let bestScore = 0;
    let bestLine = '';

    for (const line of cleanLines) {
      const lineLower = line.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (lineLower.includes(token)) {
          score += token.length > 4 ? 2 : 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestLine = line;
      }
    }

    customAnswer = bestScore > 0
      ? `Based on "${docName}": "${bestLine}". In the context of ${courseCode}, this directly addresses your question.`
      : `Regarding "${customQuery}": In "${docName}" for ${courseCode}, review the foundational principles and definitions to apply this concept accurately.`;
  }

  return {
    summary,
    keyTopics,
    examPredictions,
    recallQuiz,
    studyAdvice,
    customAnswer,
  };
}


