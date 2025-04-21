// 039. src/shared/exceptions/custom.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomException extends HttpException {
  constructor(
    message: string | object,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    private readonly errorCode?: string,
    private readonly details?: any,
  ) {
    super(
      {
        message,
        errorCode,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }

  getErrorCode(): string {
    return this.errorCode;
  }

  getDetails(): any {
    return this.details;
  }
}

export class NotFoundException extends CustomException {
  constructor(message: string = 'Resource not found', errorCode?: string, details?: any) {
    super(message, HttpStatus.NOT_FOUND, errorCode, details);
  }
}

export class BadRequestException extends CustomException {
  constructor(message: string = 'Bad request', errorCode?: string, details?: any) {
    super(message, HttpStatus.BAD_REQUEST, errorCode, details);
  }
}

export class UnauthorizedException extends CustomException {
  constructor(message: string = 'Unauthorized', errorCode?: string, details?: any) {
    super(message, HttpStatus.UNAUTHORIZED, errorCode, details);
  }
}

export class ForbiddenException extends CustomException {
  constructor(message: string = 'Forbidden', errorCode?: string, details?: any) {
    super(message, HttpStatus.FORBIDDEN, errorCode, details);
  }
}

export class ServiceUnavailableException extends CustomException {
  constructor(message: string = 'Service unavailable', errorCode?: string, details?: any) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, errorCode, details);
  }
}
