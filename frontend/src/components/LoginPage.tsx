import { useState } from 'react';
import { AuthError, AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';

export function LoginPage({
  onSwitchToRegister,
}: {
  onSwitchToRegister: () => void;
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    <AuthShell
      subtitle="Connectez-vous pour accéder à la file d'incidents."
      footer={
        <>
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Créer un compte
          </button>
        </>
      }
    >
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

        {error && <AuthError>{error}</AuthError>}

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {submitting ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
    </AuthShell>
  );
}
