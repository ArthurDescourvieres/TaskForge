import { Injectable, LoggerService } from '@nestjs/common';
import { createWriteStream, mkdirSync, WriteStream } from 'node:fs';
import { join } from 'node:path';
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
 * Logger JSON structuré (S2-01).
 *
 * Chaque ligne porte au minimum timestamp, level, message, request_id et
 * user_id, ces deux derniers étant repris du contexte de requête courant.
 *
 * Sortie sur stdout — la convention en conteneur — et, si LOG_DIR est défini,
 * duplication dans un fichier destiné au volume Docker partagé.
 */
@Injectable()
export class JsonLogger implements LoggerService {
  private readonly fichier?: WriteStream;

  constructor() {
    const dossierLogs = process.env.LOG_DIR;
    if (dossierLogs) {
      try {
        mkdirSync(dossierLogs, { recursive: true });
        this.fichier = createWriteStream(join(dossierLogs, 'backend.log'), {
          flags: 'a',
        });
      } catch (erreur) {
        // Un volume non montable ne doit pas empêcher l'API de démarrer :
        // on retombe sur stdout seul.
        process.stderr.write(
          `[logger] écriture fichier désactivée : ${(erreur as Error).message}\n`,
        );
      }
    }
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

  formatter(
    niveau: NiveauLog,
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>,
  ): LigneLog {
    const contexte = contexteActuel();

    return {
      timestamp: new Date().toISOString(),
      level: niveau,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      context: context ?? null,
      request_id: contexte?.requestId ?? null,
      user_id: contexte?.userId ?? null,
      ...extra,
    };
  }

  private ecrire(
    niveau: NiveauLog,
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>,
  ): void {
    const ligne = `${JSON.stringify(this.formatter(niveau, message, context, extra))}\n`;

    process.stdout.write(ligne);
    this.fichier?.write(ligne);
  }
}
