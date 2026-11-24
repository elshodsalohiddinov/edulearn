// Kim tizimga kirganini butun ilova bo'ylab saqlaydi.
// Sahifa yangilanganda (F5) foydalanuvchi /auth/me orqali qayta tiklanadi — cookie brauzerda turibdi.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

// Har bir rolning bosh sahifasi — login'dan keyin shu yerga yo'naltiriladi
export const HOME_BY_ROLE = {
  STUDENT: '/student/dashboard',
  TEACHER: '/teacher/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await authApi.me();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (credentials) => {
    const { user: u } = await authApi.login(credentials);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (body) => {
    const { user: u } = await authApi.register(body);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { setUser(null); }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, setUser, homePath: user ? HOME_BY_ROLE[user.role] : '/' }),
    [user, loading, login, register, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth faqat AuthProvider ichida ishlaydi');
  return ctx;
}
