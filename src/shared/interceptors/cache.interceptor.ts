// 033. src/shared/interceptors/cache.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Inject,
    Logger,
  } from '@nestjs/common';
  import { Request } from 'express';
  import { Observable, of } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { Cache } from 'cache-manager';
  import { CACHE_TTL } from '@config/cache.config';
  import { CACHE_MANAGER } from '@nestjs/cache-manager';

  
  @Injectable()
  export class CacheInterceptor implements NestInterceptor {
    private readonly logger = new Logger(CacheInterceptor.name);
  
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const request = context.switchToHttp().getRequest<Request>();
      
      // Skip cache for non-GET requests
      if (request.method !== 'GET') {
        return next.handle();
      }
  
      const cacheKey = this.createCacheKey(request);
      
      try {
        // Try to get from cache
        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData) {
          this.logger.debug(`Cache hit for ${cacheKey}`);
          return of(cachedData);
        }
        
        this.logger.debug(`Cache miss for ${cacheKey}`);
        
        // If not in cache, call the route handler and store the result
        return next.handle().pipe(
          tap(async (data) => {
            await this.cacheManager.set(cacheKey, data, CACHE_TTL.MEDIUM);
            this.logger.debug(`Cached data for ${cacheKey}`);
          }),
        );
      } catch (error) {
        this.logger.error(`Cache error: ${error.message}`, error.stack);
        return next.handle();
      }
    }
  
    private createCacheKey(request: Request): string {
      // Create a unique key based on the URL and query parameters
      const url = request.originalUrl;
      return `http:${url}`;
    }
  }
