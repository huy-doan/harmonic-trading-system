// 166. src/tasks/trade-executor.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { TradeService } from '@domain/trading/services/trade.service';
import { TradeSetupService } from '@domain/trading/services/trade-setup.service';
import { TradeExecutorService } from '@domain/trading/services/trade-executor.service';
import { QUEUE_NAMES, JOB_NAMES } from '@config/queue.config';
import { APP_CONSTANTS } from '@shared/constants/constants';

@Injectable()
export class TradeExecutorTask {
  private readonly logger = new Logger(TradeExecutorTask.name);
  private readonly isEnabled: boolean;
  private readonly isSimulationMode: boolean;
  private readonly tradeExecutionInterval: number;
  private readonly maxConcurrentTrades: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly marketDataService: MarketDataStreamService,
    private readonly tradeService: TradeService,
    private readonly tradeSetupService: TradeSetupService,
    private readonly tradeExecutorService: TradeExecutorService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QUEUE_NAMES.TRADE_EXECUTION) private tradeExecutionQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private notificationQueue: Queue
  ) {
    // Kiểm tra nếu task được bật trong cấu hình
    this.isEnabled = this.configService.get<string>('ENABLE_TRADE_EXECUTOR') !== 'false';
    
    // Kiểm tra chế độ mô phỏng
    this.isSimulationMode = this.configService.get<string>('TRADING_MODE') !== 'live';
    
    // Lấy khoảng thời gian kiểm tra thực thi giao dịch từ cấu hình hoặc giá trị mặc định
    this.tradeExecutionInterval = this.configService.get<number>(
      'TRADE_EXECUTION_INTERVAL',
      APP_CONSTANTS.SCAN_INTERVALS.TRADE_EXECUTION
    );
    
    // Lấy số lượng giao dịch tối đa được phép đồng thời
    this.maxConcurrentTrades = this.configService.get<number>('MAX_CONCURRENT_TRADES', 5);
    
    if (this.isEnabled) {
      this.logger.log(`Trade Executor Task is enabled (Mode: ${this.isSimulationMode ? 'SIMULATION' : 'LIVE'})`);
      this.logger.log(`Trade execution interval: ${this.tradeExecutionInterval}ms`);
      this.logger.log(`Maximum concurrent trades: ${this.maxConcurrentTrades}`);
    } else {
      this.logger.warn('Trade Executor Task is disabled via configuration');
    }
  }

  /**
   * Task kiểm tra thực thi giao dịch mỗi phút
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkTradeExecutions() {
    if (!this.isEnabled) return;
    
    this.logger.debug('Running trade execution check');
    
    try {
      // Kiểm tra các giao dịch đang mở để xem có cần đóng không
      await this.checkOpenTrades();
      
      // Kiểm tra các thiết lập giao dịch chờ thực thi
      await this.checkPendingTradeSetups();
      
      // Vô hiệu hóa các thiết lập giao dịch đã hết hạn
      await this.deactivateExpiredSetups();
    } catch (error) {
      this.logger.error('Error in trade execution check', error);
    }
  }

  /**
   * Kiểm tra các giao dịch đang mở để xem có cần đóng không
   */
  private async checkOpenTrades(): Promise<void> {
    try {
      // Thêm nhiệm vụ kiểm tra giao dịch đang mở vào hàng đợi
      await this.tradeExecutionQueue.add(
        JOB_NAMES.MANAGE_OPEN_TRADES,
        {
          timestamp: Date.now()
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
    } catch (error) {
      this.logger.error('Error scheduling open trades check', error);
    }
  }

  /**
   * Kiểm tra các thiết lập giao dịch chờ thực thi
   */
  private async checkPendingTradeSetups(): Promise<void> {
    try {
      // Lấy danh sách các thiết lập giao dịch còn hoạt động
      const activeSetups = await this.tradeSetupService.findActiveSetups();
      
      if (activeSetups.length === 0) {
        return;
      }
      
      this.logger.debug(`Found ${activeSetups.length} active trade setups to check`);
      
      // Lấy số lượng giao dịch đang mở
      const openTrades = await this.tradeService.findOpenTrades();
      
      // Kiểm tra xem đã đạt đến số lượng giao dịch tối đa chưa
      if (openTrades.length >= this.maxConcurrentTrades) {
        this.logger.debug(`Maximum concurrent trades limit (${this.maxConcurrentTrades}) reached. Currently: ${openTrades.length}`);
        return;
      }
      
      // Số lượng giao dịch mới có thể thực thi
      const availableSlots = this.maxConcurrentTrades - openTrades.length;
      
      // Chỉ xử lý số lượng thiết lập giao dịch tương ứng với số slot khả dụng
      const setupsToProcess = activeSetups.slice(0, availableSlots);
      
      // Thêm nhiệm vụ thực thi giao dịch vào hàng đợi
      for (const setup of setupsToProcess) {
        await this.tradeExecutionQueue.add(
          JOB_NAMES.SETUP_TRADE,
          {
            setupId: setup.id,
            timestamp: Date.now()
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
      }
    } catch (error) {
      this.logger.error('Error checking pending trade setups', error);
    }
  }

  /**
   * Vô hiệu hóa các thiết lập giao dịch đã hết hạn
   */
  private async deactivateExpiredSetups(): Promise<void> {
    try {
      const deactivatedCount = await this.tradeSetupService.deactivateExpiredSetups();
      
      if (deactivatedCount > 0) {
        this.logger.debug(`Deactivated ${deactivatedCount} expired trade setups`);
      }
    } catch (error) {
      this.logger.error('Error deactivating expired trade setups', error);
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
   * Xử lý công việc từ hàng đợi: Kiểm tra giao dịch đang mở
   */
  @OnEvent(`bull:${QUEUE_NAMES.TRADE_EXECUTION}:${JOB_NAMES.MANAGE_OPEN_TRADES}:completed`)
  async onManageOpenTradesJobCompleted(job: any) {
    this.logger.debug('Open trades check completed');
  }

  /**
   * Xử lý công việc từ hàng đợi: Thiết lập giao dịch
   */
  @OnEvent(`bull:${QUEUE_NAMES.TRADE_EXECUTION}:${JOB_NAMES.SETUP_TRADE}:completed`)
  async onSetupTradeJobCompleted(job: any) {
    const { setupId, patternId } = job.data;
    
    if (patternId) {
      this.logger.debug(`Trade setup creation completed for pattern ${patternId}`);
      try {
        // Tạo thiết lập giao dịch từ mô hình
        const setup = await this.tradeSetupService.createFromPattern(patternId);
        
        // Gửi thông báo về thiết lập giao dịch mới
        await this.notificationQueue.add(
          JOB_NAMES.SEND_TRADE_NOTIFICATION,
          {
            type: 'TRADE_SETUP',
            setupId: setup.id,
            patternId,
            symbol: setup.symbol,
            direction: setup.direction,
            timestamp: Date.now()
          },
          {
            priority: 3,
            attempts: 2,
            removeOnComplete: true
          }
        );
      } catch (error) {
        this.logger.error(`Error creating trade setup from pattern ${patternId}`, error);
      }
    } else if (setupId) {
      this.logger.debug(`Trade setup check completed for setup ${setupId}`);
    }
  }

  /**
   * Xử lý sự kiện cập nhật giá mới
   */
  @OnEvent('market.price.update')
  async onPriceUpdate(data: { symbol: string; price: number; timestamp: number }) {
    if (!this.isEnabled) return;
    
    try {
      // Thêm công việc kiểm tra điều kiện thực thi giao dịch vào hàng đợi
      await this.tradeExecutionQueue.add(
        JOB_NAMES.EXECUTE_TRADE,
        {
          symbol: data.symbol,
          price: data.price,
          timestamp: data.timestamp
        },
        {
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 1000
          },
          removeOnComplete: true
        }
      );
    } catch (error) {
      this.logger.error(`Error processing price update for ${data.symbol}`, error);
    }
  }

  /**
   * Xử lý công việc thực thi giao dịch
   */
  @OnEvent(`bull:${QUEUE_NAMES.TRADE_EXECUTION}:${JOB_NAMES.EXECUTE_TRADE}:completed`)
  async onExecuteTradeJobCompleted(job: any) {
    const { symbol, price, setupId } = job.data;
    
    if (setupId) {
      this.logger.debug(`Trade execution completed for setup ${setupId}`);
      
      try {
        // Kiểm tra điều kiện thực thi cho thiết lập giao dịch cụ thể
        const trade = await this.executeTradeForSetup(setupId);
        
        if (trade) {
          // Gửi thông báo về giao dịch mới
          await this.notificationQueue.add(
            JOB_NAMES.SEND_TRADE_NOTIFICATION,
            {
              type: 'TRADE_EXECUTED',
              tradeId: trade.id,
              setupId,
              symbol: trade.symbol,
              direction: trade.direction,
              price: trade.entryPrice,
              timestamp: Date.now()
            },
            {
              priority: 2,
              attempts: 2,
              removeOnComplete: true
            }
          );
        }
      } catch (error) {
        this.logger.error(`Error executing trade for setup ${setupId}`, error);
      }
    } else if (symbol && price) {
      this.logger.debug(`Price check completed for ${symbol} at price ${price}`);
    }
  }

  /**
   * Thực thi giao dịch cho một thiết lập cụ thể
   */
  async executeTradeForSetup(setupId: string, userId?: string): Promise<any> {
    try {
      return await this.tradeExecutorService.executeTradeFromSetup(setupId, userId);
    } catch (error) {
      this.logger.error(`Failed to execute trade for setup ${setupId}`, error);
      throw error;
    }
  }

  /**
   * Kiểm tra và đóng giao dịch nếu cần
   */
  async checkAndCloseTrade(tradeId: string): Promise<any> {
    try {
      // Lấy thông tin giao dịch
      const trade = await this.tradeService.findById(tradeId);
      
      // Kiểm tra xem giao dịch có cần đóng không
      if (trade.status !== 'OPEN') {
        return { message: 'Trade is not open', status: trade.status };
      }
      
      // Lấy giá hiện tại
      const currentPrice = await this.marketDataService.getLatestPrice(trade.symbol);
      
      // Kiểm tra điều kiện đóng lệnh (stop loss hoặc take profit)
      let shouldClose = false;
      let reason = '';
      
      if (trade.direction === 'LONG') {
        if (currentPrice <= trade.stopLoss) {
          shouldClose = true;
          reason = 'Stop loss triggered';
        } else if (currentPrice >= trade.takeProfit) {
          shouldClose = true;
          reason = 'Take profit triggered';
        }
      } else { // SHORT
        if (currentPrice >= trade.stopLoss) {
          shouldClose = true;
          reason = 'Stop loss triggered';
        } else if (currentPrice <= trade.takeProfit) {
          shouldClose = true;
          reason = 'Take profit triggered';
        }
      }
      
      if (shouldClose) {
        // Đóng giao dịch
        const closedTrade = await this.tradeExecutorService.closeTradeAtMarket(tradeId);
        
        // Gửi thông báo về giao dịch đã đóng
        await this.notificationQueue.add(
          JOB_NAMES.SEND_TRADE_NOTIFICATION,
          {
            type: 'TRADE_CLOSED',
            tradeId: trade.id,
            symbol: trade.symbol,
            reason,
            price: currentPrice,
            profitLoss: closedTrade.profitLoss,
            profitLossPercent: closedTrade.profitLossPercent,
            timestamp: Date.now()
          },
          {
            priority: 2,
            attempts: 2,
            removeOnComplete: true
          }
        );
        
        return { message: reason, trade: closedTrade };
      }
      
      return { message: 'Trade conditions checked, no action needed' };
    } catch (error) {
      this.logger.error(`Failed to check and close trade ${tradeId}`, error);
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
