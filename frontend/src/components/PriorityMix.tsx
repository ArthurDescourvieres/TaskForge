import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';
import { PRIORITIES, PRIORITY_META } from '@/lib/ticket-meta';
import type { TicketPriority } from '@/types';

interface Props {
  byPriority: Record<TicketPriority, number>;
  total: number;
}

/**
 * Répartition par priorité en une seule barre segmentée plutôt qu'en camembert :
 * la question posée est « quelle part de la file est critique ? », et une
 * proportion se compare mieux le long d'un axe que par des angles.
 */
export function PriorityMix({ byPriority, total }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // scaleX plutôt que width : on anime une transform, pas le layout.
        gsap.from('[data-segment]', {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.06,
          delay: 0.35,
        });
      });
    },
    { scope: barRef, dependencies: [total] },
  );

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun ticket à répartir pour l'instant.
      </p>
    );
  }

  const present = PRIORITIES.filter((p) => byPriority[p] > 0);

  return (
    <div ref={barRef} className="space-y-3">
      <div className="flex h-2.5 gap-1 overflow-hidden rounded-full">
        {present.map((priority) => (
          <div
            key={priority}
            data-segment
            className={`${PRIORITY_META[priority].stripe} rounded-full`}
            style={{ flexGrow: byPriority[priority] }}
          />
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {PRIORITIES.map((priority) => (
          <li
            key={priority}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span
              className={`${PRIORITY_META[priority].stripe} size-2 rounded-full`}
              aria-hidden
            />
            {PRIORITY_META[priority].label}
            <span className="tabular font-mono text-foreground">
              {byPriority[priority]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
