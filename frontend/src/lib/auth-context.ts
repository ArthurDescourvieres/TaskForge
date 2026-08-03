import { createContext, useContext } from 'react';
import type { AuthUser, LoginInput, Role } from '@/types';

export interface AuthContextValue {
  user: AuthUser | null;
  /** true tant qu'on vérifie le jeton retrouvé au démarrage. */
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'AuthProvider");
  }
  return context;
}

/** Peut agir sur les tickets des autres : prendre en charge, résoudre, fermer.
 *  L'API applique la même règle — ceci ne fait que masquer ce qui serait refusé. */
export function canManageTickets(role: Role | undefined): boolean {
  return role === 'TECHNICIEN' || role === 'ADMIN';
}

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Utilisateur',
  TECHNICIEN: 'Technicien',
  ADMIN: 'Administrateur',
};
