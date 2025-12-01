import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, logout as apiLogout, me, register as apiRegister } from '@/services/api/auth';

type User = { email: string; roles: string[]; id?: string };

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Best-effort restore using cookie-based refresh
    (async () => {
      try {
        // attempt refresh implicitly via 401 logic by hitting /users/me without token will fail; skip
      } catch { }
    })();
  }, []);

  const doLogin = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setAccessToken(res.accessToken);
    const profile = await me(res.accessToken);
    setUser(profile.user);
  };

  const doLogout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const doRegister = async (email: string, password: string) => {
    const res = await apiRegister({ email, password });
    setAccessToken(res.accessToken);
    const profile = await me(res.accessToken);
    setUser(profile.user);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, accessToken, login: doLogin, register: doRegister, logout: doLogout }),
    [user, accessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


