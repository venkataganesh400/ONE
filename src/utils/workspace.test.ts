import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpenseSummary,
  calculateStudyMetrics,
  applyCheckinToWorkspace,
  formatTimeLeft,
  getWordCount,
  INITIAL_STUDENT_WORKSPACE,
} from './workspace.ts';

test('calculateExpenseSummary accurately computes spent, remaining, and categories', () => {
  const summary = calculateExpenseSummary(
    [
      { id: '1', title: 'Calculus Book', amount: 40, category: 'Books & Supplies', date: '2026-10-20' },
      { id: '2', title: 'Lunch', amount: 12.5, category: 'Food & Dining', date: '2026-10-20' },
    ],
    200
  );

  assert.equal(summary.totalSpent, 52.5);
  assert.equal(summary.remaining, 147.5);
  assert.equal(summary.percentUsed, 26);
  assert.equal(summary.isOverBudget, false);
  assert.equal(summary.byCategory['Books & Supplies'], 40);
  assert.equal(summary.byCategory['Food & Dining'], 12.5);
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

test('applyCheckinToWorkspace updates daily priority, budget, and adds high-priority task', () => {
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
});

test('formatTimeLeft and getWordCount compute expected strings and counts', () => {
  assert.equal(formatTimeLeft(1500), '25:00');
  assert.equal(formatTimeLeft(3000), '50:00');
  assert.deepEqual(getWordCount('Master Theorem O(n log n)'), { words: 5, chars: 25 });
});
