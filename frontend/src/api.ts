import type { CreateTicketInput, Ticket, User } from './types';

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

export function getTickets(): Promise<Ticket[]> {
  return request('/tickets');
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return request('/tickets', { method: 'POST', body: JSON.stringify(input) });
}

export function getUsers(): Promise<User[]> {
  return request('/users');
}
