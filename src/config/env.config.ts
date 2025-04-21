import { z } from 'zod';

/**
 * Định nghĩa schema xác thực cho biến môi trường
 */
const envSchema = z.object({
  // API Configuration
  API_PORT: z.string().transform(Number),
  API_HOST: z.string(),
  API_PREFIX: z.string(),
  API_VERSION: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Database Configuration
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.string().transform(Number),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),

  // Redis Configuration
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number),
  REDIS_PASSWORD: z.string(),

  // JWT Configuration
  JWT_SECRET: z.string(),
  JWT_EXPIRATION: z.string().transform(Number),

  // Binance API Configuration
  BINANCE_API_KEY: z.string(),
  BINANCE_API_SECRET: z.string(),

  // Telegram Configuration
  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_CHAT_ID: z.string(),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string(),

  // // Rate Limiting
  // THROTTLE_TTL: z.string().transform(Number),
  // THROTTLE_LIMIT: z.string().transform(Number),
});

/**
 * Xác thực và lấy các biến môi trường
 */
export const env = envSchema.parse(process.env);

/**
 * Kiểm tra xem môi trường hiện tại có phải là môi trường production hay không
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Kiểm tra xem môi trường hiện tại có phải là môi trường development hay không
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Kiểm tra xem môi trường hiện tại có phải là môi trường test hay không
 */
export const isTest = env.NODE_ENV === 'test';
