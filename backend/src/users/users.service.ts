import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

// Le hash du mot de passe ne doit sortir d'ici sous aucune forme : toutes les
// lectures passent par cette projection plutôt que de retirer le champ après
// coup, ce qu'on finit toujours par oublier sur une nouvelle route.
const PUBLIC_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: PUBLIC_FIELDS,
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        password: await bcrypt.hash(dto.password, 10),
      },
      select: PUBLIC_FIELDS,
    });
  }

  async updateRole(id: number, role: Role, currentUserId: number) {
    // Seul un admin atteint cette route. S'il pouvait modifier son propre rôle,
    // une seule erreur suffirait à retirer le dernier accès d'administration —
    // et plus rien dans l'interface ne permettrait de le rétablir. Comme le
    // demandeur est forcément admin, refuser ce cas suffit à garantir qu'il
    // reste toujours au moins un admin.
    if (id === currentUserId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier votre propre rôle',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur ${id} introuvable`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: PUBLIC_FIELDS,
    });
  }
}
