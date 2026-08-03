import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TicketPriority } from '../../generated/prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  // Temporaire : en l'absence d'authentification (S1-04), le créateur est
  // fourni par le client. À remplacer par l'utilisateur du JWT une fois l'auth en place.
  @IsInt()
  createdById: number;

  @IsInt()
  @IsOptional()
  assignedToId?: number;
}
