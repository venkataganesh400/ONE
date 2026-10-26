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

export interface TaskSubstep {
  id: string;
  title: string;
  estimatedMinutes: number;
  completed: boolean;
}

export type TaskClassification = 'today' | 'longer_term';

export interface TaskItem {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  classification?: TaskClassification;
  estimatedMinutes?: number;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  subtasks?: TaskSubstep[];
}

export interface SyllabusTopicItem {
  id: string;
  title: string;
  completed: boolean;
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
  syllabusTopics?: SyllabusTopicItem[];
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

export interface NoteFlashcard {
  id: string;
  question: string;
  answer: string;
}

export interface StudyNote {
  id: string;
  title: string;
  course: string;
  content: string;
  isPinned: boolean;
  updatedAt: string;
  summaryBullets?: string[];
  flashcards?: NoteFlashcard[];
}

export interface StudySession {
  id: string;
  courseCode: string;
  taskId?: string;
  taskTitle?: string;
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

export type ScheduleBlockType = 'focus' | 'exam_prep' | 'review' | 'break' | 'class';

export interface ScheduleBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  course: string;
  type: ScheduleBlockType;
  durationMinutes: number;
  completed: boolean;
  taskId?: string;
  location?: string;
}

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface TimetableSlot {
  id: string;
  dayOfWeek: DayOfWeek;
  courseCode: string;
  courseName: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:30"
  room?: string;
  instructor?: string;
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
  scheduleBlocks: ScheduleBlock[];
  timetable?: TimetableSlot[];
  notificationsEnabled?: boolean;
  missedTaskAlerts?: boolean;
  scheduleCoachNote?: string;
  activeFocusTaskId?: string | null;
  activeFocusCourse?: string;
}
