import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { isValidStatusTransition } from './ticket-status.util';

const RESOLVING_STATUSES: TicketStatus[] = ['RESOLU', 'FERME'];

// Partagé par toutes les requêtes : le frontend attend toujours createdBy/assignedTo.
const WITH_USERS = {
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
};

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTicketDto) {
    return this.prisma.ticket.create({ data: dto, include: WITH_USERS });
  }

  findAll() {
    return this.prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      include: WITH_USERS,
    });
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
