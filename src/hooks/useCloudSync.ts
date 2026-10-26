import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase.ts';
import { compressData, decompressData, CompressionMetrics } from '../utils/compression.ts';
import type { StudentWorkspaceData } from '../types/index.ts';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface UseCloudSyncReturn {
  syncStatus: SyncStatus;
  lastSyncTime: string | null;
  metrics: CompressionMetrics | null;
  saveToCloud: (data: StudentWorkspaceData) => Promise<void>;
  isCloudConnected: boolean;
  syncError: string | null;
}

export function useCloudSync(
  user: User | null,
  currentData: StudentWorkspaceData,
  onRemoteDataReceived: (remoteData: StudentWorkspaceData) => void
): UseCloudSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<CompressionMetrics | null>(() => {
    try {
      const { metrics: initialMetrics } = compressData(currentData);
      return initialMetrics;
    } catch {
      return null;
    }
  });
  const [syncError, setSyncError] = useState<string | null>(null);

  // Keep a ref of the last saved string to avoid infinite snapshot sync loops
  const lastSavedCompressedRef = useRef<string>('');
  const isInitialSnapshotRef = useRef<boolean>(true);
  const debounceTimerRef = useRef<number | null>(null);

  // Subscribe to real-time Firestore updates when logged in
  useEffect(() => {
    if (!user || user.isAnonymous) {
      setSyncStatus('idle');
      return;
    }

    const docRef = doc(db, 'users', user.uid, 'workspaces', 'main_workspace');
    isInitialSnapshotRef.current = true;

    setSyncStatus('syncing');

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // No cloud document yet; trigger initial upload with compression
          setSyncStatus('idle');
          return;
        }

        const data = snapshot.data();
        const compressed = data?.compressedData;

        if (compressed && compressed !== lastSavedCompressedRef.current) {
          lastSavedCompressedRef.current = compressed;
          const decompressed = decompressData<StudentWorkspaceData>(compressed);
          if (decompressed) {
            onRemoteDataReceived(decompressed);
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            setSyncStatus('synced');
            if (data.metrics) {
              setMetrics(data.metrics);
            }
          }
        } else {
          setSyncStatus('synced');
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/workspaces/main_workspace`);
        const msg = error.message || '';
        const isOffline =
          msg.includes('offline') ||
          msg.includes('Could not reach') ||
          msg.includes('token-service-api');
        setSyncStatus(isOffline ? 'offline' : 'error');
        setSyncError(isOffline ? 'Operating offline: workspace preserved locally with compression' : error.message);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // Push local updates with compression to Firestore (debounced)
  const saveToCloud = useCallback(
    async (data: StudentWorkspaceData) => {
      if (!user || user.isAnonymous) {
        // If not logged in or in guest mode, compute local compression metrics
        try {
          const { metrics: localMetrics } = compressData(data);
          setMetrics(localMetrics);
        } catch {
          // ignore
        }
        return;
      }

      setSyncStatus('syncing');
      setSyncError(null);

      try {
        const { compressed, metrics: newMetrics } = compressData(data);
        lastSavedCompressedRef.current = compressed;
        setMetrics(newMetrics);

        const docRef = doc(db, 'users', user.uid, 'workspaces', 'main_workspace');
        await setDoc(
          docRef,
          {
            userId: user.uid,
            workspaceId: 'main_workspace',
            compressedData: compressed,
            metrics: newMetrics,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Cloud sync failed';
        const isOffline =
          msg.includes('offline') ||
          msg.includes('Could not reach') ||
          msg.includes('token-service-api');

        if (isOffline) {
          setSyncStatus('offline');
          setSyncError('Operating offline: workspace preserved locally with compression');
        } else {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/workspaces/main_workspace`);
          setSyncStatus('error');
          setSyncError(msg);
        }
      }
    },
    [user]
  );

  // Auto-sync debounce effect when workspace data changes and user is signed in
  useEffect(() => {
    if (!user || user.isAnonymous) {
      // Keep local compression metrics fresh even in guest mode
      try {
        const { metrics: m } = compressData(currentData);
        setMetrics(m);
      } catch {
        // ignore
      }
      return;
    }

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      saveToCloud(currentData);
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentData, user, saveToCloud]);

  return {
    syncStatus,
    lastSyncTime,
    metrics,
    saveToCloud,
    isCloudConnected: !!user,
    syncError,
  };
}
