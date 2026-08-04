import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

jest.mock('bcrypt');
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  const findUnique = jest.fn();
  const create = jest.fn();
  const update = jest.fn();

  const prisma = {
    user: { findUnique, create, update },
  } as unknown as PrismaService;

  const service = new UsersService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('crée un compte avec le rôle demandé et un mot de passe haché', async () => {
      findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      create.mockResolvedValue({
        id: 4,
        email: 'tech@taskforge.local',
        name: 'Tech',
        role: 'TECHNICIEN',
      });

      const result = await service.create({
        email: 'tech@taskforge.local',
        password: 'motdepasse-solide',
        name: 'Tech',
        role: 'TECHNICIEN',
      });

      expect(create).toHaveBeenCalledWith({
        data: {
          email: 'tech@taskforge.local',
          name: 'Tech',
          role: 'TECHNICIEN',
          password: 'hashed',
        },
        select: { id: true, name: true, email: true, role: true },
      });
      expect(result).not.toHaveProperty('password');
    });

    it('refuse un email déjà utilisé', async () => {
      findUnique.mockResolvedValue({ id: 1 });

      await expect(
        service.create({
          email: 'admin@taskforge.local',
          password: 'motdepasse-solide',
          name: 'Doublon',
          role: 'USER',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('change le rôle d’un autre compte', async () => {
      findUnique.mockResolvedValue({ id: 2, role: 'USER' });
      update.mockResolvedValue({
        id: 2,
        email: 'user@taskforge.local',
        name: 'User',
        role: 'TECHNICIEN',
      });

      const result = await service.updateRole(2, 'TECHNICIEN', 1);

      expect(result.role).toBe('TECHNICIEN');
    });

    // Le demandeur est forcément admin (@Roles('ADMIN')) : lui interdire de se
    // rétrograder garantit qu'il reste toujours au moins un admin.
    it('refuse à un admin de modifier son propre rôle', async () => {
      await expect(service.updateRole(1, 'USER', 1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(update).not.toHaveBeenCalled();
    });

    it('refuse un utilisateur inexistant', async () => {
      findUnique.mockResolvedValue(null);

      await expect(service.updateRole(99, 'ADMIN', 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
