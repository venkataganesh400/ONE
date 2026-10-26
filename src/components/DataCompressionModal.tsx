import React, { useState } from 'react';
import {
  X,
  HardDrive,
  Database,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { User } from 'firebase/auth';
import type { StudentWorkspaceData } from '../types/index.ts';
import {
  compressData,
  decompressData,
  formatBytes,
  inspectEntitySizes,
  CompressionMetrics,
} from '../utils/compression.ts';

interface DataCompressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StudentWorkspaceData;
  onRestoreData: (restored: StudentWorkspaceData) => void;
  metrics: CompressionMetrics | null;
  user: User | null;
  onTriggerSaveToCloud: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: string | null;
}

export const DataCompressionModal: React.FC<DataCompressionModalProps> = ({
  isOpen,
  onClose,
  data,
  onRestoreData,
  metrics,
  user,
  onTriggerSaveToCloud,
  isSyncing,
  lastSyncTime,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStats = metrics || compressData(data).metrics;
  const entityBreakdown = inspectEntitySizes(data);

  const handleDownloadCompressedArchive = () => {
    const { compressed } = compressData(data);
    const archivePayload = {
      version: 1,
      createdAt: new Date().toISOString(),
      user: user?.email || 'guest',
      metrics: currentStats,
      payload: compressed,
    };

    const blob = new Blob([JSON.stringify(archivePayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `one-workspace-compressed-${new Date().toISOString().split('T')[0]}.lz.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCompressedArchive = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        const compressedString = raw.payload || raw.compressedData || raw;
        if (typeof compressedString === 'string') {
          const decompressed = decompressData<StudentWorkspaceData>(compressedString);
          if (decompressed && Array.isArray(decompressed.tasks)) {
            onRestoreData(decompressed);
            onClose();
            return;
          }
        }
        setImportError('Invalid or corrupted compressed file format.');
      } catch (err) {
        setImportError('Failed to parse file: invalid JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyBase64 = () => {
    const { compressed } = compressData(data);
    navigator.clipboard.writeText(compressed).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1A1714] border border-[#E8E2D8] dark:border-[#332C25] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compression-modal-title"
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-[#E8E2D8] dark:border-[#2C2520] flex items-center justify-between bg-[#FAF7F2] dark:bg-[#1E1B18]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] flex items-center justify-center shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 id="compression-modal-title" className="text-base sm:text-lg font-bold text-[#1C1917] dark:text-[#F7F4EE] leading-tight">
                Data Management &amp; LZ Compression
              </h2>
              <p className="text-xs text-[#665D54] dark:text-[#9E9387]">
                Production payload compression &amp; isolated cloud sync
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#665D54] dark:text-[#9E9387] hover:bg-black/5 dark:hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {/* Top Compression Metrics Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FAF7F2] to-[#F3EFE7] dark:from-[#24201C] dark:to-[#1B1815] border border-[#E8E2D8] dark:border-[#38312A]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#665D54] dark:text-[#9E9387] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#C4976A]" />
                LZ-String Compression Engine
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#3C2E25]/10 dark:bg-[#FAF7F2]/10 text-[#3C2E25] dark:text-[#FAF7F2] font-medium">
                {currentStats.compressionFactor} Reduction
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center my-3">
              <div className="p-3 rounded-xl bg-white dark:bg-[#1A1714] border border-[#E8E2D8] dark:border-[#302A24]">
                <div className="text-xs text-[#665D54] dark:text-[#9E9387] mb-0.5">Raw JSON</div>
                <div className="text-lg font-bold font-mono text-[#1C1917] dark:text-[#F7F4EE]">
                  {formatBytes(currentStats.originalBytes)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#1A1714] border border-[#E8E2D8] dark:border-[#302A24]">
                <div className="text-xs text-[#665D54] dark:text-[#9E9387] mb-0.5">Compressed</div>
                <div className="text-lg font-bold font-mono text-[#8A5836] dark:text-[#C4976A]">
                  {formatBytes(currentStats.compressedBytes)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-white dark:text-[#1C1917]">
                <div className="text-xs text-[#E8E2D8] dark:text-[#665D54] mb-0.5">Space Saved</div>
                <div className="text-lg font-extrabold font-mono">
                  {currentStats.ratioPercent}%
                </div>
              </div>
            </div>

            {/* Visual Storage Meter */}
            <div className="space-y-1.5 mt-4">
              <div className="flex justify-between text-xs font-mono text-[#665D54] dark:text-[#9E9387]">
                <span>Payload Footprint</span>
                <span>{currentStats.ratioPercent}% bandwidth saved</span>
              </div>
              <div className="w-full h-3 bg-[#E8E2D8] dark:bg-[#322A23] rounded-full overflow-hidden flex">
                <div
                  className="bg-[#8A5836] dark:bg-[#C4976A] h-full transition-all duration-500 rounded-l-full"
                  style={{ width: `${Math.max(12, 100 - currentStats.ratioPercent)}%` }}
                  title="Compressed Size"
                />
                <div
                  className="bg-[#D6CFC4] dark:bg-[#483E34] h-full transition-all duration-500"
                  style={{ width: `${currentStats.ratioPercent}%` }}
                  title="Eliminated Overhead"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8C7D70] dark:text-[#80766B] pt-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#8A5836] dark:bg-[#C4976A]" /> Transferred Data
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D6CFC4] dark:bg-[#483E34]" /> Saved Network Payload
                </span>
              </div>
            </div>
          </div>

          {/* Individual Data Breakdown */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#665D54] dark:text-[#9E9387] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Individual Entity Footprint
              </h3>
              <span className="text-xs text-[#8C7D70] dark:text-[#80766B] font-mono">
                {entityBreakdown.breakdown.length} Entities Tracked
              </span>
            </div>

            <div className="divide-y divide-[#F0EBE2] dark:divide-[#2A231C] border border-[#E8E2D8] dark:border-[#302A24] rounded-2xl overflow-hidden bg-white dark:bg-[#1A1714]">
              {entityBreakdown.breakdown.map((item) => (
                <div key={item.name} className="px-4 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#1C1917] dark:text-[#F7F4EE]">{item.name}</span>
                    <span className="text-[11px] text-[#8C7D70] dark:text-[#80766B]">({item.count} items)</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[#665D54] dark:text-[#9E9387]">{formatBytes(item.rawBytes)}</span>
                    {item.compressedBytes > 0 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-[#FAF7F2] dark:bg-[#25201B] text-[#8A5836] dark:text-[#C4976A]">
                        {formatBytes(item.compressedBytes)} lz
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cloud Database Integration Info */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#E8E2D8] dark:border-[#322A23] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1917] dark:text-[#F7F4EE]">
                <Database className="w-4 h-4 text-[#8A5836] dark:text-[#C4976A]" />
                <span>Cloud Storage Isolation (Firestore)</span>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                user
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {user ? 'Authenticated User Cloud' : 'Guest Local Mode'}
              </span>
            </div>

            <p className="text-xs text-[#665D54] dark:text-[#9E9387]">
              {user
                ? `Isolated user document path: /users/${user.uid}/workspaces/main_workspace`
                : 'Sign in with Google to synchronize your compressed individual data across any browser or device.'}
            </p>

            {lastSyncTime && (
              <div className="text-[11px] font-mono text-[#8C7D70] dark:text-[#80766B] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Last cloud synchronization: {lastSyncTime}
              </div>
            )}
          </div>

          {importError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs">
              {importError}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-[#E8E2D8] dark:border-[#2C2520] bg-[#FAF7F2] dark:bg-[#1E1B18] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCompressedArchive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] text-xs font-medium text-[#1C1917] dark:text-[#F7F4EE] hover:bg-white dark:hover:bg-[#2A231C] transition"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Export .lz</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D6CFC4] dark:border-[#3C342C] text-xs font-medium text-[#1C1917] dark:text-[#F7F4EE] hover:bg-white dark:hover:bg-[#2A231C] transition cursor-pointer">
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              <span>Restore .lz</span>
              <input
                type="file"
                accept=".json,.lz"
                onChange={handleImportCompressedArchive}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleCopyBase64}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-[#665D54] dark:text-[#9E9387] hover:text-[#1C1917] dark:hover:text-[#F7F4EE] transition"
            >
              <span>{copySuccess ? 'Copied!' : 'Copy Base64'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={onTriggerSaveToCloud}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] text-xs font-semibold hover:opacity-95 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Compressing & Syncing...' : 'Sync to Cloud Now'}</span>
              </button>
            ) : (
              <span className="text-xs text-[#8C7D70] dark:text-[#80766B] flex items-center gap-1">
                <Lock className="w-3 h-3" /> Sign in for Cloud Push
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
