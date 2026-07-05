import { createContext, useContext, useEffect, useState } from 'react';
import { fetchSession } from '../lib/api';
import type { Advisor } from '../types';

type AuthState = {
  advisor: Advisor | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const session = await fetchSession();
    setAdvisor(session.advisor);
    setLoading(false);
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, []);

  return <AuthContext.Provider value={{ advisor, loading, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}