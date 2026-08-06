import { Role } from '../generated/prisma/client';

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

export type JwtPayload = {
  sub: number;
  email: string;
  role: Role;
};
