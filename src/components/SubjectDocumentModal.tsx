import React, { useState } from 'react';
import {
  X,
  FileText,
  Upload,
  Sparkles,
  Loader2,
  Trash2,
  HelpCircle,
  Brain,
  GraduationCap,
  ChevronRight,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { CourseDocument, CourseItem } from '../types/index.ts';
import { requestDocumentAnalysis } from '../utils/aiClient.ts';

interface SubjectDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseItem;
  onSaveDocuments: (documents: CourseDocument[]) => void;
}

export const SubjectDocumentModal: React.FC<SubjectDocumentModalProps> = ({
  isOpen,
  onClose,
  course,
  onSaveDocuments,
}) => {
  const documents = course.documents || [];
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    documents[0]?.id || null
  );

  // New Document Input State
  const [showAddForm, setShowAddForm] = useState(documents.length === 0);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<'pdf' | 'doc' | 'syllabus' | 'notes'>('pdf');
  const [docContent, setDocContent] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  // Analysis & Q&A state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [isAskingQuery, setIsAskingQuery] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'exam' | 'quiz' | 'ask'>('summary');
  const [revealedQuizIdxs, setRevealedQuizIdxs] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0] || null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    const fileName = file.name;
    setDocName(fileName);

    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      setDocType('pdf');
    } else if (ext === 'doc' || ext === 'docx') {
      setDocType('doc');
    } else if (ext === 'txt' || ext === 'md') {
      setDocType('notes');
    } else {
      setDocType('syllabus');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        // Strip non-printable binary artifacts if raw PDF
        const sanitized = result.replace(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, ' ').slice(0, 35000);
        setDocContent(sanitized);
      }
    };
    reader.onerror = () => {
      setFileError('Could not read file. You can paste the document text below.');
    };
    reader.readAsText(file);
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim()) {
      setFileError('Please provide a document title and content.');
      return;
    }

    const sizeBytes = new Blob([docContent]).size;
    const sizeFormatted =
      sizeBytes < 1024
        ? `${sizeBytes} B`
        : sizeBytes < 1024 * 1024
        ? `${Math.round(sizeBytes / 1024)} KB`
        : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

    const newDoc: CourseDocument = {
      id: `doc-${Date.now()}`,
      name: docName.trim(),
      type: docType,
      sizeFormatted,
      uploadedAt: new Date().toISOString().split('T')[0],
      contentSnippet: docContent.trim().slice(0, 240) + (docContent.length > 240 ? '...' : ''),
      fullText: docContent.trim(),
    };

    const updated = [...documents, newDoc];
    onSaveDocuments(updated);
    setSelectedDocId(newDoc.id);
    setShowAddForm(false);
    setDocName('');
    setDocContent('');
    setFileError(null);
  };

  const handleDeleteDocument = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = documents.filter((d) => d.id !== docId);
    onSaveDocuments(updated);
    if (selectedDocId === docId) {
      setSelectedDocId(updated[0]?.id || null);
    }
  };

  const handleRunAnalysis = async (doc: CourseDocument) => {
    if (!doc.fullText && !doc.contentSnippet) return;
    setIsAnalyzing(true);
    try {
      const text = doc.fullText || doc.contentSnippet;
      const res = await requestDocumentAnalysis(
        doc.name,
        text,
        course.code,
        course.name
      );

      const updatedDocs = documents.map((d) => {
        if (d.id !== doc.id) return d;
        return {
          ...d,
          analysis: {
            summary: res.summary,
            keyTopics: res.keyTopics,
            examPredictions: res.examPredictions,
            recallQuiz: res.recallQuiz,
            studyAdvice: res.studyAdvice,
            analysisDate: new Date().toISOString().split('T')[0],
          },
        };
      });

      onSaveDocuments(updatedDocs);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskCustomQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDoc || !customQuery.trim()) return;

    setIsAskingQuery(true);
    setCustomAnswer(null);
    try {
      const text = currentDoc.fullText || currentDoc.contentSnippet;
      const res = await requestDocumentAnalysis(
        currentDoc.name,
        text,
        course.code,
        course.name,
        customQuery.trim()
      );
      setCustomAnswer(res.customAnswer || 'Analysis complete. Review the key topics.');
    } finally {
      setIsAskingQuery(false);
    }
  };

  const toggleQuizCard = (idx: number) => {
    setRevealedQuizIdxs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1714] border border-[#E0D8CB] dark:border-[#383028] shadow-2xl text-[#1C1917] dark:text-[#FAF7F2] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D8] dark:border-[#2C2620] bg-white/60 dark:bg-[#151210]/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#EAE4D9] dark:bg-[#28221D] font-bold text-[#8A5836] dark:text-[#D8A775]">
                  {course.code}
                </span>
                <span className="text-xs text-[#665D54] dark:text-[#A89E92]">
                  {course.name}
                </span>
              </div>
              <h2 id="doc-modal-title" className="text-base sm:text-lg font-bold tracking-tight">
                Subject Documents &amp; Gemini AI Analysis
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#665D54] dark:text-[#A89E92] transition"
            aria-label="Close document modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view on desktop */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E8E2D8] dark:divide-[#2C2620]">
          {/* Left Column: Document List & Upload Trigger */}
          <div className="md:col-span-4 p-5 space-y-4 bg-white/40 dark:bg-black/20 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#665D54] dark:text-[#A89E92] uppercase tracking-wider">
                  Attached Files ({documents.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8A5836] dark:text-[#D8A775] hover:underline"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{showAddForm ? 'Cancel' : '+ Upload Doc'}</span>
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-[#D6CFC4] dark:border-[#3C342C] text-center space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-[#A89E92]" />
                  <p className="text-xs font-medium text-[#665D54] dark:text-[#A89E92]">
                    No documents attached to {course.code} yet.
                  </p>
                  <p className="text-[11px] text-[#8C8276]">
                    Upload syllabus PDFs, problem sets, or lecture notes to unlock Gemini exam predictions and flashcards.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {documents.map((doc) => {
                    const isSelected = doc.id === currentDoc?.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setShowAddForm(false);
                          setCustomAnswer(null);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-white dark:bg-[#201C18] border-[#8A5836] dark:border-[#D8A775] shadow-xs'
                            : 'bg-white/60 dark:bg-[#181512]/60 border-[#E8E2D8] dark:border-[#2C2620] hover:border-[#8A5836]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold bg-[#EAE4D9] dark:bg-[#28221D] text-[#8A5836] dark:text-[#D8A775] shrink-0">
                            {doc.type}
                          </span>
                          <div className="truncate text-left">
                            <p className="text-xs font-semibold truncate text-[#1C1917] dark:text-[#FAF7F2]">
                              {doc.name}
                            </p>
                            <p className="text-[10px] text-[#8C8276] font-mono">
                              {doc.sizeFormatted} · {doc.uploadedAt}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {doc.analysis && (
                            <span title="Gemini Analysis Available">
                              <Sparkles className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            className="p-1 rounded text-[#8C8276] hover:text-rose-600 transition"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Assistant Callout */}
            <div className="p-3.5 rounded-2xl bg-[#EFEAE1]/70 dark:bg-[#221D18]/70 border border-[#E0D8CB] dark:border-[#342D26] text-xs text-[#5C5248] dark:text-[#B5AAA0] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                <Brain className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
                <span>Gemini Document Engine</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Gemini processes document text to highlight core theorems, predict exam formats, and test you with active-recall flashcards.
              </p>
            </div>
          </div>

          {/* Right Column: View / Analysis / Upload Form */}
          <div className="md:col-span-8 p-6 flex flex-col justify-between overflow-y-auto">
            {showAddForm ? (
              /* Upload Form */
              <form onSubmit={handleCreateDocument} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                    Attach Academic Document to {course.code}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs text-[#8C8276] hover:underline"
                  >
                    Cancel
                  </button>
                </div>

                {fileError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}

                {/* File picker */}
                <div className="p-5 rounded-2xl border-2 border-dashed border-[#D6CFC4] dark:border-[#383028] bg-white/50 dark:bg-black/30 text-center space-y-2">
                  <Upload className="w-7 h-7 mx-auto text-[#8A5836] dark:text-[#D8A775]" />
                  <p className="text-xs font-semibold text-[#1C1917] dark:text-[#FAF7F2]">
                    Choose a PDF, Text file, or Syllabus doc
                  </p>
                  <p className="text-[11px] text-[#8C8276]">
                    Supports .pdf, .txt, .md, .doc, .syllabus (Max 15MB)
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] text-xs font-semibold cursor-pointer hover:opacity-90 transition mt-2">
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md,.doc,.docx,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#665D54] dark:text-[#A89E92] mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      required
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="e.g. Midterm_Review_Algorithms.pdf"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#201C18] border border-[#D6CFC4] dark:border-[#383028] text-xs text-[#1C1917] dark:text-[#FAF7F2]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#665D54] dark:text-[#A89E92] mb-1">
                      Category
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#201C18] border border-[#D6CFC4] dark:border-[#383028] text-xs text-[#1C1917] dark:text-[#FAF7F2]"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="syllabus">Syllabus / Curriculum</option>
                      <option value="notes">Lecture Notes / Summary</option>
                      <option value="doc">Assignment Sheet / Doc</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#665D54] dark:text-[#A89E92] mb-1">
                    Document Content / Extracted Text
                  </label>
                  <textarea
                    rows={6}
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Paste or inspect the text of the syllabus, lecture slides, or exam review..."
                    className="w-full p-3.5 rounded-xl bg-white dark:bg-[#201C18] border border-[#D6CFC4] dark:border-[#383028] text-xs font-mono text-[#1C1917] dark:text-[#FAF7F2] leading-relaxed resize-none scrollbar-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium border border-[#D6CFC4] dark:border-[#383028] hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] text-xs font-bold hover:opacity-90 transition shadow-xs"
                  >
                    Save &amp; Attach Document
                  </button>
                </div>
              </form>
            ) : currentDoc ? (
              /* Document Details & Analysis Screen */
              <div className="space-y-5">
                {/* Document Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#2C2620]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase font-bold text-[#8A5836] dark:text-[#D8A775]">
                        {currentDoc.type}
                      </span>
                      <span className="text-xs text-[#8C8276]">·</span>
                      <span className="text-xs text-[#8C8276] font-mono">{currentDoc.sizeFormatted}</span>
                      <span className="text-xs text-[#8C8276]">·</span>
                      <span className="text-xs text-[#8C8276]">Uploaded {currentDoc.uploadedAt}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#1C1917] dark:text-[#FAF7F2] mt-0.5">
                      {currentDoc.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => handleRunAnalysis(currentDoc)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FAF7F2] to-[#F2EDE4] dark:from-[#25201B] dark:to-[#1C1713] border border-[#D8A775]/50 text-xs font-bold text-[#3C2E25] dark:text-[#FAF7F2] shadow-2xs hover:border-[#8A5836] transition disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8A5836]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
                    )}
                    <span>{currentDoc.analysis ? 'Re-Analyze with Gemini' : 'Analyze with Gemini'}</span>
                  </button>
                </div>

                {/* Sub-tabs for Analysis views */}
                {currentDoc.analysis ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-[#EFEAE1] dark:bg-[#221D18] text-xs font-semibold overflow-x-auto scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setActiveTab('summary')}
                        className={`px-3 py-1.5 rounded-lg transition text-center whitespace-nowrap shrink-0 sm:flex-1 ${
                          activeTab === 'summary'
                            ? 'bg-white dark:bg-[#2C2620] text-[#1C1917] dark:text-[#FAF7F2] shadow-2xs font-bold'
                            : 'text-[#665D54] dark:text-[#A89E92] hover:text-[#1C1917]'
                        }`}
                      >
                        Summary &amp; Topics
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('exam')}
                        className={`px-3 py-1.5 rounded-lg transition text-center whitespace-nowrap shrink-0 sm:flex-1 ${
                          activeTab === 'exam'
                            ? 'bg-white dark:bg-[#2C2620] text-[#1C1917] dark:text-[#FAF7F2] shadow-2xs font-bold'
                            : 'text-[#665D54] dark:text-[#A89E92] hover:text-[#1C1917]'
                        }`}
                      >
                        Exam Predictions
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('quiz')}
                        className={`px-3 py-1.5 rounded-lg transition text-center whitespace-nowrap shrink-0 sm:flex-1 ${
                          activeTab === 'quiz'
                            ? 'bg-white dark:bg-[#2C2620] text-[#1C1917] dark:text-[#FAF7F2] shadow-2xs font-bold'
                            : 'text-[#665D54] dark:text-[#A89E92] hover:text-[#1C1917]'
                        }`}
                      >
                        Recall Quiz
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('ask')}
                        className={`px-3 py-1.5 rounded-lg transition text-center whitespace-nowrap shrink-0 sm:flex-1 ${
                          activeTab === 'ask'
                            ? 'bg-white dark:bg-[#2C2620] text-[#1C1917] dark:text-[#FAF7F2] shadow-2xs font-bold'
                            : 'text-[#665D54] dark:text-[#A89E92] hover:text-[#1C1917]'
                        }`}
                      >
                        Ask Gemini
                      </button>
                    </div>

                    {/* Tab 1: Executive Summary */}
                    {activeTab === 'summary' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#201C18] border border-[#E8E2D8] dark:border-[#2C2620] space-y-2">
                          <span className="text-xs font-mono font-bold text-[#8A5836] dark:text-[#D8A775] uppercase">
                            Executive Synthesis
                          </span>
                          <p className="text-xs sm:text-sm leading-relaxed text-[#3C2E25] dark:text-[#E8E2D8]">
                            {currentDoc.analysis.summary}
                          </p>
                        </div>

                        <div>
                          <span className="text-xs font-mono font-bold text-[#665D54] dark:text-[#A89E92] uppercase block mb-2">
                            Key Core Topics Identified
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {currentDoc.analysis.keyTopics.map((topic, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-xl bg-white dark:bg-[#201C18] border border-[#E0D8CB] dark:border-[#383028] text-xs font-medium text-[#3C2E25] dark:text-[#FAF7F2] shadow-2xs flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#8A5836] dark:bg-[#D8A775]" />
                                <span>{topic}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {currentDoc.analysis.studyAdvice && (
                          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                            <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-semibold block">Tutor Advice for this Document:</strong>
                              <p className="mt-0.5 leading-relaxed">{currentDoc.analysis.studyAdvice}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Exam Predictions */}
                    {activeTab === 'exam' && (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="text-xs text-[#665D54] dark:text-[#A89E92] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
                          <span>Midterm &amp; Final Exam Question Forecast</span>
                        </div>

                        <div className="space-y-2.5">
                          {currentDoc.analysis.examPredictions.map((pred, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl bg-white dark:bg-[#201C18] border border-[#E8E2D8] dark:border-[#2C2620] space-y-1.5 shadow-2xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#EAE4D9] dark:bg-[#28221D] font-bold text-[#8A5836] dark:text-[#D8A775]">
                                  Q{idx + 1} High Yield
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm font-medium text-[#1C1917] dark:text-[#FAF7F2] leading-relaxed">
                                {pred}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Active Recall Quiz */}
                    {activeTab === 'quiz' && (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="text-xs text-[#665D54] dark:text-[#A89E92] flex items-center justify-between">
                          <span>Interactive Flashcard Recall (Click to reveal solution)</span>
                          <span className="font-mono">{currentDoc.analysis.recallQuiz?.length || 0} Cards</span>
                        </div>

                        <div className="space-y-3">
                          {currentDoc.analysis.recallQuiz?.map((q, idx) => {
                            const isRevealed = revealedQuizIdxs[idx];
                            return (
                              <div
                                key={idx}
                                onClick={() => toggleQuizCard(idx)}
                                className="p-4 rounded-2xl bg-white dark:bg-[#201C18] border border-[#E8E2D8] dark:border-[#2C2620] cursor-pointer hover:border-[#8A5836] transition shadow-2xs space-y-2.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-mono font-bold text-[#8A5836] dark:text-[#D8A775]">
                                    Card #{idx + 1}
                                  </span>
                                  <span className="text-[11px] font-semibold text-[#8C8276] inline-flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{isRevealed ? 'Hide Answer' : 'Reveal Answer'}</span>
                                  </span>
                                </div>

                                <p className="text-xs sm:text-sm font-semibold text-[#1C1917] dark:text-[#FAF7F2]">
                                  {q.question}
                                </p>

                                {isRevealed ? (
                                  <div className="pt-2.5 border-t border-[#E8E2D8] dark:border-[#2C2620] text-xs text-[#3C2E25] dark:text-[#E8E2D8] leading-relaxed animate-fadeIn bg-[#FAF7F2] dark:bg-[#181512] p-3 rounded-xl">
                                    <strong className="text-[#8A5836] dark:text-[#D8A775] block font-mono text-[10px] uppercase mb-0.5">
                                      Model Explanation:
                                    </strong>
                                    {q.answer}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-[#A89E92] italic">
                                    Tap to verify your recall against professor standards.
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Ask Gemini */}
                    {activeTab === 'ask' && (
                      <div className="space-y-4 animate-fadeIn">
                        <form onSubmit={handleAskCustomQuery} className="space-y-2">
                          <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF7F2]">
                            Ask Gemini about &quot;{currentDoc.name}&quot;
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customQuery}
                              onChange={(e) => setCustomQuery(e.target.value)}
                              placeholder="e.g. Can you explain section 2 in simple terms? Or give 3 practice problems?"
                              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#201C18] border border-[#D6CFC4] dark:border-[#383028] text-xs text-[#1C1917] dark:text-[#FAF7F2]"
                            />
                            <button
                              type="submit"
                              disabled={isAskingQuery || !customQuery.trim()}
                              className="px-4 py-2.5 rounded-xl bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] text-xs font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                            >
                              {isAskingQuery ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Ask</span>
                            </button>
                          </div>
                        </form>

                        {customAnswer && (
                          <div className="p-4 rounded-2xl bg-white dark:bg-[#201C18] border border-[#8A5836]/40 dark:border-[#D8A775]/40 space-y-2 animate-fadeIn shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#8A5836] dark:text-[#D8A775]">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Gemini Response</span>
                            </div>
                            <p className="text-xs sm:text-sm leading-relaxed text-[#1C1917] dark:text-[#FAF7F2]">
                              {customAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Untouched Document Preview */
                  <div className="p-8 rounded-2xl bg-white dark:bg-[#201C18] border border-[#E8E2D8] dark:border-[#2C2620] text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] dark:bg-[#151210] flex items-center justify-center mx-auto text-[#8A5836] dark:text-[#D8A775]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                        Document Attached &amp; Ready for AI Analysis
                      </h4>
                      <p className="text-xs text-[#665D54] dark:text-[#A89E92] max-w-md mx-auto mt-1">
                        Click &quot;Analyze with Gemini&quot; above to synthesize this document, extract key topics, forecast exam questions, and generate interactive recall flashcards.
                      </p>
                    </div>

                    <div className="text-left p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#151210] border border-[#E8E2D8] dark:border-[#2C2620] max-h-40 overflow-y-auto scrollbar-none">
                      <span className="text-[10px] font-mono text-[#8C8276] block mb-1">
                        Content Preview:
                      </span>
                      <p className="text-xs font-mono text-[#665D54] dark:text-[#A89E92] leading-relaxed">
                        {currentDoc.contentSnippet}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <FileText className="w-10 h-10 text-[#8C8276]" />
                <h4 className="text-sm font-bold">Select or attach a document</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 rounded-xl bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] text-xs font-bold"
                >
                  + Upload Document
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E8E2D8] dark:border-[#2C2620] bg-white/60 dark:bg-[#151210]/60 flex items-center justify-between text-xs text-[#665D54] dark:text-[#A89E92]">
          <span>Enrolled Subject: {course.name} ({course.code})</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1C1917] text-white dark:bg-white dark:text-black font-semibold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
