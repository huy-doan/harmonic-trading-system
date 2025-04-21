// 057. src/infrastructure/external/binance/rate-limiter.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RateLimitRule {
  interval: number; // Time window in milliseconds
  limit: number; // Maximum number of requests in the time window
  weight: number; // Default weight of a request
  current: number; // Current count of requests in the time window
  resetTime: number; // Time when the count resets
}

@Injectable()
export class BinanceRateLimiter {
  private readonly logger = new Logger(BinanceRateLimiter.name);

  // Binance rate limits (as of API documentation)
  private rateLimits: {
    [key: string]: RateLimitRule
  } = {
    REQUEST_WEIGHT: {
      interval: 60 * 1000, // 1 minute
      limit: 1200, // 1200 request weight per minute
      weight: 1,
      current: 0,
      resetTime: Date.now() + 60 * 1000
    },
    ORDERS: {
      interval: 10 * 1000, // 10 seconds
      limit: 10, // 10 orders per 10 seconds
      weight: 1,
      current: 0,
      resetTime: Date.now() + 10 * 1000
    },
    RAW_REQUESTS: {
      interval: 5 * 60 * 1000, // 5 minutes
      limit: 5000, // 5000 raw requests per 5 minutes
      weight: 1,
      current: 0,
      resetTime: Date.now() + 5 * 60 * 1000
    }
  };

  // Queue of pending requests with resolve functions
  private requestQueue: {
    key: string;
    weight: number;
    resolve: () => void;
  }[] = [];

  // Flag to track if queue processing is active
  private isProcessingQueue = false;

  constructor(private readonly configService: ConfigService) {
    // Start the queue processor
    this.processQueue();
  }

  /**
   * Adds a request to rate limit queue and resolves when it can proceed
   */
  async acquirePermit(key: string = 'REQUEST_WEIGHT', weight: number = 1): Promise<void> {
    // Reset counts if interval has passed
    this.checkAndResetLimits();

    // If we are under rate limits, allow request immediately
    if (this.canMakeRequest(key, weight)) {
      this.incrementCounter(key, weight);
      return Promise.resolve();
    }

    // Otherwise, queue the request
    return new Promise((resolve) => {
      this.requestQueue.push({ key, weight, resolve });
      this.logger.debug(`Rate limit reached for ${key}. Request queued. Queue size: ${this.requestQueue.length}`);
    });
  }

  /**
   * Processes the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        // Check and reset limits if needed
        this.checkAndResetLimits();

        // Get the first request in queue
        const request = this.requestQueue[0];

        // If we can process it, remove from queue and resolve
        if (this.canMakeRequest(request.key, request.weight)) {
          this.requestQueue.shift();
          this.incrementCounter(request.key, request.weight);
          request.resolve();
        } else {
          // Calculate time until next reset
          const timeToWait = this.getTimeUntilReset(request.key);
          
          this.logger.debug(`Waiting ${timeToWait}ms for rate limit reset on ${request.key}`);
          
          // Wait until the reset time
          await new Promise(resolve => setTimeout(resolve, timeToWait));
        }
      }
    } finally {
      this.isProcessingQueue = false;
      
      // Check if new requests were added while processing
      if (this.requestQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Checks if a request can be made without exceeding rate limits
   */
  private canMakeRequest(key: string, weight: number): boolean {
    if (!this.rateLimits[key]) {
      this.logger.warn(`Unknown rate limit key: ${key}`);
      return true;
    }

    const limit = this.rateLimits[key];
    return limit.current + weight <= limit.limit;
  }

  /**
   * Increments the counter for a specific rate limit
   */
  private incrementCounter(key: string, weight: number): void {
    if (!this.rateLimits[key]) {
      this.logger.warn(`Unknown rate limit key: ${key}`);
      return;
    }

    this.rateLimits[key].current += weight;
    this.logger.debug(`Incremented ${key} counter by ${weight}. New value: ${this.rateLimits[key].current}`);
  }

  /**
   * Checks and resets rate limits if their interval has passed
   */
  private checkAndResetLimits(): void {
    const now = Date.now();
    
    for (const key in this.rateLimits) {
      if (now >= this.rateLimits[key].resetTime) {
        if (this.rateLimits[key].current > 0) {
          this.logger.debug(`Resetting ${key} counter from ${this.rateLimits[key].current} to 0`);
        }
        
        this.rateLimits[key].current = 0;
        this.rateLimits[key].resetTime = now + this.rateLimits[key].interval;
      }
    }
  }

  /**
   * Gets the time until the next reset for a specific rate limit
   */
  private getTimeUntilReset(key: string): number {
    if (!this.rateLimits[key]) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, this.rateLimits[key].resetTime - now);
  }

  /**
   * Updates rate limits based on API response headers
   */
  updateLimitsFromHeaders(headers: Record<string, string>): void {
    // Extract rate limit headers from Binance response
    const weightHeader = headers['x-mbx-used-weight-1m'];
    const ordersHeader = headers['x-mbx-order-count-10s'];
    
    if (weightHeader) {
      const usedWeight = parseInt(weightHeader, 10);
      if (!isNaN(usedWeight)) {
        this.rateLimits.REQUEST_WEIGHT.current = usedWeight;
      }
    }
    
    if (ordersHeader) {
      const orderCount = parseInt(ordersHeader, 10);
      if (!isNaN(orderCount)) {
        this.rateLimits.ORDERS.current = orderCount;
      }
    }
  }
}