// 058. src/infrastructure/external/binance/market-data-stream.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BinanceAdapter } from './binance.adapter';
import { BinanceApiClient } from './binance.client';
import { BinanceWebsocketClient } from './binance-websocket.client';
import { BinanceDataMapperService } from './binance-data-mapper.service';
import { CandleData, MarketData, StreamSubscription } from './binance.types';
import { CandleChartInterval } from 'binance-api-node';
import { MarketData as MarketDataEntity } from '../../../domain/market-analysis/entities/market-data.entity';

@Injectable()
export class MarketDataStreamService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketDataStreamService.name);
  private readonly activeStreams: Map<string, StreamSubscription> = new Map();
  private readonly marketDataCache: Map<string, MarketData> = new Map();
  private readonly candlesCache: Map<string, CandleData[]> = new Map();
  private readonly marketDataEntityCache: Map<string, MarketDataEntity[]> = new Map();
  private readonly watchedSymbols: Set<string> = new Set();
  private readonly watchedIntervals: Set<CandleChartInterval> = new Set();

  constructor(
    private readonly configService: ConfigService,
    private readonly binanceClient: BinanceApiClient,
    private readonly binanceWebsocketClient: BinanceWebsocketClient,
    private readonly binanceAdapter: BinanceAdapter,
    private readonly binanceDataMapper: BinanceDataMapperService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    const apiKey = this.configService.get<string>('BINANCE_API_KEY');
    const apiSecret = this.configService.get<string>('BINANCE_API_SECRET');

    // Initialize clients
    this.binanceClient.initialize({ apiKey, apiSecret });
    this.binanceWebsocketClient.initialize({ apiKey, apiSecret });

    // Load default symbols and intervals from config
    const defaultSymbols = this.configService.get<string[]>('DEFAULT_WATCHED_SYMBOLS', ['BTCUSDT', 'ETHUSDT']);
    const defaultIntervals = this.configService.get<CandleChartInterval[]>('DEFAULT_WATCHED_INTERVALS', [
      '1m', '5m', '15m', '1h', '4h', '1d'
    ] as CandleChartInterval[]);

    // Set up initial data streams
    for (const symbol of defaultSymbols) {
      this.watchSymbol(symbol);
    }

    for (const interval of defaultIntervals) {
      this.watchInterval(interval);
    }

    // Refresh market data every minute
    setInterval(() => this.refreshMarketData(), 60000);

    this.logger.log('Market data stream service initialized');
  }

  async onModuleDestroy() {
    this.stopAllStreams();
    this.logger.log('Market data stream service destroyed');
  }

  /**
   * Get the latest market data for a symbol
   */
  public getMarketData(symbol: string): MarketData | undefined {
    return this.marketDataCache.get(symbol);
  }

  /**
   * Get all cached market data
   */
  public getAllMarketData(): MarketData[] {
    return Array.from(this.marketDataCache.values());
  }

  /**
   * Get candlestick data for a symbol and interval
   */
  public getCandleData(symbol: string, interval: CandleChartInterval): CandleData[] | undefined {
    const key = `${symbol}_${interval}`;
    return this.candlesCache.get(key);
  }

  /**
   * Get market data entities for a symbol and interval
   * This method uses the data mapper to convert the raw Binance candle data to MarketDataEntity format
   */
  public getMarketDataEntities(symbol: string, interval: CandleChartInterval): MarketDataEntity[] | undefined {
    const key = `${symbol}_${interval}`;
    const candles = this.candlesCache.get(key);
    
    if (!candles) {
      return undefined;
    }
    
    // Check if we already have converted entities in the cache
    let entities = this.marketDataEntityCache.get(key);
    
    // If not in cache or cache is stale, convert the candles to entities
    if (!entities || entities.length !== candles.length) {
      entities = this.binanceDataMapper.mapCandlesToMarketData(candles);
      this.marketDataEntityCache.set(key, entities);
    }
    
    return entities;
  }

  /**
   * Get the latest market data entity for a symbol and interval
   */
  public getLatestMarketDataEntity(symbol: string, interval: CandleChartInterval): MarketDataEntity | undefined {
    const entities = this.getMarketDataEntities(symbol, interval);
    
    if (!entities || entities.length === 0) {
      return undefined;
    }
    
    // Return the most recent candle (last in the array)
    return entities[entities.length - 1];
  }

  /**
   * Watch a symbol for price updates
   */
  public watchSymbol(symbol: string): void {
    if (this.watchedSymbols.has(symbol)) {
      return;
    }

    this.watchedSymbols.add(symbol);
    this.logger.log(`Watching symbol: ${symbol}`);

    // Subscribe to ticker updates
    const subscription = this.binanceWebsocketClient.subscribeToTicker(symbol);
    const streamId = `ticker_${symbol.toLowerCase()}`;
    this.activeStreams.set(streamId, subscription);

    // Set up event listener
    this.binanceWebsocketClient.on(streamId, (ticker) => {
      const marketData = this.binanceAdapter.transformTickerData(ticker);
      this.marketDataCache.set(symbol, marketData);
      this.eventEmitter.emit('market.update', marketData);
    });

    // Initialize with REST API data
    this.fetchInitialMarketData(symbol);
  }

  /**
   * Watch a symbol with a specific interval for candlestick updates
   */
  public watchSymbolWithInterval(symbol: string, interval: CandleChartInterval): void {
    if (!this.watchedSymbols.has(symbol)) {
      this.watchSymbol(symbol);
    }

    if (!this.watchedIntervals.has(interval)) {
      this.watchInterval(interval);
    }

    const key = `${symbol}_${interval}`;
    if (this.activeStreams.has(key)) {
      return;
    }

    this.logger.log(`Watching ${symbol} with interval ${interval}`);

    // Subscribe to kline updates
    const subscription = this.binanceWebsocketClient.subscribeToKlines(symbol, interval);
    this.activeStreams.set(key, subscription);

    // Set up event listener with entity conversion
    this.binanceWebsocketClient.on(subscription.id, (candle) => {
      const candleData = this.binanceAdapter.transformWsKlineData(candle);
      const cacheKey = `${symbol}_${interval}`;
      
      // Update cache
      let candles = this.candlesCache.get(cacheKey) || [];
      
      // Find and replace existing candle with the same openTime, or add to the end
      const existingIndex = candles.findIndex(c => c.openTime === candleData.openTime);
      if (existingIndex >= 0) {
        candles[existingIndex] = candleData;
      } else {
        candles.push(candleData);
        // Keep only the last 1000 candles
        if (candles.length > 1000) {
          candles = candles.slice(-1000);
        }
      }
      
      // Sort by openTime
      candles.sort((a, b) => a.openTime - b.openTime);
      
      this.candlesCache.set(cacheKey, candles);
      
      // Convert the updated candle to entity format and emit events
      const marketDataEntity = this.binanceDataMapper.mapCandleToMarketData(candleData);
      
      // Update entity cache
      let entities = this.marketDataEntityCache.get(cacheKey) || [];
      const entityIndex = entities.findIndex(e => e.openTime === marketDataEntity.openTime);
      if (entityIndex >= 0) {
        entities[entityIndex] = marketDataEntity;
      } else {
        entities.push(marketDataEntity);
        if (entities.length > 1000) {
          entities = entities.slice(-1000);
        }
      }
      
      entities.sort((a, b) => a.openTime - b.openTime);
      this.marketDataEntityCache.set(cacheKey, entities);
      
      // Emit events for both formats
      this.eventEmitter.emit('candle.update', candleData);
      this.eventEmitter.emit('market.data.update', marketDataEntity);
    });

    // Initialize with REST API data
    this.fetchInitialCandleData(symbol, interval);
  }

  /**
   * Watch an interval for all watched symbols
   */
  public watchInterval(interval: CandleChartInterval): void {
    if (this.watchedIntervals.has(interval)) {
      return;
    }

    this.watchedIntervals.add(interval);
    this.logger.log(`Watching interval: ${interval}`);

    // Set up streams for all watched symbols with this interval
    for (const symbol of this.watchedSymbols) {
      this.watchSymbolWithInterval(symbol, interval);
    }
  }

  /**
   * Stop watching a symbol
   */
  public unwatchSymbol(symbol: string): void {
    if (!this.watchedSymbols.has(symbol)) {
      return;
    }

    this.watchedSymbols.delete(symbol);
    this.logger.log(`Stopped watching symbol: ${symbol}`);

    // Unsubscribe from ticker
    const tickerStreamId = `ticker_${symbol.toLowerCase()}`;
    if (this.activeStreams.has(tickerStreamId)) {
      this.binanceWebsocketClient.unsubscribe(tickerStreamId);
      this.activeStreams.delete(tickerStreamId);
    }

    // Unsubscribe from all intervals for this symbol
    for (const interval of this.watchedIntervals) {
      const key = `${symbol}_${interval}`;
      const streamKey = `kline_${symbol.toLowerCase()}_${interval}`;
      
      if (this.activeStreams.has(streamKey)) {
        this.binanceWebsocketClient.unsubscribe(streamKey);
        this.activeStreams.delete(streamKey);
      }
      
      this.candlesCache.delete(key);
    }

    // Remove from cache
    this.marketDataCache.delete(symbol);
  }

  /**
   * Stop watching an interval
   */
  public unwatchInterval(interval: CandleChartInterval): void {
    if (!this.watchedIntervals.has(interval)) {
      return;
    }

    this.watchedIntervals.delete(interval);
    this.logger.log(`Stopped watching interval: ${interval}`);

    // Unsubscribe from all symbols for this interval
    for (const symbol of this.watchedSymbols) {
      const key = `${symbol}_${interval}`;
      const streamKey = `kline_${symbol.toLowerCase()}_${interval}`;
      
      if (this.activeStreams.has(streamKey)) {
        this.binanceWebsocketClient.unsubscribe(streamKey);
        this.activeStreams.delete(streamKey);
      }
      
      this.candlesCache.delete(key);
    }
  }

  /**
   * Stop all active streams
   */
  public stopAllStreams(): void {
    this.binanceWebsocketClient.unsubscribeAll();
    this.activeStreams.clear();
    this.logger.log('Stopped all data streams');
  }

  /**
   * Fetch initial market data for a symbol using the REST API
   */
  private async fetchInitialMarketData(symbol: string): Promise<void> {
    try {
      const ticker = await this.binanceClient.getTicker24hr(symbol) as any;
      const marketData = this.binanceAdapter.transformTickerData(ticker);
      this.marketDataCache.set(symbol, marketData);
      this.eventEmitter.emit('market.update', marketData);
    } catch (error) {
      this.logger.error(`Error fetching initial market data for ${symbol}: ${error.message}`, error.stack);
    }
  }

  /**
   * Fetch initial candle data for a symbol and interval using the REST API
   * Updated to also convert and cache the entity format
   */
  private async fetchInitialCandleData(symbol: string, interval: CandleChartInterval): Promise<void> {
    try {
      const candles = await this.binanceClient.getCandles(symbol, interval, { limit: 1000 });
      const cacheKey = `${symbol}_${interval}`;
      this.candlesCache.set(cacheKey, candles);
      
      // Convert candles to market data entities and cache them
      const entities = this.binanceDataMapper.mapCandlesToMarketData(candles);
      this.marketDataEntityCache.set(cacheKey, entities);
      
      // Emit event with the entity format for database persistence
      this.eventEmitter.emit('market.candles.loaded', {
        symbol,
        interval,
        entities
      });
    } catch (error) {
      this.logger.error(`Error fetching initial candle data for ${symbol}_${interval}: ${error.message}`, error.stack);
    }
  }

  /**
   * Refresh market data for all watched symbols using the REST API
   */
  private async refreshMarketData(): Promise<void> {
    try {
      const symbols = Array.from(this.watchedSymbols);
      
      // Refresh in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        await Promise.all(batch.map(symbol => this.fetchInitialMarketData(symbol)));
      }
    } catch (error) {
      this.logger.error(`Error refreshing market data: ${error.message}`, error.stack);
    }
  }
}
