import type {
  AuthResponse,
  AuthUser,
  CreateTicketInput,
  LoginInput,
  Ticket,
  TicketFilters,
  TicketStats,
  TicketStatus,
  User,
} from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Erreur portant le code HTTP, pour distinguer un 401 d'une panne réseau. */
export class ApiError extends Error {
  // Champ déclaré puis assigné : le tsconfig du frontend active
  // erasableSyntaxOnly, qui interdit les propriétés de paramètre.
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Jeton courant, tenu ici plutôt que passé à chaque appel : c'est un détail
// de transport, les composants n'ont pas à s'en occuper.
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Branché par le fournisseur d'authentification : un jeton expiré (8 h de
 *  validité) doit ramener à l'écran de connexion sans intervention. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      onUnauthorized?.();
    }
    const message = await res
      .json()
      .then((body: { message?: string | string[] }) =>
        Array.isArray(body.message) ? body.message.join(', ') : body.message,
      )
      .catch(() => null);

    throw new ApiError(
      message ?? `${options?.method ?? 'GET'} ${path} a échoué`,
      res.status,
    );
  }

  return res.json();
}

/** Ne transmet que les filtres réellement renseignés : un param vide
 *  ferait échouer la validation côté API. */
function toQueryString(filters: TicketFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(): Promise<AuthUser> {
  return request('/auth/me');
}

export function getTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  return request(`/tickets${toQueryString(filters)}`);
}

export function getTicketStats(): Promise<TicketStats> {
  return request('/tickets/stats');
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return request('/tickets', { method: 'POST', body: JSON.stringify(input) });
}

export function updateTicketStatus(
  id: number,
  status: TicketStatus,
): Promise<Ticket> {
  return request(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getUsers(): Promise<User[]> {
  return request('/users');
}
