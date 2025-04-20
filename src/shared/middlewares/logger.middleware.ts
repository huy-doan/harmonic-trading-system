// 035. src/shared/middlewares/logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddlewareClass implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      const message = `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip}`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}

// Function version for global middleware
export function LoggerMiddleware(request: Request, response: Response, next: NextFunction): void {
  const { ip, method, originalUrl } = request;
  const userAgent = request.get('user-agent') || '';
  const logger = new Logger('HTTP');

  response.on('finish', () => {
    const { statusCode } = response;
    const contentLength = response.get('content-length');

    const message = `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip}`;

    if (statusCode >= 500) {
      logger.error(message);
    } else if (statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.log(message);
    }
  });

  next();
}
