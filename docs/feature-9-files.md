# Feature 9: Cache System

## Mô tả
Feature này triển khai hệ thống cache để tối ưu hiệu suất, giảm tải cho database và Binance API.

## Danh sách file cần triển khai

### Cache Infrastructure
```
066. src/infrastructure/cache/redis-cache.service.ts        # Redis cache service
067. src/infrastructure/cache/in-memory-cache.service.ts    # Cache trong bộ nhớ
068. src/infrastructure/cache/cache.module.ts               # Module cache
```

### Cache Interceptor
```
033. src/shared/interceptors/cache.interceptor.ts           # Interceptor cache
```

## Chi tiết triển khai

### redis-cache.service.ts
Service triển khai cache sử dụng Redis:
- Lưu trữ và truy xuất dữ liệu từ Redis
- Quản lý TTL (Time-To-Live) cho các cache key
- Hỗ trợ invalidation và refresh cache
- Cung cấp các phương thức chung: get, set, delete, clear

```typescript
@Injectable()
export class RedisCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(
    key: string, 
    value: T, 
    ttl?: number
  ): Promise<void> {
    const defaultTtl = this.configService.get<number>('cache.ttl', 300000);
    await this.cacheManager.set(key, value, { ttl: ttl || defaultTtl });
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async clear(): Promise<void> {
    await this.cacheManager.reset();
  }
  
  // Helper methods for specific data types
  async getMarketData(symbol: string, timeframe: string): Promise<any> {
    const keyPrefix = this.configService.get<string>('cache.keyPrefix.marketData', 'market:');
    return this.get(`${keyPrefix}${symbol}:${timeframe}`);
  }
  
  async setMarketData(symbol: string, timeframe: string, data: any): Promise<void> {
    const keyPrefix = this.configService.get<string>('cache.keyPrefix.marketData', 'market:');
    const customTTL = this.configService.get<number>('cache.customTTL.marketData', 60000);
    await this.set(`${keyPrefix}${symbol}:${timeframe}`, data, customTTL);
  }
  
  // Similar methods for patterns, indicators, etc.
}
```

### in-memory-cache.service.ts
Service triển khai cache trong bộ nhớ, hữu ích khi không cần Redis cho môi trường development hoặc cho dữ liệu cần truy xuất cực nhanh:
- Sử dụng Map để lưu trữ dữ liệu
- Quản lý TTL thông qua setTimeout
- API tương tự với Redis cache

```typescript
@Injectable()
export class InMemoryCacheService {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (item.expiry < now) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  async set<T>(
    key: string, 
    value: T, 
    ttl: number = 300000
  ): Promise<void> {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
    
    // Auto cleanup
    setTimeout(() => {
      const item = this.cache.get(key);
      if (item && item.expiry <= Date.now()) {
        this.cache.delete(key);
      }
    }, ttl);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}
```

### cache.module.ts
Module cung cấp các cache services:
- Đăng ký Redis cache provider
- Đăng ký In-memory cache provider
- Cấu hình cache manager

```typescript
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('cache.redisOptions.host', 'localhost'),
        port: configService.get('cache.redisOptions.port', 6379),
        password: configService.get('cache.redisOptions.password', ''),
        ttl: configService.get('cache.redisOptions.ttl', 300),
        max: configService.get('cache.max', 100),
      }),
      isGlobal: true,
    }),
  ],
  providers: [RedisCacheService, InMemoryCacheService],
  exports: [RedisCacheService, InMemoryCacheService],
})
export class CacheModule {}
```

### cache.interceptor.ts
Interceptor để tự động cache response từ controllers:
- Lấy data từ cache nếu có
- Lưu response vào cache
- Hỗ trợ nhiều strategy khác nhau

```typescript
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly configService: ConfigService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.createCacheKey(request);
    
    // Try to get from cache
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }
    
    // If not in cache, call the route handler
    return next.handle().pipe(
      tap(async (data) => {
        // Store the response in cache
        await this.cacheService.set(cacheKey, data);
      }),
    );
  }
  
  private createCacheKey(request: Request): string {
    // Create a unique key based on the request
    const url = request.originalUrl;
    const method = request.method;
    return `http:${method}:${url}`;
  }
}
```

## Thứ tự triển khai đề xuất

1. Triển khai redis-cache.service.ts
2. Triển khai in-memory-cache.service.ts
3. Tạo cache.module.ts
4. Triển khai cache.interceptor.ts
5. Tích hợp cache vào các service cần tối ưu hiệu suất

## Các trường hợp sử dụng chính

1. **Dữ liệu thị trường**: Cache dữ liệu candle để giảm số lượng request đến Binance API
2. **Chỉ báo kỹ thuật**: Cache kết quả tính toán các chỉ báo kỹ thuật phức tạp
3. **Mô hình Harmonic**: Cache các mô hình đã phát hiện trong một khung thời gian
4. **API responses**: Cache response từ các controllers ít thay đổi

## Dependencies chính

- @nestjs/cache-manager
- cache-manager
- cache-manager-redis-store
- redis