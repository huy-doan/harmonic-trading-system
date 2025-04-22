import { Injectable, Logger } from '@nestjs/common';
import { BinanceApiClient } from '../infrastructure/external/binance/binance.client';
import { MarketDataStreamService } from '../infrastructure/external/binance/market-data-stream.service';
import { TradingApiService } from '../infrastructure/external/binance/trading-api.service';
import { CandleChartInterval } from 'binance-api-node';

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);

  constructor(
    private readonly binanceClient: BinanceApiClient,
    private readonly marketDataStream: MarketDataStreamService,
    private readonly tradingApi: TradingApiService
  ) {}

  /**
   * Get current prices for all symbols or a specific symbol
   */
  async getPrices(symbol?: string) {
    try {
      return await this.binanceClient.getPrices(symbol);
    } catch (error) {
      this.logger.error(`Error getting prices: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get 24hr ticker data for all symbols or a specific symbol
   */
  async getTicker(symbol?: string) {
    try {
      return await this.binanceClient.getTicker24hr(symbol);
    } catch (error) {
      this.logger.error(`Error getting ticker: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get historical candlestick data
   */
  async getCandles(
    symbol: string,
    interval: CandleChartInterval,
    options?: {
      limit?: number;
      startTime?: number;
      endTime?: number;
    }
  ) {
    try {
      return await this.binanceClient.getCandles(symbol, interval, options);
    } catch (error) {
      this.logger.error(`Error getting candles: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get available trading symbols
   */
  async getSymbols() {
    try {
      const exchangeInfo = await this.binanceClient.getExchangeInfo();
      return exchangeInfo.symbols.map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        status: symbol.status
      }));
    } catch (error) {
      this.logger.error(`Error getting symbols: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get account information including balances
   */
  async getAccountInfo() {
    try {
      return await this.tradingApi.getAccountInfo();
    } catch (error) {
      this.logger.error(`Error getting account info: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Start watching a symbol for price updates
   */
  watchSymbol(symbol: string) {
    try {
      this.marketDataStream.watchSymbol(symbol);
      return { success: true, message: `Now watching ${symbol}` };
    } catch (error) {
      this.logger.error(`Error watching symbol: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Stop watching a symbol
   */
  unwatchSymbol(symbol: string) {
    try {
      this.marketDataStream.unwatchSymbol(symbol);
      return { success: true, message: `Stopped watching ${symbol}` };
    } catch (error) {
      this.logger.error(`Error unwatching symbol: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Start watching an interval for all watched symbols
   */
  watchInterval(interval: CandleChartInterval) {
    try {
      this.marketDataStream.watchInterval(interval);
      return { success: true, message: `Now watching interval ${interval}` };
    } catch (error) {
      this.logger.error(`Error watching interval: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Stop watching an interval
   */
  unwatchInterval(interval: CandleChartInterval) {
    try {
      this.marketDataStream.unwatchInterval(interval);
      return { success: true, message: `Stopped watching interval ${interval}` };
    } catch (error) {
      this.logger.error(`Error unwatching interval: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a market buy order
   */
  async marketBuy(symbol: string, quantity: string) {
    try {
      return await this.tradingApi.marketBuy(symbol, quantity);
    } catch (error) {
      this.logger.error(`Error creating market buy order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a market sell order
   */
  async marketSell(symbol: string, quantity: string) {
    try {
      return await this.tradingApi.marketSell(symbol, quantity);
    } catch (error) {
      this.logger.error(`Error creating market sell order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a limit buy order
   */
  async limitBuy(symbol: string, quantity: string, price: string, timeInForce?: 'GTC' | 'IOC' | 'FOK') {
    try {
      return await this.tradingApi.limitBuy(symbol, quantity, price, timeInForce);
    } catch (error) {
      this.logger.error(`Error creating limit buy order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a limit sell order
   */
  async limitSell(symbol: string, quantity: string, price: string, timeInForce?: 'GTC' | 'IOC' | 'FOK') {
    try {
      return await this.tradingApi.limitSell(symbol, quantity, price, timeInForce);
    } catch (error) {
      this.logger.error(`Error creating limit sell order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(symbol: string, orderId: number) {
    try {
      return await this.tradingApi.cancelOrder(symbol, orderId);
    } catch (error) {
      this.logger.error(`Error canceling order: ${error.message}`, error.stack);
      throw error;
    }
  }
}
