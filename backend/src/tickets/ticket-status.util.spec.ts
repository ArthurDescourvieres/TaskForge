import { TicketStatus } from '../generated/prisma/client';
import { isValidStatusTransition } from './ticket-status.util';

const STATUSES: TicketStatus[] = ['OUVERT', 'EN_COURS', 'RESOLU', 'FERME'];

/**
 * Matrice de référence, réécrite à la main depuis le cahier des charges plutôt
 * que dérivée de l'implémentation : un test qui recopie la table du code ne
 * vérifie rien d'autre que sa propre copie.
 *
 * Chaque entrée liste les cibles autorisées depuis un statut, statut identique
 * inclus (une mise à jour qui ne change pas le statut doit passer).
 */
const AUTORISEES: Record<TicketStatus, TicketStatus[]> = {
  OUVERT: ['OUVERT', 'EN_COURS', 'FERME'],
  EN_COURS: ['EN_COURS', 'RESOLU', 'FERME'],
  RESOLU: ['RESOLU', 'FERME'],
  FERME: ['FERME'],
};

describe('isValidStatusTransition', () => {
  describe('cycle de vie nominal', () => {
    it('suit la progression ouvert → en cours → résolu → fermé', () => {
      expect(isValidStatusTransition('OUVERT', 'EN_COURS')).toBe(true);
      expect(isValidStatusTransition('EN_COURS', 'RESOLU')).toBe(true);
      expect(isValidStatusTransition('RESOLU', 'FERME')).toBe(true);
    });
  });

  describe('fermeture anticipée', () => {
    it('autorise la fermeture directe depuis ouvert', () => {
      expect(isValidStatusTransition('OUVERT', 'FERME')).toBe(true);
    });

    it('autorise la fermeture directe depuis en cours', () => {
      expect(isValidStatusTransition('EN_COURS', 'FERME')).toBe(true);
    });
  });

  describe('transitions interdites', () => {
    it('refuse de sauter l’étape en cours', () => {
      expect(isValidStatusTransition('OUVERT', 'RESOLU')).toBe(false);
    });

    it('refuse tout retour en arrière', () => {
      expect(isValidStatusTransition('EN_COURS', 'OUVERT')).toBe(false);
      expect(isValidStatusTransition('RESOLU', 'EN_COURS')).toBe(false);
      expect(isValidStatusTransition('RESOLU', 'OUVERT')).toBe(false);
    });

    it('traite fermé comme un état terminal', () => {
      expect(isValidStatusTransition('FERME', 'OUVERT')).toBe(false);
      expect(isValidStatusTransition('FERME', 'EN_COURS')).toBe(false);
      expect(isValidStatusTransition('FERME', 'RESOLU')).toBe(false);
    });
  });

  describe('idempotence', () => {
    it.each(STATUSES)('accepte %s vers lui-même', (statut) => {
      expect(isValidStatusTransition(statut, statut)).toBe(true);
    });
  });

  describe('matrice complète', () => {
    // Les 16 combinaisons possibles sont couvertes explicitement : les cas
    // ci-dessus documentent l'intention, celui-ci garantit qu'aucune paire
    // n'échappe au contrôle.
    const paires = STATUSES.flatMap((depuis) =>
      STATUSES.map((vers) => ({
        depuis,
        vers,
        attendu: AUTORISEES[depuis].includes(vers),
      })),
    );

    it.each(paires)(
      '$depuis → $vers vaut $attendu',
      ({ depuis, vers, attendu }) => {
        expect(isValidStatusTransition(depuis, vers)).toBe(attendu);
      },
    );
  });
});
