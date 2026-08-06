import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { PRIORITIES, PRIORITY_META } from '@/lib/ticket-meta';
import type { CreateTicketInput, TicketPriority, User } from '@/types';

const UNASSIGNED = 'UNASSIGNED';

interface Props {
  users: User[];
  onCreate: (input: CreateTicketInput) => Promise<void>;
}

/**
 * La création vit dans une boîte de dialogue plutôt qu'en haut de la page :
 * dans une file d'incidents on consulte bien plus souvent qu'on ne crée, et un
 * formulaire permanent prendrait la place du travail réel.
 */
export function CreateTicketDialog({ users, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MOYENNE');
  const [assignedToId, setAssignedToId] = useState(UNASSIGNED);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTitle('');
    setDescription('');
    setPriority('MOYENNE');
    setAssignedToId(UNASSIGNED);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description) return;

    setSubmitting(true);
    try {
      await onCreate({
        title,
        description,
        priority,
        assignedToId:
          assignedToId === UNASSIGNED ? undefined : Number(assignedToId),
      });
      reset();
      setOpen(false);
      toast.success('Ticket créé', { description: title });
    } catch {
      toast.error('Création impossible', {
        description: "L'API n'a pas accepté le ticket. Réessayez.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nouveau ticket
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Signaler un incident
          </DialogTitle>
          <DialogDescription>
            Décrivez le problème. Un technicien pourra le prendre en charge
            depuis la file.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Imprimante du 2e étage hors service"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ce qui se passe, depuis quand, ce que vous avez déjà tenté…"
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Priorité</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TicketPriority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Assigner à</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Non assigné</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Création…' : 'Créer le ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
