import { BrowserRouter } from 'react-router-dom';
import { SwrProvider } from '@possibl/rcrt-app-kit/core';
import { RcrtApp } from '@possibl/rcrt-app-kit/shell';
import { consoleApp } from './app.config';
import { getClient } from './lib/api-client';
import { swrCache } from './lib/cache';
import { tenantId } from './lib/firebase-config';
import { useAuth } from './lib/auth';
import { Login } from './pages/Login';

// The auth gate + providers. The kit owns the router, nav and everything inside
// — App.tsx only decides "signed in?" and supplies the SDK client + SWR scope.

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--rcrt-muted-fg)' }}>
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) return <Login />;

  return (
    <BrowserRouter>
      <SwrProvider cache={swrCache} scope={tenantId}>
        <RcrtApp app={consoleApp} client={getClient()} tenantId={tenantId} />
      </SwrProvider>
    </BrowserRouter>
  );
}
