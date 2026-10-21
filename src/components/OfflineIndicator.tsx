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
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-zinc-900/95 text-zinc-200 border border-zinc-700 px-4 py-2 shadow-2xl backdrop-blur-md text-xs font-mono"
    >
      <WifiOff className="w-3.5 h-3.5 text-zinc-400" />
      <span>Offline Mode · Cached</span>
    </div>
  );
};
