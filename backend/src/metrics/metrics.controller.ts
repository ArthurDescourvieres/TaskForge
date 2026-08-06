import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  /**
   * Endpoint public : un collecteur Prometheus ne présente pas de jeton.
   * Aucune donnée nominative n'est exposée — seulement des agrégats.
   *
   * L'en-tête est écrit en dur plutôt que lu depuis `metrics.typeContenu` :
   * `@Header()` est évalué au chargement du décorateur, avant toute injection.
   * Sa valeur est celle que prom-client expose pour le format texte 0.0.4.
   */
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  rendre(): Promise<string> {
    return this.metrics.rendre();
  }
}
