import { Global, Module } from '@nestjs/common';
import { JsonLogger } from './json-logger.service';

/**
 * Global : le logger est injecté par des intercepteurs et des services répartis
 * dans tous les modules, sans qu'aucun ait à réimporter LoggingModule.
 */
@Global()
@Module({
  providers: [JsonLogger],
  exports: [JsonLogger],
})
export class LoggingModule {}
