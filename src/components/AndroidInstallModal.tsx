import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [activeTab, setActiveTab] = useState<'standalone' | 'apk' | 'cli'>('standalone');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://venkataganesh400.github.io/ONE/';
  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`;

  const cliSnippet = `# 1. Generate full Android APK project via Bubblewrap CLI
npx @bubblewrap/cli init --manifest="${currentUrl}manifest.webmanifest"

# 2. Build signed Android APK package (.apk)
npx @bubblewrap/cli build

# Output: app-release-signed.apk ready to sideload or publish!`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliSnippet);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2500);
  };

  const handleTriggerInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="android-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1714] border border-[#E0D8CB] dark:border-[#383028] shadow-2xl text-[#1C1917] dark:text-[#FAF7F2] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D8] dark:border-[#2C2620] bg-white/70 dark:bg-[#151210]/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#EAE4D9] dark:bg-[#28221D] font-bold text-[#8A5836] dark:text-[#D8A775]">
                  Android Standalone
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>WebAPK &amp; APK Ready</span>
                </span>
              </div>
              <h2 id="android-modal-title" className="text-base sm:text-lg font-bold tracking-tight">
                Install as Android App (Not Chrome Webpage)
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#665D54] dark:text-[#A89E92] transition"
            aria-label="Close Android install modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-6 pt-4 pb-2 flex gap-2 border-b border-[#E8E2D8] dark:border-[#2C2620] bg-white/40 dark:bg-black/20 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('standalone')}
            className={`py-2 px-3 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'standalone'
                ? 'bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] shadow-xs'
                : 'text-[#665D54] dark:text-[#A89E92] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Standalone WebAPK (Recommended)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-3 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] shadow-xs'
                : 'text-[#665D54] dark:text-[#A89E92] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>2. Direct .APK File Builder</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cli')}
            className={`py-2 px-3 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'cli'
                ? 'bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] shadow-xs'
                : 'text-[#665D54] dark:text-[#A89E92] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>3. Developer CLI Build</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Why it opened in Chrome explanation banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Why Did It Open In Chrome Before?</span>
            </div>
            <p className="leading-relaxed">
              If you tapped <strong className="font-semibold">&quot;Add to Home screen&quot;</strong> as a browser shortcut bookmark, Android opened it inside a Chrome tab. To run as a <strong>real standalone Android app with zero Chrome address bar and standalone task switching</strong>, follow the verified methods below:
            </p>
          </div>

          {/* Tab 1: Standalone WebAPK */}
          {activeTab === 'standalone' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#201C18] border border-[#E0D8CB] dark:border-[#383028] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#8A5836] dark:text-[#D8A775] uppercase">
                    Native WebAPK Minting
                  </span>
                  {isInstalled ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>App Installed in OS</span>
                    </span>
                  ) : null}
                </div>

                <p className="text-xs sm:text-sm text-[#3C2E25] dark:text-[#E8E2D8] leading-relaxed">
                  When you trigger <strong>Install</strong> below, Android compiles a dedicated native APK in the background and registers it with the Android Application Manager. It will launch with its own icon in your <strong>Android App Drawer</strong> with full offline caching and no browser controls.
                </p>

                {isInstallable ? (
                  <button
                    type="button"
                    onClick={handleTriggerInstall}
                    disabled={isInstalling}
                    className="w-full py-3 px-5 rounded-2xl bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] text-xs sm:text-sm font-bold hover:opacity-90 transition active:scale-98 shadow-md flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isInstalling ? 'Minting Android WebAPK...' : 'Install Standalone Android App Now'}</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#181512] border border-[#E8E2D8] dark:border-[#2C2620] text-xs text-[#665D54] dark:text-[#A89E92] space-y-1">
                    <p className="font-semibold text-[#1C1917] dark:text-[#FAF7F2]">
                      Manual Android Installation Steps:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 pt-1 leading-relaxed">
                      <li>Open Chrome menu <strong className="text-[#1C1917] dark:text-[#FAF7F2]">(⋮ three dots)</strong> in the top-right corner.</li>
                      <li>Select <strong className="text-[#1C1917] dark:text-[#FAF7F2]">&quot;Install app&quot;</strong> (NOT &quot;Add to Home screen bookmark&quot;).</li>
                      <li>Confirm <strong className="text-[#1C1917] dark:text-[#FAF7F2]">&quot;Install&quot;</strong> on the native prompt.</li>
                      <li><strong>Important:</strong> Close Chrome and open <strong>One</strong> from your phone&apos;s <strong>App Drawer</strong>. It opens in its own isolated window!</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-[#201C18]/60 border border-[#E8E2D8] dark:border-[#2C2620] space-y-2 text-xs">
                <span className="font-bold text-[#1C1917] dark:text-[#FAF7F2] block">
                  Standalone App Verification Checklist:
                </span>
                <div className="space-y-1.5 text-[#5C5248] dark:text-[#B5AAA0]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>No browser URL bar, reload buttons, or Chrome tabs visible.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Appears as an independent application in the Android Recent Apps / Multitask switcher.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Works 100% offline with LZ-compressed local storage.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Direct .APK Package Generator via PWABuilder */}
          {activeTab === 'apk' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#201C18] border border-[#E0D8CB] dark:border-[#383028] shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
                  <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                    Download Direct Signed .APK File (No Chrome Needed)
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[#3C2E25] dark:text-[#E8E2D8] leading-relaxed">
                  If you want a real, downloadable <strong>.apk installer file</strong> that you can save to your phone and install directly without using Chrome browser menus, use <strong>PWABuilder</strong> (Microsoft-backed open-source APK packaging tool).
                </p>

                <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#181512] border border-[#E8E2D8] dark:border-[#2C2620] space-y-2 text-xs text-[#5C5248] dark:text-[#B5AAA0]">
                  <strong className="text-[#1C1917] dark:text-[#FAF7F2] block">
                    3 Easy Steps to Generate Your .APK:
                  </strong>
                  <div className="space-y-1.5 pl-1 leading-relaxed">
                    <p><strong>Step 1:</strong> Click the button below to open PWABuilder with this app pre-analyzed.</p>
                    <p><strong>Step 2:</strong> Click <span className="font-mono bg-white dark:bg-[#2C2620] px-1.5 py-0.5 rounded border border-[#E0D8CB] dark:border-[#383028]">Package for Android</span> and choose <span className="font-semibold">Download APK</span>.</p>
                    <p><strong>Step 3:</strong> Open the downloaded <span className="font-mono">app-release.apk</span> on your Android phone, allow &quot;Install from this source&quot; in Android Settings, and tap <span className="font-semibold">Install</span>.</p>
                  </div>
                </div>

                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-5 rounded-2xl bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] text-xs sm:text-sm font-bold hover:opacity-90 transition active:scale-98 shadow-md flex items-center justify-center gap-2 inline-flex"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Generate &amp; Download .APK on PWABuilder</span>
                </a>
              </div>
            </div>
          )}

          {/* Tab 3: CLI Instructions for Bubblewrap */}
          {activeTab === 'cli' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#201C18] border border-[#E0D8CB] dark:border-[#383028] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#8A5836] dark:text-[#D8A775]" />
                    <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                      Build Native APK with Google&apos;s Bubblewrap CLI
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCli}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D6CFC4] dark:border-[#383028] text-xs font-mono hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    {copiedCli ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Commands</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#5C5248] dark:text-[#B5AAA0] leading-relaxed">
                  Developers can compile a production signed APK or Google Play Android App Bundle (AAB) directly using Google&apos;s official Bubblewrap CLI tool:
                </p>

                <pre className="p-4 rounded-xl bg-[#151210] text-[#FAF7F2] font-mono text-xs overflow-x-auto leading-relaxed border border-[#383028]">
                  {cliSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E2D8] dark:border-[#2C2620] bg-white/70 dark:bg-[#151210]/70 flex items-center justify-between text-xs text-[#665D54] dark:text-[#A89E92]">
          <span>App identifier: <strong className="font-mono text-[#1C1917] dark:text-[#FAF7F2]">One Student Workspace</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1C1917] text-white dark:bg-white dark:text-black font-bold text-xs hover:opacity-90 transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
