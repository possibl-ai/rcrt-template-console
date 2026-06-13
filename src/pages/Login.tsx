import { Button, Card } from '@possibl/rcrt-app-kit/ui';
import { useAuth } from '../lib/auth';

// Shown only in Firebase mode (in key mode the app is authenticated on mount).
export function Login() {
  const { signIn } = useAuth();
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1.5rem' }}>
      <div style={{ maxWidth: '22rem', width: '100%', textAlign: 'center' }}>
        <Card>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem' }}>RCRT Console</h1>
          <p style={{ margin: '0 0 1rem', color: 'var(--rcrt-muted-fg)', fontSize: '0.875rem' }}>
            Sign in to continue.
          </p>
          <Button onClick={() => void signIn()}>Sign in with Google</Button>
        </Card>
      </div>
    </div>
  );
}
