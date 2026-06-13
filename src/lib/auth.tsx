import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { firebaseConfig, firebaseEnabled } from './firebase-config';
import { setTokenRefreshCallback } from './api-client';

// Auth is the SEAM the kit leaves open: this module owns the IdP and feeds an
// access token to the SDK client (api-client.ts). Two modes:
//   • key mode (default in studio preview): no Firebase → authenticated as soon
//     as we mount; the workspace API key (VITE_RCRT_API_KEY) is the token.
//   • Firebase mode (production): Google sign-in; the Firebase id token is the
//     token. Configure VITE_FIREBASE_* to enable it.
// Swap Firebase for Auth0/Clerk/etc. here without touching the rest of the app.

interface AuthUser {
  email: string | null;
  displayName: string | null;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
  }
  return firebaseAuth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Key mode: nothing to sign into — authenticated immediately.
  const [isAuthenticated, setIsAuthenticated] = useState(!firebaseEnabled);
  const [isLoading, setIsLoading] = useState(firebaseEnabled);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!firebaseEnabled) return;
    const auth = getFirebaseAuth();
    setTokenRefreshCallback(async () =>
      auth.currentUser ? auth.currentUser.getIdToken() : null,
    );
    const unsub = onAuthStateChanged(auth, (u: User | null) => {
      setIsAuthenticated(Boolean(u));
      setUser(u ? { email: u.email, displayName: u.displayName } : null);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    if (!firebaseEnabled) return;
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch {
      await signInWithRedirect(auth, provider);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!firebaseEnabled) return;
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
