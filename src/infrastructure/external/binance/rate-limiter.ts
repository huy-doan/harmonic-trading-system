// 057. src/infrastructure/external/binance/rate-limiter.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type RateLimitCategory = 'market' | 'account' | 'order' | 'userStream' | 'other';

interface RateLimitConfig {
  limit: number;
  window: number; // in milliseconds
  tokens: number;
  lastRefill: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private rateLimits: Map<RateLimitCategory, RateLimitConfig> = new Map();

  constructor(private configService: ConfigService) {
    // Initialize rate limits based on Binance's documented limits
    this.rateLimits.set('market', {
      limit: 1200,   // 1200 requests per minute
      window: 60000, // 1 minute in milliseconds
      tokens: 1200,
      lastRefill: Date.now(),
    });

    this.rateLimits.set('account', {
      limit: 100,    // 100 requests per minute
      window: 60000, // 1 minute in milliseconds
      tokens: 100,
      lastRefill: Date.now(),
    });

    this.rateLimits.set('order', {
      limit: 50,     // 50 requests per 10 seconds
      window: 10000, // 10 seconds in milliseconds
      tokens: 50,
      lastRefill: Date.now(),
    });

    this.rateLimits.set('userStream', {
      limit: 30,     // 30 requests per minute
      window: 60000, // 1 minute in milliseconds
      tokens: 30,
      lastRefill: Date.now(),
    });

    this.rateLimits.set('other', {
      limit: 1000,
      window: 60000,
      tokens: 1000,
      lastRefill: Date.now(),
    });
  }

  /**
   * Acquire a token for a specific rate limit category
   * @param category The rate limit category
   * @returns A promise that resolves when a token is available
   */
  public async acquireToken(category: RateLimitCategory): Promise<void> {
    const rateLimitConfig = this.rateLimits.get(category);
    if (!rateLimitConfig) {
      throw new Error(`Unknown rate limit category: ${category}`);
    }

    await this.refillTokens(category, rateLimitConfig);

    if (rateLimitConfig.tokens <= 0) {
      const delay = Math.ceil(rateLimitConfig.window / rateLimitConfig.limit);
      this.logger.warn(`Rate limit exceeded for ${category}, waiting ${delay}ms`);
      await this.sleep(delay);
      await this.refillTokens(category, rateLimitConfig);
    }

    rateLimitConfig.tokens--;
  }

  /**
   * Refill tokens based on elapsed time since last refill
   */
  private async refillTokens(category: RateLimitCategory, config: RateLimitConfig): Promise<void> {
    const now = Date.now();
    const elapsed = now - config.lastRefill;
    
    if (elapsed >= config.window) {
      // If more than a full window has passed, fully refill
      config.tokens = config.limit;
      config.lastRefill = now;
    } else if (elapsed > 0) {
      // Partial refill based on elapsed time
      const tokensToAdd = Math.floor((elapsed / config.window) * config.limit);
      if (tokensToAdd > 0) {
        config.tokens = Math.min(config.limit, config.tokens + tokensToAdd);
        config.lastRefill = now;
      }
    }
  }

  /**
   * Update rate limit settings based on Binance API response headers
   */
  public updateRateLimits(category: RateLimitCategory, usedWeight: number, limit: number): void {
    const config = this.rateLimits.get(category);
    if (config) {
      config.tokens = Math.max(0, config.limit - usedWeight);
      if (limit !== config.limit) {
        this.logger.log(`Updating rate limit for ${category} from ${config.limit} to ${limit}`);
        config.limit = limit;
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}