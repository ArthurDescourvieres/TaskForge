import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

// Sert au frontend pour les menus « assigné à » et le filtre par technicien.
// Réservé aux utilisateurs authentifiés : la liste des comptes de l'entreprise
// n'a pas à être lisible publiquement.
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
