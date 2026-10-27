import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpenseSummary,
  calculateStudyMetrics,
  applyCheckinToWorkspace,
  formatTimeLeft,
  getWordCount,
  calculateDaysUntil,
  buildLocalSmartSchedule,
  decomposeTaskLocally,
  generateNoteQuizLocally,
  parseNaturalLanguageExpensesLocally,
  parseTimetableLocally,
  classifyAndScheduleTasksLocally,
  analyzeDocumentLocally,
  INITIAL_STUDENT_WORKSPACE,
} from './workspace.ts';

test('calculateExpenseSummary accurately computes spent, remaining, dailySafeSpend, and categories', () => {
  const summary = calculateExpenseSummary(
    [
      { id: '1', title: 'Calculus Book', amount: 40, category: 'Books & Supplies', date: '2026-10-20' },
      { id: '2', title: 'Lunch', amount: 12.5, category: 'Food & Dining', date: '2026-10-20' },
    ],
    200,
    '2026-10-20'
  );

  assert.equal(summary.totalSpent, 52.5);
  assert.equal(summary.remaining, 147.5);
  assert.equal(summary.percentUsed, 26);
  assert.equal(summary.isOverBudget, false);
  assert.equal(summary.byCategory['Books & Supplies'], 40);
  assert.equal(summary.byCategory['Food & Dining'], 12.5);
  assert.equal(summary.daysRemainingInMonth, 12);
  assert.equal(summary.dailySafeSpend, 12.29);
});

test('calculateDaysUntil calculates accurate exam countdowns and urgency', () => {
  const urgent = calculateDaysUntil('2026-10-24', '2026-10-20');
  assert.equal(urgent.days, 4);
  assert.equal(urgent.label, '4d left');
  assert.equal(urgent.isUrgent, true);

  const nonUrgent = calculateDaysUntil('2026-11-02', '2026-10-20');
  assert.equal(nonUrgent.days, 13);
  assert.equal(nonUrgent.label, '13d left');
  assert.equal(nonUrgent.isUrgent, false);
});

test('calculateStudyMetrics calculates weighted GPA, hours, and topic mastery', () => {
  const metrics = calculateStudyMetrics([
    {
      id: 'c1',
      code: 'CS-101',
      name: 'Intro to CS',
      targetHoursPerWeek: 10,
      loggedHours: 8,
      completedTopics: 15,
      totalTopics: 20,
      grade: 'A',
      credits: 4,
    },
    {
      id: 'c2',
      code: 'MATH-101',
      name: 'Calculus',
      targetHoursPerWeek: 10,
      loggedHours: 6,
      completedTopics: 5,
      totalTopics: 20,
      grade: 'B',
      credits: 4,
    },
  ]);

  assert.equal(metrics.totalLoggedHours, 14);
  assert.equal(metrics.totalTargetHours, 20);
  assert.equal(metrics.overallMasteryPercent, 50);
  assert.equal(metrics.estimatedGpa, '3.50');
});

test('applyCheckinToWorkspace updates daily priority, budget, and regenerates schedule blocks', () => {
  const updated = applyCheckinToWorkspace(INITIAL_STUDENT_WORKSPACE, {
    studyMode: 'assignments',
    topGoal: 'Finish Operating Systems Page Table Lab',
    focusInterval: '90m',
    budgetTarget: '800',
    distractionRules: ['phone_away'],
  });

  assert.equal(updated.dailyPriority, 'Finish Operating Systems Page Table Lab');
  assert.equal(updated.focusCadenceMinutes, 90);
  assert.equal(updated.monthlyBudget, 800);
  assert.equal(updated.tasks[0].title, 'Finish Operating Systems Page Table Lab');
  assert.ok(updated.scheduleBlocks.length >= 4);
  assert.equal(updated.scheduleBlocks[0].durationMinutes, 90);
});

