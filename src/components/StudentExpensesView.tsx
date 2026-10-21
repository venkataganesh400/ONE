import React, { useState } from 'react';
import { Plus, Trash2, Check, Sparkles, Loader2 } from 'lucide-react';
import type {
  ExpenseCategory,
  ExpenseItem,
  StudentWorkspaceData,
} from '../types/index.ts';
import { calculateExpenseSummary } from '../utils/workspace.ts';
import { requestSmartExpenseParse } from '../utils/aiClient.ts';

interface StudentExpensesViewProps {
  data: StudentWorkspaceData;
  onUpdateData: (updater: (prev: StudentWorkspaceData) => StudentWorkspaceData) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Books & Supplies',
  'Coffee & Snacks',
  'Transport',
  'Housing & Utilities',
  'Other',
];

export const StudentExpensesView: React.FC<StudentExpensesViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [date, setDate] = useState('2026-10-20');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(data.monthlyBudget));

  const [smartExpenseText, setSmartExpenseText] = useState('');
  const [isParsingExpenses, setIsParsingExpenses] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string | null>(null);

  const summary = calculateExpenseSummary(data.expenses, data.monthlyBudget);

  const filteredExpenses =
    selectedCategoryFilter === 'all'
      ? data.expenses
      : data.expenses.filter((e) => e.category === selectedCategoryFilter);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!title.trim() || isNaN(parsed) || parsed <= 0) return;

    const newExpense: ExpenseItem = {
      id: 'ex-' + Date.now(),
      title: title.trim(),
      amount: Number(parsed.toFixed(2)),
      category,
      date,
    };

    onUpdateData((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
    }));

    setTitle('');
    setAmount('');
  };

  const handleSmartParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartExpenseText.trim()) return;

    setIsParsingExpenses(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await requestSmartExpenseParse(
        smartExpenseText.trim(),
        data.monthlyBudget,
        summary.totalSpent,
        todayStr
      );
      if (res.items.length > 0) {
        const created: ExpenseItem[] = res.items.map((item, idx) => ({
          id: `ex-ai-${Date.now()}-${idx}`,
          ...item,
        }));
        onUpdateData((prev) => ({
          ...prev,
          expenses: [...created, ...prev.expenses],
        }));
        setCoachAdvice(res.advice);
        setSmartExpenseText('');
      } else {
        setCoachAdvice(
          'Include a number amount in your text (e.g. "Spent 12.50 on lunch and 28 on calculus book").'
        );
      }
    } finally {
      setIsParsingExpenses(false);
    }
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(budgetInput);
    if (!isNaN(parsed) && parsed >= 50) {
      onUpdateData((prev) => ({
        ...prev,
        monthlyBudget: Math.round(parsed),
      }));
    }
    setEditingBudget(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Student Expenses & Budget
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Track textbooks, dining, coffee runs, and daily safe spend pacing against your monthly allowance.
          </p>
        </div>

        {editingBudget ? (
          <form onSubmit={handleSaveBudget} className="flex items-center gap-2">
            <label htmlFor="monthly-budget-input" className="text-xs font-mono text-zinc-500">
              Cap ({data.currency}):
            </label>
            <input
              id="monthly-budget-input"
              type="number"
              min="50"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-28 px-3 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-950 dark:text-white"
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setBudgetInput(String(data.monthlyBudget));
              setEditingBudget(true);
            }}
            className="px-4 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 transition w-fit"
          >
            Monthly Budget: {data.currency}
            {data.monthlyBudget} (Edit)
          </button>
        )}
      </div>

      {/* Top 4 Financial KPI Cards (Including Daily Safe Spend Burn-Rate) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Spent This Month</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {data.currency}
            {summary.totalSpent.toFixed(2)}
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {summary.percentUsed}% of monthly cap used
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Remaining Allowance</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {data.currency}
            {summary.remaining.toFixed(2)}
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {summary.isOverBudget ? 'Over monthly budget target' : 'Within safe student budget'}
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Daily Safe Spend Limit</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {data.currency}
            {summary.dailySafeSpend.toFixed(2)}
            <span className="text-sm font-normal text-zinc-400">/day</span>
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Across {summary.daysRemainingInMonth} remaining days
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Logged Transactions</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white">
            {data.expenses.length}
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Avg {data.currency}
            {data.expenses.length > 0
              ? (summary.totalSpent / data.expenses.length).toFixed(2)
              : '0.00'}{' '}
            per item
          </span>
        </div>
      </div>

      {/* Gemini Natural-Language Expense Parser */}
      <form
        onSubmit={handleSmartParse}
        className="p-5 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
            <span>Gemini Smart Expense Parser & Budget Coach</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Multi-item natural language input
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            required
            value={smartExpenseText}
            onChange={(e) => setSmartExpenseText(e.target.value)}
            placeholder='Try: "Spent 14.50 on late night ramen and 42 on physics lab manual"'
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-950 dark:focus:border-white"
          />
          <button
            type="submit"
            disabled={isParsingExpenses}
            className="px-5 py-2.5 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            {isParsingExpenses ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isParsingExpenses ? 'Parsing...' : 'Parse & Log with AI'}</span>
          </button>
        </div>

        {coachAdvice && (
          <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {coachAdvice}
          </p>
        )}
      </form>

      {/* Main Split: Log & Ledger on Left, Category Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Manual Add Expense Form */}
          <form
            onSubmit={handleAddExpense}
            className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4"
          >
            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              Log Single Campus or Living Expense
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Description (e.g. Calculus Workbook, Campus Lunch)..."
                className="sm:col-span-8 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none"
              />
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`${data.currency}0.00`}
                className="sm:col-span-4 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm font-mono text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none"
              />
              <select
                aria-label="Expense category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="sm:col-span-5 px-3 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="date"
                aria-label="Expense date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="sm:col-span-4 px-3 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white"
              />
              <button
                type="submit"
                aria-label="Add Expense"
                className="sm:col-span-3 px-4 py-2.5 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          </form>

          {/* Category Filter Bar */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                selectedCategoryFilter === 'all'
                  ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              All ({data.expenses.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  selectedCategoryFilter === cat
                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Expense Ledger List */}
          <div className="rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-900 overflow-hidden">
            {filteredExpenses.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 transition"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-zinc-950 dark:text-white truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm sm:text-base font-bold font-mono text-zinc-950 dark:text-white">
                    {data.currency}
                    {item.amount.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(item.id)}
                    aria-label={`Delete expense ${item.title}`}
                    className="p-2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredExpenses.length === 0 && (
              <div className="p-8 text-center text-sm text-zinc-500">
                No expenses recorded in this category yet.
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Spending by Category */}
        <section className="lg:col-span-5 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
          <div>
            <h2 className="text-base font-bold text-zinc-950 dark:text-white">
              Category Breakdown
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Proportion of monthly student budget ({data.currency}
              {data.monthlyBudget})
            </p>
          </div>

          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const catSpent = summary.byCategory[cat] || 0;
              const pct = Math.min(
                100,
                Math.round((catSpent / Math.max(1, data.monthlyBudget)) * 100)
              );

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{cat}</span>
                    <span className="font-mono font-semibold text-zinc-950 dark:text-white">
                      {data.currency}
                      {catSpent.toFixed(2)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-zinc-950 dark:bg-white transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
