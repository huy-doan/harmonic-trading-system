// 023. src/shared/utils/http.helper.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpHelper {
  static extractIpAddress(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      ''
    );
  }

  static getUserAgent(request: any): string {
    return request.headers['user-agent'] || '';
  }

  static prepareSuccessResponse<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message: message || 'Operation successful',
      timestamp: new Date().toISOString(),
    };
  }

  static prepareErrorResponse(message: string, statusCode: number = HttpStatus.BAD_REQUEST) {
    return {
      success: false,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  static handleHttpError(error: any): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    const message = error.message || 'Internal server error';
    const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;

    return new HttpException(message, status);
  }

  static parseQueryParams(query: Record<string, any>): Record<string, any> {
    const parsed: Record<string, any> = {};

    for (const [key, value] of Object.entries(query)) {
      if (value === 'true') parsed[key] = true;
      else if (value === 'false') parsed[key] = false;
      else if (!isNaN(Number(value))) parsed[key] = Number(value);
      else parsed[key] = value;
    }

    return parsed;
  }

  static extractBearerToken(authorization: string | undefined): string | null {
    if (!authorization) return null;
    
    const parts = authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
    
    return null;
  }

  static isSuccessStatus(status: number): boolean {
    return status >= 200 && status < 300;
  }

  static createPaginationMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
