// 003. src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { createLogger } from '@config/logging.config';
import { applyRateLimiting } from '@config/rate-limit.config';
import { setupSwagger } from '@config/swagger.config';
import { APP_CONSTANTS } from '@config/const.config';

async function bootstrap() {
  const winstonLogger = createLogger();
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonLogger),
  });

  const configService = app.get(ConfigService);
  
  // Apply global prefix
  app.setGlobalPrefix(configService.get('API_PREFIX', 'api'));

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Apply rate limiting
  applyRateLimiting(app);

  // Setup Swagger documentation
  setupSwagger(app);

  // Start listening
  const port = configService.get('API_PORT', 3000);
  await app.listen(port);

  // Use NestJS Logger instead of WinstonModule directly
  const logger = new Logger('Bootstrap');
  logger.log(`${APP_CONSTANTS.APP_NAME} v${APP_CONSTANTS.APP_VERSION} is running on: ${await app.getUrl()}`);
}

bootstrap();
