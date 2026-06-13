import { SwrCache } from '@possibl/rcrt-app-kit/core';
import { localStorageAdapter } from '@possibl/rcrt-app-kit/shell';

// The app's SWR snapshot store (kit-core SwrCache over localStorage). `useCached`
// comes from @possibl/rcrt-app-kit/core; <SwrProvider> in App.tsx supplies the
// scope (tenant) so cached data never leaks across workspaces. Bump
// SWR_SCHEMA_VERSION when a cached payload shape changes.
const SWR_SCHEMA_VERSION = 1;

export const swrCache = new SwrCache({
  storage: localStorageAdapter(),
  schemaVersion: SWR_SCHEMA_VERSION,
});
