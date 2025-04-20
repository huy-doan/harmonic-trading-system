// 030. src/shared/filters/http-exception.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch(HttpException)
  export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);
  
    catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();
  
      const errorMessage = 
        typeof errorResponse === 'object' && 'message' in errorResponse
          ? errorResponse['message']
          : exception.message;
  
      const errorObj = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: errorMessage || 'Internal server error',
      };
  
      // Log the error
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `${request.method} ${request.url}`,
          exception.stack,
          'HttpExceptionFilter',
        );
      } else {
        this.logger.error(
          `${request.method} ${request.url} - Status ${status}`,
          JSON.stringify(errorObj),
          'HttpExceptionFilter',
        );
      }
  
      response.status(status).json(errorObj);
    }
  }
  