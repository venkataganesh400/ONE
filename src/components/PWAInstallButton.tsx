import React, { useState } from 'react';
import { Download, Check, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { AndroidInstallModal } from './AndroidInstallModal.tsx';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowAndroidModal(true);
    }
  };

  if (isInstalled) {
    if (compact) return null;
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>Android Standalone Active</span>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className="flex items-center gap-1.5 rounded-xl border border-[#D8A775]/50 bg-gradient-to-r from-[#FAF7F2] to-[#F2EDE4] dark:from-[#25201B] dark:to-[#1C1713] text-[#3C2E25] dark:text-[#FAF7F2] hover:border-[#8A5836] transition active:scale-95 disabled:opacity-50 px-2.5 sm:px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 shadow-2xs"
        aria-label="Install One as Android Standalone App"
        title="Install as Android Standalone App or Download .APK"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
        <span>{isInstalling ? 'Installing...' : 'Android App'}</span>
      </button>

      <AndroidInstallModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
      />
    </>
  );
};
