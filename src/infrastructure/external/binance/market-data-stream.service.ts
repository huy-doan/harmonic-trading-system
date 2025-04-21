// 058. src/infrastructure/external/binance/market-data-stream.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { BinanceWebsocketClient } from './binance-websocket.client';
import { BinanceAdapter } from './binance.adapter';
import { ConfigService } from '@nestjs/config';
import { Candlestick } from '@shared/interfaces/market-data.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { APP_CONSTANTS } from '@shared/constants/constants';

@Injectable()
export class MarketDataStreamService implements OnModuleInit {
  private readonly logger = new Logger(MarketDataStreamService.name);
  private readonly markets: Map<string, Map<string, Candlestick[]>> = new Map();
  private readonly symbols: string[] = [];
  private readonly timeframes: string[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly binanceWebsocketClient: BinanceWebsocketClient,
    private readonly binanceAdapter: BinanceAdapter,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // Initialize with some default values from environment or constants
    this.timeframes = Object.values(APP_CONSTANTS.TIMEFRAMES);
  }

  async onModuleInit() {
    // Load initial symbols from configuration or use defaults
    await this.initializeMarkets();

    // Subscribe to WebSocket streams for active symbols and timeframes
    this.subscribeToMarketStreams();
  }

  /**
   * Initialize market data for configured symbols and timeframes
   */
  private async initializeMarkets() {
    try {
      // Get symbol list from environment or use defaults
      const configuredSymbols = this.configService.get<string>('SYMBOLS');
      
      if (configuredSymbols) {
        this.symbols.push(...configuredSymbols.split(','));
      } else {
        // Default symbols if not configured
        this.symbols.push('BTCUSDT', 'ETHUSDT', 'BNBUSDT');
      }

      this.logger.log(`Initializing markets for symbols: ${this.symbols.join(', ')}`);

      // Initialize data structure for each symbol and timeframe
      for (const symbol of this.symbols) {
        this.markets.set(symbol, new Map());
        
        for (const timeframe of this.timeframes) {
          // Fetch initial historical data
          const candles = await this.binanceAdapter.getCandlesticks(symbol, timeframe, {
            limit: 1000 // Get maximum allowed candles
          });
          
          this.markets.get(symbol).set(timeframe, candles);
          
          // Cache the data
          await this.cacheMarketData(symbol, timeframe, candles);
          
          this.logger.debug(`Loaded ${candles.length} historical candles for ${symbol} ${timeframe}`);
        }
      }

      this.logger.log('Market data initialization completed');
    } catch (error) {
      this.logger.error('Failed to initialize markets', error);
    }
  }

  /**
   * Subscribe to WebSocket streams for active symbols and timeframes
   */
  private subscribeToMarketStreams() {
    for (const symbol of this.symbols) {
      for (const timeframe of this.timeframes) {
        // Only subscribe to certain timeframes for real-time data
        // For higher timeframes, we'll aggregate from lower timeframes
        if (['1m', '5m', '15m', '30m', '1h'].includes(timeframe)) {
          this.binanceWebsocketClient.subscribeToKline(symbol, timeframe);
          this.logger.debug(`Subscribed to ${symbol} ${timeframe} kline stream`);
        }
      }
      
      // Subscribe to mini ticker for price updates
      this.binanceWebsocketClient.subscribeToMiniTicker(symbol);
      this.logger.debug(`Subscribed to ${symbol} mini ticker stream`);
    }
  }

  /**
   * Handle kline events from WebSocket
   */
  @OnEvent('binance.kline')
  handleKlineEvent(data: any) {
    try {
      const { s: symbol, k } = data;
      const { t: openTime, T: closeTime, i: interval, o, h, l, c, v, n, V, Q } = k;
      
      // Create candlestick from the event data
      const candlestick: Candlestick = {
        symbol,
        timeframe: interval,
        openTime,
        open: parseFloat(o),
        high: parseFloat(h),
        low: parseFloat(l),
        close: parseFloat(c),
        volume: parseFloat(v),
        closeTime,
        quoteAssetVolume: parseFloat(Q),
        numberOfTrades: n,
        takerBuyBaseAssetVolume: parseFloat(V),
        takerBuyQuoteAssetVolume: 0, // Not directly provided in the event
      };

      // Update in-memory data
      this.updateCandlestickData(symbol, interval, candlestick);
      
      // Emit event for pattern detection
      this.eventEmitter.emit('market.candlestick.update', {
        symbol,
        timeframe: interval,
        candlestick,
        isComplete: data.k.x // Is this kline closed?
      });
      
      // If candle is complete, cache the updated data
      if (data.k.x) {
        this.cacheMarketData(symbol, interval, this.markets.get(symbol)?.get(interval) || []);
      }
    } catch (error) {
      this.logger.error('Error handling kline event', error);
    }
  }

  /**
   * Handle mini ticker events from WebSocket
   */
  @OnEvent('binance.24hrMiniTicker')
  handleMiniTickerEvent(data: any) {
    try {
      const { s: symbol, c: close, o: open, h: high, l: low, v: volume } = data;
      
      // Emit price update event
      this.eventEmitter.emit('market.price.update', {
        symbol,
        price: parseFloat(close),
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        volume: parseFloat(volume),
        timestamp: Date.now()
      });
    } catch (error) {
      this.logger.error('Error handling mini ticker event', error);
    }
  }

