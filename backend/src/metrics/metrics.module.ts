import { Global, Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

/**
 * Global : les compteurs sont alimentés depuis l'intercepteur HTTP et depuis
 * des services métier de modules différents, tous doivent viser la même
 * instance sans réimporter le module.
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
