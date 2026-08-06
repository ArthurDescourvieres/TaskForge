import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../auth.types';
import { RolesGuard } from './roles.guard';

function mockContext(user?: AuthUser) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as never;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  const techUser: AuthUser = {
    id: 1,
    email: 'tech@taskforge.local',
    name: 'Tech',
    role: 'TECHNICIEN',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('autorise si aucun rôle n’est requis', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(mockContext(techUser))).toBe(true);
  });

  it('autorise si le rôle de l’utilisateur est dans la liste', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'TECHNICIEN',
      'ADMIN',
    ]);
    expect(guard.canActivate(mockContext(techUser))).toBe(true);
  });

  it('refuse si le rôle est insuffisant', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(mockContext(techUser))).toThrow(
      ForbiddenException,
    );
  });

  it('refuse si aucun utilisateur n’est authentifié', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['USER']);
    expect(() => guard.canActivate(mockContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
