import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  /**
   * Endpoint public : un collecteur Prometheus ne présente pas de jeton.
   * Aucune donnée nominative n'est exposée — seulement des agrégats.
   */
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  rendre(): string {
    return this.metrics.rendre();
  }
}
