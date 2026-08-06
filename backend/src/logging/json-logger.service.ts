import { Injectable, LoggerService } from '@nestjs/common';
import { createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  levels,
  multistream,
  pino,
  type Logger as PinoLogger,
  type StreamEntry,
} from 'pino';
import { contexteActuel } from './request-context';

export type NiveauLog = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export interface LigneLog {
  timestamp: string;
  level: NiveauLog;
  message: string;
  context: string | null;
  request_id: string | null;
  user_id: number | null;
  [extra: string]: unknown;
}

/**
 * `verbose` n'existe pas chez pino, qui s'arrête à `trace`. On le déclare comme
 * niveau personnalisé plutôt que de le replier sur `trace` : NestJS distingue
 * les deux et le libellé émis doit rester celui que l'appelant a demandé.
 * La valeur 15 le place entre `trace` (10) et `debug` (20).
 */
const NIVEAUX_PERSONNALISES = { verbose: 15 } as const;

/**
 * Logger JSON structuré (S2-01), adossé à pino (ADR-008).
 *
 * Chaque ligne porte au minimum timestamp, level, message, request_id et
 * user_id, ces deux derniers étant repris du contexte de requête courant.
 *
 * Sortie sur stdout — la convention en conteneur — et, si LOG_DIR est défini,
 * duplication dans un fichier destiné au volume Docker partagé.
 */
@Injectable()
export class JsonLogger implements LoggerService {
  private readonly pino: PinoLogger<'verbose'>;

  constructor() {
    this.pino = pino<'verbose'>(
      {
        // Le niveau le plus bas, sinon pino filtrerait debug et verbose : le
        // choix de ce qui est journalisé appartient à l'appelant.
        level: 'verbose',
        customLevels: NIVEAUX_PERSONNALISES,
        // pino nomme ses champs `time`, `level` (numérique) et `msg`. Le CDC
        // impose timestamp, level et message : on redéfinit les trois.
        timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
        messageKey: 'message',
        formatters: {
          level: (libelle) => ({ level: libelle }),
        },
        // Ni pid ni hostname : en conteneur ils ne distinguent rien et
        // alourdissent chaque ligne.
        base: undefined,
        // request_id et user_id sont relus à chaque ligne, y compris depuis une
        // couche qui n'a aucune notion de HTTP.
        mixin: () => {
          const contexte = contexteActuel();
          return {
            request_id: contexte?.requestId ?? null,
            user_id: contexte?.userId ?? null,
          };
        },
      },
      // Chaque flux filtre pour son compte, à `info` par défaut : sans ce
      // réglage, debug et verbose passeraient le logger puis seraient jetés
      // ici. Le mapping des niveaux est nécessaire pour que multistream sache
      // situer `verbose`, qui ne fait pas partie des niveaux standards.
      multistream(this.sorties(), {
        levels: { ...levels.values, ...NIVEAUX_PERSONNALISES },
      }),
    );
  }

  /** stdout, plus le fichier du volume partagé quand LOG_DIR est défini. */
  private sorties(): StreamEntry<'verbose'>[] {
    const flux: StreamEntry<'verbose'>[] = [
      { stream: process.stdout, level: 'verbose' },
    ];
    const dossierLogs = process.env.LOG_DIR;

    if (dossierLogs) {
      try {
        mkdirSync(dossierLogs, { recursive: true });
        flux.push({
          level: 'verbose',
          stream: createWriteStream(join(dossierLogs, 'backend.log'), {
            flags: 'a',
          }),
        });
      } catch (erreur) {
        // Un volume non montable ne doit pas empêcher l'API de démarrer :
        // on retombe sur stdout seul.
        process.stderr.write(
          `[logger] écriture fichier désactivée : ${(erreur as Error).message}\n`,
        );
      }
    }

    return flux;
  }

  log(message: unknown, context?: string): void {
    this.ecrire('info', message, context);
  }

  error(message: unknown, stack?: string, context?: string): void {
    this.ecrire('error', message, context, stack ? { stack } : undefined);
  }

  warn(message: unknown, context?: string): void {
    this.ecrire('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.ecrire('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.ecrire('verbose', message, context);
  }

  /** Point d'entrée des logs applicatifs portant des champs supplémentaires. */
  ecrireEvenement(
    niveau: NiveauLog,
    message: string,
    extra: Record<string, unknown>,
    context?: string,
  ): void {
    this.ecrire(niveau, message, context, extra);
  }

  private ecrire(
    niveau: NiveauLog,
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>,
  ): void {
    this.pino[niveau](
      { context: context ?? null, ...extra },
      typeof message === 'string' ? message : JSON.stringify(message),
    );
  }
}
