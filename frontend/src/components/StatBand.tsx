import { Card } from '@/components/ui/card';
import { CountUp } from '@/components/CountUp';
import { PriorityMix } from '@/components/PriorityMix';
import { formatDuration } from '@/lib/format';
import type { TicketStats } from '@/types';

interface Props {
  stats: TicketStats | null;
}

export function StatBand({ stats }: Props) {
  const open = stats?.byStatus.OUVERT ?? 0;
  const inProgress = stats?.byStatus.EN_COURS ?? 0;
  const resolved = stats?.byStatus.RESOLU ?? 0;

  return (
    <section className="wash border-b border-border/70">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <div data-anim="header" className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            File d'incidents
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {stats === null
              ? 'Chargement de la file…'
              : `${stats.total} ticket${stats.total > 1 ? 's' : ''} au total, dont ${open} en attente de prise en charge.`}
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Ouverts" value={open} hint="à prendre en charge" />
          <StatTile
            label="En cours"
            value={inProgress}
            hint="assignés à un technicien"
          />
          <StatTile
            label="Résolus"
            value={resolved}
            hint="en attente de clôture"
          />

          {/* Une durée n'est pas un compteur : pas d'animation de comptage,
              on affiche la valeur formatée telle quelle. */}
          <Card
            data-anim="tile"
            className="gap-0 border-border/70 bg-card/80 p-5 shadow-none backdrop-blur-sm"
          >
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Temps moyen
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold tabular">
              {formatDuration(stats?.averageResolutionHours ?? null)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats?.averageResolutionHours === null
                ? 'aucun ticket résolu'
                : 'de la création à la résolution'}
            </p>
          </Card>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Répartition par priorité
          </p>
          <PriorityMix
            byPriority={
              stats?.byPriority ?? {
                BASSE: 0,
                MOYENNE: 0,
                HAUTE: 0,
                CRITIQUE: 0,
              }
            }
            total={stats?.total ?? 0}
          />
        </div>
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card
      data-anim="tile"
      className="gap-0 border-border/70 bg-card/80 p-5 shadow-none backdrop-blur-sm"
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <CountUp
        value={value}
        className="mt-2 block font-heading text-3xl font-semibold tabular"
      />
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}
