import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Check,
  Sparkles,
  Loader2,
  Utensils,
  BookOpen,
  Coffee,
  Bus,
  Home,
  Tag,
  Wallet,
  TrendingDown,
  Calendar,
} from 'lucide-react';
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

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
  'Food & Dining': Utensils,
  'Books & Supplies': BookOpen,
  'Coffee & Snacks': Coffee,
  Transport: Bus,
  'Housing & Utilities': Home,
  Other: Tag,
};

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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
          `Please include a numeric amount (e.g. "Spent ${data.currency}150 on breakfast and ${data.currency}450 on textbooks").`
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Currency Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#E8E2D8] dark:border-[#332C25] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] dark:text-[#FAF7F2] tracking-tight">
            Expense Tracker &amp; Wallet
          </h1>
          <p className="text-xs sm:text-sm text-[#665D54] dark:text-[#9E9387] mt-0.5">
            Apple Wallet-style allowance card, daily safe-spend burn rate &amp; smart categorization
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Currency Toggle */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-[#EFEAE1] dark:bg-[#28221D] border border-[#E0D8CB] dark:border-[#383028]">
            {CURRENCY_OPTIONS.map((opt) => {
              const active = data.currency === opt.symbol;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleSelectCurrency(opt.symbol)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    active
                      ? 'bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] shadow-xs'
                      : 'text-[#665D54] dark:text-[#9E9387] hover:text-[#1C1917]'
                  }`}
                >
                  {opt.symbol} {opt.code}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Apple Wallet Allowance Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#35281F] via-[#2A1F18] to-[#1C1510] text-[#FAF7F2] shadow-xl relative overflow-hidden border border-[#524134]">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#8A5836]/25 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#D6CFC4] uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-[#D8A775]" />
              <span>Remaining Monthly Allowance</span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white flex items-baseline gap-1">
              <span className="font-sans">{data.currency}</span>
              <span>{summary.remaining.toLocaleString(isRupees ? 'en-IN' : 'en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#D6CFC4]">
              <span>Spent <span className="font-sans">{data.currency}</span>{summary.totalSpent.toFixed(2)}</span>
              <span>·</span>
              {editingBudget ? (
                <form onSubmit={handleSaveBudget} className="inline-flex items-center gap-1.5">
                  <input
                    type="number"
                    min="50"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="w-24 px-2 py-0.5 rounded-lg bg-black/40 border border-[#8A5836] text-white font-mono text-xs focus:outline-none"
                  />
                  <button type="submit" className="p-1 rounded bg-[#FAF7F2] text-[#1C1917] text-xs">
                    <Check className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBudgetInput(String(data.monthlyBudget));
                    setEditingBudget(true);
                  }}
                  className="hover:text-white underline underline-offset-2"
                >
                  Cap: <span className="font-sans">{data.currency}</span>{data.monthlyBudget.toLocaleString('en-IN')} (Edit)
                </button>
              )}
            </div>
          </div>

          {/* Safe Spend Burn-Rate Pill */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 sm:text-right shrink-0">
            <div className="text-[11px] font-mono text-[#E8E2D8] uppercase tracking-wider mb-0.5">
              Daily Safe-Spend Limit
            </div>
            <div className="text-2xl font-bold font-mono text-[#F7F4EE]">
              <span className="font-sans">{data.currency}</span>{summary.dailySafeSpend.toFixed(2)}
              <span className="text-xs font-normal text-[#D6CFC4]">/day</span>
            </div>
            <div className="text-[11px] text-[#C4BCB1] mt-0.5">
              Across {summary.daysRemainingInMonth} days remaining
            </div>
          </div>
        </div>

        {/* Pacing Progress Bar */}
        <div className="relative z-10 mt-6 space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-[#D6CFC4]">
            <span>Monthly Pacing</span>
            <span>{summary.percentUsed}% Budget Consumed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                summary.isOverBudget
                  ? 'bg-rose-400'
                  : summary.percentUsed > 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, summary.percentUsed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gemini Natural Language Expense Input */}
      <form
        onSubmit={handleSmartParse}
        className="p-4 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E8E2D8] dark:border-[#322A23] shadow-xs space-y-2.5"
      >
        <div className="flex items-center justify-between text-xs text-[#665D54] dark:text-[#9E9387]">
          <span className="flex items-center gap-1.5 font-medium text-[#1C1917] dark:text-[#FAF7F2]">
            <Sparkles className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#C4976A]" />
            Natural-Language Expense Logger
          </span>
          <span className="text-[11px] text-[#8C7D70]">
            Supports multi-item phrases e.g. "Spent {data.currency}120 on lunch and {data.currency}45 on coffee"
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={smartExpenseText}
            onChange={(e) => setSmartExpenseText(e.target.value)}
            placeholder={
              isRupees
                ? 'Type in natural English: "Spent ₹160 for mess lunch and ₹40 for bus fare"'
                : 'Type in natural English: "Spent $14 for poke bowl and $4.50 for espresso"'
            }
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#28221D] border border-[#E0D8CB] dark:border-[#383028] text-xs text-[#1C1917] dark:text-[#FAF7F2] placeholder-[#8C7D70] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isParsingExpenses}
            className="px-4 py-2 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            {isParsingExpenses ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#C4976A] dark:text-[#8A5836]" />
            )}
            <span>Log with AI</span>
          </button>
        </div>

        {coachAdvice && (
          <div className="text-xs text-[#3C2E25] dark:text-[#E8E2D8] bg-[#FAF7F2] dark:bg-[#28221D] p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#332C25]">
            {coachAdvice}
          </div>
        )}
      </form>

      {/* Manual Quick Add Form */}
      <form
        onSubmit={handleAddExpense}
        className="p-4 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E8E2D8] dark:border-[#322A23] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <div className="flex items-center gap-2 flex-1 px-2">
          <Plus className="w-4 h-4 text-[#8A5836] dark:text-[#C4976A] shrink-0" />
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Manual expense description..."
            className="w-full bg-transparent text-sm text-[#1C1917] dark:text-[#FAF7F2] placeholder-[#8C7D70] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0EBE2] dark:border-[#2C2621]">
          <input
            type="number"
            required
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`${data.currency}0.00`}
            className="w-24 px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#28221D] border border-[#E0D8CB] dark:border-[#383028] text-xs font-mono text-[#1C1917] dark:text-[#FAF7F2] focus:outline-none"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#28221D] border border-[#E0D8CB] dark:border-[#383028] text-xs text-[#1C1917] dark:text-[#FAF7F2] focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-2 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#28221D] border border-[#E0D8CB] dark:border-[#383028] text-xs font-mono text-[#1C1917] dark:text-[#FAF7F2] focus:outline-none"
          />

          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] text-xs font-semibold hover:opacity-90 transition shrink-0"
          >
            Add
          </button>
        </div>
      </form>

      {/* Main Split: Category Filter & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ledger Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition shrink-0 ${
                selectedCategoryFilter === 'all'
                  ? 'bg-[#EFEAE1] dark:bg-[#2C2520] font-bold text-[#1C1917] dark:text-[#FAF7F2]'
                  : 'text-[#665D54] dark:text-[#9E9387] hover:text-[#1C1917]'
              }`}
            >
              All ({data.expenses.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition shrink-0 ${
                  selectedCategoryFilter === cat
                    ? 'bg-[#EFEAE1] dark:bg-[#2C2520] font-bold text-[#1C1917] dark:text-[#FAF7F2]'
                    : 'text-[#665D54] dark:text-[#9E9387] hover:text-[#1C1917]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grouped Transaction List */}
          <div className="apple-card divide-y divide-[#F0EBE2] dark:divide-[#28221D] overflow-hidden">
            {filteredExpenses.map((item) => {
              const Icon = CATEGORY_ICONS[item.category] || Tag;
              return (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]/80 dark:hover:bg-[#241F1B]/60 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] dark:bg-[#28221D] border border-[#E8E2D8] dark:border-[#383028] flex items-center justify-center shrink-0 text-[#8A5836] dark:text-[#C4976A]">
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-semibold text-[#1C1917] dark:text-[#FAF7F2] truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#8C7D70]">
                        <span>{item.category}</span>
                        <span>·</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm sm:text-base font-bold font-mono text-[#1C1917] dark:text-[#FAF7F2]">
                      <span className="font-sans">{data.currency}</span>{item.amount.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(item.id)}
                      aria-label="Delete transaction"
                      className="p-1.5 rounded-lg text-[#8C7D70] hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredExpenses.length === 0 && (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F0EBE2] dark:bg-[#2A231D] flex items-center justify-center text-[#8A5836] dark:text-[#C4976A]">
                  <Wallet className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#1C1917] dark:text-[#FAF7F2]">
                  {data.expenses.length === 0 ? 'Your expense ledger is clear' : 'No expenses in this category'}
                </p>
                <p className="text-xs text-[#8C7D70] max-w-sm leading-relaxed">
                  {data.expenses.length === 0
                    ? `Log your daily coffee, textbooks, meals, or groceries above to track your monthly ${data.currency}${data.monthlyBudget} allowance.`
                    : 'Switch category filter or log a transaction for this category.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Column */}
        <div className="lg:col-span-4 p-5 rounded-3xl apple-card space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#665D54] dark:text-[#9E9387]">
            Category Breakdown
          </h2>

          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const catSpent = summary.byCategory[cat] || 0;
              const pct = Math.min(
                100,
                Math.round((catSpent / Math.max(1, data.monthlyBudget)) * 100)
              );
              const Icon = CATEGORY_ICONS[cat] || Tag;

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[#3C2E25] dark:text-[#E8E2D8] font-medium">
                      <Icon className="w-3 h-3 text-[#8A5836] dark:text-[#C4976A]" />
                      <span>{cat}</span>
                    </span>
                    <span className="font-mono text-[#1C1917] dark:text-[#FAF7F2] font-semibold">
                      <span className="font-sans">{data.currency}</span>{catSpent.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#EBE5DB] dark:bg-[#2C2520] overflow-hidden">
                    <div
                      className="h-full bg-[#8A5836] dark:bg-[#C4976A] rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
