/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** RCRT API gateway URL (per-deployment; written by `project init-repo`). */
  readonly VITE_API_URL: string;
  /** The workspace this app is bound to (written by `project init-repo`). */
  readonly VITE_TENANT_ID: string;
  /** Workspace API key — the auth in studio preview / key mode. */
  readonly VITE_RCRT_API_KEY?: string;
  /** Firebase config — production auth. When unset, the app runs in key mode. */
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
