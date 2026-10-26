import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 right-6 z-50 flex items-center gap-2 rounded-full glossy-dock border border-zinc-300/80 dark:border-white/15 px-4 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
    >
      <WifiOff className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
      <span>Offline Mode · Cached</span>
    </div>
  );
};
