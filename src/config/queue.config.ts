// 013. src/config/queue.config.ts
import { env } from '@config/env.config';

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
    removeOnComplete: boolean;
    removeOnFail: boolean;
  };
}

export const getQueueConfig = (): QueueConfig => {
  const isRedisEnabled = env.REDIS_HOST !== undefined;
  
  if (!isRedisEnabled) {
    throw new Error('Redis is required for Queue to work properly.');
  }
  
  return {
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  };
};

// Queue names constants
export const QUEUE_NAMES = {
  PATTERN_DETECTION: 'pattern_detection',
  MARKET_ANALYSIS: 'market_analysis',
  TRADE_EXECUTION: 'trade_execution',
  NOTIFICATION: 'notification',
};

// Job names constants
export const JOB_NAMES = {
  // Pattern detection jobs
  SCAN_FOR_PATTERNS: 'scan_for_patterns',
  ANALYZE_PATTERN_QUALITY: 'analyze_pattern_quality',
  
  // Market analysis jobs
  ANALYZE_MARKET_TRENDS: 'analyze_market_trends',
  UPDATE_TECHNICAL_INDICATORS: 'update_technical_indicators',
  
  // Trade execution jobs
  SETUP_TRADE: 'setup_trade',
  EXECUTE_TRADE: 'execute_trade',
  MANAGE_OPEN_TRADES: 'manage_open_trades',
  
  // Notification jobs
  SEND_PATTERN_NOTIFICATION: 'send_pattern_notification',
  SEND_TRADE_NOTIFICATION: 'send_trade_notification',
  SEND_ALERT_NOTIFICATION: 'send_alert_notification',
};
