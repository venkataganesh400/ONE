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

const CURRENCY_OPTIONS = [
  { symbol: '₹', code: 'INR', label: 'INR' },
  { symbol: '$', code: 'USD', label: 'USD' },
] as const;

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

  const handleSelectCurrency = (nextSymbol: string) => {
    if (nextSymbol === data.currency) return;
    onUpdateData((prev) => {
      const nextBudget =
        nextSymbol === '₹' && prev.monthlyBudget <= 1200
          ? 15000
          : nextSymbol === '$' && prev.monthlyBudget >= 8000
            ? 500
            : prev.monthlyBudget;
      return {
        ...prev,
        currency: nextSymbol,
        monthlyBudget: nextBudget,
      };
    });
  };

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
        todayStr,
        data.currency
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
          `Include a number amount in your text (e.g. "Spent ${data.currency}150 on lunch and ${data.currency}480 on calculus book").`
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

  const isRupees = data.currency === '₹';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Student Expenses &amp; Budget ({isRupees ? '₹ INR' : '$ USD'})
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Track textbooks, mess &amp; dining, coffee runs, and daily safe spend pacing in{' '}
            {isRupees ? 'Indian Rupees (₹)' : 'US Dollars ($)'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Interactive Currency Selector (₹ INR / $ USD) */}
          <div
            role="group"
            aria-label="Select expense currency"
            className="inline-flex items-center p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
          >
            {CURRENCY_OPTIONS.map((opt) => {
              const active = data.currency === opt.symbol;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleSelectCurrency(opt.symbol)}
                  aria-pressed={active}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold smooth-spring whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    active
                      ? 'glossy-active-tab'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <span className="font-sans">{opt.symbol}</span>
                  <span className="font-mono">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {editingBudget ? (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-2">
              <label htmlFor="monthly-budget-input" className="text-xs font-sans text-zinc-500">
                Cap ({data.currency}):
              </label>
              <input
                id="monthly-budget-input"
                type="number"
                min="50"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-28 px-3 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-950 dark:text-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-4 py-2 rounded-full glossy-active-tab text-xs font-semibold smooth-spring"
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
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 smooth-spring w-fit whitespace-nowrap shrink-0"
            >
              <span>Monthly Budget: </span>
              <span className="font-sans">{data.currency}</span>
              <span className="font-mono">{data.monthlyBudget.toLocaleString('en-IN')}</span>
              <span> (Edit)</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 4 Financial KPI Cards (Including Daily Safe Spend Burn-Rate) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 sm:p-6 rounded-3xl pro-surface">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Spent This Month</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white tabular-nums">
            <span className="font-sans">{data.currency}</span>
            {summary.totalSpent.toFixed(2)}
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {summary.percentUsed}% of monthly cap used
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl pro-surface">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Remaining Allowance</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white tabular-nums">
            <span className="font-sans">{data.currency}</span>
            {summary.remaining.toFixed(2)}
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {summary.isOverBudget ? 'Over monthly budget target' : 'Within safe student budget'}
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl pro-surface">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Daily Safe Spend Limit</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white tabular-nums">
            <span className="font-sans">{data.currency}</span>
            {summary.dailySafeSpend.toFixed(2)}
            <span className="text-sm font-normal text-zinc-400">/day</span>
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Across {summary.daysRemainingInMonth} remaining days
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl pro-surface">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Logged Transactions</span>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 dark:text-white tabular-nums">
            {data.expenses.length}
          </p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Avg <span className="font-sans">{data.currency}</span>
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
        className="p-5 sm:p-6 rounded-3xl pro-surface space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
            <span>
              Gemini Smart Expense Parser &amp; Budget Coach ({data.currency})
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Supports ₹, Rs, INR &amp; multi-item input
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            required
            value={smartExpenseText}
            onChange={(e) => setSmartExpenseText(e.target.value)}
            placeholder={
              isRupees
                ? 'Try: "Spent ₹160 on masala dosa lunch and ₹520 on physics lab manual"'
                : 'Try: "Spent $14.50 on late night ramen and $42 on physics lab manual"'
            }
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-950 dark:focus:border-white smooth-spring"
          />
          <button
            type="submit"
            disabled={isParsingExpenses}
            className="px-5 py-2.5 rounded-2xl glossy-active-tab text-xs font-semibold hover:opacity-95 smooth-spring flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 whitespace-nowrap"
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
          <p className="text-xs font-sans text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
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
            className="p-6 rounded-3xl pro-surface space-y-4"
          >
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Log Single Campus or Living Expense ({data.currency})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Description (e.g. Engineering Mathematics Book, Canteen Thali)..."
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
                className="sm:col-span-4 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm font-sans tabular-nums text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none"
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
                className="sm:col-span-3 px-4 py-2.5 rounded-2xl glossy-active-tab text-xs font-semibold hover:opacity-95 smooth-spring flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-medium smooth-spring whitespace-nowrap shrink-0 ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium smooth-spring whitespace-nowrap shrink-0 ${
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
          <div className="rounded-3xl pro-surface divide-y divide-zinc-200 dark:divide-zinc-900 overflow-hidden">
            {filteredExpenses.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 smooth-spring"
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
                  <span className="text-sm sm:text-base font-bold font-mono text-zinc-950 dark:text-white tabular-nums">
                    <span className="font-sans">{data.currency}</span>
                    {item.amount.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(item.id)}
                    aria-label={`Delete expense ${item.title}`}
                    className="p-2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white smooth-spring"
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
        <section className="lg:col-span-5 p-6 rounded-3xl pro-surface space-y-5">
          <div>
            <h2 className="text-base font-bold text-zinc-950 dark:text-white">
              Category Breakdown
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Proportion of monthly student budget (
              <span className="font-sans">{data.currency}</span>
              <span className="font-mono">{data.monthlyBudget.toLocaleString('en-IN')}</span>)
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
                    <span className="font-mono font-semibold text-zinc-950 dark:text-white tabular-nums">
                      <span className="font-sans">{data.currency}</span>
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
