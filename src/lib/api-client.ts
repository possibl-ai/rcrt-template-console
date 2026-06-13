import { RcrtClient, type TokenProvider } from '@possibl/rcrt-sdk';
import { apiUrl, apiKey } from './firebase-config';

// The app's one wire client — @possibl/rcrt-sdk. The TokenProvider is the auth
// seam: in key mode it returns the workspace API key; in Firebase mode auth.tsx
// binds a callback that returns the signed-in user's id token.

let tokenCallback: (() => Promise<string | null>) | null = null;

const tokenProvider: TokenProvider = {
  async getIdToken() {
    if (tokenCallback) {
      try {
        return (await tokenCallback()) || apiKey;
      } catch {
        return apiKey;
      }
    }
    return apiKey;
  },
};

let client: RcrtClient | null = null;

export function getClient(): RcrtClient {
  if (!client) client = new RcrtClient({ apiUrl, tokenProvider });
  return client;
}

/** auth.tsx binds the Firebase id-token getter here once Firebase is ready. */
export function setTokenRefreshCallback(cb: () => Promise<string | null>) {
  tokenCallback = cb;
}
