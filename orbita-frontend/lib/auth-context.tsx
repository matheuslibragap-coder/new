'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, setToken } from './api-client';
import type { AuthResponse, AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'orbita_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(USER_STORAGE_KEY);
      const token = window.localStorage.getItem('orbita_token');
      if (raw && token) setUser(JSON.parse(raw));
    } catch {
      /* sem acesso a localStorage — usuário simplesmente começa deslogado */
    }
    setIsLoading(false);
  }, []);

  const applyAuth = useCallback((data: AuthResponse) => {
    setToken(data.accessToken);
    try {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    } catch {
      /* segue apenas em memória */
    }
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      applyAuth(data);
    },
    [applyAuth],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const data = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      applyAuth(data);
    },
    [applyAuth],
  );

  const logout = useCallback(() => {
    setToken(null);
    try {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      /* nada a limpar */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