  /**
   * Update candlestick data in memory
   */
  private updateCandlestickData(symbol: string, timeframe: string, candlestick: Candlestick) {
    // Get the candlestick array for this symbol and timeframe
    const symbolMap = this.markets.get(symbol);
    if (!symbolMap) {
      this.markets.set(symbol, new Map([[timeframe, [candlestick]]]));
      return;
    }

    const candles = symbolMap.get(timeframe);
    if (!candles) {
      symbolMap.set(timeframe, [candlestick]);
      return;
    }

    // Find if we already have this candle (by open time)
    const existingIndex = candles.findIndex(c => c.openTime === candlestick.openTime);
    
    if (existingIndex >= 0) {
      // Update existing candle
      candles[existingIndex] = candlestick;
    } else {
      // Add new candle and maintain sorted order
      candles.push(candlestick);
      candles.sort((a, b) => a.openTime - b.openTime);
      
      // Keep only the last 1000 candles to limit memory usage
      if (candles.length > 1000) {
        candles.shift();
      }
    }
  }

  /**
   * Cache market data in Redis
   */
  private async cacheMarketData(symbol: string, timeframe: string, candles: Candlestick[]) {
    try {
      const cacheKey = `market:${symbol}:${timeframe}`;
      await this.cacheManager.set(cacheKey, candles, 3600000); // Cache for 1 hour
    } catch (error) {
      this.logger.error(`Failed to cache market data for ${symbol} ${timeframe}`, error);
    }
  }

  /**
   * Get candlestick data for a symbol and timeframe
   */
  async getCandlesticks(symbol: string, timeframe: string, limit: number = 100): Promise<Candlestick[]> {
    try {
      // Check cache first
      const cacheKey = `market:${symbol}:${timeframe}`;
      const cachedData = await this.cacheManager.get<Candlestick[]>(cacheKey);
      
      if (cachedData && cachedData.length >= limit) {
        return cachedData.slice(-limit);
      }
      
      // If not in cache or not enough data, get from in-memory data
      const symbolMap = this.markets.get(symbol);
      if (symbolMap) {
        const candles = symbolMap.get(timeframe);
        if (candles && candles.length >= limit) {
          return candles.slice(-limit);
        }
      }
      
      // If still not enough data, fetch from API
      const candles = await this.binanceAdapter.getCandlesticks(symbol, timeframe, { limit });
      
      // Update in-memory data and cache
      if (candles.length > 0) {
        this.updateMarketData(symbol, timeframe, candles);
        await this.cacheMarketData(symbol, timeframe, candles);
      }
      
      return candles;
    } catch (error) {
      this.logger.error(`Failed to get candlesticks for ${symbol} ${timeframe}`, error);
      throw error;
    }
  }

  /**
   * Get historical candlestick data for a symbol and timeframe
   */
  async getHistoricalCandlesticks(
    symbol: string,
    timeframe: string,
    startTime: Date,
    endTime: Date = new Date()
  ): Promise<Candlestick[]> {
    try {
      return await this.binanceAdapter.getHistoricalCandlesticks(
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
   * Update market data with new candles
   */
  private updateMarketData(symbol: string, timeframe: string, candles: Candlestick[]) {
    if (!this.markets.has(symbol)) {
      this.markets.set(symbol, new Map());
    }
    
    this.markets.get(symbol).set(timeframe, candles);
  }

  /**
   * Add a new symbol to track
   */
  async addSymbol(symbol: string): Promise<void> {
    if (this.symbols.includes(symbol)) {
      return; // Already tracking this symbol
    }
    
    try {
      this.symbols.push(symbol);
      this.markets.set(symbol, new Map());
      
      // Initialize data for all timeframes
      for (const timeframe of this.timeframes) {
        const candles = await this.binanceAdapter.getCandlesticks(symbol, timeframe, { limit: 1000 });
        this.markets.get(symbol).set(timeframe, candles);
        await this.cacheMarketData(symbol, timeframe, candles);
        
        // Subscribe to kline stream for lower timeframes
        if (['1m', '5m', '15m', '30m', '1h'].includes(timeframe)) {
          this.binanceWebsocketClient.subscribeToKline(symbol, timeframe);
        }
      }
      
      // Subscribe to mini ticker
      this.binanceWebsocketClient.subscribeToMiniTicker(symbol);
      
      this.logger.log(`Added new symbol: ${symbol}`);
    } catch (error) {
      this.logger.error(`Failed to add symbol ${symbol}`, error);
      // Remove from symbols list if initialization failed
      this.symbols.splice(this.symbols.indexOf(symbol), 1);
      throw error;
    }
  }

  /**
   * Remove a symbol from tracking
   */
  removeSymbol(symbol: string): void {
    const index = this.symbols.indexOf(symbol);
    if (index === -1) {
      return; // Not tracking this symbol
    }
    
    // Unsubscribe from all streams for this symbol
    for (const timeframe of this.timeframes) {
      if (['1m', '5m', '15m', '30m', '1h'].includes(timeframe)) {
        this.binanceWebsocketClient.unsubscribe(`${symbol.toLowerCase()}@kline_${timeframe}`);
      }
    }
    
    // Unsubscribe from mini ticker
    this.binanceWebsocketClient.unsubscribe(`${symbol.toLowerCase()}@miniTicker`);
    
    // Remove from memory
    this.symbols.splice(index, 1);
    this.markets.delete(symbol);
    
    this.logger.log(`Removed symbol: ${symbol}`);
  }

  /**
   * Get list of all tracked symbols
   */
  getSymbols(): string[] {
    return [...this.symbols];
  }

  /**
   * Get list of all available timeframes
   */
  getTimeframes(): string[] {
    return [...this.timeframes];
  }

  /**
   * Get latest price for a symbol
   */
  async getLatestPrice(symbol: string): Promise<number> {
    return this.binanceAdapter.getLatestPrice(symbol);
  }
}
