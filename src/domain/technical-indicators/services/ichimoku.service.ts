// 109. src/domain/technical-indicators/services/ichimoku.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TechnicalIndicator } from '../entities/indicator.entity';
import { IndicatorBaseService } from './indicator-base.service';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { Candlestick } from '@shared/interfaces/market-data.interface';
import { 
  IchimokuValuesDto, 
  IchimokuParametersDto, 
  IchimokuResultDto, 
  CalculateIchimokuDto 
} from '../dtos/ichimoku.dto';

@Injectable()
export class IchimokuService extends IndicatorBaseService {
  constructor(
    @InjectRepository(TechnicalIndicator)
    protected readonly indicatorRepository: Repository<TechnicalIndicator>,
    protected readonly marketDataService: MarketDataStreamService
  ) {
    super(indicatorRepository, marketDataService);
    this.initialize('ICHIMOKU');
  }

  /**
   * Calculate Ichimoku Cloud for a symbol and timeframe
   */
  async calculateIchimoku(params: CalculateIchimokuDto): Promise<IchimokuResultDto[]> {
    try {
      // Extract parameters
      const { symbol, timeframe, startTime, endTime, limit } = params;
      
      // Set default parameters if not provided
      const ichimokuParams: IchimokuParametersDto = {
        tenkanPeriod: params.parameters?.tenkanPeriod || 9,
        kijunPeriod: params.parameters?.kijunPeriod || 26,
        senkouSpanBPeriod: params.parameters?.senkouSpanBPeriod || 52,
        displacement: params.parameters?.displacement || 26
      };
      
      // Get additional data to account for calculations that look back in time
      const requiredExtraCandles = Math.max(
        ichimokuParams.tenkanPeriod,
        ichimokuParams.kijunPeriod,
        ichimokuParams.senkouSpanBPeriod,
        ichimokuParams.displacement
      ) * 2;
      
      // Fetch market data with extra candles for calculations
      const candles = await this.getMarketData(
        symbol, 
        timeframe, 
        startTime, 
        endTime, 
        (limit || 100) + requiredExtraCandles
      );
      
      if (candles.length < requiredExtraCandles) {
        this.logger.warn(`Insufficient data for Ichimoku calculation: ${candles.length} candles available, need at least ${requiredExtraCandles}`);
        return [];
      }
      
      // Perform Ichimoku calculations
      const results = this.calculateIchimokuValues(candles, ichimokuParams);
      
      // Save results to database (in batches)
      const indicatorDtos = results.map(result => ({
        symbol,
        timeframe,
        type: this.indicatorType,
        timestamp: result.timestamp,
        values: result.values,
        notes: result.signal
      }));
      
      await this.saveBulkIndicators(indicatorDtos);
      
      // Return the most recent results up to the limit
      return results.slice(0, limit || 100);
    } catch (error) {
      this.logger.error(`Failed to calculate Ichimoku for ${params.symbol} ${params.timeframe}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate Ichimoku values for an array of candlesticks
   */
  private calculateIchimokuValues(
    candles: Candlestick[], 
    params: IchimokuParametersDto
  ): IchimokuResultDto[] {
    // Extract prices and timestamps
    const highs = this.extractHighPrices(candles);
    const lows = this.extractLowPrices(candles);
    const closes = this.extractClosePrices(candles);
    const timestamps = this.extractTimestamps(candles);
    
    const results: IchimokuResultDto[] = [];
    
    // We need at least enough candles for the largest period
    if (candles.length < params.senkouSpanBPeriod) {
      return results;
    }
    
    // Calculate Ichimoku components
    for (let i = 0; i < candles.length; i++) {
      // Skip points where we don't have enough historical data
      if (i < params.senkouSpanBPeriod - 1) {
        continue;
      }
      
      // Tenkan-sen (Conversion Line): (highest high + lowest low) / 2 for tenkanPeriod
      let highestHigh = highs[i];
      let lowestLow = lows[i];
      
      for (let j = i - params.tenkanPeriod + 1; j <= i; j++) {
        if (j >= 0) {
          if (highs[j] > highestHigh) highestHigh = highs[j];
          if (lows[j] < lowestLow) lowestLow = lows[j];
        }
      }
      
      const tenkanSen = (highestHigh + lowestLow) / 2;
      
      // Kijun-sen (Base Line): (highest high + lowest low) / 2 for kijunPeriod
      highestHigh = highs[i];
      lowestLow = lows[i];
      
      for (let j = i - params.kijunPeriod + 1; j <= i; j++) {
        if (j >= 0) {
          if (highs[j] > highestHigh) highestHigh = highs[j];
          if (lows[j] < lowestLow) lowestLow = lows[j];
        }
      }
      
      const kijunSen = (highestHigh + lowestLow) / 2;
      
      // Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2, shifted forward by displacement
      const senkouSpanA = (tenkanSen + kijunSen) / 2;
      
      // Senkou Span B (Leading Span B): (highest high + lowest low) / 2 for senkouSpanBPeriod, shifted forward by displacement
      highestHigh = highs[i];
      lowestLow = lows[i];
      
      for (let j = i - params.senkouSpanBPeriod + 1; j <= i; j++) {
        if (j >= 0) {
          if (highs[j] > highestHigh) highestHigh = highs[j];
          if (lows[j] < lowestLow) lowestLow = lows[j];
        }
      }
      
      const senkouSpanB = (highestHigh + lowestLow) / 2;
      
      // Chikou Span (Lagging Span): Current closing price, shifted backwards by displacement
      const chikouSpan = closes[i];
      
      // Create Ichimoku values
      const values: IchimokuValuesDto = {
        tenkanSen,
        kijunSen,
        senkouSpanA,
        senkouSpanB,
        chikouSpan
      };
      
      // Determine signal based on Ichimoku components
      let signal = 'NEUTRAL';
      let strength = 0;
      
      // Signal calculations based on common Ichimoku interpretations
      if (closes[i] > senkouSpanA && closes[i] > senkouSpanB) {
        // Price above the cloud: bullish
        signal = 'BULLISH';
        strength += 30;
        
        if (tenkanSen > kijunSen) {
          // Tenkan-sen crosses above Kijun-sen: bullish confirmation
          signal = 'STRONG_BULLISH';
          strength += 20;
        }
        
        if (i >= params.displacement && closes[i - params.displacement] > chikouSpan) {
          // Chikou Span above price from displacement periods ago: additional bullish confirmation
          strength += 20;
        }
      } else if (closes[i] < senkouSpanA && closes[i] < senkouSpanB) {
        // Price below the cloud: bearish
        signal = 'BEARISH';
        strength += 30;
        
        if (tenkanSen < kijunSen) {
          // Tenkan-sen crosses below Kijun-sen: bearish confirmation
          signal = 'STRONG_BEARISH';
          strength += 20;
        }
        
        if (i >= params.displacement && closes[i - params.displacement] < chikouSpan) {
          // Chikou Span below price from displacement periods ago: additional bearish confirmation
          strength += 20;
        }
      } else {
        // Price within the cloud: uncertain, in transition
        signal = 'NEUTRAL';
        strength += 15;
        
        // Check for potential breakout direction
        if (tenkanSen > kijunSen) {
          signal = 'WEAK_BULLISH';
          strength += 10;
        } else if (tenkanSen < kijunSen) {
          signal = 'WEAK_BEARISH';
          strength += 10;
        }
      }
      
      // Add volume consideration (if available)
      // This would require volume-based analysis which is a possible enhancement
      
      // Limit strength to 100
      strength = Math.min(100, strength);
      
      // Create the result
      results.push({
        timestamp: timestamps[i],
        values,
        signal,
        strength
      });
    }
    
    return results;
  }

  /**
   * Get historical Ichimoku data from database
   */
  async getIchimokuData(
    symbol: string,
    timeframe: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<IchimokuResultDto[]> {
    try {
      const indicators = await this.getIndicators(symbol, timeframe, startTime, endTime, limit);
      
      return indicators.map(indicator => ({
        timestamp: indicator.timestamp,
        values: indicator.values,
        signal: indicator.notes,
        strength: this.determineStrengthFromSignal(indicator.notes)
      }));
    } catch (error) {
      this.logger.error(`Failed to get Ichimoku data for ${symbol} ${timeframe}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Determine strength from signal string
   */
  private determineStrengthFromSignal(signal: string): number {
    switch (signal) {
      case 'STRONG_BULLISH': return 90;
      case 'BULLISH': return 70;
      case 'WEAK_BULLISH': return 60;
      case 'NEUTRAL': return 50;
      case 'WEAK_BEARISH': return 40;
      case 'BEARISH': return 30;
      case 'STRONG_BEARISH': return 10;
      default: return 50;
    }
  }
}
