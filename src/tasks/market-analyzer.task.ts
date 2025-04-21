// 165. src/tasks/market-analyzer.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { QUEUE_NAMES } from '@config/queue.config';
import { ConfigService } from '@nestjs/config';
import { APP_CONSTANTS } from '@shared/constants/constants';

@Injectable()
export class MarketAnalyzerTask {
  private readonly logger = new Logger(MarketAnalyzerTask.name);
  private readonly isEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly marketDataService: MarketDataStreamService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QUEUE_NAMES.MARKET_ANALYSIS) private marketAnalysisQueue: Queue
  ) {
    // Check if the task is enabled in configuration
    this.isEnabled = this.configService.get<string>('ENABLE_MARKET_ANALYZER') !== 'false';
    
    if (this.isEnabled) {
      this.logger.log('Market Analyzer Task is enabled');
    } else {
      this.logger.warn('Market Analyzer Task is disabled via configuration');
    }
  }

  /**
   * Run market analysis hourly
   */
  @Cron(CronExpression.EVERY_HOUR)
  async analyzeMarketHourly() {
    if (!this.isEnabled) return;
    
    this.logger.log('Running hourly market analysis');
    
    try {
      // Get all symbols being tracked
      const symbols = this.marketDataService.getSymbols();
      
      // Add to queue for processing
      await this.marketAnalysisQueue.add(
        'analyze_market_trends',
        {
          symbols,
          timeframe: APP_CONSTANTS.TIMEFRAMES.ONE_HOUR,
          timestamp: new Date().toISOString()
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          removeOnComplete: true
        }
      );
      
      this.logger.debug(`Added ${symbols.length} symbols to market analysis queue`);
    } catch (error) {
      this.logger.error('Error scheduling market analysis', error);
    }
  }

  /**
   * Run market analysis daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async analyzeMarketDaily() {
    if (!this.isEnabled) return;
    
    this.logger.log('Running daily market analysis');
    
    try {
      // Get all symbols being tracked
      const symbols = this.marketDataService.getSymbols();
      
      // Add to queue for processing
      await this.marketAnalysisQueue.add(
        'analyze_market_trends',
        {
          symbols,
          timeframe: APP_CONSTANTS.TIMEFRAMES.ONE_DAY,
          timestamp: new Date().toISOString(),
          isDaily: true
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          removeOnComplete: true
        }
      );
      
      // Also update technical indicators
      await this.marketAnalysisQueue.add(
        'update_technical_indicators',
        {
          symbols,
          timestamp: new Date().toISOString()
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          removeOnComplete: true
        }
      );
      
      this.logger.debug(`Added ${symbols.length} symbols to daily analysis queue`);
    } catch (error) {
      this.logger.error('Error scheduling daily market analysis', error);
    }
  }

  /**
   * Update market data for all tracked symbols
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateMarketData() {
    if (!this.isEnabled) return;
    
    this.logger.debug('Refreshing market data cache');
    
    try {
      // Get all symbols being tracked
      const symbols = this.marketDataService.getSymbols();
      const timeframes = [
        APP_CONSTANTS.TIMEFRAMES.ONE_HOUR,
        APP_CONSTANTS.TIMEFRAMES.FOUR_HOURS,
        APP_CONSTANTS.TIMEFRAMES.ONE_DAY
      ];
      
      // Process each symbol and timeframe
      for (const symbol of symbols) {
        for (const timeframe of timeframes) {
          try {
            // This will refresh the cache internally
            await this.marketDataService.getCandlesticks(symbol, timeframe, 100);
          } catch (error) {
            this.logger.error(`Error refreshing market data for ${symbol} ${timeframe}`, error);
            // Continue with other symbols/timeframes
          }
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      this.logger.debug('Market data cache refresh completed');
    } catch (error) {
      this.logger.error('Error refreshing market data cache', error);
    }
  }

  /**
   * Manual trigger for market analysis
   */
  async triggerMarketAnalysis(symbols: string[], timeframe: string): Promise<string> {
    if (!this.isEnabled) {
      return 'Market analyzer is disabled';
    }
    
    try {
      const jobId = new Date().getTime().toString();
      
      await this.marketAnalysisQueue.add(
        'analyze_market_trends',
        {
          symbols,
          timeframe,
          timestamp: new Date().toISOString(),
          isManualTrigger: true
        },
        {
          jobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          removeOnComplete: true
        }
      );
      
      return `Market analysis job scheduled with ID: ${jobId}`;
    } catch (error) {
      this.logger.error('Error triggering manual market analysis', error);
      throw error;
    }
  }
}
