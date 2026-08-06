import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { stockageContexte } from './request-context';

/** Un identifiant transmis par un proxy amont doit rester inoffensif en log. */
const IDENTIFIANT_VALIDE = /^[\w-]{1,64}$/;

/**
 * Ouvre le contexte de requête et pose l'en-tête x-request-id.
 *
 * Middleware Express simple plutôt que NestMiddleware : il n'a aucune
 * dépendance à injecter, et `forRoutes('*')` n'est plus une route valide depuis
 * Express 5. Enregistré via `app.use()` dans main.ts, il couvre toutes les
 * routes sans dépendre de la syntaxe de motif du routeur.
 */
export function contexteRequeteMiddleware(
  requete: Request,
  reponse: Response,
  suite: NextFunction,
): void {
  const entrant = requete.headers['x-request-id'];

  // On réutilise l'identifiant amont quand il existe, pour corréler les logs de
  // bout en bout — mais seulement s'il est sain : une valeur libre recopiée
  // telle quelle permettrait d'injecter de fausses lignes JSON.
  const requestId =
    typeof entrant === 'string' && IDENTIFIANT_VALIDE.test(entrant)
      ? entrant
      : randomUUID();

  reponse.setHeader('x-request-id', requestId);

  stockageContexte.run({ requestId }, () => suite());
}
