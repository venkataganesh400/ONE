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

  const quiz = generateNoteQuizLocally('Master Theorem', 'CS-301', INITIAL_STUDENT_WORKSPACE.notes[0].content);
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
