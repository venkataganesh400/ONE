import React, { useState } from 'react';
import { Download, Share, X, Check, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled) {
    if (compact) return null;
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400">
        <Check className="w-3.5 h-3.5" />
        <span>Installed</span>
      </span>
    );
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={async () => {
          setIsInstalling(true);
          try {
            await install();
          } finally {
            setIsInstalling(false);
          }
        }}
        disabled={isInstalling}
        className="flex items-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition active:scale-95 disabled:opacity-50 px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0"
        aria-label="Install One App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition active:scale-95 px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0"
        aria-label="Install One App"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white">
                  {isIOS ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </div>
                <h3 className="text-sm font-bold">
                  {isIOS ? 'Install on iPhone / iPad' : 'Install One Student PWA'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                aria-label="Close install instructions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80">
                    <span className="font-mono text-zinc-500 font-bold">01</span>
                    <p>Tap <strong className="text-zinc-900 dark:text-white inline-flex items-center gap-1"><Share className="w-3 h-3" /> Share</strong> in Safari toolbar.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80">
                    <span className="font-mono text-zinc-500 font-bold">02</span>
                    <p>Scroll down and select <strong className="text-zinc-900 dark:text-white">Add to Home Screen</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80">
                    <span className="font-mono text-zinc-500 font-bold">03</span>
                    <p>Launch One as a full-screen student app with offline study caching.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80">
                    <span className="font-mono text-zinc-500 font-bold">01</span>
                    <p>On Chrome or Edge: Click the <strong className="text-zinc-900 dark:text-white">Install</strong> icon in the address bar.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80">
                    <span className="font-mono text-zinc-500 font-bold">02</span>
                    <p>On mobile browser: Open menu <strong className="text-zinc-900 dark:text-white">(⋮)</strong> and tap <strong className="text-zinc-900 dark:text-white">Install app</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80">
                    <span className="font-mono text-zinc-500 font-bold">03</span>
                    <p>Works 100% offline in libraries, lecture halls, or transit.</p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black py-2.5 text-xs font-semibold hover:opacity-90 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
