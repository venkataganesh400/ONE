import React, { useRef } from 'react';
import { X, Download, Upload, FileJson, RotateCcw, Sparkles, Database, FileText } from 'lucide-react';
import type { StudentWorkspaceData } from '../types/index.ts';
import { generateStudentMarkdownReport, INITIAL_STUDENT_WORKSPACE, SAMPLE_STUDENT_TEMPLATE } from '../utils/workspace.ts';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StudentWorkspaceData;
  onUpdateData: React.Dispatch<React.SetStateAction<StudentWorkspaceData>>;
  onOpenCompressionModal: () => void;
}

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateData,
  onOpenCompressionModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleExportReport = () => {
    const md = generateStudentMarkdownReport(data);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `one-student-summary-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJsonBackup = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `one-student-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.courses)) {
          onUpdateData((prev) => ({
            ...INITIAL_STUDENT_WORKSPACE,
            ...parsed,
            theme: parsed.theme || prev.theme,
          }));
          onClose();
        }
      } catch {
        // Ignore invalid JSON file
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearWorkspace = () => {
    onUpdateData((prev) => ({
      ...INITIAL_STUDENT_WORKSPACE,
      theme: prev.theme,
    }));
    onClose();
  };

  const handleLoadDemoTemplate = () => {
    onUpdateData((prev) => ({
      ...SAMPLE_STUDENT_TEMPLATE,
      theme: prev.theme,
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1C1815] rounded-3xl border border-[#E0D8CB] dark:border-[#383028] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4.5 border-b border-[#EAE3D6] dark:border-[#2C241E] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1C1917] dark:text-[#FAF7F2]">
              Workspace Data &amp; Backups
            </h3>
            <p className="text-[11px] text-[#786C60] dark:text-[#A89E92]">
              Export reports, restore offline backups, and manage local storage
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#786C60] dark:text-[#A89E92] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3 text-xs">
          <button
            type="button"
            onClick={handleExportReport}
            className="w-full p-3 rounded-2xl bg-white dark:bg-[#25201B] border border-[#E0D8CB] dark:border-[#383028] hover:border-[#8A5836] transition flex items-center justify-between text-left shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
              <div>
                <p className="font-semibold text-[#1C1917] dark:text-[#FAF7F2]">Export Academic Markdown Report</p>
                <p className="text-[11px] text-[#786C60] dark:text-[#A89E92]">Download comprehensive semester progress summary (.md)</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
          </button>

          <button
            type="button"
            onClick={handleExportJsonBackup}
            className="w-full p-3 rounded-2xl bg-white dark:bg-[#25201B] border border-[#E0D8CB] dark:border-[#383028] hover:border-[#8A5836] transition flex items-center justify-between text-left shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <FileJson className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
              <div>
                <p className="font-semibold text-[#1C1917] dark:text-[#FAF7F2]">Download Full JSON Backup</p>
                <p className="text-[11px] text-[#786C60] dark:text-[#A89E92]">Portable offline snapshot of all tasks, courses, and wallet data</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3 rounded-2xl bg-white dark:bg-[#25201B] border border-[#E0D8CB] dark:border-[#383028] hover:border-[#8A5836] transition flex items-center justify-between text-left shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
              <div>
                <p className="font-semibold text-[#1C1917] dark:text-[#FAF7F2]">Restore From JSON Backup</p>
                <p className="text-[11px] text-[#786C60] dark:text-[#A89E92]">Import previously exported workspace file</p>
              </div>
            </div>
            <Upload className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportJsonBackup}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCompressionModal();
            }}
            className="w-full p-3 rounded-2xl bg-white dark:bg-[#25201B] border border-[#E0D8CB] dark:border-[#383028] hover:border-[#8A5836] transition flex items-center justify-between text-left shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
              <div>
                <p className="font-semibold text-[#1C1917] dark:text-[#FAF7F2]">Inspect LZ-Compression &amp; Cloud Metrics</p>
                <p className="text-[11px] text-[#786C60] dark:text-[#A89E92]">View Firestore storage optimization ratio</p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
          </button>

          <div className="pt-2 border-t border-[#EAE3D6] dark:border-[#2C241E] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleClearWorkspace}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5 p-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Workspace</span>
            </button>

            <button
              type="button"
              onClick={handleLoadDemoTemplate}
              className="text-xs text-[#8A5836] dark:text-[#D8A775] hover:underline p-1"
            >
              <span>Load Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
