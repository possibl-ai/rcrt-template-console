// Build-time config from VITE_* env (see .env.example + Dockerfile build args).
// VITE_API_URL + VITE_TENANT_ID are required; Firebase is optional — when its
// API key is absent the app runs in "key mode" (the workspace API key is the
// auth, as the studio preview uses).

export const apiUrl: string = import.meta.env.VITE_API_URL;
export const tenantId: string = import.meta.env.VITE_TENANT_ID;
export const apiKey: string = import.meta.env.VITE_RCRT_API_KEY || '';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
};

/** When Firebase is configured the app requires Google sign-in; otherwise it
 *  authenticates with the workspace API key (key mode). */
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain);

if (!apiUrl) {
  throw new Error('VITE_API_URL is required. Set it in the build environment.');
}
