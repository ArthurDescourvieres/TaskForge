import type { Ticket } from './types';

interface Props {
  tickets: Ticket[];
}

export function TicketList({ tickets }: Props) {
  if (tickets.length === 0) {
    return <p>Aucun ticket pour l'instant.</p>;
  }

  return (
    <table className="ticket-list">
      <thead>
        <tr>
          <th>Titre</th>
          <th>Priorité</th>
          <th>Statut</th>
          <th>Créé par</th>
          <th>Assigné à</th>
          <th>Créé le</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((t) => (
          <tr key={t.id}>
            <td>{t.title}</td>
            <td>
              <span className={`badge priority-${t.priority.toLowerCase()}`}>
                {t.priority}
              </span>
            </td>
            <td>
              <span className={`badge status-${t.status.toLowerCase()}`}>
                {t.status}
              </span>
            </td>
            <td>{t.createdBy.name}</td>
            <td>{t.assignedTo?.name ?? '—'}</td>
            <td>{new Date(t.createdAt).toLocaleDateString('fr-FR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
