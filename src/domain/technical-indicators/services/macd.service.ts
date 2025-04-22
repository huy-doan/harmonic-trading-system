// src/domain/technical-indicators/services/macd.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TechnicalIndicator } from '../entities/indicator.entity';
import { IndicatorBaseService } from './indicator-base.service';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { Candlestick } from '@shared/interfaces/market-data.interface';

interface MACDParameters {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

interface MACDValues {
  macd: number;
  signal: number;
  histogram: number;
  trend: string;
  strength: number;
}

interface MACDResult {
  timestamp: number;
  values: MACDValues;
}

@Injectable()
export class MACDService extends IndicatorBaseService {
  constructor(
    @InjectRepository(TechnicalIndicator)
    protected readonly indicatorRepository: Repository<TechnicalIndicator>,
    protected readonly marketDataService: MarketDataStreamService
  ) {
    super(indicatorRepository, marketDataService);
    this.initialize('MACD');
  }

  /**
   * Calculate MACD for a symbol and timeframe
   */
  async calculateMACD(
    symbol: string,
    timeframe: string,
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<MACDResult[]> {
    try {
      // Validate parameters
      if (fastPeriod >= slowPeriod) {
        throw new Error('Fast period must be smaller than slow period');
      }
      
      // Calculate required extra candles for MACD
      const requiredExtraCandles = slowPeriod + signalPeriod;
      
      // Get market data
      const candles = await this.getMarketData(
        symbol, 
        timeframe, 
        startTime, 
        endTime, 
        limit + requiredExtraCandles
      );
      
      if (candles.length < requiredExtraCandles) {
        this.logger.warn(`Insufficient data for MACD calculation: ${candles.length} candles available, need at least ${requiredExtraCandles}`);
        return [];
      }
      
      // Calculate MACD
      const macdParams: MACDParameters = { fastPeriod, slowPeriod, signalPeriod };
      const results = this.calculateMACDValues(candles, macdParams);
      
      // Save to database
      const indicatorDtos = results.map(result => ({
        symbol,
        timeframe,
        type: this.indicatorType,
        timestamp: result.timestamp,
        values: result.values,
        notes: result.values.trend
      }));
      
      await this.saveBulkIndicators(indicatorDtos);
      
      // Return limited results
      return results.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to calculate MACD for ${symbol} ${timeframe}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate MACD values for an array of candlesticks
   */
  private calculateMACDValues(candles: Candlestick[], params: MACDParameters): MACDResult[] {
    const { fastPeriod, slowPeriod, signalPeriod } = params;
    const results: MACDResult[] = [];
    
    // Extract close prices and timestamps
    const closes = this.extractClosePrices(candles);
    const timestamps = this.extractTimestamps(candles);
    
    // Calculate EMAs
    const fastEMA = this.calculateEMA(closes, fastPeriod);
    const slowEMA = this.calculateEMA(closes, slowPeriod);
    
    // Calculate MACD line
    const macdLine: number[] = [];
    // MACD can only be calculated once both EMAs are available
    const startIndex = slowPeriod - fastPeriod; // Adjust index for different period lengths
    
    for (let i = 0; i < fastEMA.length; i++) {
      const slowIndex = i - startIndex;
      if (slowIndex >= 0) {
        macdLine.push(fastEMA[i] - slowEMA[slowIndex]);
      }
    }
    
    // Calculate signal line (EMA of MACD line)
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    
    // Calculate histogram (MACD line - signal line)
    const histogram: number[] = [];
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[i + signalPeriod - 1] - signalLine[i]);
    }
    
    // Compile results
    const signalStartIndex = slowPeriod + signalPeriod - 2;
    
    for (let i = 0; i < histogram.length; i++) {
      const macd = macdLine[i + signalPeriod - 1];
      const signal = signalLine[i];
      const hist = histogram[i];
      
      // Determine trend and strength
      const trend = this.determineMACDTrend(macd, signal, hist);
      const strength = this.determineMACDStrength(macd, signal, hist);
      
      // Calculate real index for timestamp
      const timestampIndex = i + signalStartIndex;
      
      results.push({
        timestamp: timestamps[timestampIndex],
        values: {
          macd,
          signal,
          histogram: hist,
          trend,
          strength
        }
      });
    }
    
    return results;
  }

  /**
   * Determine trend based on MACD, signal, and histogram
   */
  private determineMACDTrend(macd: number, signal: number, histogram: number): string {
    // MACD above signal line: bullish
    if (macd > signal) {
      // Increasing histogram: strengthening bullish
      if (histogram > 0) {
        return 'STRONG_BULLISH';
      }
      // Decreasing histogram: weakening bullish
      return 'BULLISH';
    } 
    // MACD below signal line: bearish
    else if (macd < signal) {
      // Decreasing histogram: strengthening bearish
      if (histogram < 0) {
        return 'STRONG_BEARISH';
      }
      // Increasing histogram: weakening bearish
      return 'BEARISH';
    }
    // MACD crossing signal line
    else {
      if (histogram > 0) {
        return 'BULLISH_CROSSOVER';
      } else if (histogram < 0) {
        return 'BEARISH_CROSSOVER';
      }
      return 'NEUTRAL';
    }
  }

  /**
   * Determine strength based on MACD values
   */
  private determineMACDStrength(macd: number, signal: number, histogram: number): number {
    // Base strength on absolute difference and histogram value
    const difference = Math.abs(macd - signal);
    const histAbs = Math.abs(histogram);
    
    // Calculate strength (0-100)
    // The larger the histogram and difference, the stronger the signal
    let strength = 50; // Neutral base value
    
    if (macd > signal) {
      // Bullish strength
      strength += 10; // Base bullish bias
      
      if (histogram > 0) {
        // Additional strength for positive and increasing histogram
        strength += Math.min(30, histAbs * 20);
      }
    } else if (macd < signal) {
      // Bearish strength
      strength -= 10; // Base bearish bias
      
      if (histogram < 0) {
        // Additional strength for negative and decreasing histogram
        strength -= Math.min(30, histAbs * 20);
      }
    }
    
    // Adjust based on difference magnitude
    strength += Math.min(10, difference * 5);
    
    // Ensure within bounds
    return Math.max(0, Math.min(100, strength));
  }

  /**
   * Get historical MACD data
   */
  async getMACDData(
    symbol: string,
    timeframe: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<MACDResult[]> {
    try {
      const indicators = await this.getIndicators(symbol, timeframe, startTime, endTime, limit);
      
      return indicators.map(indicator => ({
        timestamp: indicator.timestamp,
        values: {
          macd: indicator.values.macd,
          signal: indicator.values.signal,
          histogram: indicator.values.histogram,
          trend: indicator.notes || this.determineMACDTrend(
            indicator.values.macd, 
            indicator.values.signal, 
            indicator.values.histogram
          ),
          strength: indicator.values.strength || this.determineMACDStrength(
            indicator.values.macd, 
            indicator.values.signal, 
            indicator.values.histogram
          )
        }
      }));
    } catch (error) {
      this.logger.error(`Failed to get MACD data for ${symbol} ${timeframe}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
