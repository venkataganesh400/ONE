import LZString from 'lz-string';

export interface CompressionMetrics {
  originalBytes: number;
  compressedBytes: number;
  savedBytes: number;
  ratioPercent: number; // e.g. 64% saved
  compressionFactor: string; // e.g. 2.8x
  algorithm: 'LZ-String (Base64 UTF-16)';
  timestamp: string;
}

export interface CompressedPayload<T> {
  compressed: string;
  metrics: CompressionMetrics;
  schemaVersion: number;
  entityCount: {
    tasks: number;
    expenses: number;
    courses: number;
    notes: number;
    sessions: number;
  };
}

/**
 * Format raw byte size into human readable string (B, KB, MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compresses any serializable object using LZ-String Base64 compression
 * Calculates precise byte savings and compression factors
 */
export function compressData<T>(data: T): { compressed: string; metrics: CompressionMetrics } {
  const jsonString = JSON.stringify(data);
  const originalBytes = new TextEncoder().encode(jsonString).length;

  const compressed = LZString.compressToBase64(jsonString) || '';
  const compressedBytes = new TextEncoder().encode(compressed).length;

  const savedBytes = Math.max(0, originalBytes - compressedBytes);
  const ratioPercent = originalBytes > 0 ? Math.round((savedBytes / originalBytes) * 100) : 0;
  const compressionFactor = compressedBytes > 0 ? (originalBytes / compressedBytes).toFixed(1) + 'x' : '1.0x';

  return {
    compressed,
    metrics: {
      originalBytes,
      compressedBytes,
      savedBytes,
      ratioPercent,
      compressionFactor,
      algorithm: 'LZ-String (Base64 UTF-16)',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Decompresses an LZ-String Base64 string back into the original typed object
 */
export function decompressData<T>(compressed: string): T | null {
  if (!compressed) return null;
  try {
    const decompressedJson = LZString.decompressFromBase64(compressed);
    if (!decompressedJson) return null;
    return JSON.parse(decompressedJson) as T;
  } catch (err) {
    console.error('Failed to decompress data payload:', err);
    return null;
  }
}

/**
 * Inspect individual data management breakdown (how much space tasks, expenses, notes occupy)
 */
export function inspectEntitySizes(data: {
  tasks?: unknown[];
  expenses?: unknown[];
  notes?: unknown[];
  courses?: unknown[];
  scheduleBlocks?: unknown[];
}) {
  const countBytes = (obj: unknown) => new TextEncoder().encode(JSON.stringify(obj ?? [])).length;

  const tasksBytes = countBytes(data.tasks);
  const expensesBytes = countBytes(data.expenses);
  const notesBytes = countBytes(data.notes);
  const coursesBytes = countBytes(data.courses);
  const scheduleBytes = countBytes(data.scheduleBlocks);
  const totalRaw = tasksBytes + expensesBytes + notesBytes + coursesBytes + scheduleBytes;

  const compressedTasks = LZString.compressToBase64(JSON.stringify(data.tasks ?? []));
  const compressedExpenses = LZString.compressToBase64(JSON.stringify(data.expenses ?? []));
  const compressedNotes = LZString.compressToBase64(JSON.stringify(data.notes ?? []));

  return {
    breakdown: [
      { name: 'To-Do Tasks', count: data.tasks?.length ?? 0, rawBytes: tasksBytes, compressedBytes: new TextEncoder().encode(compressedTasks).length },
      { name: 'Expenses Ledger', count: data.expenses?.length ?? 0, rawBytes: expensesBytes, compressedBytes: new TextEncoder().encode(compressedExpenses).length },
      { name: 'Study Notes & Flashcards', count: data.notes?.length ?? 0, rawBytes: notesBytes, compressedBytes: new TextEncoder().encode(compressedNotes).length },
      { name: 'Courses & Syllabus', count: data.courses?.length ?? 0, rawBytes: coursesBytes, compressedBytes: 0 },
      { name: 'Time-Block Schedule', count: data.scheduleBlocks?.length ?? 0, rawBytes: scheduleBytes, compressedBytes: 0 },
    ],
    totalRawBytes: totalRaw,
  };
}
