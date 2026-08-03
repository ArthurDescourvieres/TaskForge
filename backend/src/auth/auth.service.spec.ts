import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt');
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  const findUnique = jest.fn();
  const create = jest.fn();

  const prisma = {
    user: {
      findUnique,
      create,
    },
  } as unknown as PrismaService;

  const jwtService = {
    sign: jest.fn().mockReturnValue('signed.jwt.token'),
  } as unknown as JwtService;

  const service = new AuthService(prisma, jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('retourne un access_token si les credentials sont valides', async () => {
      findUnique.mockResolvedValue({
        id: 1,
        email: 'user@taskforge.local',
        name: 'User',
        role: 'USER',
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'user@taskforge.local',
        password: 'changeme',
      });

      expect(result.access_token).toBe('signed.jwt.token');
      expect(result.user).toEqual({
        id: 1,
        email: 'user@taskforge.local',
        name: 'User',
        role: 'USER',
      });
    });

    it('refuse un mot de passe incorrect', async () => {
      findUnique.mockResolvedValue({
        id: 1,
        email: 'user@taskforge.local',
        name: 'User',
        role: 'USER',
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@taskforge.local', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('crée un utilisateur USER et retourne un token', async () => {
      findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      create.mockResolvedValue({
        id: 2,
        email: 'new@taskforge.local',
        name: 'New',
        role: 'USER',
      });

      const result = await service.register({
        email: 'new@taskforge.local',
        password: 'secret1',
        name: 'New',
      });

      expect(create).toHaveBeenCalledWith({
        data: {
          email: 'new@taskforge.local',
          name: 'New',
          password: 'hashed',
          role: 'USER',
        },
      });
      expect(result.access_token).toBe('signed.jwt.token');
    });

    it('refuse un email déjà utilisé', async () => {
      findUnique.mockResolvedValue({ id: 1 });

      await expect(
        service.register({
          email: 'taken@taskforge.local',
          password: 'secret1',
          name: 'Taken',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
