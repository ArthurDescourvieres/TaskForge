import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PRIORITIES,
  PRIORITY_META,
  STATUS_META,
  STATUSES,
} from '@/lib/ticket-meta';
import type { TicketFilters, User } from '@/types';

/** Radix interdit une SelectItem de valeur vide : on passe par une sentinelle
 *  explicite pour « pas de filtre ». */
const ANY = 'ANY';

/** Trier se pense en une intention (« les plus urgents d'abord »), pas en deux
 *  réglages séparés champ + sens. Un seul menu, quatre intentions. */
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Plus récents' },
  { value: 'createdAt:asc', label: 'Plus anciens' },
  { value: 'priority:desc', label: 'Priorité décroissante' },
  { value: 'status:asc', label: 'Par statut' },
] as const;

interface Props {
  filters: TicketFilters;
  users: User[];
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (next: TicketFilters) => void;
}

export function FilterBar({
  filters,
  users,
  search,
  onSearchChange,
  onChange,
}: Props) {
  const sortValue = `${filters.sortBy ?? 'createdAt'}:${filters.sortOrder ?? 'desc'}`;
  const hasFilters =
    Boolean(search) ||
    Boolean(filters.status) ||
    Boolean(filters.priority) ||
    filters.assignedToId !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-56 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un titre, une description…"
          aria-label="Rechercher un ticket"
          className="bg-card pl-9"
        />
      </div>

      <Select
        value={filters.status ?? ANY}
        onValueChange={(value) =>
          onChange({
            ...filters,
            status:
              value === ANY ? undefined : (value as TicketFilters['status']),
          })
        }
      >
        <SelectTrigger className="w-40 bg-card" aria-label="Filtrer par statut">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Tous les statuts</SelectItem>
          {STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_META[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority ?? ANY}
        onValueChange={(value) =>
          onChange({
            ...filters,
            priority:
              value === ANY ? undefined : (value as TicketFilters['priority']),
          })
        }
      >
        <SelectTrigger
          className="w-40 bg-card"
          aria-label="Filtrer par priorité"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Toutes priorités</SelectItem>
          {PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {PRIORITY_META[priority].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.assignedToId ? String(filters.assignedToId) : ANY}
        onValueChange={(value) =>
          onChange({
            ...filters,
            assignedToId: value === ANY ? undefined : Number(value),
          })
        }
      >
        <SelectTrigger
          className="w-44 bg-card"
          aria-label="Filtrer par technicien"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Tous les techniciens</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={String(user.id)}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sortValue}
        onValueChange={(value) => {
          const [sortBy, sortOrder] = value.split(':');
          onChange({
            ...filters,
            sortBy: sortBy as TicketFilters['sortBy'],
            sortOrder: sortOrder as TicketFilters['sortOrder'],
          });
        }}
      >
        <SelectTrigger className="w-52 bg-card" aria-label="Trier les tickets">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSearchChange('');
            onChange({ sortBy: filters.sortBy, sortOrder: filters.sortOrder });
          }}
        >
          <X className="size-4" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
