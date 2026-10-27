import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Resilient multi-model Gemini caller with automatic fallback across proven available models.
 * Prioritizes gemini-3.5-flash for rapid response, followed by gemini-3.8-flash and gemini-3.1-flash-lite.
 */
async function callGeminiResilient(
  ai: GoogleGenAI,
  prompt: string,
  config?: Record<string, unknown>
): Promise<string> {
  const models = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      const text = (response.text || '').trim();
      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini Resilient] Model ${model} failed (${msg.slice(0, 100)}), falling back...`);
    }
  }

  throw lastError || new Error('All candidate Gemini models failed to generate output');
}

/**
 * Safely strips markdown code blocks (```json ... ```) and parses JSON.
 */
function parseGeminiJSON(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  }
  return JSON.parse(cleaned.trim());
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // 1. AI Daily Time-Block Schedule Architect
  app.post('/api/gemini/schedule', async (req, res) => {
    try {
      const {
        dailyPriority,
        focusCadenceMinutes,
        studyMode,
        tasks = [],
        exams = [],
        courses = [],
        startHour = '08:30',
      } = req.body || {};

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured on server' });
        return;
      }

      const prompt = `You are an elite academic advisor creating a realistic, high-output daily time-blocked schedule for a university student.
Student Context:
- Top Daily Priority: ${dailyPriority}
- Preferred Focus Block Cadence: ${focusCadenceMinutes} minutes
- Study Mode: ${studyMode}
- Start Time: ${startHour}
- Pending Tasks: ${JSON.stringify(tasks.slice(0, 8))}
- Upcoming Exams/Deadlines: ${JSON.stringify(exams.slice(0, 5))}
- Enrolled Courses: ${JSON.stringify(courses.map((c: { code: string; name: string; loggedHours: number; targetHoursPerWeek: number }) => ({ code: c.code, name: c.name, loggedHours: c.loggedHours, targetHoursPerWeek: c.targetHoursPerWeek })))}

Generate 5 to 7 chronological time blocks for today starting around ${startHour}. Alternate deep focus blocks with short recovery/meal breaks, prioritizing urgent exams, high-priority tasks, and under-logged courses.`;

      const text = await callGeminiResilient(ai, prompt, {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coachNote: {
              type: Type.STRING,
              description: 'A concise 1-sentence strategic rationale for today’s schedule.',
            },
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING, description: '24h time like 09:00' },
                  endTime: { type: Type.STRING, description: '24h time like 09:50' },
                  title: { type: Type.STRING, description: 'Specific actionable block title' },
                  course: { type: Type.STRING, description: 'Course code e.g. CS-301 or BREAK' },
                  type: {
                    type: Type.STRING,
                    description: 'Must be one of: focus, exam_prep, review, break',
                  },
                  durationMinutes: { type: Type.INTEGER },
                },
                required: ['startTime', 'endTime', 'title', 'course', 'type', 'durationMinutes'],
              },
            },
          },
          required: ['coachNote', 'blocks'],
        },
      });

      const parsed = parseGeminiJSON(text);
      res.json(parsed);
    } catch (error) {
      console.error('Gemini schedule error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate schedule',
      });
    }
  });

  // 2. AI Assignment & Task Decomposer
  app.post('/api/gemini/decompose-task', async (req, res) => {
    try {
      const { title, course, dueDate, focusCadenceMinutes = 50 } = req.body || {};
      if (!title || typeof title !== 'string') {
        res.status(400).json({ error: 'Task title is required' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured on server' });
        return;
      }

      const text = await callGeminiResilient(
        ai,
        `Break down the following university assignment into 3 to 4 concrete, sequential study sub-steps that fit into ${focusCadenceMinutes}-minute focus blocks.
Assignment: "${title}"
Course: ${course || 'GENERAL'}
Due Date: ${dueDate || 'Upcoming'}`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'Actionable sub-step title' },
                    estimatedMinutes: { type: Type.INTEGER },
                  },
                  required: ['title', 'estimatedMinutes'],
                },
              },
            },
            required: ['subtasks'],
          },
        }
      );

      const parsed = parseGeminiJSON(text);
      res.json(parsed);
    } catch (error) {
      console.error('Gemini decompose-task error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to decompose task',
      });
    }
  });

  // 3. AI Lecture Note Active Recall & Quiz Generator
  app.post('/api/gemini/note-quiz', async (req, res) => {
    try {
      const { title, course, content } = req.body || {};
      if (!content || typeof content !== 'string') {
        res.status(400).json({ error: 'Note content is required' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured on server' });
        return;
      }

      const text = await callGeminiResilient(
        ai,
        `You are a university professor creating an active recall revision sheet and 4 high-yield flashcards from these student lecture notes.
