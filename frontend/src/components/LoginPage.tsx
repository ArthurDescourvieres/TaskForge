import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { TicketCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-login-card]', {
          y: 18,
          autoAlpha: 0,
          duration: 0.55,
          ease: 'power3.out',
        });
      });
    },
    { scope: containerRef },
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch {
      // Volontairement identique pour un email inconnu et un mot de passe
      // faux : préciser lequel des deux est en cause révélerait quels
      // comptes existent.
      setError('Email ou mot de passe incorrect.');
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="wash flex min-h-svh items-center justify-center px-6 py-12"
    >
      <div data-login-card className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden
          >
            <TicketCheck className="size-6" strokeWidth={2.25} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">TaskForge</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Connectez-vous pour accéder à la file d'incidents.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm"
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@taskforge.local"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}
