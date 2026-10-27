import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Pin,
  Copy,
  Check,
  Search,
  Sparkles,
  Loader2,
  Eye,
  Edit3,
} from 'lucide-react';
import type { StudentWorkspaceData, StudyNote } from '../types/index.ts';
import { getWordCount } from '../utils/workspace.ts';
import { requestNoteActiveRecall } from '../utils/aiClient.ts';

interface StudentNotesViewProps {
  data: StudentWorkspaceData;
  onUpdateData: (updater: (prev: StudentWorkspaceData) => StudentWorkspaceData) => void;
}

export const StudentNotesView: React.FC<StudentNotesViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    data.notes[0]?.id || ''
  );
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});

  const courseCodes = Array.from(
    new Set([...data.courses.map((c) => c.code), ...data.notes.map((n) => n.course)])
  );

  const filteredNotes = data.notes
    .filter((note) => {
      if (courseFilter !== 'all' && note.course !== courseFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          note.course.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

  const activeNote =
    data.notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || null;

  const handleCreateNote = () => {
    const newNote: StudyNote = {
      id: 'sn-' + Date.now(),
      title: 'Untitled Lecture Summary',
      course: data.courses[0]?.code || 'CS-301',
      content: 'Key concepts, definitions, and exam review questions:\n\n- ',
      isPinned: false,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onUpdateData((prev) => ({
      ...prev,
      notes: [newNote, ...prev.notes],
    }));
    setSelectedNoteId(newNote.id);
    setViewMode('edit');
  };

  const handleUpdateActiveNote = (patch: Partial<StudyNote>) => {
    if (!activeNote) return;
    const today = new Date().toISOString().split('T')[0];
    onUpdateData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === activeNote.id ? { ...n, ...patch, updatedAt: today } : n
      ),
    }));
  };

  const handleGenerateActiveRecall = async () => {
    if (!activeNote || !activeNote.content.trim()) return;
    setIsGeneratingQuiz(true);
    try {
      const res = await requestNoteActiveRecall(
        activeNote.title,
        activeNote.course,
        activeNote.content
      );
      handleUpdateActiveNote({
        summaryBullets: res.summaryBullets,
        flashcards: res.flashcards,
      });
      setRevealedCards({});
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const toggleRevealCard = (cardId: string) => {
    setRevealedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleDeleteNote = (id: string) => {
    onUpdateData((prev) => {
      const remaining = prev.notes.filter((n) => n.id !== id);
      if (selectedNoteId === id) {
        setSelectedNoteId(remaining[0]?.id || '');
      }
      return {
        ...prev,
        notes: remaining,
      };
    });
  };

  const handleCopyNote = async () => {
    if (!activeNote) return;
    try {
      await navigator.clipboard.writeText(
        `# ${activeNote.title} (${activeNote.course})\n\n${activeNote.content}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const wordStats = getWordCount(activeNote?.content || '');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Lecture Notes & Active Recall
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Consolidate class notes, switch to clean revision preview, and generate active recall flashcards with Gemini.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNote}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Study Note</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Cols: Note Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lecture notes..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none"
            />
          </div>

          {/* Course Filter */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCourseFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition whitespace-nowrap ${
                courseFilter === 'all'
                  ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            {courseCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCourseFilter(code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition whitespace-nowrap ${
                  courseFilter === code
                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          {/* Note Cards List */}
          <div className="space-y-2.5">
            {filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`w-full text-left p-4 rounded-3xl border transition ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-950 dark:border-white'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-zinc-950 dark:text-white line-clamp-1">
                      {note.title}
                    </p>
                    {note.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-zinc-950 dark:text-white shrink-0" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    <span>{note.course}</span>
                    <span aria-hidden="true">·</span>
                    <span>{note.updatedAt}</span>
                    {note.flashcards && note.flashcards.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{note.flashcards.length} cards</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Active Note Editor + Active Recall Deck */}
        <div className="lg:col-span-8 space-y-6">
          {activeNote ? (
            <>
              <div className="p-6 sm:p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
                <div className="space-y-3 border-b border-zinc-200 dark:border-zinc-900 pb-4">
                  <input
                    type="text"
                    aria-label="Note title"
                    value={activeNote.title}
                    onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                    className="w-full text-xl sm:text-2xl font-extrabold bg-transparent text-zinc-950 dark:text-white focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setViewMode(viewMode === 'edit' ? 'preview' : 'edit')
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 transition"
                    >
                      {viewMode === 'edit' ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Study View</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Note</span>
                        </>
                      )}
                    </button>

                    <select
                      aria-label="Note course"
                      value={activeNote.course}
                      onChange={(e) => handleUpdateActiveNote({ course: e.target.value })}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white"
                    >
                      {courseCodes.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="GENERAL">GENERAL</option>
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateActiveNote({ isPinned: !activeNote.isPinned })
                      }
                      aria-label={activeNote.isPinned ? 'Unpin note' : 'Pin note'}
                      className={`p-2 rounded-xl border transition ${
                        activeNote.isPinned
                          ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-black dark:border-white'
                          : 'border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyNote}
                      aria-label="Copy note markdown"
                      className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(activeNote.id)}
                      aria-label={`Delete note ${activeNote.title}`}
                      className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {viewMode === 'edit' ? (
                  <textarea
                    aria-label="Note content"
                    rows={11}
                    value={activeNote.content}
                    onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
                    placeholder="Write lecture notes, proofs, or study guides..."
                    className="w-full bg-transparent text-sm sm:text-base font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed focus:outline-none resize-none scrollbar-none"
                  />
                ) : (
                  <div className="py-2 space-y-3 text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    {activeNote.content.split('\n').map((line, idx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <div key={idx} className="h-2" />;
                      if (trimmed.startsWith('- ') || /^\d+\./.test(trimmed)) {
                        return (
                          <div
                            key={idx}
                            className="pl-4 font-mono text-xs sm:text-sm text-zinc-700 dark:text-zinc-300"
                          >
                            {trimmed}
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="font-sans">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                )}

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <span>
                    {wordStats.words} words · {wordStats.chars} characters · Updated{' '}
                    {activeNote.updatedAt}
                  </span>

                  <button
                    type="button"
                    disabled={isGeneratingQuiz}
                    onClick={handleGenerateActiveRecall}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glossy-active-tab text-xs font-sans font-semibold hover:opacity-95 transition disabled:opacity-50"
                  >
                    {isGeneratingQuiz ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isGeneratingQuiz
                        ? 'Synthesizing Quiz...'
                        : 'Generate Active Recall Quiz'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Active Recall Summary Bullets & Flashcards */}
              {((activeNote.summaryBullets && activeNote.summaryBullets.length > 0) ||
                (activeNote.flashcards && activeNote.flashcards.length > 0)) && (
                <div className="p-6 sm:p-8 rounded-3xl pro-surface space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                        Active Recall Revision Sheet & Flashcards
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Tap any question card below to reveal the answer and test your exam readiness
                      </p>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                      {activeNote.course}
                    </span>
                  </div>

                  {activeNote.summaryBullets && activeNote.summaryBullets.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                        3-Bullet Exam Synthesis
                      </span>
                      <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
                        {activeNote.summaryBullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-mono font-bold text-zinc-400">
                              0{idx + 1}.
                            </span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeNote.flashcards && activeNote.flashcards.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeNote.flashcards.map((card, idx) => {
                        const isRevealed = Boolean(revealedCards[card.id]);
                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => toggleRevealCard(card.id)}
                            className="text-left p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-950 dark:hover:border-white transition flex flex-col justify-between gap-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                <span>Card 0{idx + 1}</span>
                                <span>{isRevealed ? 'Answer shown' : 'Tap to reveal'}</span>
                              </div>
                              <p className="text-sm font-bold text-zinc-950 dark:text-white leading-snug">
                                {card.question}
                              </p>
                            </div>

                            {isRevealed && (
                              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                {card.answer}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-12 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center space-y-3">
              <p className="text-sm text-zinc-500">
                No study note selected. Create a new note to start writing.
              </p>
              <button
                type="button"
                onClick={handleCreateNote}
                className="px-5 py-2.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-semibold"
              >
                Create First Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
