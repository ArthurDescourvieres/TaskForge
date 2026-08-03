import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { TicketCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createTicket, getTicketStats, getTickets, getUsers } from '@/api';
import { CreateTicketDialog } from '@/components/CreateTicketDialog';
import { FilterBar } from '@/components/FilterBar';
import { StatBand } from '@/components/StatBand';
import { TicketTable } from '@/components/TicketTable';
import { Toaster } from '@/components/ui/sonner';
import type {
  CreateTicketInput,
  Ticket,
  TicketFilters,
  TicketStats,
  User,
} from '@/types';

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [search, setSearch] = useState('');
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const pageRef = useRef<HTMLDivElement>(null);

  // La saisie ne déclenche pas une requête par caractère : on attend une pause.
  // Renvoyer l'objet inchangé quand la valeur est identique évite un rechargement
  // inutile au montage.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => {
        const next = search || undefined;
        return current.search === next ? current : { ...current, search: next };
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setError("Impossible de contacter l'API."));
  }, []);

  useEffect(() => {
    Promise.all([getTickets(filters), getTicketStats()])
      .then(([ticketsData, statsData]) => {
        setTickets(ticketsData);
        setStats(statsData);
        setError('');
      })
      .catch(() => setError("Impossible de contacter l'API."));
  }, [filters]);

  async function handleCreate(input: CreateTicketInput) {
    const created = await createTicket(input);

    // On relit la liste plutôt que d'insérer le ticket en tête : c'est le tri
    // et les filtres actifs qui décident de sa place — voire de sa présence.
    const [freshTickets, freshStats] = await Promise.all([
      getTickets(filters),
      getTicketStats(),
    ]);
    setTickets(freshTickets);
    setStats(freshStats);
    setHighlightId(created.id);
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Une seule séquence à l'ouverture : la page se compose de haut en bas
        // au lieu de faire apparaître quatre animations sans rapport.
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('[data-anim="topbar"]', { y: -12, autoAlpha: 0, duration: 0.5 })
          .from(
            '[data-anim="header"]',
            { y: 16, autoAlpha: 0, duration: 0.6 },
            '-=0.25',
          )
          .from(
            '[data-anim="tile"]',
            { y: 18, autoAlpha: 0, duration: 0.5, stagger: 0.07 },
            '-=0.35',
          )
          .from(
            '[data-anim="toolbar"]',
            { y: 12, autoAlpha: 0, duration: 0.45 },
            '-=0.3',
          );
      });
    },
    { scope: pageRef },
  );

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(filters.status) ||
    Boolean(filters.priority) ||
    filters.assignedToId !== undefined;

  return (
    <div ref={pageRef} className="min-h-svh">
      <header
        data-anim="topbar"
        className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
              aria-hidden
            >
              <TicketCheck className="size-4" strokeWidth={2.25} />
            </span>
            <span className="font-heading text-[15px] font-semibold tracking-tight">
              TaskForge
            </span>
          </div>
          <CreateTicketDialog users={users} onCreate={handleCreate} />
        </div>
      </header>

      <StatBand stats={stats} />

      <main className="mx-auto max-w-6xl space-y-5 px-6 py-10">
        {error && (
          <p className="rounded-lg border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div data-anim="toolbar">
          <FilterBar
            filters={filters}
            users={users}
            search={search}
            onSearchChange={setSearch}
            onChange={setFilters}
          />
        </div>

        <TicketTable
          tickets={tickets}
          highlightId={highlightId}
          hasActiveFilters={hasActiveFilters}
        />
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
