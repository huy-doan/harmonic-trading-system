// 154. src/binances/binance.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { TradingApiService } from '@infrastructure/external/binance/trading-api.service';
import { BinanceAdapter } from '@infrastructure/external/binance/binance.adapter';
import { Candlestick } from '@shared/interfaces/market-data.interface';

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);

  constructor(
    private readonly marketDataStreamService: MarketDataStreamService,
    private readonly tradingApiService: TradingApiService,
    private readonly binanceAdapter: BinanceAdapter
  ) {}

  /**
   * Get candlestick data for a symbol and timeframe
   */
  async getCandlesticks(symbol: string, timeframe: string, limit: number = 100): Promise<Candlestick[]> {
    try {
      return await this.marketDataStreamService.getCandlesticks(symbol, timeframe, limit);
    } catch (error) {
      this.logger.error(`Failed to get candlesticks for ${symbol} ${timeframe}`, error);
      throw error;
    }
  }

  /**
   * Get historical candlestick data
   */
  async getHistoricalCandlesticks(
    symbol: string,
    timeframe: string,
    startTime: Date,
    endTime: Date = new Date()
  ): Promise<Candlestick[]> {
    try {
      return await this.marketDataStreamService.getHistoricalCandlesticks(
        symbol,
        timeframe,
        startTime,
        endTime
      );
    } catch (error) {
      this.logger.error(`Failed to get historical candlesticks for ${symbol} ${timeframe}`, error);
      throw error;
    }
  }

  /**
   * Get latest price for a symbol
   */
  async getLatestPrice(symbol: string): Promise<number> {
    try {
      return await this.marketDataStreamService.getLatestPrice(symbol);
    } catch (error) {
      this.logger.error(`Failed to get latest price for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get list of all available trading symbols from Binance
   */
  async getTradingSymbols(): Promise<string[]> {
    try {
      const exchangeInfo = await this.binanceAdapter.getExchangeInfo();
      
      // Filter out symbols that are not currently trading
      const tradingSymbols = exchangeInfo.symbols
        .filter(symbol => symbol.status === 'TRADING')
        .map(symbol => symbol.symbol);
      
      return tradingSymbols;
    } catch (error) {
      this.logger.error('Failed to get trading symbols', error);
      throw error;
    }
  }

  /**
   * Get list of symbols currently being tracked
   */
  getTrackedSymbols(): string[] {
    return this.marketDataStreamService.getSymbols();
  }

  /**
   * Add a new symbol to track
   */
  async addTrackedSymbol(symbol: string): Promise<void> {
    try {
      await this.marketDataStreamService.addSymbol(symbol);
    } catch (error) {
      this.logger.error(`Failed to add symbol ${symbol} for tracking`, error);
      throw error;
    }
  }

  /**
   * Remove a symbol from tracking
   */
  removeTrackedSymbol(symbol: string): void {
    this.marketDataStreamService.removeSymbol(symbol);
  }

  /**
   * Get list of all available timeframes
   */
  getTimeframes(): string[] {
    return this.marketDataStreamService.getTimeframes();
  }

  /**
   * Check if trading is in simulation mode
   */
  isSimulationMode(): boolean {
    return this.tradingApiService.isSimulation();
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    try {
      return await this.tradingApiService.getAccountInfo();
    } catch (error) {
      this.logger.error('Failed to get account information', error);
      throw error;
    }
  }

  /**
   * Get open orders
   */
  async getOpenOrders(symbol?: string): Promise<any[]> {
    try {
      return await this.tradingApiService.getOpenOrders(symbol);
    } catch (error) {
      this.logger.error(`Failed to get open orders${symbol ? ` for ${symbol}` : ''}`, error);
      throw error;
    }
  }

  /**
   * Place a market order
   */
  async placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number
  ): Promise<any> {
    try {
      if (side === 'BUY') {
        return await this.tradingApiService.executeBuyMarketOrder(symbol, quantity);
      } else {
        return await this.tradingApiService.executeSellMarketOrder(symbol, quantity);
      }
    } catch (error) {
      this.logger.error(`Failed to place market ${side} order for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number
  ): Promise<any> {
    try {
      if (side === 'BUY') {
        return await this.tradingApiService.placeBuyLimitOrder(symbol, quantity, price);
      } else {
        return await this.tradingApiService.placeSellLimitOrder(symbol, quantity, price);
      }
    } catch (error) {
      this.logger.error(`Failed to place limit ${side} order for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    try {
      return await this.tradingApiService.cancelOrder(symbol, orderId);
    } catch (error) {
      this.logger.error(`Failed to cancel order ${orderId} for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get exchange information
   */
  async getExchangeInfo(symbols?: string[]): Promise<any> {
    try {
      return await this.binanceAdapter.getExchangeInfo(symbols);
    } catch (error) {
      this.logger.error('Failed to get exchange information', error);
      throw error;
    }
  }

  /**
   * Get 24hr ticker price change statistics
   */
  async get24hrTickerPriceChange(symbol?: string): Promise<any> {
    try {
      return await this.binanceAdapter.get24hrTickerPriceChange(symbol);
    } catch (error) {
      this.logger.error(`Failed to get 24hr ticker price change${symbol ? ` for ${symbol}` : ''}`, error);
      throw error;
    }
  }
}
