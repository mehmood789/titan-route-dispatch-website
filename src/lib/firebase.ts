import {initializeApp} from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from 'firebase/auth';
import {doc, getDocFromServer, getFirestore} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Ignore persistence setup warnings in restricted environments
});
export const storage = getStorage(app);
storage.maxUploadRetryTime = 3000;
storage.maxOperationRetryTime = 3000;
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({prompt: 'select_account'});

export function sanitizeUiError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const trimmed = err.message.trim();
    if (trimmed.startsWith('{') && trimmed.includes('authInfo')) {
      try {
        const parsed = JSON.parse(trimmed) as {error?: string};
        if (parsed.error?.toLowerCase().includes('quota exceeded')) {
          return 'Daily database quota exceeded. Please try again later or contact dispatch support.';
        }
        if (parsed.error?.toLowerCase().includes('permission')) {
          return 'Submission rejected by security validation. Please check all required fields and try again.';
        }
      } catch {
        // Ignore parse error and use fallback
      }
      return fallback;
    }
    return trimmed || fallback;
  }
  return fallback;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
