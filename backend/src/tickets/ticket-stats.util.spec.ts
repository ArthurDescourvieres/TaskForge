import {
  averageResolutionHours,
  countByPriority,
  countByStatus,
  TicketSample,
} from './ticket-stats.util';

const HEURE = 3_600_000;
const BASE = new Date('2026-08-01T08:00:00.000Z');

/** Construit un échantillon minimal ; `heures` à null laisse le ticket non résolu. */
function ticket(
  heures: number | null,
  overrides: Partial<TicketSample> = {},
): TicketSample {
  return {
    status: heures === null ? 'OUVERT' : 'RESOLU',
    priority: 'MOYENNE',
    createdAt: BASE,
    resolvedAt:
      heures === null ? null : new Date(BASE.getTime() + heures * HEURE),
    ...overrides,
  };
}

describe('averageResolutionHours', () => {
  it('retourne null sur un échantillon vide', () => {
    expect(averageResolutionHours([])).toBeNull();
  });

  it('retourne null quand aucun ticket n’est résolu', () => {
    // Point central : une moyenne sur zéro élément n'existe pas. Retourner 0
    // laisserait croire à une résolution instantanée, ce qui est faux.
    expect(averageResolutionHours([ticket(null), ticket(null)])).toBeNull();
  });

  it('calcule la moyenne sur un ticket unique', () => {
    expect(averageResolutionHours([ticket(4)])).toBe(4);
  });

  it('calcule la moyenne sur plusieurs tickets', () => {
    expect(averageResolutionHours([ticket(2), ticket(4), ticket(6)])).toBe(4);
  });

  it('exclut les tickets non résolus au lieu de les compter comme zéro', () => {
    // Avec 3 tickets dont 1 seul résolu en 6 h : la moyenne est 6 (6/1),
    // pas 2 (6/3). C'est la régression la plus probable sur cette fonction.
    expect(
      averageResolutionHours([ticket(6), ticket(null), ticket(null)]),
    ).toBe(6);
  });

  it('gère les durées inférieures à l’heure', () => {
    expect(averageResolutionHours([ticket(0.5), ticket(1.5)])).toBe(1);
  });

  it('se fonde sur resolvedAt et non sur le statut', () => {
    // Un ticket fermé porte aussi une date de résolution : il doit compter.
    // Inversement un ticket marqué RESOLU sans date ne peut pas être mesuré.
    const ferme = ticket(3, { status: 'FERME' });
    const resoluSansDate = ticket(null, { status: 'RESOLU' });
    expect(averageResolutionHours([ferme, resoluSansDate])).toBe(3);
  });
});

describe('countByStatus', () => {
  it('retourne les quatre statuts à zéro sur un échantillon vide', () => {
    expect(countByStatus([])).toEqual({
      OUVERT: 0,
      EN_COURS: 0,
      RESOLU: 0,
      FERME: 0,
    });
  });

  it('compte chaque statut et conserve les clés absentes à zéro', () => {
    const echantillon: TicketSample[] = [
      ticket(null, { status: 'OUVERT' }),
      ticket(null, { status: 'OUVERT' }),
      ticket(2, { status: 'RESOLU' }),
    ];

    expect(countByStatus(echantillon)).toEqual({
      OUVERT: 2,
      EN_COURS: 0,
      RESOLU: 1,
      FERME: 0,
    });
  });
});

describe('countByPriority', () => {
  it('retourne les quatre priorités à zéro sur un échantillon vide', () => {
    expect(countByPriority([])).toEqual({
      BASSE: 0,
      MOYENNE: 0,
      HAUTE: 0,
      CRITIQUE: 0,
    });
  });

  it('compte chaque priorité et conserve les clés absentes à zéro', () => {
    const echantillon: TicketSample[] = [
      ticket(null, { priority: 'CRITIQUE' }),
      ticket(null, { priority: 'BASSE' }),
      ticket(null, { priority: 'CRITIQUE' }),
    ];

    expect(countByPriority(echantillon)).toEqual({
      BASSE: 1,
      MOYENNE: 0,
      HAUTE: 0,
      CRITIQUE: 2,
    });
  });
});
