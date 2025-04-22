// 119. src/domain/trading/services/trade-executor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { TradeService } from './trade.service';
import { TradeSetupService } from './trade-setup.service';
import { CreateTradeDto } from '../dtos/trade.dto';
import { Trade } from '../entities/trade.entity';
import { TradeSetup } from '../entities/trade-setup.entity';
import { TradingApiService } from '@infrastructure/external/binance/trading-api.service';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';

@Injectable()
export class TradeExecutorService {
  private readonly logger = new Logger(TradeExecutorService.name);
  private readonly isSimulationMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly tradeService: TradeService,
    private readonly tradeSetupService: TradeSetupService,
    private readonly tradingApiService: TradingApiService,
    private readonly marketDataService: MarketDataStreamService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // Kiểm tra chế độ giả lập
    this.isSimulationMode = this.configService.get<string>('TRADING_MODE') !== 'live';
    
    if (this.isSimulationMode) {
      this.logger.warn('TradeExecutorService is running in SIMULATION mode. No real trades will be executed.');
    } else {
      this.logger.log('TradeExecutorService is running in LIVE mode. Real trades will be executed.');
    }
  }

  /**
   * Thực thi giao dịch dựa trên thiết lập giao dịch
   */
  async executeTradeFromSetup(tradeSetupId: string, userId?: string): Promise<Trade> {
    try {
      // Lấy thông tin thiết lập giao dịch
      const tradeSetup = await this.tradeSetupService.findById(tradeSetupId);
      
      // Kiểm tra xem thiết lập giao dịch có hợp lệ không
      if (!tradeSetup.isActive) {
        throw new Error(`Trade setup ${tradeSetupId} is not active`);
      }
      
      if (tradeSetup.isTriggered) {
        throw new Error(`Trade setup ${tradeSetupId} has already been triggered`);
      }
      
      if (new Date() > tradeSetup.validUntil) {
        // Cập nhật thiết lập giao dịch thành không còn hoạt động vì đã hết hạn
        await this.tradeSetupService.update(tradeSetupId, { isActive: false });
        throw new Error(`Trade setup ${tradeSetupId} has expired`);
      }
      
      // Lấy giá hiện tại
      const currentPrice = await this.marketDataService.getLatestPrice(tradeSetup.symbol);
      
      // Kiểm tra điều kiện vào lệnh
      const entryConditionMet = this.checkEntryCondition(tradeSetup, currentPrice);
      
      if (!entryConditionMet) {
        this.logger.debug(`Entry condition not met for setup ${tradeSetupId}. Current price: ${currentPrice}, Entry price: ${tradeSetup.entryPrice}`);
        return null;
      }
      
      // Tính toán quantity dựa trên số tiền đặt cược và giá vào lệnh
      const quantity = this.calculateQuantity(tradeSetup.symbol, tradeSetup.entryPrice, tradeSetup.stopLoss);
      
      // Tạo giao dịch
      const tradeDto: CreateTradeDto = {
        symbol: tradeSetup.symbol,
        direction: tradeSetup.direction,
        entryPrice: currentPrice, // Sử dụng giá hiện tại làm giá vào lệnh
        stopLoss: tradeSetup.stopLoss,
        takeProfit: tradeSetup.takeProfit1, // Sử dụng take profit đầu tiên
        quantity,
        isSimulated: this.isSimulationMode,
        tradeSetupId: tradeSetup.id,
        userId
      };
      
      // Thực hiện giao dịch thực tế hoặc giả lập
      if (!this.isSimulationMode) {
        const order = tradeSetup.direction === 'LONG'
          ? await this.tradingApiService.executeBuyMarketOrder(tradeSetup.symbol, quantity)
          : await this.tradingApiService.executeSellMarketOrder(tradeSetup.symbol, quantity);
          
        tradeDto.orderId = order.orderId.toString();
      }
      
      // Lưu giao dịch vào database
      const trade = await this.tradeService.create(tradeDto);
      
      // Cập nhật thiết lập giao dịch
      await this.tradeSetupService.update(tradeSetupId, { isTriggered: true });
      
      // Emit trade executed event
      this.eventEmitter.emit('trade.executed', {
        tradeId: trade.id,
        setupId: tradeSetup.id,
        symbol: trade.symbol,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        isSimulated: trade.isSimulated,
        timestamp: new Date()
      });
      
      return trade;
    } catch (error) {
      this.logger.error(`Failed to execute trade from setup ${tradeSetupId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Đóng giao dịch thoát lệnh
   */
  async closeTradeAtMarket(tradeId: string): Promise<Trade> {
    try {
      // Lấy thông tin giao dịch
      const trade = await this.tradeService.findById(tradeId);
      
      if (trade.status !== 'OPEN') {
        throw new Error(`Trade ${tradeId} is not open`);
      }
      
      // Lấy giá hiện tại
      const currentPrice = await this.marketDataService.getLatestPrice(trade.symbol);
      
      // Thực hiện đóng giao dịch thực tế nếu không phải chế độ giả lập
      if (!trade.isSimulated) {
        const order = trade.direction === 'LONG'
          ? await this.tradingApiService.executeSellMarketOrder(trade.symbol, trade.quantity)
          : await this.tradingApiService.executeBuyMarketOrder(trade.symbol, trade.quantity);
      }
      
      // Cập nhật giao dịch trong database
      const closedTrade = await this.tradeService.closeTrade(tradeId, currentPrice);
      
      // Emit trade closed event
      this.eventEmitter.emit('trade.closed', {
        tradeId: closedTrade.id,
        symbol: closedTrade.symbol,
        exitPrice: closedTrade.exitPrice,
        profitLoss: closedTrade.profitLoss,
        profitLossPercent: closedTrade.profitLossPercent,
        timestamp: new Date()
      });
      
      return closedTrade;
    } catch (error) {
      this.logger.error(`Failed to close trade ${tradeId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Kiểm tra tất cả giao dịch đang mở để xem có cần thiết đóng không
   */
  async checkOpenTrades(): Promise<void> {
    try {
      // Lấy tất cả giao dịch đang mở
      const openTrades = await this.tradeService.findOpenTrades();
      
      if (openTrades.length === 0) {
        return;
      }
      
      this.logger.debug(`Checking ${openTrades.length} open trades`);
      
      // Xử lý từng giao dịch
      for (const trade of openTrades) {
        try {
          // Lấy giá hiện tại
          const currentPrice = await this.marketDataService.getLatestPrice(trade.symbol);
          
          // Kiểm tra điều kiện đóng lệnh
          const shouldClose = this.checkCloseCondition(trade, currentPrice);
          
          if (shouldClose) {
            this.logger.log(`Closing trade ${trade.id} at ${currentPrice}`);
            await this.closeTradeAtMarket(trade.id);
          }
        } catch (error) {
          this.logger.error(`Error checking trade ${trade.id}: ${error.message}`);
          // Tiếp tục với giao dịch tiếp theo
        }
      }
    } catch (error) {
      this.logger.error(`Failed to check open trades: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Kiểm tra xem điều kiện vào lệnh có được thỏa mãn không
   */
  private checkEntryCondition(tradeSetup: TradeSetup, currentPrice: number): boolean {
    // Đối với lệnh LONG, giá hiện tại phải nhỏ hơn hoặc bằng giá vào lệnh
    if (tradeSetup.direction === 'LONG') {
      return currentPrice <= tradeSetup.entryPrice;
    }
    
    // Đối với lệnh SHORT, giá hiện tại phải lớn hơn hoặc bằng giá vào lệnh
    return currentPrice >= tradeSetup.entryPrice;
  }

  /**
   * Kiểm tra xem điều kiện đóng lệnh có được thỏa mãn không
   */
  private checkCloseCondition(trade: Trade, currentPrice: number): boolean {
    // Kiểm tra điều kiện stop loss
    if (trade.direction === 'LONG' && currentPrice <= trade.stopLoss) {
      this.logger.debug(`Stop loss triggered for trade ${trade.id}. Current price: ${currentPrice}, Stop loss: ${trade.stopLoss}`);
      return true;
    }
    
    if (trade.direction === 'SHORT' && currentPrice >= trade.stopLoss) {
      this.logger.debug(`Stop loss triggered for trade ${trade.id}. Current price: ${currentPrice}, Stop loss: ${trade.stopLoss}`);
      return true;
    }
    
    // Kiểm tra điều kiện take profit
    if (trade.direction === 'LONG' && currentPrice >= trade.takeProfit) {
      this.logger.debug(`Take profit triggered for trade ${trade.id}. Current price: ${currentPrice}, Take profit: ${trade.takeProfit}`);
      return true;
    }
    
    if (trade.direction === 'SHORT' && currentPrice <= trade.takeProfit) {
      this.logger.debug(`Take profit triggered for trade ${trade.id}. Current price: ${currentPrice}, Take profit: ${trade.takeProfit}`);
      return true;
    }
    
    return false;
  }

  /**
   * Tính toán số lượng dựa trên rủi ro
   */
  private calculateQuantity(symbol: string, entryPrice: number, stopLoss: number): number {
    // Lấy giá trị rủi ro từ cấu hình hoặc giá trị mặc định
    const riskAmount = parseFloat(this.configService.get<string>('RISK_AMOUNT_PER_TRADE', '10'));
    
    // Tính toán khoảng cách giữa giá vào lệnh và stop loss
    const priceDifference = Math.abs(entryPrice - stopLoss);
    
    // Tính toán số lượng dựa trên phần trăm rủi ro
    let quantity = riskAmount / priceDifference;
    
    // Làm tròn số lượng theo quy tắc của sàn giao dịch
    quantity = this.roundToValidQuantity(symbol, quantity);
    
    return quantity;
  }

  /**
   * Làm tròn số lượng đến giá trị hợp lệ cho mỗi symbol
   */
  private roundToValidQuantity(symbol: string, quantity: number): number {
    // Các quy tắc làm tròn phụ thuộc vào symbol
    // Đây là các quy tắc mặc định, có thể cập nhật sau khi có thông tin chi tiết hơn từ sàn giao dịch
    if (symbol.includes('BTC')) {
      // BTC thường làm tròn đến 0.001
      return Math.floor(quantity * 1000) / 1000;
    } else if (symbol.includes('ETH')) {
      // ETH thường làm tròn đến 0.01
      return Math.floor(quantity * 100) / 100;
    } else {
      // Các symbol khác làm tròn đến 0.1
      return Math.floor(quantity * 10) / 10;
    }
  }
}
