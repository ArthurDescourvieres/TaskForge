import { MetricsService } from './metrics.service';

/** Extrait la valeur d'une métrique sans label dans la sortie Prometheus. */
function valeur(sortie: string, nom: string): number {
  const ligne = sortie
    .split('\n')
    .find((l) => l.startsWith(`${nom} `) && !l.startsWith('#'));

  if (!ligne) {
    throw new Error(`Métrique ${nom} absente de la sortie`);
  }

  return Number(ligne.split(' ')[1]);
}

describe('MetricsService', () => {
  let metrics: MetricsService;

  beforeEach(() => {
    metrics = new MetricsService();
  });

  describe('format Prometheus', () => {
    it('déclare un HELP et un TYPE pour chaque métrique', () => {
      const sortie = metrics.rendre();
      const noms = sortie
        .split('\n')
        .filter((l) => l.startsWith('# TYPE '))
        .map((l) => l.split(' ')[2]);

      expect(noms.length).toBeGreaterThan(0);
      for (const nom of noms) {
        expect(sortie).toContain(`# HELP ${nom} `);
      }
    });

    it('n’émet que des types Prometheus valides', () => {
      const types = metrics
        .rendre()
        .split('\n')
        .filter((l) => l.startsWith('# TYPE '))
        .map((l) => l.split(' ')[3]);

      for (const type of types) {
        expect(['counter', 'gauge', 'histogram', 'summary']).toContain(type);
      }
    });

    it('expose les trois métriques exigées au CDC', () => {
      const sortie = metrics.rendre();

      // tickets créés, temps moyen de réponse, utilisateurs connectés
      expect(sortie).toContain('taskforge_tickets_created_total');
      expect(sortie).toContain('taskforge_http_request_duration_seconds_avg');
      expect(sortie).toContain('taskforge_users_connected');
    });

    it('émet une série à zéro même sans trafic', () => {
      // Une métrique déclarée sans aucune série se lit comme une panne de
      // collecte plutôt que comme une absence de trafic.
      expect(metrics.rendre()).toContain('taskforge_http_requests_total{');
    });
  });

  describe('tickets créés', () => {
    it('part de zéro', () => {
      expect(valeur(metrics.rendre(), 'taskforge_tickets_created_total')).toBe(
        0,
      );
    });

    it('compte chaque création', () => {
      metrics.incrementerTicketsCrees();
      metrics.incrementerTicketsCrees();
      expect(valeur(metrics.rendre(), 'taskforge_tickets_created_total')).toBe(
        2,
      );
    });
  });

  describe('temps de réponse', () => {
    it('vaut zéro tant qu’aucune requête n’a été traitée', () => {
      const sortie = metrics.rendre();
      expect(
        valeur(sortie, 'taskforge_http_request_duration_seconds_avg'),
      ).toBe(0);
      expect(
        valeur(sortie, 'taskforge_http_request_duration_seconds_count'),
      ).toBe(0);
    });

    it('calcule la moyenne en secondes', () => {
      metrics.enregistrerRequete('GET', 200, 100);
      metrics.enregistrerRequete('GET', 200, 300);

      const sortie = metrics.rendre();
      expect(
        valeur(sortie, 'taskforge_http_request_duration_seconds_avg'),
      ).toBeCloseTo(0.2);
      expect(
        valeur(sortie, 'taskforge_http_request_duration_seconds_sum'),
      ).toBeCloseTo(0.4);
      expect(
        valeur(sortie, 'taskforge_http_request_duration_seconds_count'),
      ).toBe(2);
    });

    it('sépare les séries par méthode et statut', () => {
      metrics.enregistrerRequete('GET', 200, 10);
      metrics.enregistrerRequete('POST', 201, 20);
      metrics.enregistrerRequete('GET', 200, 30);

      const sortie = metrics.rendre();
      expect(sortie).toContain(
        'taskforge_http_requests_total{method="GET",status="200"} 2',
      );
      expect(sortie).toContain(
        'taskforge_http_requests_total{method="POST",status="201"} 1',
      );
    });

    it('agrège les erreurs comme le reste du trafic', () => {
      metrics.enregistrerRequete('GET', 500, 5);
      expect(
        valeur(
          metrics.rendre(),
          'taskforge_http_request_duration_seconds_count',
        ),
      ).toBe(1);
    });
  });

  describe('utilisateurs connectés', () => {
    const T0 = 1_000_000_000_000;

    it('part de zéro', () => {
      expect(metrics.utilisateursConnectes(T0)).toBe(0);
    });

    it('compte chaque utilisateur une seule fois', () => {
      metrics.marquerUtilisateurActif(1, T0);
      metrics.marquerUtilisateurActif(1, T0 + 1000);
      metrics.marquerUtilisateurActif(2, T0);

      expect(metrics.utilisateursConnectes(T0 + 2000)).toBe(2);
    });

    it('oublie un utilisateur inactif au-delà de la fenêtre', () => {
      metrics.marquerUtilisateurActif(1, T0);

      // 15 minutes est la fenêtre retenue ; au-delà l'utilisateur sort.
      expect(metrics.utilisateursConnectes(T0 + 14 * 60_000)).toBe(1);
      expect(metrics.utilisateursConnectes(T0 + 16 * 60_000)).toBe(0);
    });

    it('recompte un utilisateur qui redevient actif', () => {
      metrics.marquerUtilisateurActif(1, T0);
      expect(metrics.utilisateursConnectes(T0 + 16 * 60_000)).toBe(0);

      metrics.marquerUtilisateurActif(1, T0 + 17 * 60_000);
      expect(metrics.utilisateursConnectes(T0 + 17 * 60_000)).toBe(1);
    });
  });
});
