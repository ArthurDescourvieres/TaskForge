import { IsInt, ValidateIf } from 'class-validator';

export class AssignTicketDto {
  /**
   * Technicien ou administrateur destinataire. `null` détache le ticket.
   *
   * ValidateIf laisse passer null sans le confondre avec une absence de champ :
   * omettre assignedToId reste une erreur, désassigner explicitement non.
   */
  @ValidateIf((_objet, valeur) => valeur !== null)
  @IsInt()
  assignedToId: number | null;
}
