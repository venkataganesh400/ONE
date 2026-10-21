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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

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

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
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
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Break down the following university assignment into 3 to 4 concrete, sequential study sub-steps that fit into ${focusCadenceMinutes}-minute focus blocks.
Assignment: "${title}"
Course: ${course || 'GENERAL'}
Due Date: ${dueDate || 'Upcoming'}`,
        config: {
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
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are a university professor creating an active recall revision sheet and 4 high-yield flashcards from these student lecture notes.
Note Title: ${title} (${course})
Content:
${content}`,
        config: {
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
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Parse the student's natural-language spending description into structured expense items, and provide a 1-sentence budget insight using the currency symbol "${currency}".
Today's Date: ${today || '2026-10-20'}
Currency Symbol: ${currency}
Monthly Budget: ${currency}${monthlyBudget}
Already Spent: ${currency}${totalSpent}
Allowed Categories: "Food & Dining", "Books & Supplies", "Coffee & Snacks", "Transport", "Housing & Utilities", "Other"

Student Input: "${rawText}"`,
        config: {
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
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate 6 core university syllabus modules/topics for the course "${code}: ${name}". Keep each topic title concise (3 to 7 words).`,
        config: {
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
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json(parsed);
    } catch (error) {
      console.error('Gemini course-syllabus error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate syllabus topics',
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
