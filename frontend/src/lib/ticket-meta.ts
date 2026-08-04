import type { TicketPriority, TicketStatus } from '@/types';

/**
 * Priorité et statut sont deux dimensions différentes, donc deux encodages
 * visuels différents : la priorité est un liseré de sévérité en bord de ligne
 * (on la scanne verticalement), le statut une pastille à point (on la lit).
 */

export const PRIORITY_META: Record<
  TicketPriority,
  { label: string; stripe: string; chip: string }
> = {
  CRITIQUE: {
    label: 'Critique',
    stripe: 'bg-sev-critique',
    chip: 'bg-sev-critique/12 text-sev-critique-ink',
  },
  HAUTE: {
    label: 'Haute',
    stripe: 'bg-sev-haute',
    chip: 'bg-sev-haute/14 text-sev-haute-ink',
  },
  MOYENNE: {
    label: 'Moyenne',
    stripe: 'bg-sev-moyenne',
    chip: 'bg-sev-moyenne/14 text-sev-moyenne-ink',
  },
  BASSE: {
    label: 'Basse',
    stripe: 'bg-sev-basse',
    chip: 'bg-sev-basse/18 text-sev-basse-ink',
  },
};

export const STATUS_META: Record<
  TicketStatus,
  { label: string; dot: string; pill: string }
> = {
  OUVERT: {
    label: 'Ouvert',
    dot: 'bg-st-ouvert',
    pill: 'border-st-ouvert/35 text-st-ouvert-ink bg-st-ouvert/6',
  },
  EN_COURS: {
    label: 'En cours',
    dot: 'bg-st-encours',
    pill: 'border-st-encours/35 text-st-encours-ink bg-st-encours/8',
  },
  RESOLU: {
    label: 'Résolu',
    dot: 'bg-st-resolu',
    pill: 'border-st-resolu/35 text-st-resolu-ink bg-st-resolu/8',
  },
  FERME: {
    label: 'Fermé',
    dot: 'bg-st-ferme',
    pill: 'border-st-ferme/35 text-st-ferme-ink bg-st-ferme/10',
  },
};

export const PRIORITIES = Object.keys(PRIORITY_META) as TicketPriority[];
export const STATUSES = Object.keys(STATUS_META) as TicketStatus[];

/**
 * Transitions proposées dans l'interface. Doit rester aligné sur
 * `isValidStatusTransition` côté backend, qui reste seul juge : ceci ne sert
 * qu'à ne pas proposer une action qui serait refusée. Un ticket fermé est
 * terminal, d'où la liste vide.
 */
export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OUVERT: ['EN_COURS', 'FERME'],
  EN_COURS: ['RESOLU', 'FERME'],
  RESOLU: ['FERME'],
  FERME: [],
};
