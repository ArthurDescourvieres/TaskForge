import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import {
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  USERNAME_RULE,
} from '../../common/account-rules';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères`,
  })
  password: string;

  // « name » côté base, mais c'est un pseudonyme : voir account-rules.ts.
  @IsString()
  @Matches(USERNAME_PATTERN, {
    message: `Nom d'utilisateur invalide (${USERNAME_RULE})`,
  })
  name: string;
}
