// 054. src/infrastructure/external/binance/binance.client.ts
import { Injectable, Logger } from '@nestjs/common';
import Binance, { Binance as BinanceClient, CandleChartInterval } from 'binance-api-node';
import {
  AccountInfo,
  BinanceCredentials,
  CandleData,
  SymbolPrice,
  TickerData,
  TradeOrder
} from './binance.types';
import { RateLimiterService } from './rate-limiter';

@Injectable()
export class BinanceApiClient {
  private readonly logger = new Logger(BinanceApiClient.name);
  private client: BinanceClient;

  constructor(
    private readonly rateLimiter: RateLimiterService
  ) {}

  /**
   * Initialize the Binance client with API credentials
   */
  public initialize(credentials: BinanceCredentials): void {
    this.client = Binance({
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
    });
    this.logger.log('Binance API client initialized');
  }

  /**
   * Get current prices for all symbols or a specific symbol
   */
  public async getPrices(symbol?: string): Promise<SymbolPrice | SymbolPrice[]> {
    await this.rateLimiter.acquireToken('market');
    try {
      const prices = await this.client.prices({ symbol });
      
      // Convert the prices object to the expected format
      if (symbol) {
        // Single symbol case
        return { symbol, price: prices[symbol] };
      } else {
        // Multiple symbols case
        return Object.entries(prices).map(([symbol, price]) => ({
          symbol,
          price
        }));
      }
    } catch (error) {
      this.logger.error(`Error fetching prices: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get detailed ticker information for all symbols or a specific symbol
   */
  public async getTicker24hr(symbol?: string): Promise<TickerData | TickerData[]> {
    await this.rateLimiter.acquireToken('market');
    try {
      return await this.client.dailyStats({ symbol });
    } catch (error) {
      this.logger.error(`Error fetching 24hr ticker: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get historical candlestick data
   */
  public async getCandles(
    symbol: string,
    interval: CandleChartInterval,
    options?: {
      limit?: number;
      startTime?: number;
      endTime?: number;
    }
  ): Promise<CandleData[]> {
    await this.rateLimiter.acquireToken('market');
    try {
      const response = await this.client.candles({
        symbol,
        interval,
        limit: options?.limit,
        startTime: options?.startTime,
        endTime: options?.endTime,
      });

      return response.map(candle => ({
        symbol,
        interval,
        openTime: candle.openTime,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        closeTime: candle.closeTime,
        quoteAssetVolume: candle.quoteAssetVolume,
        trades: candle.trades,
        // Fix property names to match what's available in CandleChartResult
        buyBaseAssetVolume: candle.baseAssetVolume || '0', 
        buyQuoteAssetVolume: candle.quoteAssetVolume || '0',
      }));
    } catch (error) {
      this.logger.error(`Error fetching candles: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get account information
   */
  public async getAccountInfo(): Promise<AccountInfo> {
    await this.rateLimiter.acquireToken('account');
    try {
      const accountInfo = await this.client.accountInfo();
      return {
        balances: accountInfo.balances,
      };
    } catch (error) {
      this.logger.error(`Error fetching account info: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new order
   */
  public async createOrder(order: TradeOrder): Promise<any> {
    await this.rateLimiter.acquireToken('order');
    try {
      const orderParams: any = {
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
      };

      if (order.price) {
        orderParams.price = order.price;
      }

      if (order.timeInForce) {
        orderParams.timeInForce = order.timeInForce;
      }

      if (order.stopPrice) {
        orderParams.stopPrice = order.stopPrice;
      }

      return await this.client.order(orderParams);
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  public async cancelOrder(symbol: string, orderId: number): Promise<any> {
    await this.rateLimiter.acquireToken('order');
    try {
      return await this.client.cancelOrder({
        symbol,
        orderId,
      });
    } catch (error) {
      this.logger.error(`Error canceling order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get exchange information
   */
  public async getExchangeInfo(): Promise<any> {
    await this.rateLimiter.acquireToken('market');
    try {
      return await this.client.exchangeInfo();
    } catch (error) {
      this.logger.error(`Error fetching exchange info: ${error.message}`, error.stack);
      throw error;
    }
  }
}
