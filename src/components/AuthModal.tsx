import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignInWithGoogle: () => Promise<void>;
  onSignUpWithEmail: (email: string, pass: string, name?: string) => Promise<boolean>;
  onSignInWithEmail: (email: string, pass: string) => Promise<boolean>;
  onSignInWithStudentProfile: (name: string, email?: string) => Promise<boolean>;
  onSignInAsGuest: () => Promise<void>;
  isSigningIn: boolean;
  authError: string | null;
  onClearError: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignInWithGoogle,
  onSignUpWithEmail,
  onSignInWithEmail,
  onSignInWithStudentProfile,
  onSignInAsGuest,
  isSigningIn,
  authError,
  onClearError,
}) => {
  const [tab, setTab] = useState<'student' | 'google' | 'email'>('student');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [studentName, setStudentName] = useState('Venkata Ganesh');
  const [studentEmail, setStudentEmail] = useState('venkataganeshdulla9@gmail.com');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localValidation, setLocalValidation] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStudentProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);
    onClearError();

    if (!studentName.trim()) {
      setLocalValidation('Please enter your full name or student handle.');
      return;
    }

    const ok = await onSignInWithStudentProfile(studentName, studentEmail);
    if (ok) {
      onClose();
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
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

    if (emailMode === 'signup') {
      const ok = await onSignUpWithEmail(email, password, displayName);
      if (ok) onClose();
    } else {
      const ok = await onSignInWithEmail(email, password);
      if (ok) onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    onClearError();
    setLocalValidation(null);
    try {
      await onSignInWithGoogle();
      onClose();
    } catch {
      // Handled via authError in hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1C1815] rounded-3xl border border-[#E0D8CB] dark:border-[#383028] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-[#EAE3D6] dark:border-[#2C241E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-bold text-sm flex items-center justify-center shadow-xs">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                Sign In to One Workspace
              </h3>
              <p className="text-[11px] text-[#786C60] dark:text-[#A89E92]">
                Instant student profile, cloud backup &amp; sync
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

        {/* Auth Method Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex items-center gap-1.5 border-b border-[#EAE3D6] dark:border-[#2C241E] pb-3 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setTab('student');
              onClearError();
              setLocalValidation(null);
            }}
            className={`whitespace-nowrap shrink-0 sm:flex-1 py-1.5 px-3 rounded-xl text-[11px] sm:text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 ${
              tab === 'student'
                ? 'bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] shadow-xs'
                : 'bg-white/70 dark:bg-[#25201B] text-[#786C60] dark:text-[#A89E92] hover:bg-white dark:hover:bg-[#2E2822]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Instant Profile</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('google');
              onClearError();
              setLocalValidation(null);
            }}
            className={`whitespace-nowrap shrink-0 sm:flex-1 py-1.5 px-3 rounded-xl text-[11px] sm:text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 ${
              tab === 'google'
                ? 'bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] shadow-xs'
                : 'bg-white/70 dark:bg-[#25201B] text-[#786C60] dark:text-[#A89E92] hover:bg-white dark:hover:bg-[#2E2822]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google OAuth</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('email');
              onClearError();
              setLocalValidation(null);
            }}
            className={`whitespace-nowrap shrink-0 sm:flex-1 py-1.5 px-3 rounded-xl text-[11px] sm:text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 ${
              tab === 'email'
                ? 'bg-[#3C2E25] text-white dark:bg-[#FAF7F2] dark:text-[#1C1917] shadow-xs'
                : 'bg-white/70 dark:bg-[#25201B] text-[#786C60] dark:text-[#A89E92] hover:bg-white dark:hover:bg-[#2E2822]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh] scrollbar-none">
          {/* Error Banner */}
          {(authError || localValidation) && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="text-[11px] leading-relaxed">
                {localValidation || authError}
                {authError?.includes('OAuth') && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab('student');
                      onClearError();
                    }}
                    className="block mt-1 font-semibold text-[#8A5836] dark:text-[#D8A775] underline"
                  >
                    Click here to Sign In with Instant Student Profile instead
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: Instant Student Profile Sign-In (Zero OAuth wait) */}
          {tab === 'student' && (
            <form onSubmit={handleStudentProfileSubmit} className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#231E19] border border-[#E0D8CB] dark:border-[#383028] space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
                  No OAuth Wait Required
                </span>
                <p className="text-[11px] text-[#786C60] dark:text-[#A89E92] leading-relaxed">
                  Sign in immediately with your student name and email. Your timetable, tasks, and notes will persist locally and sync seamlessly.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#5E5347] dark:text-[#B5AAA0] mb-1">
                  Full Name / Preferred Handle *
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9C9083]" />
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Venkata Ganesh"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-white dark:bg-[#25201B] text-[#1C1917] dark:text-[#FAF7F2] text-xs focus:ring-1 focus:ring-[#8A5836] focus:outline-none scrollbar-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#5E5347] dark:text-[#B5AAA0] mb-1">
                  Student Email / College ID (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9C9083]" />
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-white dark:bg-[#25201B] text-[#1C1917] dark:text-[#FAF7F2] text-xs focus:ring-1 focus:ring-[#8A5836] focus:outline-none scrollbar-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full py-2.5 rounded-2xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                <span>{isSigningIn ? 'Setting up Profile...' : 'Sign In as Student'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* TAB 2: Google Sign-In */}
          {tab === 'google' && (
            <div className="space-y-3">
              <p className="text-[11px] text-[#786C60] dark:text-[#A89E92] leading-relaxed">
                Connect your Google Account. Note: If your current hosting domain is awaiting Google Cloud OAuth verification, you can use the Instant Profile tab instead.
              </p>

              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleSignIn}
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
                <span>Continue with Google OAuth</span>
              </button>
            </div>
          )}

          {/* TAB 3: Traditional Email / Password Form */}
          {tab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {emailMode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-medium text-[#5E5347] dark:text-[#B5AAA0] mb-1">
                    Full Name / Handle
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9C9083]" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-white dark:bg-[#25201B] text-[#1C1917] dark:text-[#FAF7F2] text-xs focus:ring-1 focus:ring-[#8A5836] focus:outline-none scrollbar-none"
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
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-white dark:bg-[#25201B] text-[#1C1917] dark:text-[#FAF7F2] text-xs focus:ring-1 focus:ring-[#8A5836] focus:outline-none scrollbar-none"
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
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DED7CA] dark:border-[#3E352B] bg-white dark:bg-[#25201B] text-[#1C1917] dark:text-[#FAF7F2] text-xs focus:ring-1 focus:ring-[#8A5836] focus:outline-none scrollbar-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full py-2.5 rounded-2xl bg-[#3C2E25] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1C1917] font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                <span>{isSigningIn ? 'Processing...' : emailMode === 'signin' ? 'Sign In with Email' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-1 text-center text-[11px] text-[#786C60] dark:text-[#A89E92]">
                {emailMode === 'signin' ? (
                  <p>
                    Don&apos;t have an email login yet?{' '}
                    <button
                      type="button"
                      onClick={() => setEmailMode('signup')}
                      className="font-semibold text-[#8A5836] dark:text-[#D8A775] hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setEmailMode('signin')}
                      className="font-semibold text-[#8A5836] dark:text-[#D8A775] hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </form>
          )}

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
              <span>Continue in Offline Guest Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
