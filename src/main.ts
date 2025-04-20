// 001. src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from '@config/swagger.config';
import { HttpExceptionFilter } from '@filters/http-exception.filter';
import { LoggerMiddleware } from '@middlewares/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get ConfigService to access .env variables
  const configService = app.get(ConfigService);
  
  // Set global prefix
  const apiPrefix = configService.get<string>('API_PREFIX');
  const apiVersion = configService.get<string>('API_VERSION');
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);
  
  // Enable CORS
  app.enableCors();
  
  // Apply global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // Apply global filters
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Apply global middleware
  app.use(LoggerMiddleware);
  
  // Setup Swagger documentation
  setupSwagger(app);
  
  // Start the server
  const port = configService.get<number>('API_PORT') || 3000;
  const host = configService.get<string>('API_HOST') || 'localhost';
  
  await app.listen(port, host);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
