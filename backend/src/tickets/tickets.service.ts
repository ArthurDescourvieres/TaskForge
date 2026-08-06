import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, TicketStatus } from '../generated/prisma/client';
import { MetricsService } from '../metrics/metrics.service';
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

// Un ticket est un travail à traiter : seuls ceux qui peuvent le résoudre
// peuvent en être destinataires. Assigner à un USER produirait une charge de
// travail que l'intéressé n'a même pas le droit de faire avancer.
const ROLES_ASSIGNABLES: Role[] = ['TECHNICIEN', 'ADMIN'];

// Partagé par toutes les requêtes : le frontend attend toujours createdBy/assignedTo.
const WITH_USERS = {
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
};

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  // Le créateur vient du JWT, jamais du corps de la requête : sinon n'importe
  // qui pourrait ouvrir un ticket au nom d'un autre. Les champs sont listés
  // un à un plutôt que par diffusion du DTO, pour la même raison.
  async create(dto: CreateTicketDto, createdById: number) {
    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        assignedToId: dto.assignedToId,
        createdById,
      },
      include: WITH_USERS,
    });

    this.metrics.incrementerTicketsCrees();

    return ticket;
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

  /**
   * Assignation et réassignation (S1-05). `null` détache le ticket.
   *
   * Endpoint dédié plutôt que PATCH générique : l'assignation est une action
   * métier à part entière, avec ses propres règles et son propre message
   * d'erreur.
   */
  async assign(id: number, assignedToId: number | null) {
    const existing = await this.findOne(id);

    // Un ticket fermé est terminal : le réassigner fausserait la charge
    // affichée par technicien sans qu'aucun travail ne soit possible dessus.
    if (existing.status === 'FERME') {
      throw new BadRequestException(
        'Un ticket fermé ne peut plus être assigné ni réassigné',
      );
    }

    if (assignedToId !== null) {
      await this.validerDestinataire(assignedToId);
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { assignedToId },
      include: WITH_USERS,
    });
  }

  async update(id: number, dto: UpdateTicketDto) {
    const existing = await this.findOne(id);

    if (dto.status && !isValidStatusTransition(existing.status, dto.status)) {
      throw new BadRequestException(
        `Transition de statut invalide : ${existing.status} → ${dto.status}`,
      );
    }

    // Même contrôle que sur /assign : sans ça, la règle serait contournable en
    // passant assignedToId par le PATCH générique.
    if (dto.assignedToId !== undefined) {
      await this.validerDestinataire(dto.assignedToId);
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

  /** Le destinataire doit exister et pouvoir effectivement traiter le ticket. */
  private async validerDestinataire(assignedToId: number) {
    const destinataire = await this.prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, role: true },
    });

    if (!destinataire) {
      throw new NotFoundException(
        `Utilisateur ${assignedToId} introuvable : assignation impossible`,
      );
    }

    if (!ROLES_ASSIGNABLES.includes(destinataire.role)) {
      throw new BadRequestException(
        'Un ticket ne peut être assigné qu’à un technicien ou un administrateur',
      );
    }
  }
}
