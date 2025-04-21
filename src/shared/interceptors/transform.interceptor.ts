// 032. src/shared/interceptors/transform.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpStatus,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  
  export interface Response<T> {
    statusCode: number;
    success: boolean;
    data: T;
    timestamp: string;
    path: string;
  }
  
  @Injectable()
  export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
      const request = context.switchToHttp().getRequest();
      const status = context.switchToHttp().getResponse().statusCode || HttpStatus.OK;
      
      return next.handle().pipe(
        map((data) => ({
          statusCode: status,
          success: status < 400,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
        })),
      );
    }
  }
  