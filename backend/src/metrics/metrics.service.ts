import { Injectable } from '@nestjs/common';

/**
 * Fenêtre au-delà de laquelle un utilisateur n'est plus compté comme connecté.
 *
 * L'authentification JWT étant sans état, « connecté » n'a pas de définition
 * exacte : on retient « a émis une requête authentifiée dans les 15 dernières
 * minutes ». La convention est documentée dans l'aide de la métrique.
 */
const FENETRE_ACTIVITE_MS = 15 * 60 * 1000;

interface CompteurRequetes {
  total: number;
  dureeTotaleMs: number;
}

@Injectable()
export class MetricsService {
  private ticketsCrees = 0;
  private readonly requetes = new Map<string, CompteurRequetes>();
  private readonly derniereActivite = new Map<number, number>();

  /** Événement métier, incrémenté à la création effective d'un ticket. */
  incrementerTicketsCrees(): void {
    this.ticketsCrees += 1;
  }

  enregistrerRequete(methode: string, statut: number, dureeMs: number): void {
    const cle = `${methode}|${statut}`;
    const courant = this.requetes.get(cle) ?? { total: 0, dureeTotaleMs: 0 };

    courant.total += 1;
    courant.dureeTotaleMs += dureeMs;
    this.requetes.set(cle, courant);
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

  /** Somme des durées et nombre total, tous couples méthode/statut confondus. */
  private agregatRequetes(): { total: number; dureeTotaleMs: number } {
    let total = 0;
    let dureeTotaleMs = 0;

    for (const compteur of this.requetes.values()) {
      total += compteur.total;
      dureeTotaleMs += compteur.dureeTotaleMs;
    }

    return { total, dureeTotaleMs };
  }

  /** Exposition au format texte Prometheus (version 0.0.4). */
  rendre(maintenant = Date.now()): string {
    const { total, dureeTotaleMs } = this.agregatRequetes();
    const lignes: string[] = [];

    lignes.push(
      '# HELP taskforge_tickets_created_total Nombre de tickets créés depuis le démarrage du processus.',
      '# TYPE taskforge_tickets_created_total counter',
      `taskforge_tickets_created_total ${this.ticketsCrees}`,
      '',
      '# HELP taskforge_http_requests_total Requêtes HTTP traitées, par méthode et code de statut.',
      '# TYPE taskforge_http_requests_total counter',
    );

    if (this.requetes.size === 0) {
      // Une métrique déclarée sans série laisserait croire à une panne de
      // collecte plutôt qu'à une absence de trafic.
      lignes.push('taskforge_http_requests_total{method="none",status="0"} 0');
    } else {
      for (const [cle, compteur] of this.requetes) {
        const [methode, statut] = cle.split('|');
        lignes.push(
          `taskforge_http_requests_total{method="${methode}",status="${statut}"} ${compteur.total}`,
        );
      }
    }

    lignes.push(
      '',
      '# HELP taskforge_http_request_duration_seconds_sum Temps cumulé de traitement des requêtes HTTP.',
      '# TYPE taskforge_http_request_duration_seconds_sum counter',
      `taskforge_http_request_duration_seconds_sum ${(dureeTotaleMs / 1000).toFixed(6)}`,
      '',
      '# HELP taskforge_http_request_duration_seconds_count Nombre de requêtes prises en compte dans la somme.',
      '# TYPE taskforge_http_request_duration_seconds_count counter',
      `taskforge_http_request_duration_seconds_count ${total}`,
      '',
      '# HELP taskforge_http_request_duration_seconds_avg Temps moyen de réponse de l’API depuis le démarrage.',
      '# TYPE taskforge_http_request_duration_seconds_avg gauge',
      `taskforge_http_request_duration_seconds_avg ${
        total === 0 ? '0' : (dureeTotaleMs / total / 1000).toFixed(6)
      }`,
      '',
      `# HELP taskforge_users_connected Utilisateurs ayant émis une requête authentifiée dans les ${
        FENETRE_ACTIVITE_MS / 60000
      } dernières minutes.`,
      '# TYPE taskforge_users_connected gauge',
      `taskforge_users_connected ${this.utilisateursConnectes(maintenant)}`,
      '',
      '# HELP taskforge_process_uptime_seconds Temps écoulé depuis le démarrage du processus.',
      '# TYPE taskforge_process_uptime_seconds gauge',
      `taskforge_process_uptime_seconds ${process.uptime().toFixed(3)}`,
      '',
    );

    return lignes.join('\n');
  }
}
