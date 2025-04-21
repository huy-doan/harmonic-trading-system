// 040. src/shared/exceptions/api-error.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiErrorOptions {
  statusCode?: HttpStatus;
  errorCode?: string;
  details?: any;
  source?: string;
}

export class ApiError extends HttpException {
  private readonly errorCode: string;
  private readonly details: any;
  private readonly source: string;

  constructor(
    message: string,
    options: ApiErrorOptions = {}
  ) {
    const statusCode = options.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    
    super(
      {
        message,
        errorCode: options.errorCode || 'API_ERROR',
        details: options.details || null,
        source: options.source || 'internal',
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
    
    this.errorCode = options.errorCode || 'API_ERROR';
    this.details = options.details || null;
    this.source = options.source || 'internal';
  }

  getErrorCode(): string {
    return this.errorCode;
  }

  getDetails(): any {
    return this.details;
  }

  getSource(): string {
    return this.source;
  }
}

export class BinanceApiError extends ApiError {
  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message, {
      ...options,
      source: 'binance',
      errorCode: options.errorCode || 'BINANCE_API_ERROR',
    });
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message, {
      ...options,
      source: 'database',
      errorCode: options.errorCode || 'DATABASE_ERROR',
    });
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message, {
      ...options,
      statusCode: options.statusCode || HttpStatus.BAD_REQUEST,
      source: 'validation',
      errorCode: options.errorCode || 'VALIDATION_ERROR',
    });
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message, {
      ...options,
      statusCode: options.statusCode || HttpStatus.UNAUTHORIZED,
      source: 'authentication',
      errorCode: options.errorCode || 'AUTHENTICATION_ERROR',
    });
  }
}
