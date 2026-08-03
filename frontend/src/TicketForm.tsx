import { useState } from 'react';
import type { CreateTicketInput, TicketPriority, User } from './types';

const PRIORITIES: TicketPriority[] = ['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'];

interface Props {
  users: User[];
  onCreate: (input: CreateTicketInput) => Promise<void>;
}

export function TicketForm({ users, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MOYENNE');
  const [createdById, setCreatedById] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || !createdById) return;

    setSubmitting(true);
    try {
      await onCreate({
        title,
        description,
        priority,
        createdById: Number(createdById),
        assignedToId: assignedToId ? Number(assignedToId) : undefined,
      });
      setTitle('');
      setDescription('');
      setPriority('MOYENNE');
      setAssignedToId('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ticket-form" onSubmit={handleSubmit}>
      <h2>Nouveau ticket</h2>

      <label>
        Titre
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>

      <div className="form-row">
        <label>
          Priorité
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label>
          Créé par
          <select
            value={createdById}
            onChange={(e) => setCreatedById(e.target.value)}
            required
          >
            <option value="" disabled>
              Choisir...
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Assigné à
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
          >
            <option value="">Non assigné</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Création...' : 'Créer le ticket'}
      </button>
    </form>
  );
}
