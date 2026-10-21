import React, { useState } from 'react';
import { Plus, Trash2, Pin, Copy, Check, Search } from 'lucide-react';
import type { StudentWorkspaceData, StudyNote } from '../types/index.ts';
import { getWordCount } from '../utils/workspace.ts';

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
            Lecture Notes & Revision Sheets
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Consolidate class notes, formulas, and reading summaries organized by course code.
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
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Active Note Editor */}
        <div className="lg:col-span-8">
          {activeNote ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-900 pb-4">
                <input
                  type="text"
                  aria-label="Note title"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                  className="text-xl sm:text-2xl font-extrabold bg-transparent text-zinc-950 dark:text-white focus:outline-none flex-1"
                />

                <div className="flex items-center gap-2 shrink-0">
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

              <textarea
                aria-label="Note content"
                rows={12}
                value={activeNote.content}
                onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
                placeholder="Write lecture notes, proofs, or study guides..."
                className="w-full bg-transparent text-sm sm:text-base font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed focus:outline-none resize-y"
              />

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span>
                  {wordStats.words} words · {wordStats.chars} characters
                </span>
                <span>Updated {activeNote.updatedAt}</span>
              </div>
            </div>
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
