import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

/**
 * Fenêtre au-delà de laquelle un utilisateur n'est plus compté comme connecté.
 *
 * L'authentification JWT étant sans état, « connecté » n'a pas de définition
 * exacte : on retient « a émis une requête authentifiée dans les 15 dernières
 * minutes ». La convention est documentée dans l'aide de la métrique.
 */
const FENETRE_ACTIVITE_MS = 15 * 60 * 1000;

@Injectable()
export class MetricsService {
  /**
   * Registre propre à l'instance plutôt que le registre global de prom-client.
   *
   * Le registre global est un singleton de module : deux instanciations —
   * typiquement un `new MetricsService()` par test — lèveraient « a metric with
   * the name … has already been registered ». Un registre par instance rend le
   * service isolable et testable sans état partagé entre fichiers de test.
   */
  private readonly registre = new Registry();

  private readonly ticketsCrees: Counter;
  private readonly requetesHttp: Counter<'method' | 'status'>;
  private readonly dureeRequetes: Histogram;
  private readonly dureeMoyenne: Gauge;
  private readonly utilisateurs: Gauge;
  private readonly uptime: Gauge;

  /** Sommes tenues à part : le calcul de la moyenne ne se lit pas dans l'histogramme. */
  private requetesTotal = 0;
  private dureeTotaleMs = 0;

  private readonly derniereActivite = new Map<number, number>();

  constructor() {
    this.ticketsCrees = new Counter({
      name: 'taskforge_tickets_created_total',
      help: 'Nombre de tickets créés depuis le démarrage du processus.',
      registers: [this.registre],
    });

    this.requetesHttp = new Counter({
      name: 'taskforge_http_requests_total',
      help: 'Requêtes HTTP traitées, par méthode et code de statut.',
      labelNames: ['method', 'status'],
      registers: [this.registre],
    });

    // Une métrique à labels sans aucune série se lit comme une panne de
    // collecte plutôt que comme une absence de trafic : on amorce à zéro.
    this.requetesHttp.inc({ method: 'none', status: '0' }, 0);

    this.dureeRequetes = new Histogram({
      name: 'taskforge_http_request_duration_seconds',
      help: 'Distribution du temps de traitement des requêtes HTTP.',
      // Buckets par défaut de prom-client, adaptés à une API web (5 ms → 10 s).
      // L'histogramme fournit _sum et _count, et permet en plus de calculer des
      // quantiles côté Prometheus — ce que la moyenne seule ne permet pas.
      registers: [this.registre],
    });

    this.dureeMoyenne = new Gauge({
      name: 'taskforge_http_request_duration_seconds_avg',
      help: 'Temps moyen de réponse de l’API depuis le démarrage.',
      registers: [this.registre],
    });

    this.utilisateurs = new Gauge({
      name: 'taskforge_users_connected',
      help: `Utilisateurs ayant émis une requête authentifiée dans les ${
        FENETRE_ACTIVITE_MS / 60000
      } dernières minutes.`,
      registers: [this.registre],
    });

    this.uptime = new Gauge({
      name: 'taskforge_process_uptime_seconds',
      help: 'Temps écoulé depuis le démarrage du processus.',
      registers: [this.registre],
    });

    // Métriques process et Node (CPU, mémoire, event loop, handles). C'est le
    // gain concret de prom-client : elles ne coûtent rien à écrire ici et
    // alimentent un Grafana sans travail supplémentaire.
    collectDefaultMetrics({ register: this.registre });
  }

  /** Événement métier, incrémenté à la création effective d'un ticket. */
  incrementerTicketsCrees(): void {
    this.ticketsCrees.inc();
  }

  enregistrerRequete(methode: string, statut: number, dureeMs: number): void {
    this.requetesHttp.inc({ method: methode, status: String(statut) });
    this.dureeRequetes.observe(dureeMs / 1000);

    this.requetesTotal += 1;
    this.dureeTotaleMs += dureeMs;
  }

  marquerUtilisateurActif(userId: number, maintenant = Date.now()): void {
    this.derniereActivite.set(userId, maintenant);
  }

  utilisateursConnectes(maintenant = Date.now()): number {
    let actifs = 0;

    for (const [userId, vuA] of this.derniereActivite) {
      if (maintenant - vuA <= FENETRE_ACTIVITE_MS) {
        actifs += 1;
      } else {
        // Purge opportuniste : la table ne grossit pas indéfiniment.
        this.derniereActivite.delete(userId);
      }
    }

    return actifs;
  }

  /**
   * Exposition au format texte Prometheus (version 0.0.4).
   *
   * Les trois jauges dérivées sont rafraîchies ici plutôt que via un `collect()`
   * par métrique : le point de mesure reste explicite et `maintenant` reste
   * injectable, ce dont dépendent les tests de la fenêtre d'activité.
   */
  async rendre(maintenant = Date.now()): Promise<string> {
    this.dureeMoyenne.set(
      this.requetesTotal === 0
        ? 0
        : this.dureeTotaleMs / this.requetesTotal / 1000,
    );
    this.utilisateurs.set(this.utilisateursConnectes(maintenant));
    this.uptime.set(Number(process.uptime().toFixed(3)));

    return this.registre.metrics();
  }

  /**
   * Content-Type attendu par un collecteur Prometheus.
   *
   * Le contrôleur écrit cet en-tête en dur — `@Header()` est évalué avant toute
   * injection. L'exposer ici permet au test de vérifier que la valeur codée en
   * dur correspond toujours à celle de prom-client.
   */
  get typeContenu(): string {
    return this.registre.contentType;
  }
}
