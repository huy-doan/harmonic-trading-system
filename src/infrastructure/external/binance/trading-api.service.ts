// 059. src/infrastructure/external/binance/trading-api.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BinanceApiClient } from './binance.client';
import { AccountInfo, BinanceOrderSide, BinanceOrderType, BinanceTimeInForce, TradeOrder } from './binance.types';

@Injectable()
export class TradingApiService {
  private readonly logger = new Logger(TradingApiService.name);
  private isInitialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly binanceClient: BinanceApiClient,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Initialize the trading API service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const apiKey = this.configService.get<string>('BINANCE_API_KEY');
    const apiSecret = this.configService.get<string>('BINANCE_API_SECRET');

    if (!apiKey || !apiSecret) {
      this.logger.warn('Binance API credentials not found. Trading features will be disabled.');
      return;
    }

    this.binanceClient.initialize({ apiKey, apiSecret });
    this.isInitialized = true;
    this.logger.log('Trading API service initialized');
  }

  /**
   * Get account information including balances
   */
  async getAccountInfo(): Promise<AccountInfo> {
    await this.ensureInitialized();
    return this.binanceClient.getAccountInfo();
  }

  /**
   * Create a market buy order
   */
  async marketBuy(symbol: string, quantity: string): Promise<any> {
    await this.ensureInitialized();
    
    const order: TradeOrder = {
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity,
    };

    const result = await this.binanceClient.createOrder(order);
    this.eventEmitter.emit('trade.executed', { type: 'market-buy', symbol, quantity, result });
    return result;
  }

  /**
   * Create a market sell order
   */
  async marketSell(symbol: string, quantity: string): Promise<any> {
    await this.ensureInitialized();
    
    const order: TradeOrder = {
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity,
    };

    const result = await this.binanceClient.createOrder(order);
    this.eventEmitter.emit('trade.executed', { type: 'market-sell', symbol, quantity, result });
    return result;
  }

  /**
   * Create a limit buy order
   */
  async limitBuy(symbol: string, quantity: string, price: string, timeInForce?: 'GTC' | 'IOC' | 'FOK'): Promise<any> {
    await this.ensureInitialized();
    
    const order: TradeOrder = {
      symbol,
      side: 'BUY',
      type: 'LIMIT',
      quantity,
      price,
      timeInForce: timeInForce as any, // Fix: Accept string literals for timeInForce
    };

    const result = await this.binanceClient.createOrder(order);
    this.eventEmitter.emit('trade.executed', { type: 'limit-buy', symbol, quantity, price, result });
    return result;
  }

  /**
   * Create a limit sell order
   */
  async limitSell(symbol: string, quantity: string, price: string, timeInForce?: 'GTC' | 'IOC' | 'FOK'): Promise<any> {
    await this.ensureInitialized();
    
    const order: TradeOrder = {
      symbol,
      side: 'SELL',
      type: 'LIMIT',
      quantity,
      price,
      timeInForce: timeInForce as any, // Fix: Accept string literals for timeInForce
    };

    const result = await this.binanceClient.createOrder(order);
    this.eventEmitter.emit('trade.executed', { type: 'limit-sell', symbol, quantity, price, result });
    return result;
  }

  /**
   * Create a stop-loss order
   */
  async stopLoss(symbol: string, quantity: string, stopPrice: string): Promise<any> {
    await this.ensureInitialized();
    
    const order: TradeOrder = {
      symbol,
      side: 'SELL',
      type: 'STOP_LOSS',
      quantity,
      stopPrice,
    };

    const result = await this.binanceClient.createOrder(order);
    this.eventEmitter.emit('trade.executed', { type: 'stop-loss', symbol, quantity, stopPrice, result });
    return result;
  }

  /**
   * Create a take-profit order
   */
  async takeProfit(symbol: string, quantity: string, stopPrice: string): Promise<any> {
    await this.ensureInitialized();
    
    const order: TradeOrder = {
      symbol,
      side: 'SELL',
      type: 'TAKE_PROFIT',
      quantity,
      stopPrice,
    };

    const result = await this.binanceClient.createOrder(order);
    this.eventEmitter.emit('trade.executed', { type: 'take-profit', symbol, quantity, stopPrice, result });
    return result;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    await this.ensureInitialized();
    const result = await this.binanceClient.cancelOrder(symbol, orderId);
    this.eventEmitter.emit('order.canceled', { symbol, orderId, result });
    return result;
  }

  /**
   * Get exchange information
   */
  async getExchangeInfo(): Promise<any> {
    await this.ensureInitialized();
    return this.binanceClient.getExchangeInfo();
  }

  /**
   * Helper method to ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
      if (!this.isInitialized) {
        throw new Error('Trading API service is not initialized. Check your API credentials.');
      }
    }
  }
}