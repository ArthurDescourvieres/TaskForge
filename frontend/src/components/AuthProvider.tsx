import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  setAuthToken,
  setUnauthorizedHandler,
} from '@/api';
import { AuthContext, type AuthContextValue } from '@/lib/auth-context';
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '@/types';

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

  // /auth/login et /auth/register renvoient la même chose : l'inscription
  // connecte donc directement, sans repasser par le formulaire de connexion.
  const applySession = useCallback((response: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, response.access_token);
    setAuthToken(response.access_token);
    setUser(response.user);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => applySession(await loginRequest(input)),
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => applySession(await registerRequest(input)),
    [applySession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
