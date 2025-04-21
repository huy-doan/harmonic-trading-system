// 031. src/shared/filters/validation.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
    BadRequestException,
  } from '@nestjs/common';
  import { ValidationError } from 'class-validator';
  import { Request, Response } from 'express';
  
  @Catch(BadRequestException)
  export class ValidationFilter implements ExceptionFilter {
    private readonly logger = new Logger(ValidationFilter.name);
  
    catch(exception: BadRequestException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      const status = exception.getStatus();
      
      // Get the error response
      const errorResponse = exception.getResponse() as any;
      
      // Format validation errors if they exist
      let validationErrors = [];
      
      if (errorResponse.message && Array.isArray(errorResponse.message)) {
        validationErrors = this.formatValidationErrors(errorResponse.message);
      }
  
      // Create a structured response
      const responseBody = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        errors: validationErrors.length > 0 ? validationErrors : [errorResponse.message],
      };
  
      this.logger.debug(
        `Validation failed for ${request.method} ${request.url}`,
        JSON.stringify(responseBody),
      );
  
      response.status(status).json(responseBody);
    }
  
    private formatValidationErrors(errors: any[]): string[] {
      const result = [];
      
      errors.forEach((error) => {
        if (typeof error === 'string') {
          result.push(error);
        } else if (error instanceof ValidationError) {
          if (error.constraints) {
            result.push(...Object.values(error.constraints));
          }
          if (error.children && error.children.length) {
            result.push(...this.formatValidationErrors(error.children));
          }
        }
      });
      
      return result;
    }
  }
  