// 137. src/domain/market-analysis/services/trend-analyzer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { BinanceDataMapperService } from '@infrastructure/external/binance/binance-data-mapper.service';
import { CandleChartInterval } from 'binance-api-node';
import { TrendAnalysisResultDto } from '../dtos/market-data.dto';
import { MarketData } from '../entities/market-data.entity';

@Injectable()
export class TrendAnalyzerService {
  private readonly logger = new Logger(TrendAnalyzerService.name);

  constructor(
    private readonly marketDataStreamService: MarketDataStreamService,
    private readonly binanceDataMapper: BinanceDataMapperService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Analyze market trend for a specific symbol and timeframe
   */
  async analyzeTrend(symbol: string, timeframe: string): Promise<TrendAnalysisResultDto> {
    try {
      this.logger.debug(`Analyzing trend for ${symbol} ${timeframe}`);
      
      // Get candlestick data from Binance
      const candleData = this.marketDataStreamService.getCandleData(
        symbol, 
        timeframe as CandleChartInterval
      );
      
      if (!candleData || candleData.length < 50) {
        this.logger.warn(`Insufficient data to analyze trend for ${symbol} ${timeframe}`);
        return { 
          symbol, 
          timeframe, 
          trendDirection: 'SIDEWAYS',
          strength: 0,
          supportLevels: [],
          resistanceLevels: [],
          timestamp: Date.now()
        };
      }
      
      // Convert Binance data to market entities
      const marketEntities = this.binanceDataMapper.mapCandlesToMarketData(candleData);
      
      // Calculate trend analysis
      const trendAnalysis = this.calculateTrend(marketEntities);
      
      // Map to DTO
      const trendResult: TrendAnalysisResultDto = {
        symbol,
        timeframe,
        trendDirection: trendAnalysis.overallTrend === 'BULLISH' ? 'UPTREND' : 
                         trendAnalysis.overallTrend === 'BEARISH' ? 'DOWNTREND' : 'SIDEWAYS',
        strength: this.convertStrengthToNumber(trendAnalysis.trendStrength),
        supportLevels: trendAnalysis.keyLevels.support,
        resistanceLevels: trendAnalysis.keyLevels.resistance,
        timestamp: Date.now()
      };
      
      // Emit trend analysis event
      this.eventEmitter.emit('market.trend.analyzed', {
        ...trendResult,
        details: trendAnalysis
      });
      
      return trendResult;
    } catch (error) {
      this.logger.error(`Error analyzing trend for ${symbol} ${timeframe}`, error);
      throw error;
    }
  }

  /**
   * Calculate trend based on various indicators
   */
  private calculateTrend(candles: MarketData[]): any {
    // Calculate Simple Moving Averages
    const sma20 = this.calculateSMA(candles, 20);
    const sma50 = this.calculateSMA(candles, 50);
    const sma200 = this.calculateSMA(candles, 200);
    
    const latestCandle = candles[candles.length - 1];
    const latestClose = latestCandle.close;
    
    // Check trend based on SMA relationships
    let primaryTrend = 'SIDEWAYS';
    let secondaryTrend = 'SIDEWAYS';
    
    // Primary trend (based on SMA 50 and 200)
    if (sma50 > sma200) {
      primaryTrend = 'BULLISH';
    } else if (sma50 < sma200) {
      primaryTrend = 'BEARISH';
    }
    
    // Secondary trend (based on SMA 20 and price)
    if (latestClose > sma20 && sma20 > sma50) {
      secondaryTrend = 'BULLISH';
    } else if (latestClose < sma20 && sma20 < sma50) {
      secondaryTrend = 'BEARISH';
    }
    
    // Calculate ADX for trend strength
    const adx = this.calculateADX(candles, 14);
    let trendStrength = 'WEAK';
    
    if (adx >= 30) {
      trendStrength = 'STRONG';
    } else if (adx >= 20) {
      trendStrength = 'MODERATE';
    }
    
    // Calculate recent momentum
    const momentum = this.calculateMomentum(candles, 10);
    let momentumLabel = 'NEUTRAL';
    
    if (momentum > 2) {
      momentumLabel = 'BULLISH';
    } else if (momentum < -2) {
      momentumLabel = 'BEARISH';
    }
    
    // Calculate volatility
    const volatility = this.calculateVolatility(candles, 20);
    let volatilityLabel = 'MEDIUM';
    
    if (volatility > 3) {
      volatilityLabel = 'HIGH';
    } else if (volatility < 1) {
      volatilityLabel = 'LOW';
    }
    
    // Detect key levels
    const keyLevels = this.detectKeyLevels(candles);
    
    // Determine overall trend
    let overallTrend = primaryTrend;
    if (primaryTrend === secondaryTrend && trendStrength === 'STRONG') {
      overallTrend = primaryTrend === 'BULLISH' ? 'STRONG_BULLISH' : 'STRONG_BEARISH';
    } else if (primaryTrend !== secondaryTrend) {
      overallTrend = 'MIXED';
    }
    
    return {
      symbol: latestCandle.symbol,
      timeframe: latestCandle.timeframe,
      primaryTrend,
      secondaryTrend,
      overallTrend,
      trendStrength,
      adx,
      momentum: momentumLabel,
      volatility: volatilityLabel,
      currentPrice: latestClose,
      sma20,
      sma50,
      sma200,
      keyLevels,
      analysisTime: new Date().toISOString()
    };
  }

  /**
   * Convert trend strength string to number (0-100)
   */
  private convertStrengthToNumber(strengthLabel: string): number {
    switch (strengthLabel) {
      case 'STRONG':
        return 80;
      case 'MODERATE':
        return 50;
      case 'WEAK':
        return 20;
      default:
        return 0;
    }
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(candles: MarketData[], period: number): number {
    if (candles.length < period) {
      return 0;
    }
    
    const recentCandles = candles.slice(-period);
    const sum = recentCandles.reduce((total, candle) => total + candle.close, 0);
    return sum / period;
  }

  /**
   * Calculate Average Directional Index (ADX)
   * Higher values indicate stronger trend
   */
  private calculateADX(candles: MarketData[], period: number): number {
    if (candles.length < period * 2) {
      return 0;
    }
    
    // Calculate True Range (TR)
    const trueRanges = [];
    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate Average True Range (ATR)
    const atr = this.calculateEMA(trueRanges, period);
    
    // Calculate +DM and -DM
    const plusDMs = [];
    const minusDMs = [];
    
    for (let i = 1; i < candles.length; i++) {
      const highDiff = candles[i].high - candles[i - 1].high;
      const lowDiff = candles[i - 1].low - candles[i].low;
      
      if (highDiff > lowDiff && highDiff > 0) {
        plusDMs.push(highDiff);
      } else {
        plusDMs.push(0);
      }
      
      if (lowDiff > highDiff && lowDiff > 0) {
        minusDMs.push(lowDiff);
      } else {
        minusDMs.push(0);
      }
    }
    
    // Calculate +DI and -DI
    const plusDI = (this.calculateEMA(plusDMs, period) / atr) * 100;
    const minusDI = (this.calculateEMA(minusDMs, period) / atr) * 100;
    
    // Calculate DX and ADX
    const dx = Math.abs((plusDI - minusDI) / (plusDI + minusDI)) * 100;
    
    // Use last 'period' values of DX to calculate ADX
    return dx;
  }

  /**
   * Calculate Exponential Moving Average
   */
  private calculateEMA(values: number[], period: number): number {
    if (values.length < period) {
      return 0;
    }
    
    const k = 2 / (period + 1);
    let ema = values.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
    
    for (let i = period; i < values.length; i++) {
      ema = (values[i] - ema) * k + ema;
    }
    
    return ema;
  }

  /**
   * Calculate momentum as percentage change over a period
   */
  private calculateMomentum(candles: MarketData[], period: number): number {
    if (candles.length < period) {
      return 0;
    }
    
    const currentPrice = candles[candles.length - 1].close;
    const pastPrice = candles[candles.length - period - 1].close;
    
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  /**
   * Calculate volatility as average true range percentage
   */
  private calculateVolatility(candles: MarketData[], period: number): number {
    if (candles.length < period) {
      return 0;
    }
    
    const recentCandles = candles.slice(-period);
    let sumTrueRange = 0;
    
    for (let i = 1; i < recentCandles.length; i++) {
      const high = recentCandles[i].high;
      const low = recentCandles[i].low;
      const prevClose = recentCandles[i - 1].close;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      const trueRange = Math.max(tr1, tr2, tr3);
      sumTrueRange += (trueRange / prevClose) * 100;
    }
    
    return sumTrueRange / (period - 1);
  }

  /**
   * Detect key support and resistance levels
   */
  private detectKeyLevels(candles: MarketData[]): any {
    const supportLevels = new Set<number>();
    const resistanceLevels = new Set<number>();
    const currentPrice = candles[candles.length - 1].close;
    
    // Find swing highs and lows
    for (let i = 10; i < candles.length - 10; i++) {
      // Check for swing low (support)
      if (candles[i].low < candles[i - 1].low && 
          candles[i].low < candles[i - 2].low &&
          candles[i].low < candles[i + 1].low &&
          candles[i].low < candles[i + 2].low) {
        
        // Round to avoid too many similar levels
        const level = Math.round(candles[i].low * 100) / 100;
        
        // Only include levels that are within 15% of current price
        if (Math.abs((level - currentPrice) / currentPrice) <= 0.15) {
          if (level < currentPrice) {
            supportLevels.add(level);
          } else {
            resistanceLevels.add(level);
          }
        }
      }
      
      // Check for swing high (resistance)
      if (candles[i].high > candles[i - 1].high && 
          candles[i].high > candles[i - 2].high &&
          candles[i].high > candles[i + 1].high &&
          candles[i].high > candles[i + 2].high) {
        
        // Round to avoid too many similar levels
        const level = Math.round(candles[i].high * 100) / 100;
        
        // Only include levels that are within 15% of current price
        if (Math.abs((level - currentPrice) / currentPrice) <= 0.15) {
          if (level > currentPrice) {
            resistanceLevels.add(level);
          } else {
            supportLevels.add(level);
          }
        }
      }
    }
    
    return {
      support: Array.from(supportLevels).sort((a, b) => b - a),
      resistance: Array.from(resistanceLevels).sort((a, b) => a - b)
    };
  }
}
