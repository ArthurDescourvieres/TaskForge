import { useState } from 'react';
import { ApiError } from '@/api';
import { AuthError, AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_RULE,
  USERNAME_PATTERN_ATTR,
  USERNAME_RULE,
  validateAccount,
} from '@/lib/account-rules';
import { useAuth } from '@/lib/auth-context';

export function RegisterPage({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const invalid = validateAccount(name, password);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSubmitting(true);
    try {
      // L'API renvoie un jeton : on se retrouve connecté sans repasser par
      // l'écran de connexion.
      await register({ name, email, password });
    } catch (err) {
      // Ici, contrairement à la connexion, il faut dire que l'email est déjà
      // pris : sans cette précision le formulaire échoue sans que rien ne
      // permette de comprendre quoi corriger. On accepte de confirmer
      // l'existence du compte, c'est le prix d'une inscription utilisable.
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Un compte existe déjà avec cet email.'
          : "L'inscription a échoué. Réessayez dans un instant.",
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      subtitle="Créez un compte pour signaler vos incidents."
      footer={
        <>
          Vous avez déjà un compte ?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Se connecter
          </button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm"
      >
        <div className="grid gap-2">
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <Input
            id="username"
            // « nickname » et non « username » : l'identifiant de connexion est
            // l'email, c'est lui que le gestionnaire de mots de passe doit retenir.
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="j.dupont"
            pattern={USERNAME_PATTERN_ATTR}
            aria-describedby="username-hint"
            required
          />
          <p id="username-hint" className="text-xs text-muted-foreground">
            {USERNAME_RULE}.
          </p>
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={MIN_PASSWORD_LENGTH}
            aria-describedby="password-hint"
            required
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            {PASSWORD_RULE}.
          </p>
        </div>

        {error && <AuthError>{error}</AuthError>}

        {/* Le rôle ne se choisit pas ici : tout compte créé par inscription est
            un utilisateur standard. Seul un admin peut nommer un technicien. */}
        <p className="text-xs text-muted-foreground">
          Votre compte sera créé en tant qu'utilisateur standard. Un
          administrateur peut ensuite vous donner le rôle technicien.
        </p>

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {submitting ? 'Création…' : 'Créer mon compte'}
        </Button>
      </form>
    </AuthShell>
  );
}
