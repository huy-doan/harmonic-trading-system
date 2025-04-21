// 014. src/config/logging.config.ts
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { isProduction } from '@config/env.config';

export interface LoggerConfig {
  level: string;
  transports: winston.transport[];
}

export const getLoggerConfig = (): LoggerConfig => {
  // Transports for different environments
  const transports: winston.transport[] = [
    // Console transport with different format based on environment
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        isProduction
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                ({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`,
              ),
            ),
      ),
    }),
  ];
  
  // Add file transport in production environment
  if (isProduction) {
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      
      // Separate error logs
      new winston.transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  }
  
  return {
    level: isProduction ? 'info' : 'debug',
    transports,
  };
};

// Create a winston logger instance
export const createLogger = (): winston.Logger => {
  const loggerConfig = getLoggerConfig();
  
  return winston.createLogger({
    level: loggerConfig.level,
    transports: loggerConfig.transports,
  });
};
