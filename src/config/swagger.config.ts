// 011. src/config/swagger.config.ts
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { APP_CONSTANTS } from '@config/const.config';

export const setupSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle(APP_CONSTANTS.APP_NAME)
    .setDescription(APP_CONSTANTS.APP_DESCRIPTION)
    .setVersion(APP_CONSTANTS.APP_VERSION)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Application health and status endpoints')
    .addTag('Harmonic Patterns', 'Endpoints for harmonic pattern detection')
    .addTag('Technical Indicators', 'Endpoints for technical indicators')
    .addTag('Trading', 'Endpoints for trading operations')
    .addTag('Market Data', 'Endpoints for market data')
    .addTag('Backtesting', 'Endpoints for backtesting strategies')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
};
