// App — Router + auth guard + desktop layout with sidebar
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthChange, getIdToken, type User } from './auth';
import { setAuthTokenProvider } from './api';
import { Sidebar, MobileNav } from './components/TabBar';
import { Budget } from './pages/Budget';
import { Transactions } from './pages/Transactions';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(DEV_MODE);

  useEffect(() => {
    if (DEV_MODE) {
      setAuthTokenProvider(async () => null);
      return;
    }

    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        setAuthTokenProvider(() => getIdToken());
      }
    });
    return unsubscribe;
  }, []);

  if (!authReady) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-eggshell)',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  const isAuthenticated = DEV_MODE || user !== null;

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <div className="app-shell">
          <Sidebar />
          <main className="content">
            <Routes>
              <Route path="/" element={<Budget />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <MobileNav />
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
