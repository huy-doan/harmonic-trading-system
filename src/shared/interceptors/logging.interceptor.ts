// 034. src/shared/interceptors/logging.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { method, url, body, params, query, ip, headers } = request;
      const userAgent = headers['user-agent'] || 'Unknown';
      
      const now = Date.now();
      
      // Log request data
      this.logger.debug(
        `Request: ${method} ${url} (${ip}) - User-Agent: ${userAgent}`,
        {
          params,
          query,
          body: this.sanitizeBody(body),
        },
      );
      
      return next.handle().pipe(
        tap({
          next: (data: any) => {
            const response = context.switchToHttp().getResponse();
            const delay = Date.now() - now;
            
            // Log successful response
            this.logger.debug(
              `Response: ${method} ${url} - ${response.statusCode} - ${delay}ms`,
              { data: this.truncateData(data) },
            );
          },
          error: (error: any) => {
            const delay = Date.now() - now;
            
            // Log error response
            this.logger.error(
              `Response Error: ${method} ${url} - ${delay}ms`,
              error.stack,
            );
          },
        }),
      );
    }
    
    private sanitizeBody(body: any): any {
      if (!body) return {};
      
      // Create a copy of the body
      const sanitized = { ...body };
      
      // Remove sensitive fields
      const sensitiveFields = ['password', 'passwordConfirmation', 'token', 'secret', 'apiKey', 'apiSecret'];
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '***REDACTED***';
        }
      });
      
      return sanitized;
    }
    
    private truncateData(data: any): any {
      if (!data) return data;
      
      // Convert to string to check length
      const jsonString = JSON.stringify(data);
      if (jsonString.length <= 1000) return data;
      
      // If it's an array, return the first few elements
      if (Array.isArray(data)) {
        return data.slice(0, 3).concat(['... truncated']);
      }
      
      // If it's an object, return a summary
      if (typeof data === 'object') {
        return {
          summary: `Object with ${Object.keys(data).length} keys`,
          keys: Object.keys(data),
        };
      }
      
      // For strings, truncate
      if (typeof data === 'string') {
        return `${data.substring(0, 500)}... (truncated)`;
      }
      
      return data;
    }
  }
  