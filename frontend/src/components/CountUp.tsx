import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

interface Props {
  value: number;
  className?: string;
}

/**
 * Compteur animé. Sur un tableau de bord, voir le chiffre « arriver » signale
 * que la donnée est vivante — un nombre posé d'un coup peut passer pour figé.
 *
 * L'animation repart de la valeur précédemment affichée (et non de zéro) :
 * quand un compteur passe de 3 à 4, on veut voir +1, pas un recomptage.
 */
export function CountUp({ value, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const displayed = useRef(0);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const from = displayed.current;
      displayed.current = value;

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const counter = { n: from };
        gsap.to(counter, {
          n: value,
          duration: 0.9,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = String(Math.round(counter.n));
          },
        });
      });
    },
    { dependencies: [value] },
  );

  // Valeur finale rendue par React : c'est ce qui s'affiche si l'utilisateur
  // a désactivé les animations, et ce que lisent les lecteurs d'écran.
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