test('buildLocalSmartSchedule, decomposeTaskLocally, generateNoteQuizLocally, and parseNaturalLanguageExpensesLocally work deterministically', () => {
  const schedule = buildLocalSmartSchedule(INITIAL_STUDENT_WORKSPACE, '09:00');
  assert.equal(schedule.blocks[0].startTime, '09:00');
  assert.ok(schedule.blocks.length >= 4);

  const subtasks = decomposeTaskLocally('Build Compiler Lexer', 'CS-301', 50);
  assert.equal(subtasks.length, 3);
  assert.equal(subtasks[1].estimatedMinutes, 50);

  const testContent = `Divide and conquer recurrence relations with recursive subproblems.
Boundary condition cases for Master Theorem case 1 and case 2.
Asymptotic complexity proofs using tree expansion and substitution.`;
  const quiz = generateNoteQuizLocally('Master Theorem', 'CS-301', testContent);
  assert.equal(quiz.summaryBullets.length, 3);
  assert.equal(quiz.flashcards.length, 3);

  const parsedExpenses = parseNaturalLanguageExpensesLocally(
    'Spent ₹160 on masala dosa lunch and Rs 520 on lab goggles',
    15000,
    5330,
    '2026-10-20',
    '₹'
  );
  assert.equal(INITIAL_STUDENT_WORKSPACE.currency, '₹');
  assert.equal(parsedExpenses.items.length, 2);
  assert.equal(parsedExpenses.items[0].amount, 160);
  assert.equal(parsedExpenses.items[0].category, 'Food & Dining');
  assert.equal(parsedExpenses.items[1].amount, 520);
  assert.equal(parsedExpenses.items[1].category, 'Books & Supplies');
  assert.ok(parsedExpenses.advice.includes('₹680.00'));
});

test('formatTimeLeft and getWordCount compute expected strings and counts', () => {
  assert.equal(formatTimeLeft(1500), '25:00');
  assert.equal(formatTimeLeft(3000), '50:00');
  assert.deepEqual(getWordCount('Master Theorem O(n log n)'), { words: 5, chars: 25 });
});

test('parseTimetableLocally extracts classes with start/end time and course info', () => {
  const timetableText = `Monday 09:00 - 10:30 CS-301 Data Structures Room 204
Wednesday 14:00 - 15:30 MATH-204 Linear Algebra Hall B`;
  const result = parseTimetableLocally(timetableText);
  assert.equal(result.slots.length, 2);
  assert.equal(result.slots[0].dayOfWeek, 'Monday');
  assert.equal(result.slots[0].courseCode, 'CS-301');
  assert.equal(result.slots[0].startTime, '09:00');
  assert.equal(result.slots[0].endTime, '10:30');
  assert.equal(result.slots[1].dayOfWeek, 'Wednesday');
  assert.equal(result.slots[1].courseCode, 'MATH-204');
});

test('classifyAndScheduleTasksLocally separates urgent today tasks from longer projects', () => {
  const rawInput = `Finish CS-301 lab 3 today
Start 20-page history term paper due in 2 weeks
Review MATH-204 problem set`;
  const courses = [
    { id: 'c1', code: 'CS-301', name: 'Data Structures', targetHoursPerWeek: 8, loggedHours: 2, completedTopics: 3, totalTopics: 10, grade: 'A', credits: 4 },
    { id: 'c2', code: 'MATH-204', name: 'Linear Algebra', targetHoursPerWeek: 6, loggedHours: 1, completedTopics: 2, totalTopics: 8, grade: 'B', credits: 3 },
  ];
  const result = classifyAndScheduleTasksLocally(rawInput, courses, [], 45, '09:00');
  assert.equal(result.todayTasks.length, 2);
  assert.equal(result.longerTermTasks.length, 1);
  assert.equal(result.longerTermTasks[0].classification, 'longer_term');
  assert.ok(result.scheduleBlocks.length >= 2);
});

test('analyzeDocumentLocally extracts summary, exam predictions, recall questions and handles custom queries', () => {
  const sampleDoc = `Relational database normalization involves decomposing relations to eliminate anomalies.
First normal form (1NF) enforces atomic values and unique records.
Second normal form (2NF) eliminates partial functional dependencies.
Third normal form (3NF) removes transitive dependencies.
Boyce-Codd Normal Form (BCNF) strictly requires every determinant to be a superkey.`;

  const analysis = analyzeDocumentLocally(
    'Database_Normalization.pdf',
    sampleDoc,
    'CS-402',
    'Database Systems',
    'What does Boyce-Codd Normal Form require?'
  );

  assert.ok(analysis.summary.length > 20);
  assert.ok(analysis.keyTopics.length >= 3);
  assert.equal(analysis.examPredictions.length, 3);
  assert.equal(analysis.recallQuiz.length, 4);
  assert.ok(analysis.studyAdvice.includes('Database_Normalization.pdf'));
  assert.ok(analysis.customAnswer?.toLowerCase().includes('boyce-codd'));
});


