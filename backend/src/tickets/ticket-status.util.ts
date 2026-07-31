import { TicketStatus } from '../generated/prisma/client';

const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OUVERT: ['EN_COURS', 'FERME'],
  EN_COURS: ['RESOLU', 'FERME'],
  RESOLU: ['FERME'],
  FERME: [],
};

export function isValidStatusTransition(
  from: TicketStatus,
  to: TicketStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}
