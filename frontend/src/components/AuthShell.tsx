import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { TicketCheck } from 'lucide-react';
import { useRef } from 'react';

interface Props {
  subtitle: string;
  children: React.ReactNode;
  /** Bascule vers l'autre écran, sous la carte. */
  footer: React.ReactNode;
}

/**
 * Cadre commun à la connexion et à l'inscription. Les deux écrans partagent
 * l'identité et l'animation d'entrée : les dupliquer ferait diverger l'un des
 * deux à la première retouche.
 */
export function AuthShell({ subtitle, children, footer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-auth-card]', {
          y: 18,
          autoAlpha: 0,
          duration: 0.55,
          ease: 'power3.out',
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="wash flex min-h-svh items-center justify-center px-6 py-12"
    >
      <div data-auth-card className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden
          >
            <TicketCheck className="size-6" strokeWidth={2.25} />
          </span>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            TaskForge
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {children}

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {footer}
        </p>
      </div>
    </div>
  );
}

/** Message d'erreur du formulaire. `role="alert"` pour que le lecteur d'écran
 *  l'annonce : sans ça, un échec de soumission passe totalement inaperçu. */
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  );
}
