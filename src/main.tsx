import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerDefaultWidgets } from '@possibl/rcrt-ui/widgets';
import App from './App';
import { AuthProvider } from './lib/auth';
// Kit shell styles first so index.css's --rcrt-* token overrides win the
// cascade and brand the kit shell/advisor on this app's palette.
import '@possibl/rcrt-app-kit/styles.css';
import './index.css';

// Register the built-in JIT-UI chat/stream widget cards so the advisor's rich
// cards render in @possibl/rcrt-ui's <Chat> (see src/lib/advisor-chat.tsx).
registerDefaultWidgets();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
