// 010. src/config/rate-limit.config.ts
import { INestApplication } from '@nestjs/common';
import rateLimit from 'express-rate-limit';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  message: string;
}

export const getDefaultRateLimitConfig = (): RateLimitConfig => ({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later.',
});

export const getBinanceRateLimitConfig = (): RateLimitConfig => ({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs for Binance endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests to Binance API, please try again later.',
});

export const applyRateLimiting = (app: INestApplication): void => {
  // Apply default rate limiting
  app.use(rateLimit(getDefaultRateLimitConfig()));
  
  // Apply specific rate limiting for Binance-related routes
  app.use('/api/*/binance', rateLimit(getBinanceRateLimitConfig()));
};
