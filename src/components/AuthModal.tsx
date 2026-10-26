import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { User } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignInWithGoogle: () => Promise<void>;
  onSignUpWithEmail: (email: string, pass: string, name?: string) => Promise<boolean>;
  onSignInWithEmail: (email: string, pass: string) => Promise<boolean>;
  onSignInAsGuest: () => Promise<void>;
  isSigningIn: boolean;
  authError: string | null;
  onClearError: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignInWithGoogle,
  onSignUpWithEmail,
  onSignInWithEmail,
  onSignInAsGuest,
  isSigningIn,
  authError,
  onClearError,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localValidation, setLocalValidation] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);
    onClearError();

    if (!email || !email.includes('@')) {
      setLocalValidation('Please enter a valid university or personal email.');
      return;
    }
    if (password.length < 6) {
      setLocalValidation('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      const ok = await onSignUpWithEmail(email, password, displayName);
      if (ok) onClose();
    } else {
      const ok = await onSignInWithEmail(email, password);
      if (ok) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1C1815] rounded-3xl border border-[#E0D8CB] dark:border-[#383028] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#EAE3D6] dark:border-[#2C241E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-bold text-sm flex items-center justify-center shadow-xs">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                {mode === 'signin' ? 'Sign In to One' : 'Create Student Account'}
              </h3>
              <p className="text-[11px] text-[#786C60] dark:text-[#A89E92]">
                Cloud persistence &amp; LZ-compressed sync
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#786C60] dark:text-[#A89E92] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Quick Google Sign In */}
          <button
            type="button"
            disabled={isSigningIn}
            onClick={async () => {
              onClearError();
              await onSignInWithGoogle();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-[#25201B] border border-[#DED7CA] dark:border-[#3E352B] font-semibold text-[#1C1917] dark:text-[#FAF7F2] hover:bg-[#F5EFE6] dark:hover:bg-[#2E2822] transition flex items-center justify-center gap-2 shadow-2xs disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-[#EAE3D6] dark:border-[#2C241E] w-full" />
            <span className="bg-[#FAF7F2] dark:bg-[#1C1815] px-3 text-[10px] uppercase font-mono tracking-wider text-[#9C9083]">
              or with email
            </span>
          </div>

          {/* Error Banner */}
          {(authError || localValidation) && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="text-[11px] leading-relaxed">
                {localValidation || authError}
              </div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-medium text-[#5E5347] dark:text-[#B5AAA0] mb-1">
                  Full Name / Preferred Handle
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9C9083]" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-white dark:bg-[#25201B] text-[#1C1917] dark:text-[#FAF7F2] text-xs focus:ring-1 focus:ring-[#8A5836] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[#5E5347] dark:text-[#B5AAA0] mb-1">
                Student Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9C9083]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-white dark:bg-[#25201B] text-[#1C1917] dark:text-[#FAF7F2] text-xs focus:ring-1 focus:ring-[#8A5836] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#5E5347] dark:text-[#B5AAA0] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9C9083]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-white dark:bg-[#25201B] text-[#1C1917] dark:text-[#FAF7F2] text-xs focus:ring-1 focus:ring-[#8A5836] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full py-2.5 rounded-2xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              <span>{isSigningIn ? 'Processing...' : mode === 'signin' ? 'Sign In with Email' : 'Create My Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle Signin / Signup */}
          <div className="pt-2 text-center text-[11px] text-[#786C60] dark:text-[#A89E92]">
            {mode === 'signin' ? (
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    onClearError();
                    setLocalValidation(null);
                  }}
                  className="font-semibold text-[#8A5836] dark:text-[#D8A775] hover:underline"
                >
                  Sign up free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    onClearError();
                    setLocalValidation(null);
                  }}
                  className="font-semibold text-[#8A5836] dark:text-[#D8A775] hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Guest Mode Fallback */}
          <div className="pt-3 border-t border-[#EAE3D6] dark:border-[#2C241E]">
            <button
              type="button"
              disabled={isSigningIn}
              onClick={async () => {
                onClearError();
                await onSignInAsGuest();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border border-dashed border-[#DED7CA] dark:border-[#3E352B] text-[#786C60] dark:text-[#A89E92] font-medium transition text-[11px] flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#8A5836] dark:text-[#D8A775]" />
              <span>Continue as Anonymous / Guest Student</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
