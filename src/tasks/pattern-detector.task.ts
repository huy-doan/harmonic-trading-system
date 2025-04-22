// 164. src/tasks/pattern-detector.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { GartleyPatternService } from '@domain/harmonic-patterns/services/gartley-pattern.service';
import { ButterflyPatternService } from '@domain/harmonic-patterns/services/butterfly-pattern.service';
import { BatPatternService } from '@domain/harmonic-patterns/services/bat-pattern.service';
import { CrabPatternService } from '@domain/harmonic-patterns/services/crab-pattern.service';
import { CypherPatternService } from '@domain/harmonic-patterns/services/cypher-pattern.service';
import { PointPredictorService } from '@domain/harmonic-patterns/services/point-predictor.service';
import { QUEUE_NAMES, JOB_NAMES } from '@config/queue.config';
import { APP_CONSTANTS } from '@shared/constants/constants';
import { Candlestick } from '@shared/interfaces/market-data.interface';
import { HarmonicPattern } from '@domain/harmonic-patterns/entities/harmonic-pattern.entity';
// Import adapter
import { CandlestickAdapter } from '@libs/candlestick/utils/candlestick-adapter';

@Injectable()
export class PatternDetectorTask {
  private readonly logger = new Logger(PatternDetectorTask.name);
  private readonly isEnabled: boolean;
  private readonly patternDetectionInterval: number;
  private lastProcessedCandles: Map<string, Map<string, number>> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly marketDataService: MarketDataStreamService,
    private readonly gartleyService: GartleyPatternService,
    private readonly butterflyService: ButterflyPatternService,
    private readonly batService: BatPatternService,
    private readonly crabService: CrabPatternService,
    private readonly cypherService: CypherPatternService,
    private readonly pointPredictorService: PointPredictorService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QUEUE_NAMES.PATTERN_DETECTION) private patternDetectionQueue: Queue
  ) {
    // Kiểm tra nếu task được bật trong cấu hình
    this.isEnabled = this.configService.get<string>('ENABLE_PATTERN_DETECTOR') !== 'false';
    
    // Lấy khoảng thời gian quét mẫu hình từ cấu hình hoặc giá trị mặc định
    this.patternDetectionInterval = this.configService.get<number>(
      'PATTERN_DETECTION_INTERVAL',
      APP_CONSTANTS.SCAN_INTERVALS.PATTERN_DETECTION
    );
    
    if (this.isEnabled) {
      this.logger.log('Pattern Detector Task is enabled');
      this.logger.log(`Pattern detection interval: ${this.patternDetectionInterval}ms`);
    } else {
      this.logger.warn('Pattern Detector Task is disabled via configuration');
    }
  }

  /**
   * Task quét mô hình mỗi 30 giây
   */
  @Cron('*/30 * * * * *') // Mỗi 30 giây
  async scanForPatterns() {
    if (!this.isEnabled) return;
    
    this.logger.debug('Running pattern detection scan');
    
    try {
      // Lấy danh sách các cặp tiền đang theo dõi
      const symbols = this.marketDataService.getSymbols();
      
      // Các khung thời gian cần quét
      const timeframes = [
        APP_CONSTANTS.TIMEFRAMES.ONE_HOUR,
        APP_CONSTANTS.TIMEFRAMES.FOUR_HOURS,
        APP_CONSTANTS.TIMEFRAMES.ONE_DAY
      ];
      
      // Xử lý song song các cặp tiền
      await Promise.all(symbols.map(async (symbol) => {
        for (const timeframe of timeframes) {
          // Kiểm tra xem có cần quét lại khung thời gian này không
          if (this.shouldProcessTimeframe(symbol, timeframe)) {
            try {
              // Thêm công việc vào queue
              await this.patternDetectionQueue.add(
                JOB_NAMES.SCAN_FOR_PATTERNS,
                {
                  symbol,
                  timeframe,
                  timestamp: Date.now()
                },
                {
                  attempts: 2,
                  backoff: {
                    type: 'fixed',
                    delay: 5000
                  },
                  removeOnComplete: true
                }
              );
            } catch (error) {
              this.logger.error(`Error scheduling pattern detection for ${symbol} ${timeframe}`, error);
            }
          }
        }
      }));
    } catch (error) {
      this.logger.error('Error in pattern detection scan', error);
    }
  }

  /**
   * Xử lý công việc phát hiện mô hình từ queue
   */
  @OnEvent(`bull:${QUEUE_NAMES.PATTERN_DETECTION}:completed`)
  async onPatternDetectionJobCompleted(job: any) {
    if (job.name === JOB_NAMES.SCAN_FOR_PATTERNS) {
      const { symbol, timeframe } = job.data;
      
      this.logger.debug(`Pattern detection completed for ${symbol} ${timeframe}`);
      
      // Cập nhật thời gian xử lý cuối cùng
      this.updateLastProcessedTime(symbol, timeframe);
    }
  }

  /**
   * Thực hiện phát hiện mẫu hình cho một cặp tiền và khung thời gian cụ thể
   */
  async detectPatternsForSymbolAndTimeframe(symbol: string, timeframe: string): Promise<HarmonicPattern[]> {
    try {
      this.logger.debug(`Detecting patterns for ${symbol} ${timeframe}`);
      
      // Lấy dữ liệu nến
      const marketDataCandles = await this.marketDataService.getCandlesticks(symbol, timeframe, 200);
      
      if (!marketDataCandles || marketDataCandles.length < 50) {
        this.logger.warn(`Insufficient candlestick data for ${symbol} ${timeframe}`);
        return [];
      }

      // Chuyển đổi sang Candlestick class
      const candles = CandlestickAdapter.fromMarketDataArray(marketDataCandles);

      // Chạy các thuật toán phát hiện mẫu hình
      const [gartleyPatterns, butterflyPatterns, batPatterns, crabPatterns, cypherPatterns] = await Promise.all([
        this.gartleyService.findPatterns(candles, symbol, timeframe),
        this.butterflyService.findPatterns(candles, symbol, timeframe),
        this.batService.findPatterns(candles, symbol, timeframe),
        this.crabService.findPatterns(candles, symbol, timeframe),
        this.cypherService.findPatterns(candles, symbol, timeframe)
      ]);
      
      // Gộp tất cả các mẫu hình phát hiện được
      const allPatterns = [
        ...gartleyPatterns,
        ...butterflyPatterns,
        ...batPatterns,
        ...crabPatterns,
        ...cypherPatterns
      ];
      
      // Ghi log kết quả
      this.logger.debug(`Detected ${allPatterns.length} patterns for ${symbol} ${timeframe}`);
      
      // Dự đoán điểm D cho các mẫu hình chưa hoàn thành
      const incompletePatterns = allPatterns.filter(pattern => !pattern.isCompleted);
      for (const pattern of incompletePatterns) {
        try {
          await this.pointPredictorService.predictDPoint(pattern.id);
        } catch (error) {
          this.logger.error(`Error predicting D point for pattern ${pattern.id}`, error);
        }
      }
      
      // Cập nhật giá thị trường hiện tại
      if (incompletePatterns.length > 0) {
        try {
          const currentPrice = await this.marketDataService.getLatestPrice(symbol);
          
          // Cập nhật độ tin cậy của các điểm dự đoán
          for (const pattern of incompletePatterns) {
            await this.pointPredictorService.updatePredictionConfidence(pattern.id, currentPrice);
          }
        } catch (error) {
          this.logger.error(`Error updating prediction confidence for ${symbol}`, error);
        }
      }
      
      return allPatterns;
    } catch (error) {
      this.logger.error(`Error detecting patterns for ${symbol} ${timeframe}`, error);
      return [];
    }
  }

  /**
   * Kiểm tra xem có nên xử lý lại một khung thời gian cụ thể không
   */
  private shouldProcessTimeframe(symbol: string, timeframe: string): boolean {
    const now = Date.now();
    
    // Lấy thời gian xử lý cuối cùng cho cặp tiền và khung thời gian
    const lastProcessedTime = this.getLastProcessedTime(symbol, timeframe);
    
    // Tính khoảng thời gian giữa các lần quét dựa trên khung thời gian
    let scanInterval = this.patternDetectionInterval;
    
    // Cho các khung thời gian lớn hơn, có thể giảm tần suất quét
    if (timeframe === APP_CONSTANTS.TIMEFRAMES.FOUR_HOURS) {
      scanInterval = scanInterval * 2;
    } else if (timeframe === APP_CONSTANTS.TIMEFRAMES.ONE_DAY) {
      scanInterval = scanInterval * 4;
    }
    
    // Chỉ xử lý nếu đã qua đủ thời gian
    return !lastProcessedTime || (now - lastProcessedTime) >= scanInterval;
  }

  /**
   * Lấy thời gian xử lý cuối cùng cho một cặp tiền và khung thời gian
   */
  private getLastProcessedTime(symbol: string, timeframe: string): number | undefined {
    if (!this.lastProcessedCandles.has(symbol)) {
      return undefined;
    }
    
    return this.lastProcessedCandles.get(symbol).get(timeframe);
  }

  /**
   * Cập nhật thời gian xử lý cuối cùng cho một cặp tiền và khung thời gian
   */
  private updateLastProcessedTime(symbol: string, timeframe: string): void {
    if (!this.lastProcessedCandles.has(symbol)) {
      this.lastProcessedCandles.set(symbol, new Map());
    }
    
    this.lastProcessedCandles.get(symbol).set(timeframe, Date.now());
  }

  /**
   * Xử lý sự kiện khi một nến mới được cập nhật
   */
  @OnEvent('market.candlestick.update')
  async onCandlestickUpdate(data: { 
    symbol: string; 
    timeframe: string; 
    candlestick: Candlestick; 
    isComplete: boolean 
  }) {
    if (!this.isEnabled) return;
    
    // Chỉ xử lý khi nến hoàn thành (isComplete = true)
    if (data.isComplete) {
      this.logger.debug(`New complete candlestick for ${data.symbol} ${data.timeframe}`);
      
      // Thêm việc phát hiện mẫu hình vào hàng đợi với mức ưu tiên cao
      try {
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
      } catch (error) {
        this.logger.error(`Error scheduling pattern detection for new candle ${data.symbol} ${data.timeframe}`, error);
      }
    }
  }
}
