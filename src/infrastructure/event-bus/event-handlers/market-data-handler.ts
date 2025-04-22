// 074. src/infrastructure/event-bus/event-handlers/market-data-handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES, JOB_NAMES } from '@config/queue.config';
import { Candlestick } from '@shared/interfaces/market-data.interface';

@Injectable()
export class MarketDataHandler {
  private readonly logger = new Logger(MarketDataHandler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.PATTERN_DETECTION) private patternDetectionQueue: Queue,
    @InjectQueue(QUEUE_NAMES.MARKET_ANALYSIS) private marketAnalysisQueue: Queue,
  ) {}

  /**
   * Xử lý sự kiện khi có dữ liệu candlestick mới
   */
  @OnEvent('market.candlestick.update')
  async handleCandlestickUpdate(data: { 
    symbol: string; 
    timeframe: string; 
    candlestick: Candlestick; 
    isComplete: boolean 
  }): Promise<void> {
    this.logger.debug(`Handling candlestick update for ${data.symbol} ${data.timeframe}`);

    // Chỉ xử lý khi nến hoàn thành (đóng)
    if (data.isComplete) {
      this.logger.debug(`Candlestick completed for ${data.symbol} ${data.timeframe}`);
      
      try {
        // Thêm công việc phát hiện mẫu hình vào hàng đợi
        await this.patternDetectionQueue.add(
          JOB_NAMES.SCAN_FOR_PATTERNS,
          {
            symbol: data.symbol,
            timeframe: data.timeframe,
            timestamp: Date.now(),
            isTriggeredByNewCandle: true
          },
          {
            priority: 1, // Ưu tiên cao
            attempts: 2,
            backoff: {
              type: 'fixed',
              delay: 2000
            },
            removeOnComplete: true
          }
        );
        
        this.logger.debug(`Scheduled pattern detection for ${data.symbol} ${data.timeframe}`);
      } catch (error) {
        this.logger.error(`Failed to schedule pattern detection: ${error.message}`, error.stack);
      }
    }
  }
  
  /**
   * Xử lý sự kiện khi có dữ liệu giá mới
   */
  @OnEvent('market.price.update')
  async handlePriceUpdate(data: { 
    symbol: string; 
    price: number; 
    timestamp: number 
  }): Promise<void> {
    this.logger.debug(`Handling price update for ${data.symbol}: ${data.price}`);
    
    try {
      // Gửi dữ liệu giá đến hàng đợi phân tích thị trường
      await this.marketAnalysisQueue.add(
        JOB_NAMES.UPDATE_TECHNICAL_INDICATORS,
        {
          symbol: data.symbol,
          price: data.price,
          timestamp: data.timestamp
        },
        {
          priority: 5,
          attempts: 1,
          removeOnComplete: true
        }
      );
    } catch (error) {
      this.logger.error(`Failed to process price update: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Xử lý khi phân tích thị trường hoàn thành
   */
  @OnEvent('market.analysis.completed')
  async handleMarketAnalysisCompleted(data: {
    symbol: string;
    timeframe: string;
    metrics: any;
    timestamp: string;
  }): Promise<void> {
    this.logger.debug(`Market analysis completed for ${data.symbol} ${data.timeframe}`);
    
    // Có thể thêm logic xử lý kết quả phân tích ở đây
    // Ví dụ: cập nhật cache, tạo cảnh báo, v.v.
  }
}

