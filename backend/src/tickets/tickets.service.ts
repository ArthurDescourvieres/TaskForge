import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { isValidStatusTransition } from './ticket-status.util';
import {
  averageResolutionHours,
  countByPriority,
  countByStatus,
} from './ticket-stats.util';

const RESOLVING_STATUSES: TicketStatus[] = ['RESOLU', 'FERME'];

// Partagé par toutes les requêtes : le frontend attend toujours createdBy/assignedTo.
const WITH_USERS = {
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
};

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  // Le créateur vient du JWT, jamais du corps de la requête : sinon n'importe
  // qui pourrait ouvrir un ticket au nom d'un autre. Les champs sont listés
  // un à un plutôt que par diffusion du DTO, pour la même raison.
  create(dto: CreateTicketDto, createdById: number) {
    return this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        assignedToId: dto.assignedToId,
        createdById,
      },
      include: WITH_USERS,
    });
  }

  findAll(query: QueryTicketsDto = {}) {
    const {
      status,
      priority,
      assignedToId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    return this.prisma.ticket.findMany({
      where: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId && { assignedToId }),
        // Recherche insensible à la casse sur le titre OU la description.
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      },
      // Trier par priorité suit l'ordre de déclaration de l'enum Prisma
      // (BASSE → CRITIQUE), donc 'desc' remonte bien les critiques en premier.
      orderBy: { [sortBy]: sortOrder },
      include: WITH_USERS,
    });
  }

  async stats() {
    const tickets = await this.prisma.ticket.findMany({
      select: {
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
      },
    });

    return {
      total: tickets.length,
      byStatus: countByStatus(tickets),
      byPriority: countByPriority(tickets),
      averageResolutionHours: averageResolutionHours(tickets),
    };
  }

  async findOne(id: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: WITH_USERS,
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} introuvable`);
    }
    return ticket;
  }

  async update(id: number, dto: UpdateTicketDto) {
    const existing = await this.findOne(id);

    if (dto.status && !isValidStatusTransition(existing.status, dto.status)) {
      throw new BadRequestException(
        `Transition de statut invalide : ${existing.status} → ${dto.status}`,
      );
    }

    const resolvedAt =
      dto.status &&
      RESOLVING_STATUSES.includes(dto.status) &&
      !existing.resolvedAt
        ? new Date()
        : undefined;

    return this.prisma.ticket.update({
      where: { id },
      data: { ...dto, ...(resolvedAt && { resolvedAt }) },
      include: WITH_USERS,
    });
  }

  close(id: number) {
    return this.update(id, { status: 'FERME' });
  }
}