Note Title: ${title} (${course})
Content:
${content}`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryBullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 ultra-crisp takeaway bullets for rapid exam revision',
              },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                  },
                  required: ['question', 'answer'],
                },
              },
            },
            required: ['summaryBullets', 'flashcards'],
          },
        }
      );

      const parsed = parseGeminiJSON(text);
      res.json(parsed);
    } catch (error) {
      console.error('Gemini note-quiz error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate active recall quiz',
      });
    }
  });

  // 4. AI Natural-Language Expense Parser & Budget Coach
  app.post('/api/gemini/parse-expenses', async (req, res) => {
    try {
      const { rawText, monthlyBudget, totalSpent, today, currency = '₹' } = req.body || {};
      if (!rawText || typeof rawText !== 'string') {
        res.status(400).json({ error: 'Expense text is required' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured on server' });
        return;
      }

      const text = await callGeminiResilient(
        ai,
        `Parse the student's natural-language spending description into structured expense items, and provide a 1-sentence budget insight using the currency symbol "${currency}".
Today's Date: ${today || '2026-10-20'}
Currency Symbol: ${currency}
Monthly Budget: ${currency}${monthlyBudget}
Already Spent: ${currency}${totalSpent}
Allowed Categories: "Food & Dining", "Books & Supplies", "Coffee & Snacks", "Transport", "Housing & Utilities", "Other"

Student Input: "${rawText}"`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              advice: {
                type: Type.STRING,
                description: 'Concise 1-sentence student budget pacing advice.',
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                    date: { type: Type.STRING, description: 'YYYY-MM-DD' },
                  },
                  required: ['title', 'amount', 'category', 'date'],
                },
              },
            },
            required: ['advice', 'items'],
          },
        }
      );

      const parsed = parseGeminiJSON(text);
      res.json(parsed);
    } catch (error) {
      console.error('Gemini parse-expenses error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to parse expenses',
      });
    }
  });

  // 5. AI Course Syllabus Topic Generator
  app.post('/api/gemini/course-syllabus', async (req, res) => {
    try {
      const { code, name } = req.body || {};
      if (!name) {
        res.status(400).json({ error: 'Course name is required' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured on server' });
        return;
      }

      const text = await callGeminiResilient(
        ai,
        `Generate 6 core university syllabus modules/topics for the course "${code}: ${name}". Keep each topic title concise (3 to 7 words).`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['topics'],
          },
        }
      );

      const parsed = parseGeminiJSON(text);
      res.json(parsed);
    } catch (error) {
      console.error('Gemini course-syllabus error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate syllabus topics',
      });
    }
  });

  // 6. Gemini Academic AI Strategist & Comprehensive Coach
  app.post('/api/gemini/academic-coach', async (req, res) => {
    try {
      const {
        tasks = [],
        courses = [],
        exams = [],
        expenses = [],
        monthlyBudget = 10000,
        dailyPriority = '',
        currency = '₹',
        focusCadenceMinutes = 45,
      } = req.body || {};

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured on server' });
        return;
      }

      const prompt = `You are an elite university academic strategist and personal executive coach.
Analyze this student's real-time workspace and generate:
1. A sharp, inspiring daily focus recommendation for today.
2. A strategic rationale explaining how to optimize cognitive energy, upcoming exams, and coursework.
3. 3 to 4 actionable, high-impact suggestions across schedule pacing, exam prep, budget control, and deep focus.
4. A chronological 5 to 6-block time schedule for today.

Student State:
- Stated Priority: "${dailyPriority || 'None set yet'}"
- Focus Cadence: ${focusCadenceMinutes} minutes per block
- Active Tasks (${tasks.length}): ${JSON.stringify(tasks.slice(0, 10))}
- Active Courses (${courses.length}): ${JSON.stringify(courses)}
- Upcoming Exams (${exams.length}): ${JSON.stringify(exams)}
- Total Logged Expenses (${expenses.length}): ${currency}${expenses.reduce((s: number, e: { amount: number }) => s + (Number(e.amount) || 0), 0)} out of ${currency}${monthlyBudget} monthly budget

