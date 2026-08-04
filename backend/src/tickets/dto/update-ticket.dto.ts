import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { TicketStatus } from '../../generated/prisma/client';
import { CreateTicketDto } from './create-ticket.dto';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;
}
