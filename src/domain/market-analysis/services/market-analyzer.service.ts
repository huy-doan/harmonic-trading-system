// 136. src/domain/market-analysis/services/market-analyzer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MarketData } from '../entities/market-data.entity';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { Candlestick } from '@shared/interfaces/market-data.interface';
import { BinanceDataMapperService } from '@infrastructure/external/binance/binance-data-mapper.service';
import { CandleChartInterval } from 'binance-api-node';
import { TimeframeEnum } from '../dtos/market-data.dto';

@Injectable()
export class MarketAnalyzerService {
  private readonly logger = new Logger(MarketAnalyzerService.name);

  constructor(
    @InjectRepository(MarketData)
    private readonly marketDataRepository: Repository<MarketData>,
    private readonly marketDataStreamService: MarketDataStreamService,
    private readonly binanceDataMapper: BinanceDataMapperService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Analyze market data for a specific symbol and timeframe
   */
  async analyzeMarket(symbol: string, timeframe: string): Promise<any> {
    try {
      this.logger.debug(`Analyzing market data for ${symbol} ${timeframe}`);
      
      // Get recent candlesticks from Binance
      const candleData = this.marketDataStreamService.getCandleData(
        symbol, 
        timeframe as CandleChartInterval
      );
      
      if (!candleData || candleData.length === 0) {
        this.logger.warn(`No candles found for ${symbol} ${timeframe}`);
        return null;
      }
      
      // Convert Binance data to market entities
      const marketEntities = this.binanceDataMapper.mapCandlesToMarketData(candleData);
      
      // Store candles in the database
      await this.storeMarketData(marketEntities);
      
      // Calculate market metrics
      const marketMetrics = this.calculateMarketMetrics(marketEntities);
      
      // Emit market analysis event
      this.eventEmitter.emit('market.analysis.completed', {
        symbol,
        timeframe,
        metrics: marketMetrics,
        timestamp: new Date().toISOString()
      });
      
      return marketMetrics;
    } catch (error) {
      this.logger.error(`Error analyzing market for ${symbol} ${timeframe}`, error);
      throw error;
    }
  }

  /**
   * Stores candlestick data in the database
   */
  private async storeMarketData(marketDataEntities: MarketData[]): Promise<void> {
    try {
      // Use upsert to avoid duplicate errors
      await this.marketDataRepository.upsert(
        marketDataEntities,
        ['symbol', 'timeframe', 'openTime']
      );
    } catch (error) {
      this.logger.error('Error storing market data', error);
      // Don't re-throw to prevent analysis failure due to db errors
    }
  }

  /**
   * Calculate market metrics from market data entities
   */
  private calculateMarketMetrics(candles: MarketData[]): any {
    if (candles.length < 30) {
      return {
        insufficient_data: true,
        message: 'Not enough data to calculate reliable metrics'
      };
    }

    // Get the most recent candle
    const latestCandle = candles[candles.length - 1];
    
    // Calculate price change percentage
    const firstCandle = candles[0];
    const priceChange = latestCandle.close - firstCandle.open;
    const priceChangePercent = (priceChange / firstCandle.open) * 100;
    
    // Calculate volume metrics
    let totalVolume = 0;
    let avgVolume = 0;
    
    for (const candle of candles) {
      totalVolume += candle.volume;
    }
    
    avgVolume = totalVolume / candles.length;
    
    // Calculate relative volume (current volume compared to average)
    const relativeVolume = latestCandle.volume / avgVolume;
    
    // Calculate volatility (standard deviation of price changes)
    const priceChanges = [];
    for (let i = 1; i < candles.length; i++) {
      const changePercent = ((candles[i].close - candles[i-1].close) / candles[i-1].close) * 100;
      priceChanges.push(changePercent);
    }
    
    const avgPriceChange = priceChanges.reduce((sum, val) => sum + val, 0) / priceChanges.length;
    let volatility = 0;
    
    for (const change of priceChanges) {
      volatility += Math.pow(change - avgPriceChange, 2);
    }
    
    volatility = Math.sqrt(volatility / priceChanges.length);
    
    // Identify trend
    let trend = 'SIDEWAYS';
    if (priceChangePercent > 5) {
      trend = 'STRONG_UPTREND';
    } else if (priceChangePercent > 2) {
      trend = 'UPTREND';
    } else if (priceChangePercent < -5) {
      trend = 'STRONG_DOWNTREND';
    } else if (priceChangePercent < -2) {
      trend = 'DOWNTREND';
    }
    
    // Identify support and resistance levels
    const supportLevels = this.findSupportLevels(candles);
    const resistanceLevels = this.findResistanceLevels(candles);
    
    return {
      symbol: latestCandle.symbol,
      timeframe: latestCandle.timeframe,
      current_price: latestCandle.close,
      open_price: firstCandle.open,
      price_change: priceChange,
      price_change_percent: priceChangePercent,
      total_volume: totalVolume,
      avg_volume: avgVolume,
      relative_volume: relativeVolume,
      volatility: volatility,
      trend: trend,
      support_levels: supportLevels,
      resistance_levels: resistanceLevels,
      analysis_time: new Date().toISOString()
    };
  }

  /**
   * Find support levels from market data entities
   */
  private findSupportLevels(candles: MarketData[]): number[] {
    const levels = new Set<number>();
    const lastCandle = candles[candles.length - 1];
    
    // Logic to find support levels
    for (let i = 10; i < candles.length - 5; i++) {
      // Check if this is a local minimum
      if (candles[i].low < candles[i-1].low && 
          candles[i].low < candles[i-2].low &&
          candles[i].low < candles[i+1].low &&
          candles[i].low < candles[i+2].low) {
        
        // Ensure this level is below current price
        if (candles[i].low < lastCandle.close) {
          // Round to avoid too many similar levels
          const roundedLevel = Math.round(candles[i].low * 100) / 100;
          levels.add(roundedLevel);
        }
      }
    }
    
    // Convert to array and sort
    return Array.from(levels).sort((a, b) => b - a);
  }

  /**
   * Find resistance levels from market data entities
   */
  private findResistanceLevels(candles: MarketData[]): number[] {
    const levels = new Set<number>();
    const lastCandle = candles[candles.length - 1];
    
    // Logic to find resistance levels
    for (let i = 10; i < candles.length - 5; i++) {
      // Check if this is a local maximum
      if (candles[i].high > candles[i-1].high && 
          candles[i].high > candles[i-2].high &&
          candles[i].high > candles[i+1].high &&
          candles[i].high > candles[i+2].high) {
        
        // Ensure this level is above current price
        if (candles[i].high > lastCandle.close) {
          // Round to avoid too many similar levels
          const roundedLevel = Math.round(candles[i].high * 100) / 100;
          levels.add(roundedLevel);
        }
      }
    }
    
    // Convert to array and sort
    return Array.from(levels).sort((a, b) => a - b);
  }
  
  /**
   * Get market data for a symbol and timeframe within a date range
   */
  async getMarketData(
    symbol: string,
    timeframe: string,
    startTime: Date,
    endTime: Date = new Date(),
    limit: number = 1000
  ): Promise<MarketData[]> {
    try {
      return this.marketDataRepository.find({
        where: {
          symbol,
          timeframe,
          openTime: {
            $gte: startTime.getTime(),
            $lte: endTime.getTime()
          } as any
        },
        order: { openTime: 'ASC' },
        take: limit
      });
    } catch (error) {
      this.logger.error(`Error fetching market data for ${symbol} ${timeframe}`, error);
      throw error;
    }
  }

  /**
   * Get the latest market metrics
   */
  async getLatestMarketMetrics(symbol: string, timeframe: string): Promise<any> {
    try {
      // Get the latest market data entity directly from the service
      const latestEntity = this.marketDataStreamService.getLatestMarketDataEntity(
        symbol, 
        timeframe as CandleChartInterval
      );
      
      if (!latestEntity) {
        throw new Error(`No market data found for ${symbol} ${timeframe}`);
      }
      
      // Get recent market data for analysis
      const recentEntities = await this.getMarketData(
        symbol,
        timeframe,
        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
      );
      
      if (recentEntities.length < 10) {
        throw new Error(`Insufficient historical data for ${symbol} ${timeframe}`);
      }
      
      // Calculate market metrics
      return this.calculateMarketMetrics(recentEntities);
    } catch (error) {
      this.logger.error(`Error getting market metrics for ${symbol} ${timeframe}`, error);
      throw error;
    }
  }
  
  /**
   * Get supported timeframes
   */
  getTimeframes(): string[] {
    return Object.values(TimeframeEnum);
  }
  
  /**
   * Start watching a symbol with multiple timeframes
   */
  async watchSymbol(symbol: string, timeframes: string[] = Object.values(TimeframeEnum)): Promise<void> {
    try {
      // First watch the symbol for ticker data
      this.marketDataStreamService.watchSymbol(symbol);
      
      // Then watch each timeframe
      for (const timeframe of timeframes) {
        this.marketDataStreamService.watchSymbolWithInterval(symbol, timeframe as CandleChartInterval);
      }
      
      this.logger.log(`Now watching ${symbol} with timeframes: ${timeframes.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error watching symbol ${symbol}`, error);
      throw error;
    }
  }
}
