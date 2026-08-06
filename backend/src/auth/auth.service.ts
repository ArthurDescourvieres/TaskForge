import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password,
        role: 'USER',
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.buildAuthResponse(user);
  }

  async validateUserById(id: number): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      return null;
    }
    return this.toAuthUser(user);
  }

  private buildAuthResponse(user: {
    id: number;
    email: string;
    name: string;
    role: AuthUser['role'];
  }) {
    const authUser = this.toAuthUser(user);
    const payload: JwtPayload = {
      sub: authUser.id,
      email: authUser.email,
      role: authUser.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: authUser,
    };
  }

  private toAuthUser(user: {
    id: number;
    email: string;
    name: string;
    role: AuthUser['role'];
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
