// 165. src/tasks/market-analyzer.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { QUEUE_NAMES } from '@config/queue.config';
import { APP_CONSTANTS } from '@shared/constants/constants';
import { ConfigService } from '@nestjs/config';

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
    // Kiểm tra nếu task là được bật trong cấu hình
    this.isEnabled = this.configService.get<string>('ENABLE_MARKET_ANALYZER') !== 'false';
    
    if (this.isEnabled) {
      this.logger.log('Market Analyzer Task is enabled');
    } else {
      this.logger.warn('Market Analyzer Task is disabled via configuration');
    }
  }

  /**
   * Chạy phân tích thị trường mỗi giờ
   */
  @Cron(CronExpression.EVERY_HOUR)
  async analyzeMarketHourly() {
    if (!this.isEnabled) return;
    
    this.logger.log('Running hourly market analysis');
    
    try {
      // Lấy tất cả các cặp tiền đang theo dõi
      const symbols = this.marketDataService.getSymbols();
      
      // Thêm vào hàng đợi để xử lý
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
   * Chạy phân tích thị trường hàng ngày
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async analyzeMarketDaily() {
    if (!this.isEnabled) return;
    
    this.logger.log('Running daily market analysis');
    
    try {
      // Lấy tất cả các cặp tiền đang theo dõi
      const symbols = this.marketDataService.getSymbols();
      
      // Thêm vào hàng đợi để xử lý
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
      
      // Cập nhật chỉ báo kỹ thuật
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
   * Cập nhật dữ liệu thị trường cho tất cả các cặp tiền đang theo dõi
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateMarketData() {
    if (!this.isEnabled) return;
    
    this.logger.debug('Refreshing market data cache');
    
    try {
      // Lấy tất cả các cặp tiền đang theo dõi
      const symbols = this.marketDataService.getSymbols();
      const timeframes = [
        APP_CONSTANTS.TIMEFRAMES.ONE_HOUR,
        APP_CONSTANTS.TIMEFRAMES.FOUR_HOURS,
        APP_CONSTANTS.TIMEFRAMES.ONE_DAY
      ];
      
      // Xử lý từng cặp tiền và khung thời gian
      for (const symbol of symbols) {
        for (const timeframe of timeframes) {
          try {
            // Lấy dữ liệu nến để làm mới cache nội bộ
            await this.marketDataService.getCandlesticks(symbol, timeframe, 100);
          } catch (error) {
            this.logger.error(`Error refreshing market data for ${symbol} ${timeframe}`, error);
            // Tiếp tục với các cặp tiền và khung thời gian khác
          }
          
          // Thêm độ trễ nhỏ để tránh vượt quá giới hạn rate limit
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      this.logger.debug('Market data cache refresh completed');
    } catch (error) {
      this.logger.error('Error refreshing market data cache', error);
    }
  }

  /**
   * Kích hoạt thủ công phân tích thị trường
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
  