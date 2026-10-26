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

export interface UseFirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  isSigningIn: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<boolean>;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signInAsGuestStudent: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isSigningInRef = useRef<boolean>(false);

  const clearError = () => setError(null);

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
            setUser(null);
            setLoading(false);
            return;
          }
        }
      }

      setUser(currentUser);
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
          // Gracefully handle if initial profile sync is delayed or offline
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

  const signInWithGoogle = async () => {
    if (isSigningInRef.current) return;
    isSigningInRef.current = true;
    setIsSigningIn(true);
    setError(null);

    try {
      await signInWithPopup(auth, googleProvider);
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
        setError('Google sign-in popup was blocked. Please enable popups or continue in Guest Mode.');
        return;
      }

      if (errorCode === 'auth/unauthorized-domain') {
        setError('This preview domain is awaiting OAuth authorization. Please continue in Local Guest Mode.');
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
        } catch {
          // non-critical
        }
      }
      return true;
    } catch (err: unknown) {
      const isFirebaseError = typeof err === 'object' && err !== null && 'code' in err;
      const errorCode = isFirebaseError ? String((err as { code: string }).code) : '';

      if (errorCode === 'auth/operation-not-allowed') {
        setError('Email sign-in is not enabled on this project. Please continue with Google Sign-In or use Guest Mode.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (errorCode === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        const msg = err instanceof Error ? err.message : 'Sign up failed';
        if (msg.includes('token-service-api')) {
          setError('Google Cloud Token Service is activating. Please use Google Sign-In or Guest Mode.');
        } else {
          setError(msg);
        }
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

      if (errorCode === 'auth/operation-not-allowed') {
        setError('Email sign-in is not enabled on this project. Please continue with Google Sign-In or use Guest Mode.');
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        setError('Invalid email or password. Please verify and try again.');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a moment or reset your password.');
      } else {
        const msg = err instanceof Error ? err.message : 'Sign in failed';
        if (msg.includes('token-service-api')) {
          setError('Google Cloud Token Service is activating. Please use Google Sign-In or Guest Mode.');
        } else {
          setError(msg);
        }
      }
      return false;
    } finally {
      isSigningInRef.current = false;
      setIsSigningIn(false);
    }
  };

  const signInAsGuestStudent = async () => {
    // Guest mode provides full offline-first functionality without creating an un-provisioned backend session
    await signOut(auth).catch(() => {});
    setUser(null);
    setError(null);
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await signOut(auth);
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
    signInAsGuestStudent,
    signOutUser,
  };
}
