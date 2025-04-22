// 110. src/domain/technical-indicators/services/rsi.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TechnicalIndicator } from '../entities/indicator.entity';
import { IndicatorBaseService } from './indicator-base.service';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { Candlestick } from '@shared/interfaces/market-data.interface';

interface RSIParameters {
  period: number;
  overbought: number;
  oversold: number;
}

interface RSIValues {
  rsi: number;
  signal: string;
  strength: number;
}

interface RSIResult {
  timestamp: number;
  values: RSIValues;
}

@Injectable()
export class RSIService extends IndicatorBaseService {
  constructor(
    @InjectRepository(TechnicalIndicator)
    protected readonly indicatorRepository: Repository<TechnicalIndicator>,
    protected readonly marketDataService: MarketDataStreamService
  ) {
    super(indicatorRepository, marketDataService);
    this.initialize('RSI');
  }

  /**
   * Calculate RSI for a symbol and timeframe
   */
  async calculateRSI(
    symbol: string,
    timeframe: string,
    period: number = 14,
    overbought: number = 70,
    oversold: number = 30,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<RSIResult[]> {
    try {
      // Get market data
      const candles = await this.getMarketData(symbol, timeframe, startTime, endTime, limit + period);
      
      if (candles.length < period + 1) {
        this.logger.warn(`Insufficient data for RSI calculation: ${candles.length} candles available, need at least ${period + 1}`);
        return [];
      }
      
      // Calculate RSI
      const rsiParams: RSIParameters = { period, overbought, oversold };
      const results = this.calculateRSIValues(candles, rsiParams);
      
      // Save to database
      const indicatorDtos = results.map(result => ({
        symbol,
        timeframe,
        type: this.indicatorType,
        timestamp: result.timestamp,
        values: result.values,
        notes: result.values.signal
      }));
      
      await this.saveBulkIndicators(indicatorDtos);
      
      // Return limited results
      return results.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to calculate RSI for ${symbol} ${timeframe}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate RSI values for an array of candlesticks
   */
  private calculateRSIValues(candles: Candlestick[], params: RSIParameters): RSIResult[] {
    const { period, overbought, oversold } = params;
    const results: RSIResult[] = [];
    
    // Extract close prices and timestamps
    const closes = this.extractClosePrices(candles);
    const timestamps = this.extractTimestamps(candles);
    
    // Calculate price changes
    const changes: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }
    
    // Separate gains and losses
    const gains: number[] = changes.map(change => change > 0 ? change : 0);
    const losses: number[] = changes.map(change => change < 0 ? Math.abs(change) : 0);
    
    // Calculate initial average gain and loss
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let i = 0; i < period; i++) {
      avgGain += gains[i];
      avgLoss += losses[i];
    }
    
    avgGain = avgGain / period;
    avgLoss = avgLoss / period;
    
    // Calculate first RSI
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    
    // Determine signal and strength
    let signal = this.determineRSISignal(rsi, overbought, oversold);
    let strength = this.determineRSIStrength(rsi, overbought, oversold);
    
    // Add first RSI result
    results.push({
      timestamp: timestamps[period],
      values: {
        rsi,
        signal,
        strength
      }
    });
    
    // Calculate remaining RSI values
    for (let i = period; i < changes.length; i++) {
      // Use smoothed averages for subsequent calculations
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      
      // Calculate RS and RSI
      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
      
      // Determine signal and strength
      signal = this.determineRSISignal(rsi, overbought, oversold);
      strength = this.determineRSIStrength(rsi, overbought, oversold);
      
      // Add to results
      results.push({
        timestamp: timestamps[i + 1], // +1 because changes array starts from index 1
        values: {
          rsi,
          signal,
          strength
        }
      });
    }
    
    return results;
  }

  /**
   * Determine signal based on RSI value
   */
  private determineRSISignal(rsi: number, overbought: number, oversold: number): string {
    if (rsi > overbought) {
      return 'OVERBOUGHT';
    } else if (rsi < oversold) {
      return 'OVERSOLD';
    } else if (rsi > 50 && rsi <= overbought) {
      return 'BULLISH';
    } else if (rsi < 50 && rsi >= oversold) {
      return 'BEARISH';
    } else {
      return 'NEUTRAL';
    }
  }

  /**
   * Determine strength based on RSI value
   */
  private determineRSIStrength(rsi: number, overbought: number, oversold: number): number {
    if (rsi > 90 || rsi < 10) {
      return 90; // Extreme values
    } else if (rsi > overbought) {
      return 80; // Overbought
    } else if (rsi < oversold) {
      return 80; // Oversold
    } else if (rsi > 60 && rsi <= overbought) {
      return 65; // Moderately bullish
    } else if (rsi < 40 && rsi >= oversold) {
      return 65; // Moderately bearish
    } else {
      return 50; // Neutral
    }
  }

  /**
   * Get historical RSI data
   */
  async getRSIData(
    symbol: string,
    timeframe: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<RSIResult[]> {
    try {
      const indicators = await this.getIndicators(symbol, timeframe, startTime, endTime, limit);
      
      return indicators.map(indicator => ({
        timestamp: indicator.timestamp,
        values: {
          rsi: indicator.values.rsi,
          signal: indicator.notes || this.determineRSISignal(indicator.values.rsi, 70, 30),
          strength: indicator.values.strength || this.determineRSIStrength(indicator.values.rsi, 70, 30)
        }
      }));
    } catch (error) {
      this.logger.error(`Failed to get RSI data for ${symbol} ${timeframe}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
