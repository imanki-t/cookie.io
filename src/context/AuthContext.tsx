import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  accentColor: string;
  settings?: Record<string, any>;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = 'cookie_auth_token';
const USER_KEY  = 'cookie_auth_user';

async function authFetch(url: string, options: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers as any) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      const t = localStorage.getItem(TOKEN_KEY);
      if (!t) { setLoading(false); return; }
      try {
        const data = await authFetch('/api/auth/me', {}, t);
        setUser(data);
        setToken(t);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };
    verify();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await authFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }, []);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    const data = await authFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password, displayName }) });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const updateProfile = useCallback(async (data: Partial<AuthUser>) => {
    const t = localStorage.getItem(TOKEN_KEY);
    const updated = await authFetch('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }, t);
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const t = localStorage.getItem(TOKEN_KEY);
    await authFetch('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }, t);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
