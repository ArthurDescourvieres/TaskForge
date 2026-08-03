import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  login as loginRequest,
  setAuthToken,
  setUnauthorizedHandler,
} from '@/api';
import { AuthContext, type AuthContextValue } from '@/lib/auth-context';
import type { AuthUser, LoginInput } from '@/types';

const TOKEN_KEY = 'taskforge.token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  // Au démarrage, on ne fait pas confiance au jeton stocké : il peut être
  // expiré ou révoqué. /auth/me tranche, et sert au passage à récupérer le
  // rôle à jour plutôt que de le lire dans un jeton figé.
  useEffect(() => {
    setUnauthorizedHandler(logout);

    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    setAuthToken(stored);
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(async (input: LoginInput) => {
    const response = await loginRequest(input);
    localStorage.setItem(TOKEN_KEY, response.access_token);
    setAuthToken(response.access_token);
    setUser(response.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
