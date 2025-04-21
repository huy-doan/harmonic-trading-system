// 002. src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getCacheConfig } from '@config/cache.config';
import { typeOrmAsyncConfig } from '@config/orm.config';
import { databaseConfig } from '@config/database.config';
import { getLoggerConfig } from '@config/logging.config';
import { getQueueConfig, QUEUE_NAMES } from '@config/queue.config';
import { WinstonModule } from 'nest-winston';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [databaseConfig],
      cache: true,
    }),
    
    // Winston Logger configuration
    WinstonModule.forRoot(getLoggerConfig()),
    
    // Database connection
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    
    // Cache configuration
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: getCacheConfig,
    }),
    
    // Bull Queue configuration
    BullModule.forRootAsync({
      useFactory: () => {
        const queueConfig = getQueueConfig();
        return {
          redis: queueConfig.redis,
          defaultJobOptions: queueConfig.defaultJobOptions,
        };
      },
    }),
    
    // Register specific queues
    BullModule.registerQueue(
      { name: QUEUE_NAMES.PATTERN_DETECTION },
      { name: QUEUE_NAMES.MARKET_ANALYSIS },
      { name: QUEUE_NAMES.TRADE_EXECUTION },
      { name: QUEUE_NAMES.NOTIFICATION },
    ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
