import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

interface RequeteAuthentifiee extends Request {
  user?: { id?: number };
}

/** Alimente les compteurs HTTP et la présence utilisateur à chaque requête. */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

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
    const debut = Date.now();

    if (typeof requete.user?.id === 'number') {
      this.metrics.marquerUtilisateurActif(requete.user.id);
    }

    return suite.handle().pipe(
      tap({
        next: () =>
          this.metrics.enregistrerRequete(
            requete.method,
            reponse.statusCode,
            Date.now() - debut,
          ),
        error: (erreur: unknown) =>
          this.metrics.enregistrerRequete(
            requete.method,
            this.statutErreur(erreur),
            Date.now() - debut,
          ),
      }),
    );
  }

  private statutErreur(erreur: unknown): number {
    const statut = (erreur as { status?: unknown })?.status;
    return typeof statut === 'number' ? statut : 500;
  }
}
