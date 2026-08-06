import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type EtatComposant = 'up' | 'down';

export interface RapportSante {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  components: {
    api: { status: EtatComposant };
    database: { status: EtatComposant; latencyMs?: number; reason?: string };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Rapport complet : état de chaque composant, tel que demandé au CDC. */
  async check(): Promise<RapportSante> {
    const database = await this.checkDatabase();

    return {
      // L'API répond forcément puisqu'elle sert cette requête ; seule la base
      // peut faire basculer l'ensemble en « degraded ».
      status: database.status === 'up' ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      components: {
        api: { status: 'up' },
        database,
      },
    };
  }

  /** Readiness : le service n'est prêt que si la base répond. */
  async isReady(): Promise<boolean> {
    const database = await this.checkDatabase();
    return database.status === 'up';
  }

  private async checkDatabase(): Promise<
    RapportSante['components']['database']
  > {
    const debut = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - debut };
    } catch (erreur) {
      // Le détail part dans les logs, pas dans la réponse : /health est public
      // et un message d'erreur Postgres expose l'hôte et l'utilisateur.
      this.logger.error(
        `Vérification base de données en échec : ${(erreur as Error).message}`,
      );
      return { status: 'down', reason: 'connexion à la base indisponible' };
    }
  }
}
