/** « 3 j 4 h », « 5 h 20 min », « 12 min » — une durée se lit d'un coup d'œil,
 *  pas en décimales d'heures. */
export function formatDuration(hours: number | null): string {
  if (hours === null) return '—';

  const totalMinutes = Math.round(hours * 60);
  // Arrondir à « 0 min » laisserait croire à une résolution instantanée.
  if (totalMinutes < 1) return '< 1 min';
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (totalHours < 24) {
    return minutes === 0 ? `${totalHours} h` : `${totalHours} h ${minutes} min`;
  }

  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  return remainingHours === 0 ? `${days} j` : `${days} j ${remainingHours} h`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}
