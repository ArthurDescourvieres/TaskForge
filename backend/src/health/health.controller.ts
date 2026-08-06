import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';

/**
 * Endpoints publics : ni JwtAuthGuard ni RolesGuard. Docker et les sondes
 * externes ne disposent d'aucun jeton.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** État détaillé de chaque composant. 503 si un composant est tombé. */
  @Get()
  async check() {
    const rapport = await this.health.check();

    if (rapport.status !== 'ok') {
      // Le corps du rapport est conservé : une sonde qui reçoit 503 doit
      // pouvoir lire quel composant est en cause.
      throw new HttpException(rapport, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return rapport;
  }

  /** Liveness : le processus tourne. Ne touche pas la base. */
  @Get('live')
  live() {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }

  /** Readiness : le service peut réellement traiter du trafic. */
  @Get('ready')
  async ready() {
    if (!(await this.health.isReady())) {
      throw new HttpException(
        { status: 'not-ready' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status: 'ready' };
  }
}
