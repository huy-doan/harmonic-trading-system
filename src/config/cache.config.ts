// 012. src/config/cache.config.ts
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { env } from '@config/env.config';

export const getCacheConfig = async (): Promise<CacheModuleOptions> => {
  const isRedisEnabled = env.REDIS_HOST !== undefined;
  
  if (isRedisEnabled) {
    return {
      store: await redisStore({
        socket: {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
        },
        password: env.REDIS_PASSWORD,
        ttl: 60 * 60 * 1000, // 1 hour in milliseconds
      }),
      isGlobal: true,
    };
  }
  
  // Fallback to memory cache if Redis is not configured
  return {
    isGlobal: true,
    ttl: 60 * 60 * 1000, // 1 hour in milliseconds
    max: 100, // maximum number of items in cache
  };
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 5 * 60, // 5 minutes
  LONG: 30 * 60, // 30 minutes
  VERY_LONG: 12 * 60 * 60, // 12 hours
};

// Cache key prefixes for different resources
export const CACHE_KEYS = {
  MARKET_DATA: 'market_data',
  PATTERNS: 'patterns',
  INDICATORS: 'indicators',
  USER_DATA: 'user_data',
};
