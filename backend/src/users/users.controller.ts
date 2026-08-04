import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Sert au frontend pour les menus « assigné à » et le filtre par technicien,
  // donc ouvert à tout compte authentifié. La liste des comptes de l'entreprise
  // n'a en revanche pas à être lisible publiquement.
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // L'inscription publique ne crée que des USER. Créer un technicien ou un
  // second admin passe forcément par ici.
  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.usersService.updateRole(id, dto.role, currentUser.id);
  }
}
