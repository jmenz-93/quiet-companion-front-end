import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AdvisorPage } from './pages/AdvisorPage';
import { useAuth } from './context/AuthContext';

function TerminalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="live-dot" aria-hidden="true" /> Loading your workspace…
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { advisor, loading } = useAuth();

  if (loading) {
    return <TerminalLoading />;
  }

  if (!advisor) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { advisor, loading } = useAuth();

  if (loading) {
    return <TerminalLoading />;
  }

  if (advisor) {
    return <Navigate to="/market" replace />;
  }

  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/market" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/advisor" element={<ProtectedRoute><AdvisorPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}