If the student currently has no tasks or courses, provide friendly, expert guidance on how to structure their academic semester, recommend starting habits, and give a realistic baseline daily study plan.`;

      const text = await callGeminiResilient(ai, prompt, {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyFocusRecommendation: {
              type: Type.STRING,
              description: 'A sharp, 1-2 sentence recommendation for the student’s top priority today.',
            },
            scheduleRationale: {
              type: Type.STRING,
              description: 'Clear tactical reasoning on why this schedule maximizes academic mastery.',
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    description: 'One of: schedule, exam_prep, budget, focus',
                  },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  actionTip: { type: Type.STRING },
                },
                required: ['category', 'title', 'description', 'actionTip'],
              },
            },
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  title: { type: Type.STRING },
                  course: { type: Type.STRING },
                  type: { type: Type.STRING },
                  durationMinutes: { type: Type.INTEGER },
                },
                required: ['startTime', 'endTime', 'title', 'course', 'type', 'durationMinutes'],
              },
            },
          },
          required: ['dailyFocusRecommendation', 'scheduleRationale', 'suggestions', 'blocks'],
        },
      });

      const parsed = parseGeminiJSON(text);
      res.json(parsed);
    } catch (error) {
      console.error('Gemini academic-coach error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate academic coaching strategy',
      });
    }
  });

  // 7. AI Daily Work Intake & Smart Task Classifier + Schedule Architect
  app.post('/api/gemini/intake-and-classify', async (req, res) => {
    try {
      const {
        rawInput,
        courses = [],
        timetableToday = [],
        focusCadenceMinutes = 45,
        startHour = '09:00',
      } = req.body || {};

      if (!rawInput || typeof rawInput !== 'string') {
        res.status(400).json({ error: 'Workload input text is required' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured on server' });
        return;
      }

      const prompt = `You are a world-class academic productivity architect.
The student has provided an unstructured list of works/tasks/commitments they need to do:
"${rawInput}"

Existing Enrolled Courses: ${JSON.stringify(courses.map((c: { code: string; name: string }) => ({ code: c.code, name: c.name })))}
Today's Fixed Timetable Classes: ${JSON.stringify(timetableToday)}
Preferred Focus Block Duration: ${focusCadenceMinutes} minutes
Day Start Time: ${startHour}

Analyze and accomplish:
1. SMART CLASSIFICATION:
   - "todayTasks": Actionable tasks/assignments that should be performed TODAY. For each, assign a course code, priority ('high'|'medium'|'low'), estimated minutes, and suggested start/end times.
   - "longerTermTasks": Substantial projects, research papers, long-term milestones, or assignments due later (e.g. next week, end of month). Assign an estimated target due date (e.g. "Next Friday", "In 10 days", etc.) and priority.
