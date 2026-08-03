import type {
  CreateTicketInput,
  Ticket,
  TicketFilters,
  TicketStats,
  User,
} from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(
      `${options?.method ?? 'GET'} ${path} a échoué (${res.status})`,
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

export function getTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  return request(`/tickets${toQueryString(filters)}`);
}

export function getTicketStats(): Promise<TicketStats> {
  return request('/tickets/stats');
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return request('/tickets', { method: 'POST', body: JSON.stringify(input) });
}

export function getUsers(): Promise<User[]> {
  return request('/users');
}
