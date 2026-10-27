import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Calendar,
  Sparkles,
  Clock,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import type { DayOfWeek, TimetableSlot, StudentWorkspaceData, ScheduleBlock } from '../types/index.ts';
import { requestTimetableParse } from '../utils/aiClient.ts';
import { getTodayDayOfWeek } from '../utils/workspace.ts';

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StudentWorkspaceData;
  onUpdateData: React.Dispatch<React.SetStateAction<StudentWorkspaceData>>;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TimetableModal: React.FC<TimetableModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateData,
}) => {
  const [activeDay, setActiveDay] = useState<DayOfWeek>(() => getTodayDayOfWeek());
  const [pasteText, setPasteText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New slot form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:30');
  const [newRoom, setNewRoom] = useState('');

  if (!isOpen) return null;

  const currentSlots = (data.timetable || []).filter((s) => s.dayOfWeek === activeDay);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || '');
      setPasteText(text);
      await handleParseText(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleParseText = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsParsing(true);
    setStatusMessage(null);

    try {
      const res = await requestTimetableParse(textToParse);
      if (res.slots.length > 0) {
        onUpdateData((prev) => {
          // Merge with existing slots, avoiding duplicate code + day + time
          const existing = prev.timetable || [];
          const merged = [...existing];

          res.slots.forEach((newSlot) => {
            const dupIdx = merged.findIndex(
              (m) =>
                m.dayOfWeek === newSlot.dayOfWeek &&
                m.courseCode.toLowerCase() === newSlot.courseCode.toLowerCase() &&
                m.startTime === newSlot.startTime
            );
            if (dupIdx >= 0) {
              merged[dupIdx] = newSlot;
            } else {
              merged.push(newSlot);
            }
          });

          return { ...prev, timetable: merged };
        });

        setStatusMessage(`Successfully extracted ${res.slots.length} class slot(s) using AI.`);
        setPasteText('');
      } else {
        setStatusMessage('No timetable slots recognized. Please try pasting a clearer format.');
      }
    } catch {
      setStatusMessage('Timetable parsing failed. Check input.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim()) return;

    const newSlot: TimetableSlot = {
      id: `tt-manual-${Date.now()}`,
      dayOfWeek: activeDay,
      courseCode: newCourseCode.trim().toUpperCase(),
      courseName: newCourseName.trim() || `${newCourseCode.trim().toUpperCase()} Lecture`,
      startTime: newStartTime,
      endTime: newEndTime,
      room: newRoom.trim() || 'Campus Hall',
    };

    onUpdateData((prev) => ({
      ...prev,
      timetable: [...(prev.timetable || []), newSlot],
    }));

    setNewCourseCode('');
    setNewCourseName('');
    setNewRoom('');
    setShowAddForm(false);
  };

  const handleDeleteSlot = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      timetable: (prev.timetable || []).filter((s) => s.id !== id),
    }));
  };

  const handleIntegrateIntoSchedule = () => {
    const today = getTodayDayOfWeek();
    const todaySlots = (data.timetable || []).filter((s) => s.dayOfWeek === today);

    if (todaySlots.length === 0) {
      setStatusMessage(`No classes scheduled for today (${today}).`);
      return;
    }

    onUpdateData((prev) => {
      // Remove previous class blocks to avoid duplicates
      const nonClassBlocks = prev.scheduleBlocks.filter((b) => b.type !== 'class');

      const classBlocks: ScheduleBlock[] = todaySlots.map((slot) => {
        const [sh, sm] = slot.startTime.split(':').map(Number);
        const [eh, em] = slot.endTime.split(':').map(Number);
        const duration = (eh * 60 + em) - (sh * 60 + sm);

        return {
          id: `sb-cls-${slot.id}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          title: `${slot.courseCode}: ${slot.courseName}`,
          course: slot.courseCode,
          type: 'class',
          durationMinutes: duration > 0 ? duration : 60,
          completed: false,
          location: slot.room || 'Campus Hall',
        };
      });

      const combined = [...nonClassBlocks, ...classBlocks].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );

      return {
        ...prev,
        scheduleBlocks: combined,
        scheduleCoachNote: `Integrated ${classBlocks.length} fixed classes for today (${today}). Study blocks are scheduled in the remaining gaps.`,
      };
    });

    setStatusMessage(`Integrated ${todaySlots.length} class(es) into today's timeline.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-[#FAF7F2] dark:bg-[#1A1714] rounded-3xl border border-[#E0D8CB] dark:border-[#383028] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#EAE3D6] dark:border-[#2C241E] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                Class Timetable &amp; Schedule Integrator
              </h3>
              <p className="text-[11px] text-[#786C60] dark:text-[#A89E92]">
                Upload syllabus or paste course timings to avoid scheduling study over classes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#786C60] dark:text-[#A89E92] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Action Row: Upload file or paste */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#221E1A] border border-[#E0D8CB] dark:border-[#332B24] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-semibold text-xs text-[#1C1917] dark:text-[#FAF7F2] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
                <span>Upload or Paste Timetable</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] hover:bg-[#F5EFE6] dark:hover:bg-[#2E2822] text-[#3C2E25] dark:text-[#FAF7F2] font-medium transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.json,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="e.g. Mon 09:00 - 10:30 CS-301 Data Structures Room 204&#10;Tue 14:00 - 15:30 MATH-204 Linear Algebra Hall B&#10;Wed 10:00 - 11:30 PHYS-102 Physics Lab"
                rows={2}
                className="w-full p-2.5 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs focus:ring-1 focus:ring-[#8A5836] focus:outline-none resize-none scrollbar-none"
              />
              <button
                type="button"
                disabled={isParsing || !pasteText.trim()}
                onClick={() => handleParseText(pasteText)}
                className="px-4 py-2 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold hover:opacity-90 transition shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5 self-end"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isParsing ? 'Parsing...' : 'Extract'}</span>
              </button>
            </div>

            {statusMessage && (
              <div className="p-2.5 rounded-xl bg-[#EFEAE1] dark:bg-[#28221D] text-[#5C5248] dark:text-[#D6CFC4] text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* Days Tab Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar border-b border-[#EAE3D6] dark:border-[#2C241E]">
            {DAYS.map((day) => {
              const isToday = day === getTodayDayOfWeek();
              const count = (data.timetable || []).filter((s) => s.dayOfWeek === day).length;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                    activeDay === day
                      ? 'bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917]'
                      : 'text-[#786C60] dark:text-[#A89E92] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span>{day.slice(0, 3)}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        activeDay === day
                          ? 'bg-white/20 dark:bg-black/20 text-inherit'
                          : 'bg-[#EAE3D6] dark:bg-[#2C241E] text-inherit'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Today" />}
                </button>
              );
            })}
          </div>

          {/* Slots List for Selected Day */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#1C1917] dark:text-[#FAF7F2]">
                {activeDay}&apos;s Classes ({currentSlots.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8A5836] dark:text-[#D8A775] hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>{showAddForm ? 'Cancel' : 'Add Class'}</span>
              </button>
            </div>

            {/* Quick Add Form */}
            {showAddForm && (
              <form onSubmit={handleAddSlot} className="p-3.5 rounded-2xl bg-white dark:bg-[#221E1A] border border-[#E0D8CB] dark:border-[#332B24] space-y-2.5 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Course Code (e.g. CS-301)"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="p-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Course Name (e.g. Algorithms)"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="p-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[#786C60] dark:text-[#A89E92] block mb-0.5">Start Time</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full p-1.5 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#786C60] dark:text-[#A89E92] block mb-0.5">End Time</label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full p-1.5 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#786C60] dark:text-[#A89E92] block mb-0.5">Room / Hall</label>
                    <input
                      type="text"
                      placeholder="Hall B"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      className="w-full p-1.5 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-[#FAF7F2] dark:bg-[#1A1714] text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold text-xs"
                >
                  Save Class Slot
                </button>
              </form>
            )}

            {currentSlots.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-[#DED7CA] dark:border-[#3E352B] text-center text-[#786C60] dark:text-[#A89E92]">
                <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="font-medium text-xs">No classes scheduled on {activeDay}</p>
                <p className="text-[11px] mt-0.5">Free day for deep study blocks, research, or revision.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#221E1A] border border-[#E0D8CB] dark:border-[#332B24] flex items-center justify-between gap-3 shadow-2xs hover:border-[#8A5836] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EFEAE1] dark:bg-[#2C241E] flex flex-col items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
                        <span className="text-[9px] font-mono mt-0.5 text-[#5C5248] dark:text-[#A89E92]">
                          {slot.startTime}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#1C1917] dark:text-[#FAF7F2]">
                            {slot.courseCode}
                          </span>
                          <span className="text-[11px] text-[#786C60] dark:text-[#A89E92] truncate">
                            {slot.courseName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#786C60] dark:text-[#A89E92] mt-0.5 font-mono">
                          <span>
                            {slot.startTime} – {slot.endTime}
                          </span>
                          {slot.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#8A5836] dark:text-[#D8A775]" />
                              <span>{slot.room}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-1.5 rounded-lg text-[#9C9083] hover:text-rose-600 transition"
                      title="Remove slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#EAE3D6] dark:border-[#2C241E] flex items-center justify-between gap-3 bg-[#FAF7F2] dark:bg-[#1A1714]">
          <span className="text-[11px] text-[#786C60] dark:text-[#A89E92]">
            Total weekly slots: <strong>{(data.timetable || []).length}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] font-semibold text-xs text-[#5C5248] dark:text-[#B5AAA0] hover:bg-black/5 transition"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleIntegrateIntoSchedule}
              className="px-4 py-2 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold text-xs hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D8A775] dark:text-[#8A5836]" />
              <span>Integrate Classes Into Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
