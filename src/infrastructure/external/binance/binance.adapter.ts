// 056. src/infrastructure/external/binance/binance.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import { BinanceClient } from './binance.client';
import { Candlestick } from '@shared/interfaces/market-data.interface';
import { TimeHelper } from '@shared/utils/time.helper';

@Injectable()
export class BinanceAdapter {
  private readonly logger = new Logger(BinanceAdapter.name);

  constructor(private readonly binanceClient: BinanceClient) {}

  /**
   * Converts Binance kline data to standardized Candlestick format
   */
  private convertToCandlestick(klineData: any[], symbol: string, timeframe: string): Candlestick {
    return {
      symbol,
      timeframe,
      openTime: klineData[0],
      open: parseFloat(klineData[1]),
      high: parseFloat(klineData[2]),
      low: parseFloat(klineData[3]),
      close: parseFloat(klineData[4]),
      volume: parseFloat(klineData[5]),
      closeTime: klineData[6],
      quoteAssetVolume: parseFloat(klineData[7]),
      numberOfTrades: klineData[8],
      takerBuyBaseAssetVolume: parseFloat(klineData[9]),
      takerBuyQuoteAssetVolume: parseFloat(klineData[10]),
    };
  }

  /**
   * Fetches candlestick data from Binance and converts to standardized format
   */
  async getCandlesticks(
    symbol: string,
    timeframe: string,
    options: {
      limit?: number;
      startTime?: number | Date;
      endTime?: number | Date;
    } = {}
  ): Promise<Candlestick[]> {
    try {
      // Convert Date objects to timestamps if provided
      const params: any = { ...options };
      
      if (params.startTime instanceof Date) {
        params.startTime = params.startTime.getTime();
      }
      
      if (params.endTime instanceof Date) {
        params.endTime = params.endTime.getTime();
      }
      
      // Default limit if not provided
      if (!params.limit) {
        params.limit = 500;
      }

      const klines = await this.binanceClient.getKlines(symbol, timeframe, params);
      
      return klines.map(kline => this.convertToCandlestick(kline, symbol, timeframe));
    } catch (error) {
      this.logger.error(`Failed to fetch candlesticks for ${symbol} ${timeframe}`, error);
      throw error;
    }
  }

  /**
   * Gets historical candlesticks for a specific time range
   */
  async getHistoricalCandlesticks(
    symbol: string,
    timeframe: string,
    startTime: Date,
    endTime: Date = new Date()
  ): Promise<Candlestick[]> {
    try {
      // Calculate the timeframe in milliseconds
      const timeframeMs = TimeHelper.parseTimeframe(timeframe);
      
      // Binance has a limit of 1000 candlesticks per request
      const maxCandlesPerRequest = 1000;
      const maxTimeRange = timeframeMs * maxCandlesPerRequest;
      
      let currentStartTime = startTime.getTime();
      let currentEndTime = Math.min(currentStartTime + maxTimeRange, endTime.getTime());
      let allCandlesticks: Candlestick[] = [];
      
      // Fetch data in chunks if the time range is large
      while (currentStartTime < endTime.getTime()) {
        const candlesticks = await this.getCandlesticks(symbol, timeframe, {
          startTime: currentStartTime,
          endTime: currentEndTime,
          limit: maxCandlesPerRequest,
        });
        
        if (candlesticks.length === 0) {
          break;
        }
        
        allCandlesticks = [...allCandlesticks, ...candlesticks];
        
        // Update start time for next request
        currentStartTime = candlesticks[candlesticks.length - 1].closeTime + 1;
        currentEndTime = Math.min(currentStartTime + maxTimeRange, endTime.getTime());
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return allCandlesticks;
    } catch (error) {
      this.logger.error(`Failed to fetch historical candlesticks for ${symbol} ${timeframe}`, error);
      throw error;
    }
  }

  /**
   * Gets latest price for a symbol
   */
  async getLatestPrice(symbol: string): Promise<number> {
    try {
      const tickerData = await this.binanceClient.getSymbolPriceTicker(symbol);
      return parseFloat(tickerData.price);
    } catch (error) {
      this.logger.error(`Failed to fetch latest price for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Gets exchange information for symbols
   */
  async getExchangeInfo(symbols?: string[]): Promise<any> {
    try {
      return await this.binanceClient.getExchangeInfo(symbols);
    } catch (error) {
      this.logger.error('Failed to fetch exchange info', error);
      throw error;
    }
  }

  /**
   * Gets account information
   */
  async getAccountInfo(): Promise<any> {
    try {
      return await this.binanceClient.getAccountInfo();
    } catch (error) {
      this.logger.error('Failed to fetch account info', error);
      throw error;
    }
  }

  /**
   * Gets 24hr ticker price change statistics
   */
  async get24hrTickerPriceChange(symbol?: string): Promise<any> {
    try {
      return await this.binanceClient.get24hrTickerPriceChange(symbol);
    } catch (error) {
      this.logger.error(`Failed to fetch 24hr ticker price change for ${symbol || 'all symbols'}`, error);
      throw error;
    }
  }

  /**
   * Creates a new market order
   */
  async createMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number
  ): Promise<any> {
    try {
      return await this.binanceClient.createOrder(symbol, side, 'MARKET', {
        quantity,
      });
    } catch (error) {
      this.logger.error(`Failed to create market order for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Creates a new limit order
   */
  async createLimitOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number
  ): Promise<any> {
    try {
      return await this.binanceClient.createOrder(symbol, side, 'LIMIT', {
        quantity,
        price,
        timeInForce: 'GTC',
      });
    } catch (error) {
      this.logger.error(`Failed to create limit order for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Cancels an existing order
   */
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    try {
      return await this.binanceClient.cancelOrder(symbol, orderId);
    } catch (error) {
      this.logger.error(`Failed to cancel order ${orderId} for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Gets current open orders
   */
  async getOpenOrders(symbol?: string): Promise<any[]> {
    try {
      return await this.binanceClient.getOpenOrders(symbol);
    } catch (error) {
      this.logger.error(`Failed to fetch open orders for ${symbol || 'all symbols'}`, error);
      throw error;
    }
  }
}
