// 162. src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

import { TasksService } from './tasks.service';
import { PatternDetectorTask } from './pattern-detector.task';
import { MarketAnalyzerTask } from './market-analyzer.task';
import { TradeExecutorTask } from './trade-executor.task';

import { QueueModule } from '@infrastructure/queue/queue.module';
import { EventBusModule } from '@infrastructure/event-bus/event-bus.module';
import { BinanceModule } from '@/binances/binance.module';
import { HarmonicPatternModule } from '@domain/harmonic-patterns/harmonic-pattern.module';
import { MarketAnalysisModule } from '@domain/market-analysis/market-analysis.module';

import { QUEUE_NAMES } from '@config/queue.config';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    QueueModule.forRoot(),
    EventBusModule,
    BinanceModule,
    HarmonicPatternModule,
    MarketAnalysisModule,
    BullModule.registerQueue(
      { name: QUEUE_NAMES.PATTERN_DETECTION },
      { name: QUEUE_NAMES.MARKET_ANALYSIS },
      { name: QUEUE_NAMES.TRADE_EXECUTION },
      { name: QUEUE_NAMES.NOTIFICATION },
    ),
  ],
  providers: [
    TasksService,
    PatternDetectorTask,
    MarketAnalyzerTask,
    TradeExecutorTask,
  ],
  exports: [
    TasksService,
    PatternDetectorTask,
    MarketAnalyzerTask,
    TradeExecutorTask,
  ],
})
export class TasksModule {}
