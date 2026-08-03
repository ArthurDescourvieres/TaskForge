import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { PRIORITY_META, STATUS_META } from '@/lib/ticket-meta';
import { cn } from '@/lib/utils';
import type { Ticket } from '@/types';

interface Props {
  tickets: Ticket[];
  /** Ticket tout juste créé, mis en évidence le temps qu'on le repère. */
  highlightId: number | null;
  hasActiveFilters: boolean;
}

export function TicketTable({ tickets, highlightId, hasActiveFilters }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Les lignes réapparaissent à chaque changement de filtre : le mouvement
  // confirme que la liste a bien été recalculée.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-row]', {
          y: 8,
          autoAlpha: 0,
          duration: 0.35,
          ease: 'power2.out',
          stagger: 0.03,
        });
      });
    },
    { scope: containerRef, dependencies: [tickets] },
  );

  // Rappel visuel sur le ticket qu'on vient de créer : dans une file triée par
  // date il arrive en tête, mais avec un tri par priorité il peut atterrir
  // n'importe où — l'animation dit où regarder.
  useGSAP(
    () => {
      if (highlightId === null) return;
      const row = containerRef.current?.querySelector(
        `[data-ticket-id="${highlightId}"]`,
      );
      if (!row) return;

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          row,
          { backgroundColor: 'rgba(76, 125, 240, 0.18)' },
          {
            backgroundColor: 'rgba(76, 125, 240, 0)',
            duration: 2,
            ease: 'power2.out',
          },
        );
      });
    },
    { scope: containerRef, dependencies: [highlightId, tickets] },
  );

  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="font-heading text-lg font-medium">
          {hasActiveFilters ? 'Aucun ticket ne correspond' : 'La file est vide'}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {hasActiveFilters
            ? 'Élargissez la recherche ou réinitialisez les filtres.'
            : 'Créez un premier ticket pour démarrer le suivi.'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto rounded-xl border border-border bg-card"
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">Ticket</TableHead>
            <TableHead className="w-32">Priorité</TableHead>
            <TableHead className="w-36">Statut</TableHead>
            <TableHead className="w-44">Assigné à</TableHead>
            <TableHead className="w-28 text-right pr-6">Créé le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id} data-row data-ticket-id={ticket.id}>
              <TableCell className="relative py-3.5 pl-6">
                {/* Liseré de sévérité : la priorité se scanne verticalement,
                    le long du bord gauche, sans lire les libellés. */}
                <span
                  className={cn(
                    'absolute top-1/2 left-0 h-9 w-1 -translate-y-1/2 rounded-r-full',
                    PRIORITY_META[ticket.priority].stripe,
                  )}
                  aria-hidden
                />
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-xs text-muted-foreground tabular">
                    #{ticket.id}
                  </span>
                  <span className="font-medium">{ticket.title}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 max-w-md text-sm text-muted-foreground">
                  {ticket.description}
                </p>
              </TableCell>

              <TableCell>
                <span
                  className={cn(
                    'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                    PRIORITY_META[ticket.priority].chip,
                  )}
                >
                  {PRIORITY_META[ticket.priority].label}
                </span>
              </TableCell>

              <TableCell>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    STATUS_META[ticket.status].pill,
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      STATUS_META[ticket.status].dot,
                    )}
                    aria-hidden
                  />
                  {STATUS_META[ticket.status].label}
                </span>
              </TableCell>

              <TableCell className="text-sm">
                {ticket.assignedTo ? (
                  ticket.assignedTo.name
                ) : (
                  <span className="text-muted-foreground">Non assigné</span>
                )}
              </TableCell>

              <TableCell className="pr-6 text-right text-sm text-muted-foreground tabular">
                {formatDate(ticket.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
