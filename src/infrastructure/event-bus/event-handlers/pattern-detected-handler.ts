// 075. src/infrastructure/event-bus/event-handlers/pattern-detected-handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES, JOB_NAMES } from '@config/queue.config';

@Injectable()
export class PatternDetectedHandler {
  private readonly logger = new Logger(PatternDetectedHandler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.TRADE_EXECUTION) private tradeExecutionQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private notificationQueue: Queue,
  ) {}

  /**
   * Xử lý sự kiện khi phát hiện mô hình mới
   */
  @OnEvent('pattern.detected')
  async handlePatternDetected(data: {
    patternId: string;
    patternType: string;
    symbol: string;
    timeframe: string;
    direction: string;
    qualityScore: number;
    detectedAt: Date;
  }): Promise<void> {
    this.logger.debug(`Handling detected ${data.patternType} pattern for ${data.symbol} ${data.timeframe}`);

    try {
      // 1. Xử lý thiết lập giao dịch
      if (data.qualityScore >= 70) {
        await this.tradeExecutionQueue.add(
          JOB_NAMES.SETUP_TRADE,
          {
            patternId: data.patternId,
            symbol: data.symbol,
            timeframe: data.timeframe,
            direction: data.direction,
            qualityScore: data.qualityScore,
            timestamp: Date.now()
          },
          {
            priority: 2,
            attempts: 2,
            backoff: {
              type: 'fixed',
              delay: 3000
            },
            removeOnComplete: true
          }
        );
        
        this.logger.debug(`Trade setup job added for pattern ${data.patternId}`);
      }

      // 2. Gửi thông báo
      await this.notificationQueue.add(
        JOB_NAMES.SEND_PATTERN_NOTIFICATION,
        {
          type: 'PATTERN_DETECTED',
          patternId: data.patternId,
          patternType: data.patternType,
          symbol: data.symbol,
          timeframe: data.timeframe,
          direction: data.direction,
          qualityScore: data.qualityScore,
          timestamp: Date.now()
        },
        {
          priority: 3,
          attempts: 3,
          removeOnComplete: true
        }
      );
      
      this.logger.debug(`Notification job added for pattern ${data.patternId}`);
    } catch (error) {
      this.logger.error(`Failed to process pattern detection: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Xử lý sự kiện khi mô hình hoàn thành (điểm D xác nhận)
   */
  @OnEvent('pattern.completed')
  async handlePatternCompleted(data: {
    patternId: string;
    completionTime: Date;
    completionPrice: number;
  }): Promise<void> {
    this.logger.debug(`Handling completed pattern ${data.patternId}`);

    try {
      // Gửi thông báo về việc mô hình hoàn thành
      await this.notificationQueue.add(
        JOB_NAMES.SEND_PATTERN_NOTIFICATION,
        {
          type: 'PATTERN_COMPLETED',
          patternId: data.patternId,
          completionTime: data.completionTime,
          completionPrice: data.completionPrice,
          timestamp: Date.now()
        },
        {
          priority: 3,
          attempts: 3,
          removeOnComplete: true
        }
      );

      // Kiểm tra giao dịch liên quan đến mô hình này
      await this.tradeExecutionQueue.add(
        JOB_NAMES.MANAGE_OPEN_TRADES,
        {
          patternId: data.patternId,
          completionPrice: data.completionPrice,
          timestamp: Date.now()
        },
        {
          priority: 1,
          attempts: 2,
          removeOnComplete: true
        }
      );
      
      this.logger.debug(`Completion jobs added for pattern ${data.patternId}`);
    } catch (error) {
      this.logger.error(`Failed to process pattern completion: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Xử lý sự kiện khi dự đoán điểm D
   */
  @OnEvent('pattern.point.predicted')
  async handlePointPredicted(data: {
    patternId: string;
    point: {
      label: string;
      price: number;
      timestamp: Date;
    };
    confidence: number;
  }): Promise<void> {
    this.logger.debug(`Handling predicted point ${data.point.label} for pattern ${data.patternId}`);

    try {
      // Chỉ gửi thông báo khi dự đoán điểm D
      if (data.point.label === 'D') {
        await this.notificationQueue.add(
          JOB_NAMES.SEND_PATTERN_NOTIFICATION,
          {
            type: 'POINT_PREDICTED',
            patternId: data.patternId,
            pointLabel: data.point.label,
            pointPrice: data.point.price,
            confidence: data.confidence,
            timestamp: Date.now()
          },
          {
            priority: 4,
            attempts: 2,
            removeOnComplete: true
          }
        );
        
        this.logger.debug(`Prediction notification added for pattern ${data.patternId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process point prediction: ${error.message}`, error.stack);
    }
  }
}
