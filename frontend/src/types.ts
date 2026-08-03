export type TicketPriority = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
export type TicketStatus = 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'FERME';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'TECHNICIEN' | 'ADMIN';
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
  createdById: number;
  assignedToId?: number;
}
