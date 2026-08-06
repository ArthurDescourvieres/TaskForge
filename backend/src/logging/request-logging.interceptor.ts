import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { JsonLogger } from './json-logger.service';
import { associerUtilisateur } from './request-context';

interface RequeteAuthentifiee extends Request {
  user?: { id?: number };
}

/**
 * Chemin de route déclaré (`/tickets/:id`) plutôt qu'URL concrète : sans ça
 * chaque identifiant produirait une série de logs distincte, inagrégeable.
 */
function cheminRoute(requete: RequeteAuthentifiee): string {
  const route = (requete as { route?: { path?: string } }).route;
  return route?.path ?? requete.originalUrl;
}

/**
 * Journalise chaque requête HTTP terminée et rattache l'utilisateur au contexte.
 *
 * Les intercepteurs s'exécutent après les gardes : `request.user` est donc déjà
 * renseigné ici, ce qui n'est pas le cas dans le middleware de contexte.
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: JsonLogger) {}

  intercept(
    contexte: ExecutionContext,
    suite: CallHandler,
  ): Observable<unknown> {
    if (contexte.getType() !== 'http') {
      return suite.handle();
    }

    const http = contexte.switchToHttp();
    const requete = http.getRequest<RequeteAuthentifiee>();
    const reponse = http.getResponse<Response>();

    if (typeof requete.user?.id === 'number') {
      associerUtilisateur(requete.user.id);
    }

    const debut = Date.now();

    return suite.handle().pipe(
      tap({
        next: () => this.journaliser(requete, reponse.statusCode, debut),
        error: (erreur: unknown) =>
          this.journaliser(requete, this.statutErreur(erreur), debut),
      }),
    );
  }

  private journaliser(
    requete: RequeteAuthentifiee,
    statut: number,
    debut: number,
  ): void {
    this.logger.ecrireEvenement(
      statut >= 500 ? 'error' : 'info',
      `${requete.method} ${requete.originalUrl} ${statut}`,
      {
        http_method: requete.method,
        http_path: cheminRoute(requete),
        http_status: statut,
        duration_ms: Date.now() - debut,
      },
      'HTTP',
    );
  }

  private statutErreur(erreur: unknown): number {
    const statut = (erreur as { status?: unknown })?.status;
    return typeof statut === 'number' ? statut : 500;
  }
}
