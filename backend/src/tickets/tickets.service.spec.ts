import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import { TicketsService } from './tickets.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PrismaService } from '../prisma/prisma.service';

describe('TicketsService — assignation (S1-05)', () => {
  const ticketFindUnique = jest.fn();
  const ticketUpdate = jest.fn();
  const userFindUnique = jest.fn();

  const prisma = {
    ticket: { findUnique: ticketFindUnique, update: ticketUpdate },
    user: { findUnique: userFindUnique },
  } as unknown as PrismaService;

  let metrics: MetricsService;
  let service: TicketsService;

  const TICKET_OUVERT = { id: 1, status: 'OUVERT', resolvedAt: null };

  beforeEach(() => {
    jest.clearAllMocks();
    metrics = new MetricsService();
    service = new TicketsService(prisma, metrics);
    ticketUpdate.mockImplementation(({ data }: { data: unknown }) => ({
      ...TICKET_OUVERT,
      ...(data as object),
    }));
  });

  describe('destinataire valide', () => {
    it.each(['TECHNICIEN', 'ADMIN'])('accepte un %s', async (role) => {
      ticketFindUnique.mockResolvedValue(TICKET_OUVERT);
      userFindUnique.mockResolvedValue({ id: 9, role });

      await expect(service.assign(1, 9)).resolves.toMatchObject({
        assignedToId: 9,
      });
    });

    it('écrit bien l’assignation en base', async () => {
      ticketFindUnique.mockResolvedValue(TICKET_OUVERT);
      userFindUnique.mockResolvedValue({ id: 9, role: 'TECHNICIEN' });

      await service.assign(1, 9);

      expect(ticketUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { assignedToId: 9 },
        }),
      );
    });
  });

  describe('destinataire refusé', () => {
    it('refuse un utilisateur standard', async () => {
      // Assigner à un USER produirait une charge que l'intéressé n'a même pas
      // le droit de faire avancer : les mutations lui sont interdites.
      ticketFindUnique.mockResolvedValue(TICKET_OUVERT);
      userFindUnique.mockResolvedValue({ id: 5, role: 'USER' });

      await expect(service.assign(1, 5)).rejects.toThrow(BadRequestException);
      expect(ticketUpdate).not.toHaveBeenCalled();
    });

    it('refuse un utilisateur inexistant', async () => {
      ticketFindUnique.mockResolvedValue(TICKET_OUVERT);
      userFindUnique.mockResolvedValue(null);

      await expect(service.assign(1, 404)).rejects.toThrow(NotFoundException);
      expect(ticketUpdate).not.toHaveBeenCalled();
    });
  });

  describe('désassignation', () => {
    it('accepte null sans chercher de destinataire', async () => {
      ticketFindUnique.mockResolvedValue(TICKET_OUVERT);

      await service.assign(1, null);

      expect(userFindUnique).not.toHaveBeenCalled();
      expect(ticketUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { assignedToId: null } }),
      );
    });
  });

  describe('ticket introuvable ou fermé', () => {
    it('refuse un ticket inexistant', async () => {
      ticketFindUnique.mockResolvedValue(null);

      await expect(service.assign(42, 9)).rejects.toThrow(NotFoundException);
    });

    it('refuse un ticket fermé', async () => {
      ticketFindUnique.mockResolvedValue({ ...TICKET_OUVERT, status: 'FERME' });
      userFindUnique.mockResolvedValue({ id: 9, role: 'TECHNICIEN' });

      await expect(service.assign(1, 9)).rejects.toThrow(BadRequestException);
      expect(ticketUpdate).not.toHaveBeenCalled();
    });
  });

  describe('la règle n’est pas contournable par le PATCH générique', () => {
    it('valide aussi le destinataire passé à update()', async () => {
      ticketFindUnique.mockResolvedValue(TICKET_OUVERT);
      userFindUnique.mockResolvedValue({ id: 5, role: 'USER' });

      await expect(service.update(1, { assignedToId: 5 })).rejects.toThrow(
        BadRequestException,
      );
      expect(ticketUpdate).not.toHaveBeenCalled();
    });

    it('laisse passer une mise à jour sans assignation', async () => {
      ticketFindUnique.mockResolvedValue(TICKET_OUVERT);

      await service.update(1, { title: 'Titre corrigé' });

      expect(userFindUnique).not.toHaveBeenCalled();
      expect(ticketUpdate).toHaveBeenCalled();
    });
  });

  describe('compteur de tickets créés (S2-02)', () => {
    it('n’incrémente qu’après une écriture réussie', async () => {
      const create = jest
        .fn()
        .mockRejectedValue(new Error('contrainte violée'));
      const prismaEnEchec = {
        ticket: { create },
      } as unknown as PrismaService;
      const serviceEnEchec = new TicketsService(prismaEnEchec, metrics);

      await expect(
        serviceEnEchec.create({ title: 't', description: 'd' }, 1),
      ).rejects.toThrow();

      expect(await metrics.rendre()).toContain(
        'taskforge_tickets_created_total 0',
      );
    });
  });
});
