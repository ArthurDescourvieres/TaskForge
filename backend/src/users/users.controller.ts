import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

// Liste en lecture seule, en attendant l'authentification (S1-04).
// Sert au frontend pour les menus "créé par" / "assigné à".
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
