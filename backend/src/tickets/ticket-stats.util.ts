import { TicketPriority, TicketStatus } from '../generated/prisma/client';

/** Le strict minimum dont les calculs ont besoin — pas le modèle Prisma complet,
 *  pour rester testable sans base de données (cf. S2-08). */
export interface TicketSample {
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  resolvedAt: Date | null;
}

const ALL_STATUSES: TicketStatus[] = ['OUVERT', 'EN_COURS', 'RESOLU', 'FERME'];
const ALL_PRIORITIES: TicketPriority[] = [
  'BASSE',
  'MOYENNE',
  'HAUTE',
  'CRITIQUE',
];

/** Compte les occurrences en partant de zéro pour chaque valeur possible :
 *  le frontend reçoit toujours toutes les clés, même à zéro. */
function countOccurrences<T extends string>(
  values: T[],
  allValues: T[],
): Record<T, number> {
  const counts = Object.fromEntries(allValues.map((v) => [v, 0])) as Record<
    T,
    number
  >;
  for (const value of values) {
    counts[value] += 1;
  }
  return counts;
}

export function countByStatus(
  tickets: TicketSample[],
): Record<TicketStatus, number> {
  return countOccurrences(
    tickets.map((t) => t.status),
    ALL_STATUSES,
  );
}

export function countByPriority(
  tickets: TicketSample[],
): Record<TicketPriority, number> {
  return countOccurrences(
    tickets.map((t) => t.priority),
    ALL_PRIORITIES,
  );
}

/**
 * Temps moyen de résolution, en heures.
 *
 * Ne prend en compte que les tickets effectivement résolus : un ticket encore
 * ouvert n'a pas un temps de résolution de zéro, il n'en a pas du tout.
 * Retourne null si aucun ticket n'est résolu (une moyenne sur zéro élément
 * n'existe pas — renvoyer 0 laisserait croire à une résolution instantanée).
 */
export function averageResolutionHours(tickets: TicketSample[]): number | null {
  const resolved = tickets.filter(
    (t): t is TicketSample & { resolvedAt: Date } => t.resolvedAt !== null,
  );

  if (resolved.length === 0) {
    return null;
  }

  const totalMs = resolved.reduce(
    (sum, t) => sum + (t.resolvedAt.getTime() - t.createdAt.getTime()),
    0,
  );

  return totalMs / resolved.length / 3_600_000;
}