2. SCHEDULE BLOCKS:
   - Generate chronological daily schedule blocks starting from ${startHour}.
   - MUST integrate the today's fixed timetable classes (type: 'class') so study blocks do NOT overlap with class times.
   - Insert focused study blocks (type: 'focus') for today's tasks in the free gaps, along with 10-15m recovery breaks.`;

      const text = await callGeminiResilient(ai, prompt, {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryRationale: {
              type: Type.STRING,
              description: '1-2 sentence executive breakdown of today’s focus plan vs longer projects.',
            },
            todayTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  course: { type: Type.STRING },
                  priority: { type: Type.STRING, description: 'low, medium, or high' },
                  estimatedMinutes: { type: Type.INTEGER },
                  scheduledStartTime: { type: Type.STRING, description: 'e.g. 09:00' },
                  scheduledEndTime: { type: Type.STRING, description: 'e.g. 09:45' },
                },
                required: ['title', 'course', 'priority', 'estimatedMinutes'],
              },
            },
            longerTermTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  course: { type: Type.STRING },
                  priority: { type: Type.STRING, description: 'low, medium, or high' },
                  dueDate: { type: Type.STRING, description: 'e.g. Due next Friday or YYYY-MM-DD' },
                  estimatedMinutes: { type: Type.INTEGER },
                },
                required: ['title', 'course', 'priority', 'dueDate'],
              },
            },
            scheduleBlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  title: { type: Type.STRING },
                  course: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'focus, exam_prep, review, break, or class' },
                  durationMinutes: { type: Type.INTEGER },
                  location: { type: Type.STRING },
                },
                required: ['startTime', 'endTime', 'title', 'course', 'type', 'durationMinutes'],
              },
            },
          },
          required: ['summaryRationale', 'todayTasks', 'longerTermTasks', 'scheduleBlocks'],
        },
      });

      const parsed = parseGeminiJSON(text);
      res.json(parsed);
    } catch (error) {
      console.error('Gemini intake-and-classify error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to classify tasks and schedule',
      });
    }
  });

  // 8. AI Timetable & Syllabus Class Slot Parser
  app.post('/api/gemini/parse-timetable', async (req, res) => {
    try {
      const { rawText } = req.body || {};
      if (!rawText || typeof rawText !== 'string') {
        res.status(400).json({ error: 'Timetable text is required' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured on server' });
        return;
      }

      const prompt = `You are an academic scheduling expert.
Extract all recurring university class lectures, lab sessions, and tutorials from the following timetable or syllabus snippet:
"${rawText}"

Map each class to:
- dayOfWeek: Exactly one of "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
- courseCode: Short code like "CS-301" or "PHYS-102"
- courseName: Full title like "Data Structures & Algorithms"
- startTime: 24h format like "09:00"
- endTime: 24h format like "10:30"
- room: Location/Hall/Room if mentioned, or empty string
- instructor: Professor/Instructor name if mentioned, or empty string`;

      const text = await callGeminiResilient(ai, prompt, {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Summary of detected weekly class commitments.',
            },
            slots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayOfWeek: {
                    type: Type.STRING,
                    description: 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
                  },
                  courseCode: { type: Type.STRING },
                  courseName: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  room: { type: Type.STRING },
                  instructor: { type: Type.STRING },
                },
                required: ['dayOfWeek', 'courseCode', 'courseName', 'startTime', 'endTime'],
              },
            },
          },
          required: ['summary', 'slots'],
        },
      });

      const parsed = parseGeminiJSON(text);
      res.json(parsed);
    } catch (error) {
      console.error('Gemini parse-timetable error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to parse timetable',
      });
    }
  });

  // 9. AI Subject Document Analysis & Study Exam Synthesizer
  app.post('/api/gemini/analyze-document', async (req, res) => {
    try {
      const {
        docName = 'Subject Document',
        docText,
        courseCode = 'ACAD',
        courseName = 'Subject Course',
        customQuery = '',
      } = req.body || {};

      if (!docText || typeof docText !== 'string') {
        res.status(400).json({ error: 'Document content is required' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured on server' });
        return;
      }

      const prompt = `You are an elite university professor and personal academic tutor.
Analyze this academic document attached to the student's enrolled course "${courseCode}: ${courseName}".
Document Title: "${docName}"
Document Excerpt / Content:
${docText.slice(0, 18000)}

${customQuery ? `User's Specific Query / Instruction: "${customQuery}"` : ''}

Provide a comprehensive, high-yield academic breakdown:
1. "summary": A crisp, 3 to 4 sentence executive synthesis of the material, core definitions, and overarching theories.
2. "keyTopics": 4 to 6 critical topics, theorems, or problem classes covered in this document.
3. "examPredictions": 3 to 4 realistic midterm/final exam questions or problem themes most likely to be tested by professors from this document.
4. "recallQuiz": 4 rigorous active-recall flashcard pairs (question and answer) designed for high retention.
5. "studyAdvice": 1-2 actionable, concrete study tactics tailored to mastering this specific document.
6. "customAnswer": ${customQuery ? 'A direct, thorough, and helpful answer to the user query grounded in this document.' : '""'}`;

      const text = await callGeminiResilient(ai, prompt, {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Executive academic summary of the document.',
            },
            keyTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            examPredictions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recallQuiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
                required: ['question', 'answer'],
              },
            },
            studyAdvice: {
              type: Type.STRING,
              description: 'Specific study technique for this document.',
            },
            customAnswer: {
              type: Type.STRING,
              description: 'Answer to custom question if provided.',
            },
          },
          required: ['summary', 'keyTopics', 'examPredictions', 'recallQuiz', 'studyAdvice'],
        },
      });

      const parsed = parseGeminiJSON(text);
      res.json(parsed);
    } catch (error) {
      console.error('Gemini analyze-document error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to analyze document',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`One Student Workspace server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
