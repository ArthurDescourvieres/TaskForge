import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { TicketPriority, TicketStatus } from '../../generated/prisma/client';

export const SORTABLE_FIELDS = ['createdAt', 'priority', 'status'] as const;
export type SortableField = (typeof SORTABLE_FIELDS)[number];

export class QueryTicketsDto {
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  // Les query params arrivent en string : @Type les convertit avant validation.
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  assignedToId?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(SORTABLE_FIELDS)
  @IsOptional()
  sortBy?: SortableField;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
