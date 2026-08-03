export type TicketPriority = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
export type TicketStatus = 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'FERME';
export type Role = 'USER' | 'TECHNICIEN' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

/** Ce que renvoie /auth/login, /auth/register et /auth/me. */
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  resolvedAt: string | null;
  createdBy: { id: number; name: string };
  assignedTo: { id: number; name: string } | null;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  // Plus de createdById : l'API le déduit du jeton, il ne se déclare plus.
  assignedToId?: number;
}

export interface TicketStats {
  total: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
  /** null tant qu'aucun ticket n'a été résolu. */
  averageResolutionHours: number | null;
}

export type SortableField = 'createdAt' | 'priority' | 'status';

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: number;
  search?: string;
  sortBy?: SortableField;
  sortOrder?: 'asc' | 'desc';
}
