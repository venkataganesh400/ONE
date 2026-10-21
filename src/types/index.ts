export type ThemeMode = 'dark' | 'light';

export type StudentTab =
  | 'planner'
  | 'tasks'
  | 'study'
  | 'focus'
  | 'expenses'
  | 'notes'
  | 'checkin';

export type QuestionType = 'single' | 'multiple' | 'text';

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  shortcut?: string;
}

export interface Question {
  id: string;
  stepNumber: number;
  totalSteps: number;
  category: string;
  title: string;
  subtitle: string;
  type: QuestionType;
  options: QuestionOption[];
  minSelections?: number;
  placeholder?: string;
}

export interface StudentCheckinResponses {
  studyMode: string;
  topGoal: string;
  focusInterval: string;
  budgetTarget: string;
  distractionRules: string[];
}

export interface TaskItem {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
}

export interface CourseItem {
  id: string;
  code: string;
  name: string;
  targetHoursPerWeek: number;
  loggedHours: number;
  completedTopics: number;
  totalTopics: number;
  grade: string;
  credits: number;
}

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Books & Supplies'
  | 'Transport'
  | 'Housing & Utilities'
  | 'Coffee & Snacks'
  | 'Other';

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

export interface StudyNote {
  id: string;
  title: string;
  course: string;
  content: string;
  isPinned: boolean;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  courseCode: string;
  durationMinutes: number;
  completedAt: string;
}

export interface ExamDeadline {
  id: string;
  title: string;
  course: string;
  date: string;
  type: 'Exam' | 'Project' | 'Quiz';
}

export interface StudentWorkspaceData {
  theme: ThemeMode;
  currency: string;
  monthlyBudget: number;
  dailyPriority: string;
  focusCadenceMinutes: number;
  studyMode: string;
  distractionRules: string[];
  tasks: TaskItem[];
  courses: CourseItem[];
  expenses: ExpenseItem[];
  notes: StudyNote[];
  sessions: StudySession[];
  exams: ExamDeadline[];
}
