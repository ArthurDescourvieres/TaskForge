import { createContext, useContext } from 'react';
import type { AuthUser, LoginInput, RegisterInput, Role } from '@/types';

export interface AuthContextValue {
  user: AuthUser | null;
  /** true tant qu'on vérifie le jeton retrouvé au démarrage. */
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
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

/** Peut créer des comptes et changer les rôles. Même remarque : l'API tranche. */
export function canManageUsers(role: Role | undefined): boolean {
  return role === 'ADMIN';
}

export const ROLES: Role[] = ['USER', 'TECHNICIEN', 'ADMIN'];

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Utilisateur',
  TECHNICIEN: 'Technicien',
  ADMIN: 'Administrateur',
};

/** Ce que chaque rôle change concrètement, montré au moment de le choisir :
 *  « Technicien » ne dit pas de lui-même ce qu'il débloque. */
export const ROLE_HINTS: Record<Role, string> = {
  USER: 'Signale des incidents et suit les siens.',
  TECHNICIEN: 'Prend en charge et résout les tickets de la file.',
  ADMIN: 'Gère les tickets, les comptes et les rôles.',
};
