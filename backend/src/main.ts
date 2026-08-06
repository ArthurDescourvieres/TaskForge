import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JsonLogger } from './logging/json-logger.service';
import { contexteRequeteMiddleware } from './logging/request-context.middleware';

async function bootstrap() {
  // bufferLogs : les logs du démarrage sont retenus puis rejoués au format JSON
  // une fois le logger disponible, plutôt que sortis au format Nest par défaut.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(JsonLogger));

  // Avant tout le reste : chaque requête doit disposer d'un request_id, y
  // compris celles rejetées par la validation ou par un garde.
  app.use(contexteRequeteMiddleware);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
