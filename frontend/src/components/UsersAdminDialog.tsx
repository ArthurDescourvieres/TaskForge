import { Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError, createUser, updateUserRole } from '@/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_RULE,
  USERNAME_PATTERN_ATTR,
  USERNAME_RULE,
  validateAccount,
} from '@/lib/account-rules';
import { ROLE_HINTS, ROLE_LABELS, ROLES, useAuth } from '@/lib/auth-context';
import type { Role, User } from '@/types';

interface Props {
  users: User[];
  /** Relit la liste après une création ou un changement de rôle : le menu
   *  « assigné à » et le filtre par technicien s'appuient sur les mêmes données. */
  onChanged: () => Promise<void>;
}

/**
 * Gestion des comptes, réservée aux administrateurs. C'est le seul endroit de
 * l'application où un rôle se choisit : l'inscription publique ne produit que
 * des utilisateurs standards.
 */
export function UsersAdminDialog({ users, onChanged }: Props) {
  const { user: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('TECHNICIEN');
  const [submitting, setSubmitting] = useState(false);
  // Un seul menu à la fois est bloqué, pas toute la table : changer un rôle ne
  // doit pas figer les autres lignes.
  const [pendingId, setPendingId] = useState<number | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    const invalid = validateAccount(name, password);
    if (invalid) {
      toast.error('Compte refusé', { description: invalid });
      return;
    }

    setSubmitting(true);
    try {
      await createUser({ name, email, password, role });
      await onChanged();
      setName('');
      setEmail('');
      setPassword('');
      setRole('TECHNICIEN');
      toast.success('Compte créé', {
        description: `${name} — ${ROLE_LABELS[role]}`,
      });
    } catch (err) {
      toast.error('Création impossible', {
        description:
          err instanceof ApiError && err.status === 409
            ? 'Un compte existe déjà avec cet email.'
            : "L'API n'a pas accepté ce compte. Vérifiez les champs.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(target: User, nextRole: Role) {
    setPendingId(target.id);
    try {
      await updateUserRole(target.id, nextRole);
      await onChanged();
      toast.success(`${target.name} — ${ROLE_LABELS[nextRole]}`);
    } catch (err) {
      toast.error('Changement de rôle refusé', {
        description:
          err instanceof Error ? err.message : 'Réessayez dans un instant.',
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Le libellé disparaît sous 640px pour laisser la place au reste de la
            barre : sans aria-label il ne resterait qu'une icône muette. */}
        <Button variant="outline" aria-label="Gestion des utilisateurs">
          <Users className="size-4" aria-hidden />
          <span className="hidden sm:inline">Utilisateurs</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Gestion des utilisateurs
          </DialogTitle>
          <DialogDescription>
            Créez les comptes de l'équipe et attribuez les rôles.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[45svh] overflow-y-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom d'utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[180px]">Rôle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {isSelf && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          (vous)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {/* Se rétrograder soi-même retirerait le dernier accès
                          d'administration : l'API le refuse, l'interface ne le
                          propose donc pas. */}
                      {isSelf ? (
                        <span className="text-sm text-muted-foreground">
                          {ROLE_LABELS[user.role]}
                        </span>
                      ) : (
                        <Select
                          value={user.role}
                          disabled={pendingId === user.id}
                          onValueChange={(value) =>
                            handleRoleChange(user, value as Role)
                          }
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-label={`Rôle de ${user.name}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <form
          onSubmit={handleCreate}
          className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4"
        >
          <p className="text-sm font-medium">Nouveau compte</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="new-user-name">Nom d'utilisateur</Label>
              <Input
                id="new-user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="j.dupont"
                pattern={USERNAME_PATTERN_ATTR}
                aria-describedby="new-user-name-hint"
                required
              />
              <p
                id="new-user-name-hint"
                className="text-xs text-muted-foreground"
              >
                {USERNAME_RULE}.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="j.dupont@taskforge.local"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-user-password">Mot de passe</Label>
              <Input
                id="new-user-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                placeholder={PASSWORD_RULE}
                required
              />
            </div>

            <div className="grid gap-2">
              {/* Un <Label> ne se rattache pas au déclencheur Radix, qui n'est
                  pas un contrôle natif : le nom accessible passe par aria-label. */}
              <Label htmlFor="new-user-role">Rôle</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as Role)}
              >
                <SelectTrigger
                  id="new-user-role"
                  className="w-full"
                  aria-label="Rôle du nouveau compte"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{ROLE_HINTS[role]}</p>

          <Button
            type="submit"
            disabled={submitting}
            className="justify-self-start"
          >
            {submitting ? 'Création…' : 'Créer le compte'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
