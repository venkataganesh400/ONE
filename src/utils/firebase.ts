import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize or reuse Firebase App
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth with Google Provider
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore instance targeting our specific provisioned database
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export type OperationType = 'create' | 'read' | 'update' | 'delete' | 'list';

export interface FirestoreErrorInfo {
  error: string;
  operation: OperationType;
  path: string;
  timestamp: string;
}

export function handleFirestoreError(error: unknown, operation: OperationType, path: string): FirestoreErrorInfo {
  const message = error instanceof Error ? error.message : String(error);
  const info: FirestoreErrorInfo = {
    error: message,
    operation,
    path,
    timestamp: new Date().toISOString(),
  };
  console.warn(`[Firestore Error] ${operation.toUpperCase()} on ${path}:`, message);
  return info;
}

export async function testFirebaseConnection(): Promise<boolean> {
  try {
    return !!db && !!auth;
  } catch (err) {
    console.error('Firebase test connection failed:', err);
    return false;
  }
}
