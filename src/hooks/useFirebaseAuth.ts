import { useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../utils/firebase.ts';

const STUDENT_PROFILE_STORAGE_KEY = 'one_student_profile_session';

export interface StudentAuthProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
  providerData: Array<{
    providerId: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    uid: string;
    phoneNumber: string | null;
  }>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

export interface UseFirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  isSigningIn: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<boolean>;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signInWithStudentProfile: (name: string, email?: string) => Promise<boolean>;
  signInAsGuestStudent: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

function createLocalStudentUser(name: string, email?: string): User {
  const cleanName = name.trim() || 'Student User';
  const cleanEmail = email?.trim() || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@workspace.local`;
  let uid = '';
  try {
    uid = localStorage.getItem('one_student_uid') || '';
    if (!uid) {
      uid = `student_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem('one_student_uid', uid);
    }
  } catch {
    uid = `student_${Date.now()}`;
  }

  const userObj: any = {
    uid,
    displayName: cleanName,
    email: cleanEmail,
    photoURL: '',
    isAnonymous: false,
    emailVerified: true,
    phoneNumber: null,
    tenantId: null,
    providerId: 'student_profile',
    providerData: [
      {
        providerId: 'student_profile',
        uid,
        displayName: cleanName,
        email: cleanEmail,
        photoURL: null,
        phoneNumber: null,
      },
    ],
    getIdToken: async () => `local-student-token-${uid}`,
    getIdTokenResult: async () => ({ token: `local-student-token-${uid}`, claims: {}, authTime: '0', issuedAtTime: '0', expirationTime: '0', signInProvider: 'student_profile', signInSecondFactor: null }),
    reload: async () => {},
    delete: async () => {},
    toJSON: () => ({ uid, displayName: cleanName, email: cleanEmail }),
  };

  return userObj as User;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isSigningInRef = useRef<boolean>(false);

  const clearError = () => setError(null);

  // Restore local student session on mount if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STUDENT_PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.displayName) {
          const localUser = createLocalStudentUser(parsed.displayName, parsed.email);
          setUser(localUser);
        }
      }
    } catch {
      // Local storage unreadable
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Handle edge cases where anonymous or un-provisioned sessions reside in browser IndexedDB
      if (currentUser) {
        if (currentUser.isAnonymous) {
          console.warn('[Auth] Anonymous session detected. Clearing unsupported session.');
          await signOut(auth).catch(() => {});
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          // Verify that this token can be safely obtained from token service without throwing
          await currentUser.getIdToken(false);
        } catch (tokenErr: unknown) {
          const msg = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
          if (msg.includes('token-service-api') || msg.includes('disabled')) {
            console.warn('[Auth] Token Service API pending propagation or disabled. Resetting session to offline.');
            await signOut(auth).catch(() => {});
            // Keep local student profile if one exists
            try {
              const stored = localStorage.getItem(STUDENT_PROFILE_STORAGE_KEY);
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.displayName) {
                  setUser(createLocalStudentUser(parsed.displayName, parsed.email));
                  setLoading(false);
                  return;
                }
              }
            } catch {}
            setUser(null);
            setLoading(false);
            return;
          }
        }
        setUser(currentUser);
      } else {
        // If Firebase has no user, check local student profile
        try {
          const stored = localStorage.getItem(STUDENT_PROFILE_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.displayName) {
              setUser(createLocalStudentUser(parsed.displayName, parsed.email));
            }
          }
        } catch {}
      }

      setLoading(false);

      if (currentUser && !currentUser.isAnonymous) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userDocRef,
            {
              id: currentUser.uid,
              email: currentUser.email || `student_${currentUser.uid.slice(0, 6)}@workspace.local`,
              displayName: currentUser.displayName || 'Student',
              photoURL: currentUser.photoURL || '',
              isAnonymous: false,
              lastLoginAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('token-service-api') || msg.includes('offline') || msg.includes('Could not reach')) {
            console.warn('[Auth Profile Sync] Cloud sync will resume once connected:', msg);
          } else {
            handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithStudentProfile = async (name: string, email?: string): Promise<boolean> => {
    if (isSigningInRef.current) return false;
    isSigningInRef.current = true;
    setIsSigningIn(true);
    setError(null);

    try {
      const cleanName = name.trim();
      if (!cleanName) {
        setError('Please enter your name or student handle.');
        return false;
      }

      const localUser = createLocalStudentUser(cleanName, email);
      setUser(localUser);

      try {
        localStorage.setItem(
          STUDENT_PROFILE_STORAGE_KEY,
          JSON.stringify({ displayName: cleanName, email: email?.trim() || '' })
        );
      } catch {}

      // Attempt optional cloud profile registration if Firestore is available
      try {
        const userDocRef = doc(db, 'users', localUser.uid);
        await setDoc(
          userDocRef,
          {
            id: localUser.uid,
            email: localUser.email,
            displayName: localUser.displayName,
            photoURL: '',
            isAnonymous: false,
            lastLoginAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('[Student Sign-In] Saved profile locally (Cloud sync will persist once online).');
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in student profile';
      setError(msg);
      return false;
    } finally {
      isSigningInRef.current = false;
      setIsSigningIn(false);
    }
  };

  const signInWithGoogle = async () => {
    if (isSigningInRef.current) return;
    isSigningInRef.current = true;
    setIsSigningIn(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setUser(result.user);
        try {
          localStorage.removeItem(STUDENT_PROFILE_STORAGE_KEY);
        } catch {}
      }
    } catch (err: unknown) {
      const isFirebaseError = typeof err === 'object' && err !== null && 'code' in err;
      const errorCode = isFirebaseError ? String((err as { code: string }).code) : '';

      if (
        errorCode === 'auth/cancelled-popup-request' ||
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/user-cancelled'
      ) {
        return;
      }

      if (errorCode === 'auth/popup-blocked') {
        setError('Google sign-in popup was blocked. Please enable popups or use instant Student Sign-In below.');
        return;
      }

      if (errorCode === 'auth/unauthorized-domain') {
        setError('Google OAuth is awaiting domain authorization. Use Instant Student Sign-In below without waiting for OAuth.');
        return;
      }

      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      console.warn('Google sign-in error:', errorCode, msg);
      setError(msg);
    } finally {
      isSigningInRef.current = false;
      setIsSigningIn(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string): Promise<boolean> => {
    if (isSigningInRef.current) return false;
    isSigningInRef.current = true;
    setIsSigningIn(true);
    setError(null);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name && cred.user) {
        try {
          await updateProfile(cred.user, { displayName: name.trim() });
        } catch {}
      }
      return true;
    } catch (err: unknown) {
      const isFirebaseError = typeof err === 'object' && err !== null && 'code' in err;
      const errorCode = isFirebaseError ? String((err as { code: string }).code) : '';

      // Graceful fallback to student profile if email auth is disabled or restricted
      if (
        errorCode === 'auth/operation-not-allowed' ||
        errorCode === 'auth/unauthorized-domain' ||
        String(err).includes('token-service-api')
      ) {
        console.warn('[Auth Fallback] Signing in via Student Profile session due to:', errorCode);
        return await signInWithStudentProfile(name || email.split('@')[0], email);
      }

      if (errorCode === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (errorCode === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        const msg = err instanceof Error ? err.message : 'Sign up failed';
        setError(msg);
      }
      return false;
    } finally {
      isSigningInRef.current = false;
      setIsSigningIn(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<boolean> => {
    if (isSigningInRef.current) return false;
    isSigningInRef.current = true;
    setIsSigningIn(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      return true;
    } catch (err: unknown) {
      const isFirebaseError = typeof err === 'object' && err !== null && 'code' in err;
      const errorCode = isFirebaseError ? String((err as { code: string }).code) : '';

      // Graceful fallback to student profile if email auth is disabled or restricted
      if (
        errorCode === 'auth/operation-not-allowed' ||
        errorCode === 'auth/unauthorized-domain' ||
        String(err).includes('token-service-api')
      ) {
        console.warn('[Auth Fallback] Signing in via Student Profile session due to:', errorCode);
        return await signInWithStudentProfile(email.split('@')[0], email);
      }

      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        setError('Invalid email or password. Please verify or use Instant Student Sign-In below.');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please use Instant Student Sign-In below.');
      } else {
        const msg = err instanceof Error ? err.message : 'Sign in failed';
        setError(msg);
      }
      return false;
    } finally {
      isSigningInRef.current = false;
      setIsSigningIn(false);
    }
  };

  const signInAsGuestStudent = async () => {
    await signOut(auth).catch(() => {});
    try {
      localStorage.removeItem(STUDENT_PROFILE_STORAGE_KEY);
    } catch {}
    setUser(null);
    setError(null);
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await signOut(auth).catch(() => {});
      try {
        localStorage.removeItem(STUDENT_PROFILE_STORAGE_KEY);
      } catch {}
      setUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign out failed';
      setError(msg);
    }
  };

  return {
    user,
    loading,
    isSigningIn,
    error,
    clearError,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signInWithStudentProfile,
    signInAsGuestStudent,
    signOutUser,
  };
}
