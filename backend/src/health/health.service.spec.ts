import { Logger } from '@nestjs/common';
import { HealthService } from './health.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PrismaService } from '../prisma/prisma.service';

function mockPrisma(queryRaw: jest.Mock) {
  return { $queryRaw: queryRaw } as unknown as PrismaService;
}

describe('HealthService', () => {
  beforeEach(() => {
    // Le service journalise l'échec base : on évite de polluer la sortie Jest.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('base joignable', () => {
    const service = new HealthService(
      mockPrisma(jest.fn().mockResolvedValue([{ '?column?': 1 }])),
    );

    it('rapporte un état global ok', async () => {
      const rapport = await service.check();
      expect(rapport.status).toBe('ok');
    });

    it('rapporte chaque composant comme up', async () => {
      const rapport = await service.check();
      expect(rapport.components.api.status).toBe('up');
      expect(rapport.components.database.status).toBe('up');
    });

    it('mesure la latence de la base', async () => {
      const rapport = await service.check();
      expect(rapport.components.database.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('se déclare prêt', async () => {
      await expect(service.isReady()).resolves.toBe(true);
    });
  });

  describe('base injoignable', () => {
    const service = new HealthService(
      mockPrisma(jest.fn().mockRejectedValue(new Error('ECONNREFUSED'))),
    );

    it('bascule l’état global en degraded', async () => {
      const rapport = await service.check();
      expect(rapport.status).toBe('degraded');
    });

    it('laisse l’API up et marque la base down', async () => {
      const rapport = await service.check();
      expect(rapport.components.api.status).toBe('up');
      expect(rapport.components.database.status).toBe('down');
    });

    it('n’expose pas le détail de l’erreur dans la réponse', async () => {
      // /health est public : un message Postgres brut divulguerait l'hôte et
      // l'utilisateur de la base.
      const rapport = await service.check();
      expect(JSON.stringify(rapport)).not.toContain('ECONNREFUSED');
      expect(rapport.components.database.reason).toBe(
        'connexion à la base indisponible',
      );
    });

    it('ne se déclare pas prêt', async () => {
      await expect(service.isReady()).resolves.toBe(false);
    });
  });

  it('expose un uptime et un timestamp exploitables', async () => {
    const service = new HealthService(
      mockPrisma(jest.fn().mockResolvedValue([{ '?column?': 1 }])),
    );
    const rapport = await service.check();

    expect(rapport.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(new Date(rapport.timestamp).toISOString()).toBe(rapport.timestamp);
  });
});
