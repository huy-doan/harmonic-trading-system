// 166. src/tasks/trade-executor.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { QUEUE_NAMES, JOB_NAMES } from '@config/queue.config';
import { APP_CONSTANTS } from '@shared/constants/constants';
import { ConfigService } from '@nestjs/config';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { TradingApiService } from '@infrastructure/external/binance/trading-api.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trade } from '@domain/trading/entities/trade.entity';
import { TradeSetup } from '@domain/trading/entities/trade-setup.entity';
import { HarmonicPattern } from '@domain/harmonic-patterns/entities/harmonic-pattern.entity';

@Injectable()
export class TradeExecutorTask {
  private readonly logger = new Logger(TradeExecutorTask.name);
  private readonly isEnabled: boolean;
  private readonly isSimulationMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly marketDataService: MarketDataStreamService,
    private readonly tradingApiService: TradingApiService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(TradeSetup)
    private readonly tradeSetupRepository: Repository<TradeSetup>,
    @InjectRepository(HarmonicPattern)
    private readonly patternRepository: Repository<HarmonicPattern>,
    @InjectQueue(QUEUE_NAMES.TRADE_EXECUTION) private tradeExecutionQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private notificationQueue: Queue,
  ) {
    // Kiểm tra nếu task được bật trong cấu hình
    this.isEnabled = this.configService.get<string>('ENABLE_TRADE_EXECUTOR') !== 'false';
    
    // Kiểm tra chế độ mô phỏng
    this.isSimulationMode = this.configService.get<string>('TRADING_MODE') !== 'live';
    
    if (this.isEnabled) {
      this.logger.log(`Trade Executor Task is enabled (Mode: ${this.isSimulationMode ? 'SIMULATION' : 'LIVE'})`);
    } else {
      this.logger.warn('Trade Executor Task is disabled via configuration');
    }
  }

  /**
   * Task kiểm tra các thiết lập giao dịch mỗi phút
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkTradeSetups() {
    if (!this.isEnabled) return;
    
    this.logger.debug('Checking trade setups');
    
    try {
      // Lấy các thiết lập giao dịch đang hoạt động (chưa kích hoạt)
      const activeSetups = await this.tradeSetupRepository.find({
        where: {
          isActive: true,
          isTriggered: false,
          validUntil: { $gte: new Date() } as any
        }
      });

      if (activeSetups.length === 0) {
        return;
      }
      
      this.logger.debug(`Found ${activeSetups.length} active trade setups`);
      
      // Thêm mỗi thiết lập vào hàng đợi để xử lý
      for (const setup of activeSetups) {
        await this.tradeExecutionQueue.add(
          JOB_NAMES.EXECUTE_TRADE,
          {
            setupId: setup.id,
            symbol: setup.symbol,
            timestamp: Date.now()
          },
          {
            attempts: 2,
            backoff: {
              type: 'fixed',
              delay: 2000
            },
            removeOnComplete: true
          }
        );
      }
    } catch (error) {
      this.logger.error('Error checking trade setups', error);
    }
  }

  /**
   * Task quản lý các giao dịch đang mở mỗi 5 phút
   */
  @Cron('*/5 * * * *') // Mỗi 5 phút
  async manageOpenTrades() {
    if (!this.isEnabled) return;
    
    this.logger.debug('Managing open trades');
    
    try {
      // Lấy tất cả các giao dịch đang mở
      const openTrades = await this.tradeRepository.find({
        where: { status: 'OPEN' }
      });

      if (openTrades.length === 0) {
        return;
      }
      
      this.logger.debug(`Found ${openTrades.length} open trades to manage`);
      
      // Thêm vào hàng đợi để xử lý
      await this.tradeExecutionQueue.add(
        JOB_NAMES.MANAGE_OPEN_TRADES,
        {
          tradeIds: openTrades.map(trade => trade.id),
          timestamp: Date.now()
        },
        {
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 2000
          },
          removeOnComplete: true
        }
      );
    } catch (error) {
      this.logger.error('Error managing open trades', error);
    }
  }

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
  }) {
    if (!this.isEnabled) return;
    
    // Chỉ xử lý các mô hình có chất lượng cao
    if (data.qualityScore < 75) {
      return;
    }
    
    this.logger.debug(`Creating trade setup for pattern ${data.patternId}`);
    
    try {
      // Tạo thiết lập giao dịch và thêm vào hàng đợi
      await this.tradeExecutionQueue.add(
        JOB_NAMES.SETUP_TRADE,
        {
          patternId: data.patternId,
          timestamp: Date.now()
        },
        {
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 2000
          },
          removeOnComplete: true
        }
      );
    } catch (error) {
      this.logger.error(`Failed to create trade setup for pattern ${data.patternId}`, error);
    }
  }

  /**
   * Xử lý công việc thiết lập giao dịch từ hàng đợi
   */
  @OnEvent(`bull:${QUEUE_NAMES.TRADE_EXECUTION}:completed`)
  async onTradeJobCompleted(job: any) {
    if (job.name === JOB_NAMES.SETUP_TRADE) {
      const { patternId } = job.data;
      this.logger.debug(`Trade setup completed for pattern ${patternId}`);
    } else if (job.name === JOB_NAMES.EXECUTE_TRADE) {
      const { setupId } = job.data;
      this.logger.debug(`Trade execution completed for setup ${setupId}`);
    } else if (job.name === JOB_NAMES.MANAGE_OPEN_TRADES) {
      this.logger.debug(`Trade management job completed`);
    }
  }

  /**
   * Tạo thiết lập giao dịch từ mô hình
   */
  async createTradeSetupFromPattern(patternId: string): Promise<TradeSetup> {
    try {
      // Lấy thông tin mô hình
      const pattern = await this.patternRepository.findOne({
        where: { id: patternId },
        relations: ['points']
      });

      if (!pattern) {
        throw new Error(`Pattern ${patternId} not found`);
      }

      // Kiểm tra xem đã có thiết lập giao dịch cho mô hình này chưa
      const existingSetup = await this.tradeSetupRepository.findOne({
        where: { patternId }
      });

      if (existingSetup) {
        this.logger.debug(`Trade setup already exists for pattern ${patternId}`);
        return existingSetup;
      }

      // Tính toán thời gian hiệu lực (thường là 24 giờ từ thời điểm phát hiện)
      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + 24);

      // Tính tỷ lệ rủi ro-lợi nhuận
      const riskRewardRatio = this.calculateRiskRewardRatio(
        pattern.entryPrice, 
        pattern.stopLoss, 
        pattern.takeProfit1
      );

      // Tạo thiết lập giao dịch mới
      const tradeSetup = this.tradeSetupRepository.create({
        symbol: pattern.symbol,
        timeframe: pattern.timeframe,
        patternType: pattern.patternType,
        direction: pattern.direction,
        entryPrice: pattern.entryPrice,
        stopLoss: pattern.stopLoss,
        takeProfit1: pattern.takeProfit1,
        takeProfit2: pattern.takeProfit2,
        takeProfit3: pattern.takeProfit3,
        riskRewardRatio,
        isTriggered: false,
        isActive: true,
        validUntil,
      });

      // Lưu thiết lập giao dịch
      const savedSetup = await this.tradeSetupRepository.save(tradeSetup);
      
      // Phát sự kiện
      this.eventEmitter.emit('trade.setup.created', {
        setupId: savedSetup.id,
        patternId: pattern.id,
        symbol: pattern.symbol,
        direction: pattern.direction
      });

      // Gửi thông báo
      await this.notificationQueue.add(
        JOB_NAMES.SEND_TRADE_NOTIFICATION,
        {
          type: 'TRADE_SETUP',
          setupId: savedSetup.id,
          patternId: pattern.id,
          symbol: pattern.symbol,
          direction: pattern.direction,
          timestamp: Date.now()
        },
        {
          priority: 3,
          attempts: 2,
          removeOnComplete: true
        }
      );

      return savedSetup;
    } catch (error) {
      this.logger.error(`Error creating trade setup for pattern ${patternId}`, error);
      throw error;
    }
  }

  /**
   * Tính tỷ lệ rủi ro-lợi nhuận
   */
  private calculateRiskRewardRatio(entryPrice: number, stopLoss: number, takeProfit: number): number {
    const risk = Math.abs(entryPrice - stopLoss);
    if (risk === 0) return 0;
    
    const reward = Math.abs(takeProfit - entryPrice);
    return parseFloat((reward / risk).toFixed(2));
  }
}
