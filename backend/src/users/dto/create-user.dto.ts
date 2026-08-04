import { IsEmail, IsEnum, IsString, Matches, MinLength } from 'class-validator';
import {
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  USERNAME_RULE,
} from '../../common/account-rules';
import { Role } from '../../generated/prisma/client';

// Contrairement à RegisterDto, le rôle est ici accepté depuis le corps de la
// requête : c'est tout l'intérêt de la route, un admin doit pouvoir créer un
// technicien. La route est protégée par @Roles('ADMIN').
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères`,
  })
  password: string;

  @IsString()
  @Matches(USERNAME_PATTERN, {
    message: `Nom d'utilisateur invalide (${USERNAME_RULE})`,
  })
  name: string;

  @IsEnum(Role)
  role: Role;
}
